import os
import hashlib
import time
from typing import Optional, Dict, Any
from fastapi import APIRouter, HTTPException, Depends, Header
from pydantic import BaseModel
from jose import jwt, JWTError
from modules.database import db

router = APIRouter(prefix="/api/v2/auth", tags=["Authentication & Multi-User"])

JWT_SECRET = os.environ.get("JWT_SECRET", "sentinel_mesh_soc_jwt_secret_key_2026_production")
ALGORITHM = "HS256"
SALT = "sentinel_mesh_salt_v2"

class RegisterRequest(BaseModel):
    email: str
    password: str
    role: Optional[str] = "investigator"

class LoginRequest(BaseModel):
    email: str
    password: str

def hash_password(password: str) -> str:
    return hashlib.sha256(f"{SALT}{password}".encode()).hexdigest()

def create_jwt_token(user_id: str, email: str, role: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "role": role,
        "exp": int(time.time()) + (86400 * 7) # 7 days
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=ALGORITHM)

def decode_token(token: str) -> Optional[Dict[str, Any]]:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[ALGORITHM])
    except JWTError:
        return None

def get_current_user(authorization: Optional[str] = Header(None)) -> Dict[str, Any]:
    """
    Extracts current user from Bearer token.
    If no token is supplied, returns a guest analyst profile so single-user demo never breaks.
    """
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ")[1]
        decoded = decode_token(token)
        if decoded:
            return {
                "id": decoded.get("sub"),
                "email": decoded.get("email"),
                "role": decoded.get("role", "investigator"),
                "is_authenticated": True
            }

    # Safe fallback: guest analyst
    return {
        "id": "usr-guest-analyst",
        "email": "analyst@sentinel.mesh",
        "role": "analyst",
        "is_authenticated": False
    }

@router.post("/register")
def register(req: RegisterRequest):
    allowed_roles = ["investigator", "analyst", "admin"]
    role = req.role if req.role in allowed_roles else "investigator"

    existing = db.get_user_by_email(req.email)
    if existing:
        raise HTTPException(status_code=400, detail="User with this email already exists")

    hashed_pw = hash_password(req.password)
    new_user = db.create_user(req.email, role, hashed_pw)
    token = create_jwt_token(new_user["id"], new_user["email"], new_user["role"])

    return {
        "message": "User registered successfully",
        "token": token,
        "user": {
            "id": new_user["id"],
            "email": new_user["email"],
            "role": new_user["role"]
        }
    }

@router.post("/login")
def login(req: LoginRequest):
    user = db.get_user_by_email(req.email)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    hashed_input = hash_password(req.password)
    if user.get("password_hash") != hashed_input:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_jwt_token(user["id"], user["email"], user["role"])
    return {
        "message": "Authentication successful",
        "token": token,
        "user": {
            "id": user["id"],
            "email": user["email"],
            "role": user["role"]
        }
    }

@router.get("/me")
def get_me(user: Dict[str, Any] = Depends(get_current_user)):
    return user

@router.get("/session")
def get_session(user: Dict[str, Any] = Depends(get_current_user)):
    return {
        "active_user": user,
        "roles_available": ["investigator", "analyst", "admin"],
        "capabilities": {
            "can_analyze": True,
            "can_review_evidence": user["role"] in ["analyst", "admin"],
            "can_view_aggregated_intel": True,
            "can_manage_ledger": user["role"] in ["analyst", "admin"],
            "can_manage_users": user["role"] == "admin"
        }
    }
