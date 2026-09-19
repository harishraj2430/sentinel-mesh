import re
from urllib.parse import urlparse

SUSPICIOUS_TLDS = {
    "top", "xyz", "club", "work", "click", "buzz", "country", "gq", 
    "cf", "tk", "ml", "ga", "fit", "surf", "rest", "monster", "icu"
}

SUSPICIOUS_SUBDOMAINS = [
    "ngrok.io", "duckdns.org", "localtunnel.me", "serveo.net", "nip.io",
    "firebaseapp.com", "workers.dev", "pages.dev", "weebly.com"
]

HIGH_VALUE_TARGETS = [
    "microsoft", "office365", "google", "paypal", "apple", "amazon", 
    "chase", "bankofamerica", "wellsfargo", "dhl", "fedex", "netflix"
]

def defang_url(url: str) -> str:
    """Standard security defanging (e.g. hxxps://evil[.]com)"""
    if not url:
        return ""
    defanged = re.sub(r"^https?://", lambda m: "hxxps://" if m.group(0).startswith("https") else "hxxp://", url, flags=re.IGNORECASE)
    defanged = defanged.replace(".", "[.]")
    return defanged

def extract_urls(text: str) -> list:
    """Extract raw URLs from email body and headers."""
    if not text:
        return []
    url_pattern = r'https?://(?:[-\w.]|(?:%[\da-fA-F]{2}))+[^\s<>"\')]*'
    found = re.findall(url_pattern, text)
    # Deduplicate while preserving order
    seen = set()
    unique_urls = []
    for u in found:
        cleaned = u.rstrip(".,;!?>)]\"'")
        if cleaned and cleaned not in seen:
            seen.add(cleaned)
            unique_urls.append(cleaned)
    return unique_urls

def analyze_url(url: str) -> dict:
    parsed = urlparse(url)
    hostname = (parsed.hostname or "").lower()
    path = (parsed.path or "").lower()
    query = (parsed.query or "").lower()

    flags = []
    risk_score = 0

    # 1. IP as Host
    is_ip_host = bool(re.match(r"^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$", hostname))
    if is_ip_host:
        flags.append("Host is raw IPv4 address (common in phishing/C2)")
        risk_score += 40

    # 2. Suspicious TLD
    tld = hostname.split(".")[-1] if "." in hostname else ""
    if tld in SUSPICIOUS_TLDS:
        flags.append(f"High-abuse TLD identified: .{tld}")
        risk_score += 25

    # 3. Dynamic DNS / Cloud worker hosting
    for sub in SUSPICIOUS_SUBDOMAINS:
        if sub in hostname:
            flags.append(f"Hosted on dynamic DNS / public gateway: {sub}")
            risk_score += 30
            break

    # 4. Target impersonation / homoglyph
    for target in HIGH_VALUE_TARGETS:
        if target in hostname:
            # Check if it's the genuine domain or a lookalike
            genuine = f"{target}.com"
            if not hostname.endswith(f".{target}.com") and hostname != genuine:
                flags.append(f"Possible brand spoofing / lookalike targeting '{target}'")
                risk_score += 45
                break

    # 5. Credential harvest cues in URL path
    credential_keywords = ["login", "signin", "verify", "account", "update", "password", "auth", "secure", "banking"]
    found_cues = [k for k in credential_keywords if k in path or k in query]
    if found_cues:
        flags.append(f"Credential harvesting parameters found in URI: {', '.join(found_cues)}")
        risk_score += 20

    # 6. Scheme check
    is_https = parsed.scheme.lower() == "https"
    if not is_https:
        flags.append("Non-secure HTTP transport")
        risk_score += 10

    verdict = "MALICIOUS" if risk_score >= 60 else "SUSPICIOUS" if risk_score >= 25 else "CLEAN"

    return {
        "raw_url": url,
        "defanged_url": defang_url(url),
        "domain": hostname,
        "is_https": is_https,
        "flags": flags,
        "risk_score": min(risk_score, 100),
        "verdict": verdict
    }

def analyze_all_urls(text: str) -> dict:
    raw_urls = extract_urls(text)
    analyzed = [analyze_url(u) for u in raw_urls]
    
    total_suspicious = sum(1 for a in analyzed if a["verdict"] in ("MALICIOUS", "SUSPICIOUS"))
    max_risk = max((a["risk_score"] for a in analyzed), default=0)

    overall_verdict = "MALICIOUS_LINKS_DETECTED" if max_risk >= 60 else "SUSPICIOUS_LINKS" if max_risk >= 25 else "CLEAN" if analyzed else "NO_URLS"

    return {
        "url_count": len(analyzed),
        "suspicious_count": total_suspicious,
        "max_risk_score": max_risk,
        "overall_verdict": overall_verdict,
        "urls": analyzed
    }
