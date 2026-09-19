import re
import dns.resolver
import socket
import requests
from datetime import datetime

def check_spf(domain: str, auth_results_raw: str = "") -> dict:
    header_status = None
    if auth_results_raw:
        m = re.search(r"spf=(pass|fail|softfail|neutral|none|temperror|permerror)", auth_results_raw, re.IGNORECASE)
        if m:
            header_status = m.group(1).lower()

    try:
        txt_records = []
        try:
            answers = dns.resolver.resolve(domain, "TXT", lifetime=3.0)
            for r in answers:
                txt = r.to_text().strip('"')
                if "v=spf1" in txt.lower():
                    txt_records.append(txt)
        except Exception:
            pass

        if txt_records:
            record = txt_records[0]
            policy = "-all" if "-all" in record else "~all" if "~all" in record else "+all" if "+all" in record else "?all"
            verdict = header_status or ("pass" if policy in ["-all", "~all"] else "neutral")
            return {
                "found": True,
                "record": record,
                "policy": policy,
                "header_verdict": header_status,
                "verdict": verdict,
                "status": "PASS" if verdict == "pass" else "WARNING" if verdict in ["softfail", "neutral"] else "FAIL"
            }

        if header_status:
            return {
                "found": True,
                "record": f"Reported by MTA: spf={header_status}",
                "policy": "unknown",
                "header_verdict": header_status,
                "verdict": header_status,
                "status": "PASS" if header_status == "pass" else "FAIL"
            }

        return {
            "found": False,
            "verdict": "missing",
            "status": "FAIL",
            "error": "No SPF DNS record published for domain"
        }

    except Exception as e:
        if header_status:
            return {
                "found": True,
                "record": f"MTA authenticated: spf={header_status}",
                "header_verdict": header_status,
                "verdict": header_status,
                "status": "PASS" if header_status == "pass" else "FAIL"
            }
        return {
            "found": False,
            "verdict": "lookup_failed",
            "status": "FAIL",
            "error": str(e)
        }


def check_dmarc(domain: str, auth_results_raw: str = "") -> dict:
    header_status = None
    if auth_results_raw:
        m = re.search(r"dmarc=(pass|fail|none|action=reject|action=quarantine)", auth_results_raw, re.IGNORECASE)
        if m:
            header_status = m.group(1).lower()

    try:
        record = None
        policy = "none"
        try:
            answers = dns.resolver.resolve(f"_dmarc.{domain}", "TXT", lifetime=3.0)
            for r in answers:
                txt = r.to_text().strip('"')
                if "v=DMARC1" in txt.upper():
                    record = txt
                    p_match = re.search(r"(?:^|;)\s*p=([^;]+)", txt, re.IGNORECASE)
                    if p_match:
                        policy = p_match.group(1).strip().lower()
                    break
        except Exception:
            pass

        if record:
            verdict = header_status or ("pass" if policy in ["reject", "quarantine"] else "monitor_only")
            return {
                "found": True,
                "record": record,
                "policy": policy,
                "header_verdict": header_status,
                "verdict": verdict,
                "status": "PASS" if policy in ["reject", "quarantine"] and verdict != "fail" else "WARNING"
            }

        if header_status:
            return {
                "found": True,
                "record": f"Reported by MTA: dmarc={header_status}",
                "policy": "reported",
                "header_verdict": header_status,
                "verdict": header_status,
                "status": "PASS" if header_status == "pass" else "FAIL"
            }

        return {
            "found": False,
            "verdict": "missing",
            "status": "FAIL",
            "error": "No DMARC record found at _dmarc." + domain
        }

    except Exception as e:
        return {
            "found": False,
            "verdict": "lookup_failed",
            "status": "FAIL",
            "error": str(e)
        }


def check_dkim_header(headers: dict, auth_results_raw: str = "") -> dict:
    header_status = None
    if auth_results_raw:
        m = re.search(r"dkim=(pass|fail|neutral|temperror|permerror)", auth_results_raw, re.IGNORECASE)
        if m:
            header_status = m.group(1).lower()

    sig = headers.get("DKIM-Signature") or headers.get("dkim-signature")
    if not sig:
        if header_status:
            return {
                "found": True,
                "verdict": header_status,
                "status": "PASS" if header_status == "pass" else "FAIL",
                "signing_domain": "MTA Validated",
                "selector": None
            }
        return {
            "found": False,
            "verdict": "missing",
            "status": "FAIL",
            "error": "DKIM-Signature header is missing"
        }

    d = re.search(r"(?:^|;)\s*d=([^;]+)", sig, re.IGNORECASE)
    s = re.search(r"(?:^|;)\s*s=([^;]+)", sig, re.IGNORECASE)
    a = re.search(r"(?:^|;)\s*a=([^;]+)", sig, re.IGNORECASE)
    bh = re.search(r"(?:^|;)\s*bh=([^;]+)", sig, re.IGNORECASE)

    signing_domain = d.group(1).strip() if d else None
    selector = s.group(1).strip() if s else None
    algorithm = a.group(1).strip() if a else "rsa-sha256"
    body_hash = bh.group(1).strip() if bh else None

    verdict = header_status or "present"
    return {
        "found": True,
        "verdict": verdict,
        "status": "PASS" if verdict == "pass" or verdict == "present" else "FAIL",
        "signing_domain": signing_domain,
        "selector": selector,
        "algorithm": algorithm,
        "body_hash": body_hash
    }


