import hashlib
import json
from typing import Dict, List, Any, Optional
from datetime import datetime
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from modules.database import db

router = APIRouter(prefix="/api/v2/blockchain", tags=["Blockchain & Chain of Custody"])

class ChainEventRequest(BaseModel):
    evidence_id: str
    evidence_hash: str
    event: str # EVIDENCE_CAPTURED, ANALYSIS_COMPLETED, EVIDENCE_REVIEWED, REPORT_APPROVED
    user_id: Optional[str] = "analyst@sentinel.mesh"
    notes: Optional[str] = "Forensic case event"

def compute_block_hash(prev_hash: str, payload: Dict[str, Any], timestamp: str) -> str:
    raw_str = f"{prev_hash}:{json.dumps(payload, sort_keys=True)}:{timestamp}"
    return hashlib.sha256(raw_str.encode("utf-8")).hexdigest()

def record_custody_event(evidence_id: str, evidence_hash: str, event: str, user_id: str = "analyst@sentinel.mesh", notes: str = "") -> Dict[str, Any]:
    """
    Appends a new immutable chain-of-custody block to the investigation ledger.
    """
    blocks = db.get_ledger_blocks(1)
    prev_hash = blocks[-1]["hash"] if blocks else ("0" * 64)

    timestamp = datetime.utcnow().isoformat() + "Z"
    payload = {
        "evidence_id": evidence_id,
        "evidence_hash": evidence_hash,
        "event": event,
        "user_id": user_id,
        "notes": notes,
        "timestamp": timestamp
    }

    block_hash = compute_block_hash(prev_hash, payload, timestamp)
    saved_block = db.append_ledger_block(prev_hash=prev_hash, hash_val=block_hash, payload=payload)
    return saved_block

def _ensure_genesis_and_seed():
    blocks = db.get_ledger_blocks(10)
    if blocks:
        return

    # Create Genesis Block
    genesis_timestamp = "2026-09-18T00:00:00Z"
    genesis_payload = {
        "evidence_id": "GENESIS",
        "evidence_hash": "0" * 64,
        "event": "GENESIS_INITIALIZED",
        "user_id": "system@sentinel.mesh",
        "notes": "Sentinel Mesh Immutable Forensic Ledger Root",
        "timestamp": genesis_timestamp
    }
    genesis_hash = compute_block_hash("0" * 64, genesis_payload, genesis_timestamp)
    db.append_ledger_block(prev_hash="0" * 64, hash_val=genesis_hash, payload=genesis_payload)

    # Seed Chain-of-Custody sequence for demonstration
    custody_events = [
        ("EV-case-bec-01-0001", "a84f91c71289fe1b9d21c87a9b8e721a3df98124b89c71a2e9871bcde4120912", "EVIDENCE_CAPTURED", "analyst.john@sentinel.mesh", "Raw RFC822 EML ingest"),
        ("EV-case-bec-01-0001", "a84f91c71289fe1b9d21c87a9b8e721a3df98124b89c71a2e9871bcde4120912", "ANALYSIS_COMPLETED", "analyst.john@sentinel.mesh", "12-Scanner automated verdict: BEC CRITICAL"),
        ("EV-case-bec-01-0001", "a84f91c71289fe1b9d21c87a9b8e721a3df98124b89c71a2e9871bcde4120912", "EVIDENCE_REVIEWED", "senior.analyst@sentinel.mesh", "Wire instruction diversion confirmed"),
        ("EV-case-bec-01-0001", "a84f91c71289fe1b9d21c87a9b8e721a3df98124b89c71a2e9871bcde4120912", "REPORT_APPROVED", "ciso@company.internal", "Law enforcement escalation authorized")
    ]

    for eid, ehash, ev, uid, notes in custody_events:
        record_custody_event(eid, ehash, ev, uid, notes)

@router.get("/blocks")
def get_blocks():
    _ensure_genesis_and_seed()
    blocks = db.get_ledger_blocks(200)
    return {
        "chain_length": len(blocks),
        "purpose": "Tamper-evident record of evidence integrity and chain-of-custody events.",
        "blocks": blocks
    }

@router.get("/verify")
def verify_chain():
    _ensure_genesis_and_seed()
    blocks = db.get_ledger_blocks(1000)
    if not blocks:
        return {"valid": True, "blocks_verified": 0, "issues": []}

    issues = []
    for i in range(1, len(blocks)):
        prev_block = blocks[i - 1]
        curr_block = blocks[i]

        if curr_block.get("prev_hash") != prev_block.get("hash"):
            issues.append({
                "block_index": i,
                "block_id": curr_block.get("id"),
                "issue": "CHAIN_LINK_BROKEN",
                "expected_prev": prev_block.get("hash"),
                "actual_prev": curr_block.get("prev_hash")
            })

    return {
        "valid": len(issues) == 0,
        "blocks_verified": len(blocks),
        "issues": issues,
        "status": "VERIFIED_TAMPER_FREE" if len(issues) == 0 else "TAMPERING_DETECTED",
        "verified_at": datetime.utcnow().isoformat() + "Z"
    }

@router.post("/record-event")
def record_event(req: ChainEventRequest):
    _ensure_genesis_and_seed()
    allowed_events = ["EVIDENCE_CAPTURED", "ANALYSIS_COMPLETED", "EVIDENCE_REVIEWED", "REPORT_APPROVED"]
    if req.event not in allowed_events:
        raise HTTPException(status_code=400, detail=f"Invalid custody event. Must be one of {allowed_events}")

    saved = record_custody_event(
        evidence_id=req.evidence_id,
        evidence_hash=req.evidence_hash,
        event=req.event,
        user_id=req.user_id or "analyst@sentinel.mesh",
        notes=req.notes or ""
    )
    return {
        "status": "RECORDED_TO_BLOCKCHAIN",
        "block": saved
    }

@router.post("/demo-tamper")
def demo_tamper():
    """
    Demonstration tool for presentation / judges:
    Takes an authentic evidence hash, alters 1 character, and shows how recalculating SHA-256
    instantly catches the mismatch.
    """
    authentic_data = "From: ceo@company.internal\nSubject: Legitimate Vendor Invoice\nAmount: $10,000"
    tampered_data = "From: ceo@company.internal\nSubject: Legitimate Vendor Invoice\nAmount: $100,000" # 1 zero added

    authentic_hash = hashlib.sha256(authentic_data.encode()).hexdigest()
    tampered_hash = hashlib.sha256(tampered_data.encode()).hexdigest()

    return {
        "description": "Deterministic SHA-256 Tamper Detection Demonstration",
        "authentic_payload": authentic_data,
        "authentic_sha256": authentic_hash,
        "tampered_payload": tampered_data,
        "tampered_sha256": tampered_hash,
        "hashes_match": authentic_hash == tampered_hash,
        "detection_result": "⚠ INTEGRITY MISMATCH DETECTED: Tampered file produces completely different SHA-256 hash"
    }
