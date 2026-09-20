import os
import requests
import logging
from typing import Dict, List, Any, Optional
from datetime import datetime

logger = logging.getLogger("sentinel.database")

class DatabaseManager:
    """
    Unified Database Client for Sentinel Mesh.
    Connects to Supabase PostgreSQL via PostgREST when configured,
    and falls back to thread-safe in-memory storage for offline/testing scenarios.
    """

    def __init__(self):
        self.supabase_url = os.environ.get("SUPABASE_URL", "").rstrip("/")
        self.supabase_key = os.environ.get("SUPABASE_SERVICE_KEY", "")
        self.is_connected = bool(self.supabase_url and self.supabase_key and "YOUR_SUPABASE" not in self.supabase_url)

        # In-Memory Fallback Stores
        self._memory_ledger: List[Dict[str, Any]] = []
        self._memory_threat_events: List[Dict[str, Any]] = []
        self._memory_devices: List[Dict[str, Any]] = []
        self._memory_analyses: List[Dict[str, Any]] = []
        self._memory_users: Dict[str, Dict[str, Any]] = {}

        # Seed default users in memory for immediate SOC exploration
        self._seed_default_users()

    def _seed_default_users(self):
        import hashlib
        # Password for all default accounts is: SentinelMesh@2026
        salt = "sentinel_mesh_salt"
        default_pw = hashlib.sha256(f"{salt}SentinelMesh@2026".encode()).hexdigest()

        self._memory_users["analyst@sentinel.mesh"] = {
            "id": "usr-analyst-001",
            "email": "analyst@sentinel.mesh",
            "role": "analyst",
            "password_hash": default_pw,
            "created_at": "2026-09-18T00:00:00Z"
        }
        self._memory_users["investigator@sentinel.mesh"] = {
            "id": "usr-inv-002",
            "email": "investigator@sentinel.mesh",
            "role": "investigator",
            "password_hash": default_pw,
            "created_at": "2026-09-18T00:00:00Z"
        }
        self._memory_users["admin@sentinel.mesh"] = {
            "id": "usr-admin-003",
            "email": "admin@sentinel.mesh",
            "role": "admin",
            "password_hash": default_pw,
            "created_at": "2026-09-18T00:00:00Z"
        }

    def _headers(self) -> Dict[str, str]:
        return {
            "apikey": self.supabase_key,
            "Authorization": f"Bearer {self.supabase_key}",
            "Content-Type": "application/json",
            "Prefer": "return=representation"
        }

    def ping(self) -> Dict[str, Any]:
        """Runs a tiny query against Supabase to keep Render and Supabase awake."""
        if not self.is_connected:
            return {"status": "in_memory_mode", "db": "local_fallback", "ledger_blocks": len(self._memory_ledger)}

        try:
            url = f"{self.supabase_url}/rest/v1/investigation_ledger?select=id&limit=1"
            res = requests.get(url, headers=self._headers(), timeout=3)
            if res.status_code in [200, 206]:
                return {"status": "connected", "db": "supabase_postgres", "status_code": res.status_code}
            return {"status": "degraded", "db": "supabase_error", "code": res.status_code}
        except Exception as e:
            return {"status": "fallback", "db": "local_memory", "error": str(e)}

    # -------------------------------------------------------------
    # USERS TABLE
    # -------------------------------------------------------------
    def get_user_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        email = email.lower().strip()
        if self.is_connected:
            try:
                url = f"{self.supabase_url}/rest/v1/users?email=eq.{email}&select=*"
                res = requests.get(url, headers=self._headers(), timeout=4)
                if res.status_code == 200 and res.json():
                    return res.json()[0]
            except Exception as e:
                logger.warning(f"Supabase get_user failed, falling back to memory: {e}")

        return self._memory_users.get(email)

    def create_user(self, email: str, role: str, password_hash: str) -> Dict[str, Any]:
        email = email.lower().strip()
        user_record = {
            "email": email,
            "role": role,
            "password_hash": password_hash,
            "created_at": datetime.utcnow().isoformat() + "Z"
        }

        if self.is_connected:
            try:
                url = f"{self.supabase_url}/rest/v1/users"
                res = requests.post(url, headers=self._headers(), json=user_record, timeout=4)
                if res.status_code in [200, 201]:
                    created = res.json()[0]
                    self._memory_users[email] = created
                    return created
            except Exception as e:
                logger.warning(f"Supabase create_user failed: {e}")

        user_record["id"] = f"usr-{int(datetime.utcnow().timestamp())}"
        self._memory_users[email] = user_record
        return user_record

    # -------------------------------------------------------------
    # INVESTIGATION LEDGER (Append-Only)
    # -------------------------------------------------------------
    def append_ledger_block(self, prev_hash: str, hash_val: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        record = {
            "prev_hash": prev_hash,
            "hash": hash_val,
            "payload": payload,
            "created_at": datetime.utcnow().isoformat() + "Z"
        }

        if self.is_connected:
            try:
                url = f"{self.supabase_url}/rest/v1/investigation_ledger"
                res = requests.post(url, headers=self._headers(), json=record, timeout=4)
                if res.status_code in [200, 201]:
                    saved = res.json()[0]
                    self._memory_ledger.append(saved)
                    return saved
            except Exception as e:
                logger.warning(f"Supabase append_ledger failed, storing locally: {e}")

        record["id"] = f"blk-{len(self._memory_ledger) + 1:04d}"
        self._memory_ledger.append(record)
        return record

    def get_ledger_blocks(self, limit: int = 100) -> List[Dict[str, Any]]:
        if self.is_connected:
            try:
                url = f"{self.supabase_url}/rest/v1/investigation_ledger?select=*&order=created_at.asc&limit={limit}"
                res = requests.get(url, headers=self._headers(), timeout=4)
                if res.status_code == 200:
                    return res.json()
            except Exception as e:
                logger.warning(f"Supabase get_ledger failed: {e}")

        return self._memory_ledger[-limit:]

    # -------------------------------------------------------------
    # THREAT EVENTS (Frequency Analytics)
    # -------------------------------------------------------------
    def record_threat_event(self, email_id: str, threat_type: str, reason: str, severity: str) -> Dict[str, Any]:
        record = {
            "email_id": email_id,
            "threat_type": threat_type,
            "reason": reason,
            "severity": severity,
            "created_at": datetime.utcnow().isoformat() + "Z"
        }

        if self.is_connected:
            try:
                url = f"{self.supabase_url}/rest/v1/threat_events"
                res = requests.post(url, headers=self._headers(), json=record, timeout=4)
                if res.status_code in [200, 201]:
                    saved = res.json()[0]
                    self._memory_threat_events.append(saved)
                    return saved
            except Exception as e:
                logger.warning(f"Supabase record_threat_event failed: {e}")

        record["id"] = f"te-{len(self._memory_threat_events) + 1:04d}"
        self._memory_threat_events.append(record)
        return record

    def get_all_threat_events(self) -> List[Dict[str, Any]]:
        if self.is_connected:
            try:
                url = f"{self.supabase_url}/rest/v1/threat_events?select=*&order=created_at.desc"
                res = requests.get(url, headers=self._headers(), timeout=5)
                if res.status_code == 200:
                    return res.json()
            except Exception as e:
                logger.warning(f"Supabase get_all_threat_events failed: {e}")

        return self._memory_threat_events

    # -------------------------------------------------------------
    # DEVICES & IMPOSSIBLE TRAVEL
    # -------------------------------------------------------------
    def record_device_login(self, account_email: str, ip: str, device_type: str = "PC",
                             model: str = "Workstation", city: str = "Unknown", country: str = "Unknown",
                             lat: float = 0.0, lng: float = 0.0) -> Dict[str, Any]:
        record = {
            "account_email": account_email,
            "ip": ip,
            "device_type": device_type,
            "model": model,
            "city": city,
            "country": country,
            "lat": lat,
            "lng": lng,
            "last_seen": datetime.utcnow().isoformat() + "Z"
        }

        if self.is_connected:
            try:
                url = f"{self.supabase_url}/rest/v1/devices"
                res = requests.post(url, headers=self._headers(), json=record, timeout=4)
                if res.status_code in [200, 201]:
                    saved = res.json()[0]
                    self._memory_devices.append(saved)
                    return saved
            except Exception as e:
                logger.warning(f"Supabase record_device_login failed: {e}")

        record["id"] = f"dev-{len(self._memory_devices) + 1:04d}"
        self._memory_devices.append(record)
        return record

    def get_devices(self, account_email: Optional[str] = None) -> List[Dict[str, Any]]:
        if self.is_connected:
            try:
                query = f"?select=*&order=last_seen.desc"
                if account_email:
                    query += f"&account_email=eq.{account_email}"
                url = f"{self.supabase_url}/rest/v1/devices{query}"
                res = requests.get(url, headers=self._headers(), timeout=4)
                if res.status_code == 200:
                    return res.json()
            except Exception as e:
                logger.warning(f"Supabase get_devices failed: {e}")

        if account_email:
            return [d for d in self._memory_devices if d["account_email"] == account_email]
        return self._memory_devices

# Singleton instance
db = DatabaseManager()