def check_arc(headers: dict, auth_results_raw: str = "") -> dict:
    """ARC (Authenticated Received Chain) - RFC 8617"""
    arc_seal = headers.get("ARC-Seal") or headers.get("arc-seal")
    arc_message_signature = headers.get("ARC-Message-Signature") or headers.get("arc-message-signature")
    arc_auth_results = headers.get("ARC-Authentication-Results") or headers.get("arc-authentication-results")

    if not arc_seal and not arc_message_signature and not arc_auth_results:
        return {
            "found": False,
            "verdict": "missing",
            "status": "NONE",
            "chain": []
        }

    chain = []
    cv = "none"
    if arc_seal:
        cv_match = re.search(r"(?:^|;)\s*cv=([^;]+)", arc_seal, re.IGNORECASE)
        if cv_match:
            cv = cv_match.group(1).strip().lower()

    return {
        "found": True,
        "verdict": cv,
        "status": "PASS" if cv == "pass" else "FAIL" if cv == "fail" else "WARNING",
        "chain": [{
            "arc_seal": arc_seal,
            "arc_message_signature": arc_message_signature,
            "arc_auth_results": arc_auth_results,
            "cv": cv
        }]
    }


def check_mta_sts(domain: str) -> dict:
    """MTA-STS (Mail Transfer Agent Strict Transport Security) - RFC 8461"""
    try:
        record = None
        try:
            answers = dns.resolver.resolve(f"_mta-sts.{domain}", "TXT", lifetime=3.0)
            for r in answers:
                txt = r.to_text().strip('"')
                if "v=STSv1" in txt:
                    record = txt
                    break
        except Exception:
            pass

        if record:
            return {
                "found": True,
                "record": record,
                "status": "PASS",
                "mode": "enforce" if "mode=enforce" in record else "testing"
            }

        return {
            "found": False,
            "verdict": "missing",
            "status": "NONE",
            "error": "No MTA-STS record found at _mta-sts." + domain
        }
    except Exception as e:
        return {
            "found": False,
            "verdict": "lookup_failed",
            "status": "FAIL",
            "error": str(e)
        }


def check_tls_rpt(domain: str) -> dict:
    """TLS-RPT (TLS Reporting) - RFC 8460"""
    try:
        record = None
        try:
            answers = dns.resolver.resolve(f"_smtp._tls.{domain}", "TXT", lifetime=3.0)
            for r in answers:
                txt = r.to_text().strip('"')
                if "v=TLSRPTv1" in txt:
                    record = txt
                    break
        except Exception:
            pass

        if record:
            rua_match = re.search(r"rua=([^;]+)", record)
            rua = rua_match.group(1) if rua_match else None
            return {
                "found": True,
                "record": record,
                "status": "PASS",
                "rua": rua
            }

        return {
            "found": False,
            "verdict": "missing",
            "status": "NONE",
            "error": "No TLS-RPT record found at _smtp._tls." + domain
        }
    except Exception as e:
        return {
            "found": False,
            "verdict": "lookup_failed",
            "status": "FAIL",
            "error": str(e)
        }


def get_whois_info(domain: str) -> dict:
    """Get WHOIS information for domain"""
    try:
        import whois
        w = whois.whois(domain)
        return {
            "found": True,
            "registrar": w.registrar,
            "creation_date": str(w.creation_date) if w.creation_date else None,
            "expiration_date": str(w.expiration_date) if w.expiration_date else None,
            "updated_date": str(w.updated_date) if w.updated_date else None,
            "name_servers": w.name_servers if w.name_servers else [],
            "emails": w.emails if w.emails else [],
            "org": w.org,
            "country": w.country,
            "status": w.status if w.status else []
        }
    except Exception as e:
        return {
            "found": False,
            "error": str(e)
        }


def get_dns_records(domain: str) -> dict:
    """Get comprehensive DNS records"""
    records = {
        "A": [],
        "AAAA": [],
        "MX": [],
        "NS": [],
        "TXT": [],
        "CNAME": [],
        "SOA": None
    }
    
    for rtype in ["A", "AAAA", "MX", "NS", "TXT", "CNAME", "SOA"]:
        try:
            answers = dns.resolver.resolve(domain, rtype, lifetime=3.0)
            for r in answers:
                if rtype == "MX":
                    records[rtype].append({
                        "priority": r.preference,
                        "exchange": r.exchange.to_text()
                    })
                elif rtype == "SOA":
                    records[rtype] = {
                        "mname": r.mname.to_text(),
                        "rname": r.rname.to_text(),
                        "serial": r.serial,
                        "refresh": r.refresh,
                        "retry": r.retry,
                        "expire": r.expire,
                        "minimum": r.minimum
                    }
                else:
                    records[rtype].append(r.to_text())
        except Exception:
            pass
    
    return records


