from typing import Dict, Any, Optional
from fastapi import APIRouter
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

router = APIRouter(prefix="/api/v2/extension", tags=["Chrome Extension Compatibility"])

class ExtensionScanRequest(BaseModel):
    raw_content: str
    sender: Optional[str] = None
    subject: Optional[str] = None
    source_url: Optional[str] = "https://mail.google.com"

@router.post("/scan")
def scan_from_extension(req: ExtensionScanRequest):
    """
    Chrome Extension Ingestion Endpoint:
    Receives email content extracted by the browser extension in Gmail web interface,
    and runs it through the core Sentinel Mesh 12-scanner engine.
    """
    raw_bytes = req.raw_content.encode("utf-8")
    email_obj = parse_eml(raw_bytes)

    if req.sender and not email_obj.get("from"):
        email_obj["from"] = req.sender
    if req.subject and not email_obj.get("subject"):
        email_obj["subject"] = req.subject

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

    # Ingest threat events
    extract_threat_events_from_report(report)

    # Evidence & blockchain anchoring
    ev = register_evidence(
        investigation_id=report["case_id"],
        evidence_type="EXTENSION_CAPTURED_EMAIL",
        data=req.raw_content,
        file_name=f"{report['case_id']}-extension.eml",
        created_by="chrome-extension@sentinel.mesh"
    )

    record_custody_event(
        evidence_id=ev["evidence_id"],
        evidence_hash=ev["sha256"],
        event="EVIDENCE_CAPTURED",
        user_id="chrome-extension@sentinel.mesh",
        notes=f"Captured via Chrome Extension from {req.source_url}"
    )

    return {
        "status": "ANALYSIS_COMPLETE",
        "case_id": report["case_id"],
        "threat_detected": report["threat_detected"],
        "threat_type": report["threat_type"],
        "severity": report["severity"],
        "overall_score": report["overall_score"],
        "recommended_action": report["recommended_action"],
        "evidence_id": ev["evidence_id"],
        "evidence_hash": ev["sha256"],
        "full_report": report
    }
