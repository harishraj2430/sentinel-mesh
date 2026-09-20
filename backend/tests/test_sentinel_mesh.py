import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_check():
    """Verify health endpoint returns online and database ping"""
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"
    assert "Sentinel Mesh" in data["engine"]
    assert "database" in data

def test_sample_cases_existing():
    """Verify existing sample cases endpoint returns 4 standard test cases"""
    response = client.get("/api/sample-cases")
    assert response.status_code == 200
    cases = response.json()
    assert len(cases) == 4
    case_ids = [c["id"] for c in cases]
    assert "case-bec-01" in case_ids
    assert "case-clean-04" in case_ids

def test_analyze_sample_case_bec():
    """Verify existing analysis pipeline runs all 12 scanners and produces BEC report"""
    response = client.post("/api/sample-cases/case-bec-01/analyze")
    assert response.status_code == 200
    report = response.json()
    assert report["threat_detected"] is True
    assert "BUSINESS EMAIL COMPROMISE" in report["threat_type"]
    assert report["scanners_completed"] == 12
    assert len(report["scanners"]) == 12
    assert "ai_forensic_analyst" in report

def test_auth_registration_and_login():
    """Verify multi-user registration, login, and JWT generation"""
    test_email = "new_investigator@sentinel.mesh"
    test_pw = "InvestigatorPass123!"

    # Register
    reg_res = client.post("/api/v2/auth/register", json={
        "email": test_email,
        "password": test_pw,
        "role": "investigator"
    })
    assert reg_res.status_code == 200
    reg_data = reg_res.json()
    assert "token" in reg_data
    token = reg_data["token"]

    # Login
    login_res = client.post("/api/v2/auth/login", json={
        "email": test_email,
        "password": test_pw
    })
    assert login_res.status_code == 200
    assert "token" in login_res.json()

    # Verify /me with token
    me_res = client.get("/api/v2/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_res.status_code == 200
    assert me_res.json()["email"] == test_email
    assert me_res.json()["role"] == "investigator"

def test_threat_intelligence_frequency():
    """Verify aggregated threat-method frequency analytics"""
    summary_res = client.get("/api/v2/threat-intelligence/summary")
    assert summary_res.status_code == 200
    summary = summary_res.json()
    assert summary["total_threats"] > 0
    assert "most_frequent_threat_method" in summary

    freq_res = client.get("/api/v2/threat-intelligence/frequency")
    assert freq_res.status_code == 200
    freq = freq_res.json()
    assert len(freq["methods"]) > 0
    assert "percentage" in freq["methods"][0]

    trends_res = client.get("/api/v2/threat-intelligence/trends?range=7d")
    assert trends_res.status_code == 200
    assert len(trends_res.json()["points"]) == 7

def test_evidence_vault_and_sha256_verification():
    """Verify deterministic SHA-256 evidence hashing and tamper verification"""
    vault_res = client.get("/api/v2/evidence/vault")
    assert vault_res.status_code == 200
    items = vault_res.json()["items"]
    assert len(items) > 0

    first_item = items[0]
    ev_id = first_item["evidence_id"]

    # Tamper check with invalid payload
    verify_res = client.post("/api/v2/evidence/verify", json={
        "evidence_id": ev_id,
        "payload_to_verify": "tampered_arbitrary_content"
    })
    assert verify_res.status_code == 200
    assert verify_res.json()["verified"] is False
    assert verify_res.json()["status"] == "INTEGRITY_MISMATCH"

def test_blockchain_ledger_and_chain_verification():
    """Verify append-only blockchain ledger blocks and zero tampering"""
    blocks_res = client.get("/api/v2/blockchain/blocks")
    assert blocks_res.status_code == 200
    blocks = blocks_res.json()["blocks"]
    assert len(blocks) > 0

    verify_res = client.get("/api/v2/blockchain/verify")
    assert verify_res.status_code == 200
    assert verify_res.json()["valid"] is True
    assert verify_res.json()["status"] == "VERIFIED_TAMPER_FREE"

def test_gmail_oauth_and_selected_analysis():
    """Verify Gmail status, message listing, and selected message forensics"""
    status_res = client.get("/api/v2/gmail/status")
    assert status_res.status_code == 200

    msg_res = client.get("/api/v2/gmail/messages")
    assert msg_res.status_code == 200
    messages = msg_res.json()["messages"]
    assert len(messages) > 0

    # Analyze selected email via existing 12 detectors
    selected_id = messages[0]["id"]
    analyze_res = client.post(f"/api/v2/gmail/analyze/{selected_id}")
    assert analyze_res.status_code == 200
    report = analyze_res.json()
    assert report["scanners_completed"] == 12
    assert "case_id" in report

def test_chrome_extension_scan_endpoint():
    """Verify future Chrome Extension compatibility ingestion endpoint"""
    raw_email = """From: attacker@malicious-test.xyz
To: victim@company.internal
Subject: Urgent Security Alert
Date: Fri, 19 Sep 2026 12:00:00 +0000

Immediate action required! Confirm your password now: http://phish-login.xyz
"""
    res = client.post("/api/v2/extension/scan", json={
        "raw_content": raw_email,
        "sender": "attacker@malicious-test.xyz",
        "subject": "Urgent Security Alert"
    })
    assert res.status_code == 200
    result = res.json()
    assert result["status"] == "ANALYSIS_COMPLETE"
    assert "evidence_hash" in result
    assert result["full_report"]["scanners_completed"] == 12
