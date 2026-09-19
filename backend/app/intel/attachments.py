import hashlib
import os

DANGEROUS_EXTENSIONS = {
    ".exe", ".scr", ".bat", ".cmd", ".ps1", ".vbs", ".js", ".wsf", 
    ".hta", ".cpl", ".pif", ".jar", ".com"
}

CONTAINER_EXTENSIONS = {
    ".iso", ".img", ".vhd", ".dmg", ".7z", ".rar", ".tar", ".gz"
}

MACRO_EXTENSIONS = {
    ".docm", ".xlsm", ".pptm", ".dotm", ".xltm"
}

def analyze_attachment(raw_bytes: bytes, filename: str, content_type: str) -> dict:
    if not filename:
        filename = "unnamed_attachment"

    # Compute hashes
    sha256 = hashlib.sha256(raw_bytes).hexdigest() if raw_bytes else "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
    md5 = hashlib.md5(raw_bytes).hexdigest() if raw_bytes else "d41d8cd98f00b204e9800998ecf8427e"
    size_bytes = len(raw_bytes) if raw_bytes else 0

    base_name, ext = os.path.splitext(filename.lower())
    flags = []
    risk_score = 0

    # Check for double extension (e.g. invoice.pdf.exe)
    if "." in base_name:
        hidden_ext = os.path.splitext(base_name)[1]
        if hidden_ext in [".pdf", ".doc", ".docx", ".xls", ".xlsx", ".jpg", ".png", ".txt"]:
            flags.append(f"Double extension evasion detected: '{filename}' disguises real type '{ext}'")
            risk_score += 55

    # Check executable types
    if ext in DANGEROUS_EXTENSIONS:
        flags.append(f"High-risk executable or script binary extension: {ext}")
        risk_score += 65

    # Check container types often weaponized in phishing
    if ext in CONTAINER_EXTENSIONS:
        flags.append(f"Container / disk image attachment used to bypass email inspection: {ext}")
        risk_score += 35

    # Check macro-enabled office types
    if ext in MACRO_EXTENSIONS:
        flags.append(f"Macro-enabled Office document capable of VBA malware execution: {ext}")
        risk_score += 50

    verdict = "MALICIOUS" if risk_score >= 60 else "SUSPICIOUS" if risk_score >= 30 else "BENIGN"

    return {
        "filename": filename,
        "content_type": content_type or "application/octet-stream",
        "size_bytes": size_bytes,
        "sha256": sha256,
        "md5": md5,
        "extension": ext,
        "flags": flags,
        "risk_score": min(risk_score, 100),
        "verdict": verdict
    }

def analyze_all_attachments(attachments_list: list) -> dict:
    if not attachments_list:
        return {
            "has_attachments": False,
            "attachment_count": 0,
            "max_risk_score": 0,
            "overall_verdict": "NO_ATTACHMENTS",
            "items": []
        }

    results = []
    for att in attachments_list:
        # att can be dict with raw bytes or pre-parsed info
        raw = att.get("raw_bytes") or b""
        filename = att.get("filename") or "evidence.bin"
        ctype = att.get("content_type") or "application/octet-stream"
        
        # If sha256 was already calculated or simulated in sample
        res = analyze_attachment(raw, filename, ctype)
        if att.get("sha256") and att.get("sha256") != res["sha256"]:
            res["sha256"] = att["sha256"]
        if att.get("size") and not res["size_bytes"]:
            res["size_bytes"] = att["size"]
        results.append(res)

    max_risk = max((r["risk_score"] for r in results), default=0)
    verdict = "MALICIOUS_ATTACHMENT" if max_risk >= 60 else "SUSPICIOUS_ATTACHMENT" if max_risk >= 30 else "BENIGN"

    return {
        "has_attachments": True,
        "attachment_count": len(results),
        "max_risk_score": max_risk,
        "overall_verdict": verdict,
        "items": results
    }
