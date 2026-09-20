import os
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.ingestion.parser import parse_eml
from app.headers.forensics import run_header_forensics
from app.geoip.tracer import trace_origin
from app.nlp.classifier import score_language
from app.intel.urls import analyze_all_urls
from app.intel.attachments import analyze_all_attachments
from app.report.builder import build_report

# Modular Sentinel Mesh v2 Extensions
from modules.database import db
from modules.auth.service import router as auth_router
from modules.investigations.manager import router as investigations_router
from modules.threat_intel.engine import router as threat_intel_router, extract_threat_events_from_report
from modules.evidence.engine import router as evidence_router, register_evidence
from modules.blockchain.ledger import router as blockchain_router, record_custody_event
from integrations.gmail.oauth import router as gmail_router
from modules.extension.routes import router as extension_router

app = FastAPI(
    title="SENTINEL-MESH API",
    description="Live forensic engine for email threat investigation, header forensics, URL intelligence, and network geolocation.",
    version="2.1.0"
)

# CORS: Read FRONTEND_URL or allow development origins
frontend_url = os.environ.get("FRONTEND_URL", "").strip().rstrip("/")
allowed_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000"
]
if frontend_url:
    allowed_origins.append(frontend_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins if frontend_url else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Modular v2 Extension Routers
app.include_router(auth_router)
app.include_router(investigations_router)
app.include_router(threat_intel_router)
app.include_router(evidence_router)
app.include_router(blockchain_router)
app.include_router(gmail_router)
app.include_router(extension_router)

@app.get("/api/health")
@app.get("/health")
def health():
    db_status = db.ping()
    return {
        "status": "online",
        "engine": "Sentinel Mesh Forensic Core v2.1",
        "threat_intel_active": True,
        "database": db_status
    }

SAMPLE_CASES = [
    {
        "id": "case-bec-01",
        "title": "Urgent Wire Acquisition — CEO Impersonation (BEC)",
        "scenario": "Business Email Compromise",
        "sender": "Satya Nadella <ceo-desk@office-microsoft-notice.com>",
        "subject": "STRICTLY CONFIDENTIAL: Wire Transfer for Q3 Project Delta",
        "date": "Today, 09:14 AM",
        "snippet": "We are finalizing the confidential acquisition today. Wire $248,500 immediately to the attached escrow account...",
        "risk_tag": "CRITICAL",
        "mock_eml": """From: "Satya Nadella" <satya@office-microsoft-notice.com>
To: finance-team@company.internal
Reply-To: wire-processing@drop-vault-finance.top
Subject: STRICTLY CONFIDENTIAL: Wire Transfer for Q3 Project Delta
Date: Wed, 18 Sep 2026 09:14:22 +0000
Message-ID: <20260918.DELTA.992@office-microsoft-notice.com>
Received: from mail-node-out.hosted-bulletproof.com (185.220.101.45) by mx.company.internal with SMTP; Wed, 18 Sep 2026 09:14:25 +0000
Authentication-Results: mx.company.internal; spf=fail (domain office-microsoft-notice.com does not designate 185.220.101.45); dkim=fail; dmarc=fail action=none

Please process this wire transfer of $248,500 immediately for Project Delta. Do not discuss this over standard phone lines as this acquisition is strictly confidential. Reply directly with the SWIFT wire confirmation receipt.
"""
    },
    {
        "id": "case-phish-02",
        "title": "Microsoft 365 Account Suspension Notice",
        "scenario": "Credential Harvesting",
        "sender": "Microsoft Security Team <account-alert@auth-verify-security.xyz>",
        "subject": "ACTION REQUIRED: Your M365 access will expire in 24 hours",
        "date": "Today, 08:30 AM",
        "snippet": "Unusual login activity detected from IP 45.133.1.20. Confirm your identity to prevent permanent mailbox suspension...",
        "risk_tag": "HIGH",
        "mock_eml": """From: "Microsoft Account Security" <alert@auth-verify-security.xyz>
To: target-user@company.internal
Reply-To: support@auth-verify-security.xyz
Subject: ACTION REQUIRED: Your M365 access will expire in 24 hours
Date: Wed, 18 Sep 2026 08:30:10 +0000
Message-ID: <ms-sec-991240182@auth-verify-security.xyz>
Received: from cloud-vps-ams.vultr.com (45.76.88.192) by mx.company.internal with SMTP; Wed, 18 Sep 2026 08:30:12 +0000
Authentication-Results: mx.company.internal; spf=softfail; dkim=fail; dmarc=fail

Final notice: unusual activity detected from unfamiliar location. Confirm your login credentials immediately:
http://micros0ft-login-verify.xyz/auth/signin?user=target-user@company.internal
Failure to verify identity within 24 hours will cause mailbox termination.
"""
    },
    {
        "id": "case-malware-03",
        "title": "DHL Global Express — Overdue Shipping Invoice #99142",
        "scenario": "Malware & Weaponized Attachment",
        "sender": "DHL Express Tracking <dispatch@dhl-express-tracking.com>",
        "subject": "Delivery Exception: Outstanding Customs Fee for Parcel #881902",
        "date": "Yesterday, 17:45 PM",
        "snippet": "Your package cannot be released without clearance. Download and run the attached customs declaration file...",
        "risk_tag": "CRITICAL",
        "mock_eml": """From: "DHL Logistics" <dispatch@dhl-express-tracking.com>
To: logistics@company.internal
Reply-To: dispatch@dhl-express-tracking.com
Subject: Delivery Exception: Outstanding Customs Fee for Parcel #881902
Date: Tue, 17 Sep 2026 17:45:00 +0000
Message-ID: <dhl-parcel-881902@dhl-express-tracking.com>
Received: from dedicated-nl.ovh.net (51.15.80.201) by mx.company.internal with SMTP; Tue, 17 Sep 2026 17:45:02 +0000
Authentication-Results: mx.company.internal; spf=fail; dkim=fail; dmarc=fail

Dear Customer, your international parcel has been held at customs. Please inspect the attached customs release manifest to authorize delivery:
hxxp://track-dhl-parcel-customs.club/download/release.iso
"""
    },
    {
        "id": "case-clean-04",
        "title": "Google Cloud Platform — Monthly Architecture Review",
        "scenario": "Legitimate / Verified Traffic",
        "sender": "Google Cloud Support <cloud-alerts@google.com>",
        "subject": "Your Google Cloud Platform Architecture Health Summary",
        "date": "Yesterday, 14:10 PM",
        "snippet": "Here is your monthly infrastructure audit. All compute instances are performing within optimal latency boundaries...",
        "risk_tag": "CLEAN",
        "mock_eml": """From: "Google Cloud Platform" <cloud-alerts@google.com>
To: ops-team@company.internal
Reply-To: cloud-alerts@google.com
Return-Path: <cloud-alerts@google.com>
Subject: Your Google Cloud Platform Architecture Health Summary
Date: Tue, 17 Sep 2026 14:10:00 +0000
Message-ID: <gcp-infra-audit-2026@google.com>
Received: from mail-pj1-f67.google.com (209.85.216.67) by mx.company.internal with SMTP; Tue, 17 Sep 2026 14:10:02 +0000
Authentication-Results: mx.company.internal; spf=pass (google.com: domain of cloud-alerts@google.com designates 209.85.216.67 as permitted sender); dkim=pass header.i=@google.com; dmarc=pass (p=REJECT)

Hello Operations Team,

Your Google Cloud Platform quarterly review report is now ready in the Cloud Console. All services are operating under healthy load metrics.
Review details securely at https://console.cloud.google.com/monitoring
"""
    }
]

@app.get("/api/sample-cases")
def get_sample_cases():
    return SAMPLE_CASES

@app.post("/api/sample-cases/{case_id}/analyze")
def analyze_sample_case(case_id: str):
    case = next((c for c in SAMPLE_CASES if c["id"] == case_id), None)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    raw_bytes = case["mock_eml"].encode("utf-8")
    email_obj = parse_eml(raw_bytes)

    if case["id"] == "case-malware-03":
        email_obj["attachments"] = [{
            "filename": "customs_declaration_manifest.iso",
            "content_type": "application/x-iso9660-image",
            "size": 482910,
            "raw_bytes": b"MOCK_MALWARE_PAYLOAD_BINARY_HEADER",
            "sha256": "4b72ef919864299b841a0279a0bcf5e771e86b24d77682bc8c5ad024921615f3"
        }]

    header_result = run_header_forensics(email_obj)
    geo_result = trace_origin(header_result["relay_chain"])

    # Deterministic geo overrides for sample cases to ensure consistent results
    SAMPLE_GEO_OVERRIDES = {
        "185.220.101.45": {
            "ip": "185.220.101.45",
            "hostname": "tor-exit-relay-45.torservers.net",
            "verdict": "resolved",
            "asn": "AS60729",
            "org": "Zwiebelfreunde e.V. (Tor Exit)",
            "city": "Amsterdam",
            "region": "North Holland",
            "country": "Netherlands",
            "country_code": "NL",
            "approximate_location": "Amsterdam, North Holland, Netherlands",
            "lat": 52.3676,
            "lon": 4.9041,
            "network_type": {
                "category": "Tor Exit Node / Bulletproof Hosting",
                "is_datacenter": True,
                "risk_modifier": 35,
                "risk_label": "Tor Anonymity Network — High Risk Infrastructure"
            },
            "threat_intel": {"is_tor": True, "is_vpn": False, "is_proxy": False, "is_datacenter": True, "is_malicious": True, "reputation": "malicious", "threat_types": ["TOR_EXIT_NODE"], "last_seen": None},
            "location_disclaimer": "Approximate Network Infrastructure Location (Autonomous System MTA gateway, NOT physical user location)",
            "all_hops": ["185.220.101.45"],
            "geolocation_source": "verified_sample"
        },
        "45.76.88.192": {
            "ip": "45.76.88.192",
            "hostname": "45.76.88.192.vultrusercontent.com",
            "verdict": "resolved",
            "asn": "AS20473",
            "org": "The Constant Company, LLC (Vultr)",
            "city": "Amsterdam",
            "region": "North Holland",
            "country": "Netherlands",
            "country_code": "NL",
            "approximate_location": "Amsterdam, North Holland, Netherlands",
            "lat": 52.3676,
            "lon": 4.9041,
            "network_type": {
                "category": "Datacenter / Cloud Infrastructure",
                "is_datacenter": True,
                "risk_modifier": 20,
                "risk_label": "Cloud VPS — Frequently abused for phishing campaigns"
            },
            "threat_intel": {"is_tor": False, "is_vpn": False, "is_proxy": False, "is_datacenter": True, "is_malicious": False, "reputation": "suspicious", "threat_types": [], "last_seen": None},
            "location_disclaimer": "Approximate Network Infrastructure Location (Autonomous System MTA gateway, NOT physical user location)",
            "all_hops": ["45.76.88.192"],
            "geolocation_source": "verified_sample"
        },
        "51.15.80.201": {
            "ip": "51.15.80.201",
            "hostname": "51-15-80-201.rev.poneytelecom.eu",
            "verdict": "resolved",
            "asn": "AS12876",
            "org": "Scaleway S.A.S. (Online SAS)",
            "city": "Paris",
            "region": "Île-de-France",
            "country": "France",
            "country_code": "FR",
            "approximate_location": "Paris, Île-de-France, France",
            "lat": 48.8566,
            "lon": 2.3522,
            "network_type": {
                "category": "Datacenter / Cloud Infrastructure",
                "is_datacenter": True,
                "risk_modifier": 25,
                "risk_label": "European Cloud Hosting — Used for malware distribution"
            },
            "threat_intel": {"is_tor": False, "is_vpn": False, "is_proxy": False, "is_datacenter": True, "is_malicious": True, "reputation": "malicious", "threat_types": ["MALWARE_DISTRIBUTION"], "last_seen": None},
            "location_disclaimer": "Approximate Network Infrastructure Location (Autonomous System MTA gateway, NOT physical user location)",
            "all_hops": ["51.15.80.201"],
            "geolocation_source": "verified_sample"
        },
        "209.85.216.67": {
            "ip": "209.85.216.67",
            "hostname": "mail-pj1-f67.google.com",
            "verdict": "resolved",
            "asn": "AS15169",
            "org": "Google LLC",
            "city": "Mountain View",
            "region": "California",
            "country": "United States",
            "country_code": "US",
            "approximate_location": "Mountain View, California, United States",
            "lat": 37.3861,
            "lon": -122.0839,
            "network_type": {
                "category": "Commercial Gateway",
                "is_datacenter": True,
                "risk_modifier": 0,
                "risk_label": "Legitimate Corporate Infrastructure (Google Mail)"
            },
            "threat_intel": {"is_tor": False, "is_vpn": False, "is_proxy": False, "is_datacenter": True, "is_malicious": False, "reputation": "trusted", "threat_types": [], "last_seen": None},
            "location_disclaimer": "Approximate Network Infrastructure Location (Google LLC MTA gateway, NOT physical user location)",
            "all_hops": ["209.85.216.67"],
            "geolocation_source": "verified_sample"
        }
    }
    
    # Apply deterministic override if this is a known sample IP
    detected_ip = geo_result.get("ip", "")
    if detected_ip in SAMPLE_GEO_OVERRIDES:
        geo_result = SAMPLE_GEO_OVERRIDES[detected_ip]
    language_result = score_language(email_obj.get("body", ""), email_obj.get("subject", ""))
    url_result = analyze_all_urls(email_obj.get("body", ""))
    attachment_result = analyze_all_attachments(email_obj.get("attachments", []))

    report = build_report(
        email_obj,
        header_result,
        geo_result,
        language_result,
        url_result,
        attachment_result
    )
    extract_threat_events_from_report(report)
    return report

@app.post("/api/analyze")
async def analyze_email(file: UploadFile = File(...)):
    raw = await file.read()

    email_obj = parse_eml(raw)
    header_result = run_header_forensics(email_obj)
    geo_result = trace_origin(header_result["relay_chain"])
    language_result = score_language(email_obj.get("body", ""), email_obj.get("subject", ""))
    url_result = analyze_all_urls(email_obj.get("body", "") + " " + email_obj.get("body_html", ""))
    attachment_result = analyze_all_attachments(email_obj.get("attachments", []))

    report = build_report(
        email_obj,
        header_result,
        geo_result,
        language_result,
        url_result,
        attachment_result
    )
    extract_threat_events_from_report(report)
    return report


@app.post("/api/scan/email")
async def scan_email(payload: dict = None):
    raw_text = ""
    if payload:
        raw_text = payload.get("email") or payload.get("raw_eml") or payload.get("content") or ""
    raw = raw_text.encode("utf-8")

    email_obj = parse_eml(raw)
    header_result = run_header_forensics(email_obj)
    geo_result = trace_origin(header_result["relay_chain"])
    language_result = score_language(email_obj.get("body", ""), email_obj.get("subject", ""))
    url_result = analyze_all_urls(email_obj.get("body", "") + " " + email_obj.get("body_html", ""))
    attachment_result = analyze_all_attachments(email_obj.get("attachments", []))

    report = build_report(
        email_obj,
        header_result,
        geo_result,
        language_result,
        url_result,
        attachment_result
    )
    extract_threat_events_from_report(report)
    return report