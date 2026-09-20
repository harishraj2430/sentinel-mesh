import os
import base64
import requests
from typing import Dict, List, Any, Optional
from urllib.parse import urlencode
from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import RedirectResponse
from pydantic import BaseModel

from app.ingestion.parser import parse_eml
from app.headers.forensics import run_header_forensics
from app.geoip.tracer import trace_origin
from app.nlp.classifier import score_language
from app.intel.urls import analyze_all_urls
from app.intel.attachments import analyze_all_attachments
from app.report.builder import build_report
from modules.threat_intel.engine import extract_threat_events_from_report
from modules.evidence.engine import register_evidence
from modules.blockchain.ledger import record_custody_event

router = APIRouter(prefix="/api/v2/gmail", tags=["Gmail OAuth & Email Ingestion"])

# Google OAuth Configuration
GOOGLE_CLIENT_ID = os.environ.get("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = os.environ.get("GOOGLE_CLIENT_SECRET", "")
GOOGLE_REDIRECT_URI = os.environ.get("GOOGLE_REDIRECT_URI", "http://127.0.0.1:8000/api/v2/gmail/callback")
FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:5173")

# Minimum required scope strictly for email threat forensics
GMAIL_SCOPES = [
    "https://www.googleapis.com/auth/gmail.readonly"
]

# Secure backend-only token storage (never exposed to client browser)
_gmail_tokens: Dict[str, Dict[str, Any]] = {}

# Sandbox authorized messages for demo / fallback testing when offline
SANDBOX_MESSAGES = [
    {
        "id": "gmail-msg-bec-101",
        "sender": "Satya Nadella <ceo-desk@office-microsoft-notice.com>",
        "subject": "STRICTLY CONFIDENTIAL: Wire Transfer for Q3 Project Delta",
        "date": "Today, 09:14 AM",
        "snippet": "We are finalizing the confidential acquisition today. Wire $248,500 immediately to the attached escrow account...",
        "risk_tag": "CRITICAL",
        "raw_eml": """From: "Satya Nadella" <satya@office-microsoft-notice.com>
To: finance-team@company.internal
Reply-To: wire-processing@drop-vault-finance.top
Subject: STRICTLY CONFIDENTIAL: Wire Transfer for Q3 Project Delta
Date: Wed, 18 Sep 2026 09:14:22 +0000
Message-ID: <20260918.DELTA.992@office-microsoft-notice.com>
Received: from mail-node-out.hosted-bulletproof.com (185.220.101.45) by mx.company.internal with SMTP; Wed, 18 Sep 2026 09:14:25 +0000
Authentication-Results: mx.company.internal; spf=fail (domain office-microsoft-notice.com does not designate 185.220.101.45); dkim=fail; dmarc=fail action=none

Please process this wire transfer of $248,500 immediately for Project Delta. Reply directly with the SWIFT wire confirmation receipt.
"""
    },
    {
        "id": "gmail-msg-phish-102",
        "sender": "Microsoft Security Team <account-alert@auth-verify-security.xyz>",
        "subject": "ACTION REQUIRED: Your M365 access will expire in 24 hours",
        "date": "Today, 08:30 AM",
        "snippet": "Unusual login activity detected from IP 45.133.1.20. Confirm your identity to prevent permanent mailbox suspension...",
        "risk_tag": "HIGH",
        "raw_eml": """From: "Microsoft Account Security" <alert@auth-verify-security.xyz>
To: target-user@company.internal
Reply-To: support@auth-verify-security.xyz
Subject: ACTION REQUIRED: Your M365 access will expire in 24 hours
Date: Wed, 18 Sep 2026 08:30:10 +0000
Message-ID: <ms-sec-991240182@auth-verify-security.xyz>
Received: from cloud-vps-ams.vultr.com (45.76.88.192) by mx.company.internal with SMTP; Wed, 18 Sep 2026 08:30:12 +0000
Authentication-Results: mx.company.internal; spf=softfail; dkim=fail; dmarc=fail

Final notice: unusual activity detected from unfamiliar location. Confirm your login credentials immediately:
http://micros0ft-login-verify.xyz/auth/signin?user=target-user@company.internal
"""
    },
    {
        "id": "gmail-msg-clean-103",
        "sender": "Google Cloud Support <cloud-alerts@google.com>",
        "subject": "Your Google Cloud Platform Architecture Health Summary",
        "date": "Yesterday, 14:10 PM",
        "snippet": "Here is your monthly infrastructure audit. All compute instances are performing within optimal latency boundaries...",
        "risk_tag": "CLEAN",
        "raw_eml": """From: "Google Cloud Platform" <cloud-alerts@google.com>
To: ops-team@company.internal
Reply-To: cloud-alerts@google.com
Return-Path: <cloud-alerts@google.com>
Subject: Your Google Cloud Platform Architecture Health Summary
Date: Tue, 17 Sep 2026 14:10:00 +0000
Message-ID: <gcp-infra-audit-2026@google.com>
Received: from mail-pj1-f67.google.com (209.85.216.67) by mx.company.internal with SMTP; Tue, 17 Sep 2026 14:10:02 +0000
Authentication-Results: mx.company.internal; spf=pass (google.com: domain of cloud-alerts@google.com designates 209.85.216.67 as permitted sender); dkim=pass header.i=@google.com; dmarc=pass (p=REJECT)

Hello Operations Team, your Google Cloud Platform quarterly review report is now ready in the Cloud Console.
"""
    }
]

@router.get("/status")
def get_gmail_status():
    has_credentials = bool(GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET and "YOUR_GOOGLE" not in GOOGLE_CLIENT_ID)
    is_connected = bool(_gmail_tokens.get("default_user"))

    return {
        "oauth_configured": has_credentials,
        "is_authorized": is_connected or not has_credentials, # If credentials not configured, sandbox mode is active
        "mode": "live_oauth" if has_credentials else "sandbox_demo",
        "account_email": _gmail_tokens.get("default_user", {}).get("email", "soc-analyst@enterprise-mesh.internal"),
        "permission_notice": "Sentinel Mesh requires access to analyze authorized email messages for cybersecurity threat detection."
    }

@router.get("/auth-url")
def get_authorization_url():
    """
    Generates the Google OAuth 2.0 authorization URL.
    Minimum scope: https://www.googleapis.com/auth/gmail.readonly
    """
    if not GOOGLE_CLIENT_ID or "YOUR_GOOGLE" in GOOGLE_CLIENT_ID:
        # Provide sandbox redirect if live credentials aren't supplied
        return {
            "auth_url": f"{FRONTEND_URL}/console?gmail_connected=sandbox",
            "mode": "sandbox",
            "message": "Google Client ID not configured. Sandbox testing environment active."
        }

    params = {
        "client_id": GOOGLE_CLIENT_ID,
        "redirect_uri": GOOGLE_REDIRECT_URI,
        "response_type": "code",
        "scope": " ".join(GMAIL_SCOPES),
        "access_type": "offline",
        "prompt": "consent",
        "state": "sentinel_mesh_soc_state"
    }
    auth_url = f"https://accounts.google.com/o/oauth2/v2/auth?{urlencode(params)}"
    return {
        "auth_url": auth_url,
        "mode": "live",
        "scopes": GMAIL_SCOPES
    }

@router.get("/callback")
def oauth_callback(code: Optional[str] = None, error: Optional[str] = None):
    """
    Google OAuth 2.0 callback endpoint.
    Exchanges code for tokens server-side. Tokens are NEVER exposed to the frontend.
    """
    if error:
        return RedirectResponse(url=f"{FRONTEND_URL}/console?gmail_error={error}")

    if not code:
        return RedirectResponse(url=f"{FRONTEND_URL}/console?gmail_error=missing_code")

    try:
        token_url = "https://oauth2.googleapis.com/token"
        payload = {
            "code": code,
            "client_id": GOOGLE_CLIENT_ID,
            "client_secret": GOOGLE_CLIENT_SECRET,
            "redirect_uri": GOOGLE_REDIRECT_URI,
            "grant_type": "authorization_code"
        }
        res = requests.post(token_url, data=payload, timeout=10)
        token_data = res.json()

        if "access_token" in token_data:
            # Store securely in backend memory
            _gmail_tokens["default_user"] = {
                "access_token": token_data["access_token"],
                "refresh_token": token_data.get("refresh_token"),
                "email": "authorized-user@company.internal"
            }
            return RedirectResponse(url=f"{FRONTEND_URL}/console?gmail_connected=true")
        else:
            return RedirectResponse(url=f"{FRONTEND_URL}/console?gmail_error=token_exchange_failed")
    except Exception as e:
        return RedirectResponse(url=f"{FRONTEND_URL}/console?gmail_error={str(e)}")

@router.get("/messages")
def list_messages():
    """
    Retrieves authorized mailbox messages for the user to select.
    Does NOT automatically analyze the entire mailbox.
    """
    token_info = _gmail_tokens.get("default_user")

    # If live token is active, fetch from Gmail API
    if token_info and token_info.get("access_token"):
        try:
            headers = {"Authorization": f"Bearer {token_info['access_token']}"}
            url = "https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=10"
            res = requests.get(url, headers=headers, timeout=8)
            if res.status_code == 200:
                raw_list = res.json().get("messages", [])
                formatted = []
                for m in raw_list[:5]:
                    msg_detail = requests.get(f"https://gmail.googleapis.com/gmail/v1/users/me/messages/{m['id']}", headers=headers, timeout=5).json()
                    snippet = msg_detail.get("snippet", "")
                    headers_list = msg_detail.get("payload", {}).get("headers", [])
                    subject = next((h["value"] for h in headers_list if h["name"].lower() == "subject"), "(No Subject)")
                    sender = next((h["value"] for h in headers_list if h["name"].lower() == "from"), "Unknown")
                    date = next((h["value"] for h in headers_list if h["name"].lower() == "date"), "")
                    formatted.append({
                        "id": m["id"],
                        "subject": subject,
                        "sender": sender,
                        "date": date,
                        "snippet": snippet,
                        "risk_tag": "PENDING_INSPECTION"
                    })
                return {"messages": formatted, "mailbox": token_info.get("email", "Authorized User")}
        except Exception:
            pass

    # Return sandbox authorized mailbox
    return {
        "messages": [
            {
                "id": m["id"],
                "subject": m["subject"],
                "sender": m["sender"],
                "date": m["date"],
                "snippet": m["snippet"],
                "risk_tag": m["risk_tag"]
            }
            for m in SANDBOX_MESSAGES
        ],
        "mailbox": "soc-analyst@enterprise-mesh.internal",
        "note": "Authorized Gmail Mailbox Ready for Selective Forensics"
    }

@router.post("/analyze/{message_id}")
def analyze_selected_message(message_id: str):
    """
    CRITICAL ARCHITECTURE RULE:
    Pipes selected Gmail message directly into the EXISTING 12-scanner analysis pipeline.
    Does NOT create a second independent analysis engine.
    """
    raw_eml_str = ""

    # Check sandbox messages first
    sandbox_match = next((m for m in SANDBOX_MESSAGES if m["id"] == message_id), None)
    if sandbox_match:
        raw_eml_str = sandbox_match["raw_eml"]
    else:
        # Fetch from live Gmail API if authenticated
        token_info = _gmail_tokens.get("default_user")
        if token_info and token_info.get("access_token"):
            try:
                headers = {"Authorization": f"Bearer {token_info['access_token']}"}
                url = f"https://gmail.googleapis.com/gmail/v1/users/me/messages/{message_id}?format=raw"
                res = requests.get(url, headers=headers, timeout=10)
                if res.status_code == 200:
                    raw_b64 = res.json().get("raw", "")
                    raw_eml_str = base64.urlsafe_b64decode(raw_b64.encode("utf-8")).decode("utf-8", errors="replace")
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Failed to fetch Gmail message: {e}")

    if not raw_eml_str:
        raise HTTPException(status_code=404, detail="Selected Gmail message could not be retrieved")

    # RUN THE EXISTING SENTINEL MESH ANALYSIS PIPELINE
    raw_bytes = raw_eml_str.encode("utf-8")
    email_obj = parse_eml(raw_bytes)
    header_result = run_header_forensics(email_obj)
    geo_result = trace_origin(header_result["relay_chain"])
    language_result = score_language(email_obj.get("body", ""), email_obj.get("subject", ""))
    url_result = analyze_all_urls(email_obj.get("body", "") + " " + email_obj.get("body_html", ""))
    attachment_result = analyze_all_attachments(email_obj.get("attachments", []))

    # Build the standard 12-scanner report
    report = build_report(
        email_obj,
        header_result,
        geo_result,
        language_result,
        url_result,
        attachment_result
    )

    # Automatically feed into Threat Intelligence Layer
    extract_threat_events_from_report(report)

    # Register in Evidence Vault & Anchor to Blockchain
    ev = register_evidence(
        investigation_id=report["case_id"],
        evidence_type="GMAIL_MESSAGE",
        data=raw_eml_str,
        file_name=f"gmail-{message_id}.eml",
        created_by="gmail-oauth@sentinel.mesh"
    )

    record_custody_event(
        evidence_id=ev["evidence_id"],
        evidence_hash=ev["sha256"],
        event="EVIDENCE_CAPTURED",
        user_id="gmail-oauth@sentinel.mesh",
        notes=f"Selected email ingested from Gmail API (ID: {message_id})"
    )

    return report