def extract_domain(address: str) -> str:
    if not address:
        return ""
    m = re.search(r"@([\w.-]+)", address)
    return m.group(1).rstrip(">") if m else ""


def extract_display_name(address: str) -> str:
    if not address:
        return ""
    m = re.match(r'^(?:"?([^"<]+)"?\s*)?<', address)
    if m and m.group(1):
        return m.group(1).strip()
    return ""


def check_identity_mismatch(email_obj: dict) -> dict:
    from_addr = email_obj.get("from", "")
    reply_to = email_obj.get("reply_to", "")
    return_path = email_obj.get("return_path", "")

    from_domain = extract_domain(from_addr)
    reply_domain = extract_domain(reply_to) if reply_to else from_domain
    return_domain = extract_domain(return_path) if return_path else from_domain
    display_name = extract_display_name(from_addr)

    mismatches = []
    indicators = []

    if reply_domain and reply_domain.lower() != from_domain.lower():
        mismatches.append(f"Reply-To domain ({reply_domain}) diverts replies away from sender domain ({from_domain})")
        indicators.append("REPLY_TO_DIVERSION")

    if return_domain and return_domain.lower() != from_domain.lower():
        mismatches.append(f"Return-Path bounce envelope ({return_domain}) differs from From domain ({from_domain})")
        indicators.append("RETURN_PATH_MISMATCH")

    free_providers = ["gmail.com", "yahoo.com", "outlook.com", "hotmail.com", "aol.com", "mail.com", "protonmail.com"]
    if display_name and from_domain.lower() in free_providers:
        corporate_keywords = ["bank", "support", "security", "admin", "executive", "payroll", "ceo", "director", "service", "it desk"]
        if any(k in display_name.lower() for k in corporate_keywords):
            mismatches.append(f"Display name impersonation: '{display_name}' sent from public free webmail '{from_domain}'")
            indicators.append("EXECUTIVE_IMPERSONATION")

    verdict = "MISMATCH_DETECTED" if mismatches else "CONSISTENT"

    return {
        "from_address": from_addr,
        "from_domain": from_domain,
        "reply_domain": reply_domain,
        "return_domain": return_domain,
        "display_name": display_name,
        "mismatches": mismatches,
        "indicators": indicators,
        "verdict": verdict,
        "status": "FAIL" if mismatches else "PASS"
    }


def parse_received_chain(received_headers: list) -> list:
    hops = []
    for idx, h in enumerate(received_headers):
        ip_match = re.search(r"\[?(\d{1,3}(?:\.\d{1,3}){3})\]?", h)
        from_match = re.search(r"\bfrom\s+(\S+)", h, re.IGNORECASE)
        by_match = re.search(r"\bby\s+(\S+)", h, re.IGNORECASE)
        date_match = re.search(r";\s*([^;]+)$", h)

        hops.append({
            "hop_number": idx + 1,
            "ip": ip_match.group(1) if ip_match else None,
            "from_host": from_match.group(1) if from_match else None,
            "by_host": by_match.group(1) if by_match else None,
            "timestamp": date_match.group(1).strip() if date_match else None,
            "raw": h.strip()
        })
    return hops


def run_header_forensics(email_obj: dict) -> dict:
    from_addr = email_obj.get("from", "")
    domain = extract_domain(from_addr)
    headers = email_obj.get("headers", {})

    auth_raw = " ".join(email_obj.get("auth_results_headers", []))

    spf = check_spf(domain, auth_raw) if domain else {"found": False, "verdict": "no_domain", "status": "FAIL"}
    dmarc = check_dmarc(domain, auth_raw) if domain else {"found": False, "verdict": "no_domain", "status": "FAIL"}
    dkim = check_dkim_header(headers, auth_raw)
    arc = check_arc(headers, auth_raw)
    mta_sts = check_mta_sts(domain) if domain else {"found": False, "verdict": "no_domain", "status": "NONE"}
    tls_rpt = check_tls_rpt(domain) if domain else {"found": False, "verdict": "no_domain", "status": "NONE"}
    whois = get_whois_info(domain) if domain else {"found": False, "error": "no_domain"}
    dns_records = get_dns_records(domain) if domain else {}
    identity = check_identity_mismatch(email_obj)
    relay_chain = parse_received_chain(email_obj.get("received_headers", []))

    spf_aligned = spf.get("status") == "PASS" and spf.get("found")
    dkim_aligned = dkim.get("status") == "PASS" and dkim.get("signing_domain", "").lower() == domain.lower()
    dmarc_aligned = spf_aligned or dkim_aligned

    return {
        "sender_domain": domain,
        "spf": spf,
        "dkim": dkim,
        "dmarc": dmarc,
        "arc": arc,
        "mta_sts": mta_sts,
        "tls_rpt": tls_rpt,
        "whois": whois,
        "dns_records": dns_records,
        "dmarc_aligned": dmarc_aligned,
        "identity": identity,
        "relay_chain": relay_chain
    }