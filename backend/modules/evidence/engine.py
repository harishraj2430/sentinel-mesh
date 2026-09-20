import hashlib
import json
from typing import Dict, List, Any
from datetime import datetime
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter(prefix="/api/v2/evidence", tags=["Evidence Engine & Integrity"])

class EvidenceItem(BaseModel):
    evidence_id: str
    investigation_id: str
    type: str # EMAIL, HEADERS, ATTACHMENT, URL_SET
    sha256: str
    file_name: str
    size_bytes: int
    created_at: str
    created_by: str

class VerifyEvidenceRequest(BaseModel):
    evidence_id: str
    payload_to_verify: str

# In-memory evidence registry synced with case records
_evidence_vault: Dict[str, Dict[str, Any]] = {}

def calculate_sha256(data: Any) -> str:
    """
    Computes a deterministic SHA-256 fingerprint for forensic evidence.
    Hashing provides integrity verification, not confidentiality.
    """
    if isinstance(data, bytes):
        raw_bytes = data
    elif isinstance(data, (dict, list)):
        raw_bytes = json.dumps(data, sort_keys=True).encode("utf-8")
    else:
        raw_bytes = str(data).encode("utf-8")

    return hashlib.sha256(raw_bytes).hexdigest()

def register_evidence(
    investigation_id: str,
    evidence_type: str,
    data: Any,
    file_name: str = "forensic-artifact",
    created_by: str = "analyst@sentinel.mesh"
) -> Dict[str, Any]:
    """
    Registers a new evidence artifact in the Evidence Vault with its deterministic SHA-256 hash.
    """
    hash_val = calculate_sha256(data)
    evidence_id = f"EV-{investigation_id}-{len(_evidence_vault) + 1:04d}"

    size_bytes = len(data) if isinstance(data, (bytes, str)) else len(json.dumps(data))

    record = {
        "evidence_id": evidence_id,
        "investigation_id": investigation_id,
        "type": evidence_type,
        "sha256": hash_val,
        "file_name": file_name,
        "size_bytes": size_bytes,
        "created_at": datetime.utcnow().isoformat() + "Z",
        "created_by": created_by,
        "status": "VERIFIED_ACTIVE"
    }

    _evidence_vault[evidence_id] = record
    return record

# Seed standard baseline evidence items
def _seed_baseline_evidence():
    if _evidence_vault:
        return

    sample_cases = [
        ("case-bec-01", "EMAIL", "mock_bec_email_content", "satya_nadella_wire_acquisition.eml"),
        ("case-phish-02", "EMAIL", "mock_phish_email_content", "microsoft_365_suspension_notice.eml"),
        ("case-malware-03", "ATTACHMENT", "mock_iso_payload_binary", "customs_declaration_manifest.iso"),
        ("case-clean-04", "EMAIL", "mock_clean_gcp_report", "gcp_monthly_architecture_audit.eml")
    ]

    for c_id, e_type, payload, f_name in sample_cases:
        register_evidence(c_id, e_type, payload, f_name, "soc-analyst@sentinel.mesh")

@router.get("/vault")
def get_vault():
    _seed_baseline_evidence()
    items = list(_evidence_vault.values())
    return {
        "total_items": len(items),
        "items": items,
        "integrity_principle": "SHA-256 hashing guarantees digital integrity and tamper-evidence (RFC 6234)."
    }

@router.post("/verify")
def verify_evidence(req: VerifyEvidenceRequest):
    _seed_baseline_evidence()
    record = _evidence_vault.get(req.evidence_id)
    if not record:
        raise HTTPException(status_code=404, detail="Evidence ID not found in Vault")

    computed_hash = calculate_sha256(req.payload_to_verify)
    is_match = (computed_hash.lower() == record["sha256"].lower())

    return {
        "evidence_id": req.evidence_id,
        "status": "INTEGRITY_VERIFIED" if is_match else "INTEGRITY_MISMATCH",
        "verified": is_match,
        "original_sha256": record["sha256"],
        "recalculated_sha256": computed_hash,
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "verdict_message": (
            "✓ INTEGRITY VERIFIED: Recalculated hash matches stored digital fingerprint exactly."
            if is_match else
            "⚠ INTEGRITY MISMATCH: Artifact payload differs from captured chain-of-custody hash."
        )
    }
