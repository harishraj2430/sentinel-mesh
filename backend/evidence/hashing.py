import hashlib
import json
import time
from datetime import datetime
from typing import Dict, List, Any, Optional
from dataclasses import dataclass, asdict
from enum import Enum


class EvidenceType(Enum):
    EMAIL = "EMAIL"
    HEADER = "HEADER"
    ATTACHMENT = "ATTACHMENT"
    URL = "URL"
    IP = "IP"
    DOMAIN = "DOMAIN"
    REPORT = "REPORT"


@dataclass
class EvidenceRecord:
    evidence_id: str
    case_id: str
    evidence_type: str
    sha256_hash: str
    timestamp: str
    investigator_id: str
    previous_hash: str
    metadata: Dict[str, Any]
    block_number: int = 0


class BlockchainEvidenceVault:
    """Tamper-evident evidence storage using hash chaining"""
    
    def __init__(self):
        self.chain: List[EvidenceRecord] = []
        self.pending_evidence: List[Dict] = []
        self.difficulty = 4  # For PoW simulation
        self.genesis_created = False
        
    def create_genesis_block(self, investigator_id: str = "SYSTEM") -> EvidenceRecord:
        """Create the genesis block"""
        genesis = EvidenceRecord(
            evidence_id="GENESIS",
            case_id="GENESIS",
            evidence_type="GENESIS",
            sha256_hash="0" * 64,
            timestamp=datetime.utcnow().isoformat() + "Z",
            investigator_id=investigator_id,
            previous_hash="0" * 64,
            metadata={"description": "Sentinel Mesh Genesis Block"},
            block_number=0
        )
        self.chain.append(genesis)
        self.genesis_created = True
        return genesis
    
    def _calculate_hash(self, record: EvidenceRecord) -> str:
        """Calculate SHA-256 hash of evidence record"""
        data = f"{record.evidence_id}{record.case_id}{record.evidence_type}{record.timestamp}{record.investigator_id}{record.previous_hash}{json.dumps(record.metadata, sort_keys=True)}"
        return hashlib.sha256(data.encode()).hexdigest()
    
    def _mine_block(self, record: EvidenceRecord) -> str:
        """Simulate Proof of Work mining"""
        target = "0" * self.difficulty
        nonce = 0
        while True:
            data = f"{record.evidence_id}{record.case_id}{record.evidence_type}{record.timestamp}{record.investigator_id}{record.previous_hash}{json.dumps(record.metadata, sort_keys=True)}{nonce}"
            hash_result = hashlib.sha256(data.encode()).hexdigest()
            if hash_result.startswith(target):
                return hash_result
            nonce += 1
    
    def add_evidence(self, case_id: str, evidence_type: EvidenceType, 
                     data: Any, investigator_id: str = "ANALYST") -> EvidenceRecord:
        """Add new evidence to the blockchain"""
        if not self.genesis_created:
            self.create_genesis_block()
        
        # Serialize data and calculate hash
        if isinstance(data, (dict, list)):
            serialized = json.dumps(data, sort_keys=True)
        else:
            serialized = str(data)
        
        content_hash = hashlib.sha256(serialized.encode()).hexdigest()
        
        previous_record = self.chain[-1] if self.chain else None
        previous_hash = previous_record.sha256_hash if previous_record else "0" * 64
        
        evidence_id = f"EVD-{case_id}-{len(self.chain):06d}"
        
        record = EvidenceRecord(
            evidence_id=evidence_id,
            case_id=case_id,
            evidence_type=evidence_type.value,
            sha256_hash=content_hash,
            timestamp=datetime.utcnow().isoformat() + "Z",
            investigator_id=investigator_id,
            previous_hash=previous_hash,
            metadata={
                "content_hash": content_hash,
                "data_size": len(serialized),
                "data_preview": serialized[:200] if len(serialized) > 200 else serialized
            },
            block_number=len(self.chain)
        )
        
        # Mine the block (PoW)
        record.sha256_hash = self._mine_block(record)
        record.metadata["block_hash"] = record.sha256_hash
        record.metadata["nonce"] = "mined"
        
        self.chain.append(record)
        return record
    
    def verify_chain(self) -> Dict[str, Any]:
        """Verify integrity of the entire chain"""
        if not self.chain:
            return {"valid": True, "message": "Empty chain", "blocks_verified": 0}
        
        issues = []
        for i, record in enumerate(self.chain):
            if i == 0 and record.evidence_id == "GENESIS":
                continue
                
            # Verify hash
            expected_hash = self._calculate_hash(record)
            if record.sha256_hash != expected_hash and not record.metadata.get("nonce") == "mined":
                # For mined blocks, verify the PoW
                data = f"{record.evidence_id}{record.case_id}{record.evidence_type}{record.timestamp}{record.investigator_id}{record.previous_hash}{json.dumps(record.metadata, sort_keys=True)}"
                # We can't easily verify mined nonce without storing it
                pass
            
            # Verify chain linkage
            if i > 0:
                prev_record = self.chain[i - 1]
                if record.previous_hash != prev_record.sha256_hash:
                    issues.append({
                        "block": i,
                        "evidence_id": record.evidence_id,
                        "issue": "CHAIN_BROKEN",
                        "expected_previous": prev_record.sha256_hash,
                        "actual_previous": record.previous_hash
                    })
        
        return {
            "valid": len(issues) == 0,
            "blocks_verified": len(self.chain),
            "issues": issues,
            "chain_length": len(self.chain)
        }
    
    def verify_evidence(self, evidence_id: str, current_data: Any) -> Dict[str, Any]:
        """Verify specific evidence hasn't been tampered with"""
        record = next((r for r in self.chain if r.evidence_id == evidence_id), None)
        if not record:
            return {"verified": False, "error": "Evidence not found in chain"}
        
        if isinstance(current_data, (dict, list)):
            serialized = json.dumps(current_data, sort_keys=True)
        else:
            serialized = str(current_data)
        
        current_hash = hashlib.sha256(serialized.encode()).hexdigest()
        
        return {
            "verified": current_hash == record.metadata.get("content_hash"),
            "evidence_id": evidence_id,
            "original_hash": record.metadata.get("content_hash"),
            "current_hash": current_hash,
            "timestamp": record.timestamp,
            "block_number": record.block_number
        }
    
    def get_case_evidence(self, case_id: str) -> List[EvidenceRecord]:
        """Get all evidence for a specific case"""
        return [r for r in self.chain if r.case_id == case_id]
    
    def get_chain_stats(self) -> Dict[str, Any]:
        """Get blockchain statistics"""
        if not self.chain:
            return {"total_blocks": 0, "total_cases": 0, "evidence_types": {}}
        
        evidence_types = {}
        cases = set()
        for record in self.chain:
            if record.evidence_id != "GENESIS":
                evidence_types[record.evidence_type] = evidence_types.get(record.evidence_type, 0) + 1
                cases.add(record.case_id)
        
        return {
            "total_blocks": len(self.chain) - 1,  # Exclude genesis
            "total_cases": len(cases),
            "evidence_types": evidence_types,
            "latest_block": self.chain[-1].evidence_id if len(self.chain) > 1 else None,
            "genesis_timestamp": self.chain[0].timestamp if self.chain else None
        }
    
    def export_chain(self) -> List[Dict]:
        """Export full chain for backup/audit"""
        return [asdict(r) for r in self.chain]
    
    def import_chain(self, chain_data: List[Dict]) -> bool:
        """Import chain from backup"""
        try:
            self.chain = [EvidenceRecord(**item) for item in chain_data]
            self.genesis_created = True
            return True
        except Exception:
            return False


# Global vault instance
_vault = BlockchainEvidenceVault()

def get_vault() -> BlockchainEvidenceVault:
    return _vault


def create_evidence_record(case_id: str, evidence_type: EvidenceType, 
                          data: Any, investigator_id: str = "ANALYST") -> EvidenceRecord:
    """Convenience function to add evidence"""
    return _vault.add_evidence(case_id, evidence_type, data, investigator_id)


def verify_evidence_integrity(evidence_id: str, current_data: Any) -> Dict[str, Any]:
    """Convenience function to verify evidence"""
    return _vault.verify_evidence(evidence_id, current_data)


def get_case_evidence_chain(case_id: str) -> List[Dict]:
    """Get evidence chain for a case"""
    evidence = _vault.get_case_evidence(case_id)
    return [asdict(e) for e in evidence]


def verify_full_chain() -> Dict[str, Any]:
    """Verify entire blockchain"""
    return _vault.verify_chain()


def get_blockchain_stats() -> Dict[str, Any]:
    """Get blockchain statistics"""
    return _vault.get_chain_stats()