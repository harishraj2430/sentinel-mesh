import re

URGENCY_PATTERNS = [
    r"\b(act now|urgent|immediately|action required|final notice|suspended|suspension|terminated|restricted)\b",
    r"\b(within \d+ hours|immediate attention|critical alert|within 24 hours|deadline)\b",
    r"\b(unusual activity|unauthorized login|security breach|compromised)\b"
]

CREDENTIAL_PATTERNS = [
    r"\b(password|passcode|pin|credential|ssn|social security)\b",
    r"\b(verify (?:your )?account|confirm (?:your )?identity|log ?in here|sign ?in)\b",
    r"\b(update (?:your )?payment|billing information|credit card|bank account)\b",
    r"\b(reactivate (?:your )?access|security question|authentication prompt)\b"
]

FINANCIAL_BEC_PATTERNS = [
    r"\b(wire transfer|swift code|bank transfer|direct deposit|payroll)\b",
    r"\b(change bank details|new account number|remittance|unpaid invoice)\b",
    r"\b(confidential transaction|keep this strictly confidential|between us|do not call)\b",
    r"\b(gift cards?|itunes card|apple card|steam card)\b"
]

def score_language(body_text: str, subject: str = "") -> dict:
    full_text = f"{subject} {body_text or ''}".lower()

    u_hits = []
    for pat in URGENCY_PATTERNS:
        matches = re.findall(pat, full_text, re.IGNORECASE)
        u_hits.extend(matches)

    c_hits = []
    for pat in CREDENTIAL_PATTERNS:
        matches = re.findall(pat, full_text, re.IGNORECASE)
        c_hits.extend(matches)

    f_hits = []
    for pat in FINANCIAL_BEC_PATTERNS:
        matches = re.findall(pat, full_text, re.IGNORECASE)
        f_hits.extend(matches)

    # Deduplicate hits
    u_hits = sorted(list(set(u_hits)))
    c_hits = sorted(list(set(c_hits)))
    f_hits = sorted(list(set(f_hits)))

    # Compute risk
    score = 0
    score += min(len(u_hits) * 15, 35)
    score += min(len(c_hits) * 20, 40)
    score += min(len(f_hits) * 25, 45)
    score = min(score, 100)

    indicators = []
    if u_hits:
        indicators.append(f"Psychological urgency triggers: {', '.join(u_hits[:4])}")
    if c_hits:
        indicators.append(f"Credential harvesting indicators: {', '.join(c_hits[:4])}")
    if f_hits:
        indicators.append(f"Financial BEC / wire solicitation cues: {', '.join(f_hits[:4])}")

    confidence = "HIGH" if score >= 60 else "MEDIUM" if score >= 30 else "LOW"
    verdict = "SUSPICIOUS_CONTENT" if score >= 35 else "BENIGN_CONTENT"

    is_bec_suspect = len(f_hits) >= 1 and len(u_hits) >= 1
    is_phishing_suspect = len(c_hits) >= 1

    return {
        "language_risk_score": score,
        "confidence": confidence,
        "verdict": verdict,
        "indicators": indicators,
        "urgency_cues": u_hits,
        "credential_cues": c_hits,
        "financial_cues": f_hits,
        "is_bec_suspect": is_bec_suspect,
        "is_phishing_suspect": is_phishing_suspect
    }
