from typing import Dict, List, Any, Optional
from datetime import datetime
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from modules.auth.service import get_current_user
from modules.evidence.engine import register_evidence
from modules.blockchain.ledger import record_custody_event

router = APIRouter(prefix="/api/v2/investigations", tags=["User Investigation History"])

class CreateInvestigationRequest(BaseModel):
    title: str
    source: str # "UPLOAD", "GMAIL", "SAMPLE_CASE", "CHROME_EXTENSION"
    report_data: Dict[str, Any]
    notes: Optional[str] = ""

class ReviewInvestigationRequest(BaseModel):
    action: str # "CONFIRM_THREAT", "MARK_FALSE_POSITIVE", "ESCALATE"
    analyst_notes: str

# In-memory investigation storage partitioned by user
_investigations: Dict[str, Dict[str, Any]] = {}

def _seed_initial_investigations():
    if _investigations:
        return

    sample_invs = [
        {
            "id": "INV-2026-001",
            "user_id": "analyst@sentinel.mesh",
            "title": "CEO Impersonation Wire Solicitation",
            "source": "GMAIL",
            "threat_type": "BUSINESS EMAIL COMPROMISE (BEC)",
            "severity": "CRITICAL",
            "overall_score": 93,
            "evidence_hash": "a84f91c71289fe1b9d21c87a9b8e721a3df98124b89c71a2e9871bcde4120912",
            "status": "APPROVED",
            "created_at": "2026-09-18T09:14:22Z",
            "summary": "Urgent $248,500 wire transfer request masquerading as Satya Nadella with Reply-To diversion."
        },
        {
            "id": "INV-2026-002",
            "user_id": "investigator@sentinel.mesh",
            "title": "M365 Credential Harvesting Lure",
            "source": "UPLOAD",
            "threat_type": "CREDENTIAL PHISHING",
            "severity": "HIGH",
            "overall_score": 85,
            "evidence_hash": "b73c82d62391ea2c8d10b76e8c7d612f2ea87214a90b62b1d8760acde3210821",
            "status": "IN_REVIEW",
            "created_at": "2026-09-18T08:30:10Z",
            "summary": "Fake Microsoft account alert linking to credential phishing portal."
        },
        {
            "id": "INV-2026-003",
            "user_id": "analyst@sentinel.mesh",
            "title": "DHL Shipping Overdue Invoice Payload",
            "source": "UPLOAD",
            "threat_type": "MALWARE DISTRIBUTION",
            "severity": "CRITICAL",
            "overall_score": 96,
            "evidence_hash": "4b72ef919864299b841a0279a0bcf5e771e86b24d77682bc8c5ad024921615f3",
            "status": "CONFIRMED",
            "created_at": "2026-09-17T17:45:00Z",
            "summary": "Weaponized ISO attachment containing malicious delivery invoice."
        }
    ]

    for inv in sample_invs:
        _investigations[inv["id"]] = inv

@router.get("")
def list_investigations(user: Dict[str, Any] = Depends(get_current_user)):
    _seed_initial_investigations()

    user_role = user.get("role", "investigator")
    user_email = user.get("email", "")

    # Role-based access control:
    # Admins and Analysts see team investigations
    # Investigators only see their own investigations
    results = []
    for inv in _investigations.values():
        if user_role in ["admin", "analyst"] or inv["user_id"] == user_email:
            results.append(inv)

    return {
        "user": user_email,
        "role": user_role,
        "count": len(results),
        "investigations": sorted(results, key=lambda x: x["created_at"], reverse=True)
    }

@router.get("/{inv_id}")
def get_investigation(inv_id: str, user: Dict[str, Any] = Depends(get_current_user)):
    _seed_initial_investigations()
    inv = _investigations.get(inv_id)
    if not inv:
        raise HTTPException(status_code=404, detail="Investigation not found")

    user_role = user.get("role", "investigator")
    user_email = user.get("email", "")

    if user_role not in ["admin", "analyst"] and inv["user_id"] != user_email:
        raise HTTPException(status_code=403, detail="Access denied to private investigation")

    return inv

@router.post("")
def create_investigation(req: CreateInvestigationRequest, user: Dict[str, Any] = Depends(get_current_user)):
    _seed_initial_investigations()

    user_email = user.get("email", "analyst@sentinel.mesh")
    inv_id = f"INV-2026-{len(_investigations) + 1:03d}"
    now_iso = datetime.utcnow().isoformat() + "Z"

    rep = req.report_data
    threat_type = rep.get("threat_type", "UNKNOWN_ANALYSIS")
    severity = rep.get("severity", "CLEAN")
    overall_score = rep.get("overall_score", 0)

    # Register evidence in Vault and compute SHA-256
    ev_record = register_evidence(
        investigation_id=inv_id,
        evidence_type="ANALYSIS_REPORT",
        data=rep,
        file_name=f"{inv_id}-report.json",
        created_by=user_email
    )

    # Record initial Blockchain custody event
    record_custody_event(
        evidence_id=ev_record["evidence_id"],
        evidence_hash=ev_record["sha256"],
        event="EVIDENCE_CAPTURED",
        user_id=user_email,
        notes=f"Investigation created from {req.source}"
    )

    new_inv = {
        "id": inv_id,
        "user_id": user_email,
        "title": req.title or f"Investigation {inv_id}",
        "source": req.source,
        "threat_type": threat_type,
        "severity": severity,
        "overall_score": overall_score,
        "evidence_id": ev_record["evidence_id"],
        "evidence_hash": ev_record["sha256"],
        "status": "OPEN",
        "created_at": now_iso,
        "summary": rep.get("ai_forensic_analyst", req.notes or "Automated investigation case"),
        "report_data": rep
    }

    _investigations[inv_id] = new_inv
    return {
        "message": "Investigation created and anchored to blockchain",
        "investigation": new_inv
    }

@router.post("/{inv_id}/review")
def review_investigation(inv_id: str, req: ReviewInvestigationRequest, user: Dict[str, Any] = Depends(get_current_user)):
    _seed_initial_investigations()
    inv = _investigations.get(inv_id)
    if not inv:
        raise HTTPException(status_code=404, detail="Investigation not found")

    user_email = user.get("email", "analyst@sentinel.mesh")

    # Record blockchain review event
    record_custody_event(
        evidence_id=inv.get("evidence_id", f"EV-{inv_id}"),
        evidence_hash=inv.get("evidence_hash", "0" * 64),
        event="EVIDENCE_REVIEWED",
        user_id=user_email,
        notes=f"Review Action: {req.action}. Notes: {req.analyst_notes}"
    )

    inv["status"] = req.action
    inv["reviewed_by"] = user_email
    inv["review_notes"] = req.analyst_notes
    inv["reviewed_at"] = datetime.utcnow().isoformat() + "Z"

    return {
        "message": "Investigation reviewed and blockchain audit event recorded",
        "investigation": inv
    }
