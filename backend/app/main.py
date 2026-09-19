from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.ingestion.parser import parse_eml
from app.headers.forensics import run_header_forensics
from app.geoip.tracer import trace_origin
from app.nlp.classifier import score_language
from app.intel.urls import analyze_all_urls
from app.intel.attachments import analyze_all_attachments
from app.report.builder import build_report

app = FastAPI(
    title="SENTINEL-MESH API",
    description="Live forensic engine for email threat investigation, header forensics, URL intelligence, and network geolocation.",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
def health():
    return {
        "status": "online",
        "engine": "Sentinel Mesh Forensic Core v2.0",
        "threat_intel_active": True
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

    return report