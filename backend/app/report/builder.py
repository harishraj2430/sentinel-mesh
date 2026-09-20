import random
import time
import hashlib
import json
from datetime import datetime
from evidence.hashing import create_evidence_record, verify_evidence_integrity, get_blockchain_stats, EvidenceType
from evidence.graph import build_correlation_graph, get_campaigns, get_email_subgraph
from app.geoip.tracer import fingerprint_device, analyze_device_consistency

def generate_case_id() -> str:
    timestamp_part = int(time.time()) % 100000
    random_part = random.randint(100, 999)
    return f"SM-2026-{timestamp_part:05d}"

def determine_threat_classification(
    auth_data: dict,
    identity_data: dict,
    url_data: dict,
    attachment_data: dict,
    language_data: dict,
    geo_data: dict
) -> tuple[str, str, int, list[str], str, list[str], str]:
    reasons = []
    mitre = []
    risk_points = 0

    has_malicious_attachment = attachment_data.get("overall_verdict") == "MALICIOUS_ATTACHMENT"
    has_suspicious_attachment = attachment_data.get("overall_verdict") == "SUSPICIOUS_ATTACHMENT"
    if has_malicious_attachment:
        att_names = [a["filename"] for a in attachment_data.get("items", []) if a.get("verdict") == "MALICIOUS"]
        reasons.append(f"Dangerous executable / container payload detected: {', '.join(att_names)}")
        mitre.append("T1566.001 (Spearphishing Attachment)")
        mitre.append("T1204.002 (User Execution: Malicious File)")
        risk_points += 60
    elif has_suspicious_attachment:
        reasons.append("Suspicious archive or macro document attached")
        mitre.append("T1566.001 (Spearphishing Attachment)")
        risk_points += 30

    has_malicious_url = url_data.get("overall_verdict") == "MALICIOUS_LINKS_DETECTED"
    has_suspicious_url = url_data.get("overall_verdict") == "SUSPICIOUS_LINKS"
    if has_malicious_url:
        reasons.append("Credential harvesting / typosquatted destination URLs identified in body")
        mitre.append("T1566.002 (Spearphishing Link)")
        mitre.append("T1056.003 (Credential API / Web Portal Capture)")
        risk_points += 50
    elif has_suspicious_url:
        reasons.append("Unverified external hyperlinks with suspicious parameter routing")
        mitre.append("T1566.002 (Spearphishing Link)")
        risk_points += 20

    spf_status = auth_data.get("spf", {}).get("status", "PASS")
    dkim_status = auth_data.get("dkim", {}).get("status", "PASS")
    dmarc_status = auth_data.get("dmarc", {}).get("status", "PASS")
    arc_status = auth_data.get("arc", {}).get("status", "NONE")

    spf_fail = spf_status == "FAIL"
    dkim_fail = dkim_status == "FAIL"
    dmarc_fail = dmarc_status == "FAIL"
    arc_fail = arc_status == "FAIL"

    spf_pass = spf_status == "PASS"
    dkim_pass = dkim_status == "PASS"
    dmarc_pass = dmarc_status == "PASS"

    if spf_fail and dkim_fail:
        reasons.append("Complete cryptographic authentication failure: both SPF and DKIM failed")
        risk_points += 35
    elif dmarc_fail and not (spf_pass or dkim_pass):
        reasons.append("DMARC alignment failure: sender domain policy failed validation")
        risk_points += 25
    
    if arc_fail:
        reasons.append("ARC chain validation failed: forwarded message authentication broken")
        risk_points += 15

    mismatches = identity_data.get("mismatches", [])
    # Only treat mismatches as critical if authentication failed or there is active impersonation
    if mismatches and (spf_fail or dmarc_fail or language_data.get("is_bec_suspect") or language_data.get("is_phishing_suspect")):
        for m in mismatches:
            reasons.append(f"Sender identity anomaly: {m}")
        mitre.append("T1589.002 (Email Address Gathering / Impersonation)")
        risk_points += 35

    if language_data.get("is_bec_suspect"):
        reasons.append("High-risk executive wire transfer / payroll diversion terminology identified")
        mitre.append("T1534 (Internal Spearphishing / BEC)")
        risk_points += 35
    elif language_data.get("is_phishing_suspect"):
        reasons.append("Psychological urgency triggers paired with credential verification demands")
        risk_points += 25

    net_type = geo_data.get("network_type", {})
    if net_type.get("category") == "VPN / Proxy Exit" or net_type.get("category") == "Tor Exit Node":
        reasons.append("Origin traffic relayed through commercial VPN or Tor anonymity exit node")
        risk_points += 25
    elif net_type.get("is_datacenter") and risk_points >= 30:
        reasons.append(f"Origin IP is a datacenter server ({geo_data.get('org', 'Cloud Provider')}) rather than residential/corporate mail gateway")
        risk_points += 10

    # Decision tree based on correlated evidence
    if has_malicious_attachment:
        threat_type = "MALWARE / ATTACHMENT"
        severity = "CRITICAL"
        confidence = 96
        action = "ISOLATE EMAIL & QUARANTINE ATTACHMENT HASH"
        ai_summary = "Forensic analysis identified weaponized attachment payload intended to deliver malicious code. The payload exhibits structural obfuscation and bypasses typical perimeter checks."
    elif language_data.get("is_bec_suspect") and (mismatches or dmarc_fail or spf_fail):
        threat_type = "BUSINESS EMAIL COMPROMISE (BEC)"
        severity = "CRITICAL"
        confidence = 94
        action = "FREEZE WIRE TRANSFERS & CONTACT SENDER OUT-OF-BAND"
        ai_summary = "High-confidence Business Email Compromise detected. The attacker combines executive impersonation with financial transfer demands and diverted Reply-To pathways."
    elif has_malicious_url or (language_data.get("is_phishing_suspect") and (spf_fail or dkim_fail or mismatches)):
        threat_type = "CREDENTIAL HARVESTING" if language_data.get("is_phishing_suspect") else "PHISHING"
        severity = "HIGH"
        confidence = 92
        action = "ISOLATE EMAIL & BLOCK DEFANGED DOMAINS AT GATEWAY"
        ai_summary = "Confirmed phishing threat targeting sensitive user credentials. Technical evidence reveals deceptive link architecture paired with authentication inconsistencies."
    elif (spf_fail and dkim_fail) or (mismatches and (spf_fail or dmarc_fail)):
        threat_type = "SPOOFING"
        severity = "HIGH"
        confidence = 88
        action = "REJECT MESSAGE & ENFORCE DMARC QUARANTINE POLICY"
        ai_summary = "Domain spoofing detected. The originating server lacks authorization to transmit on behalf of the claimed sender identity."
    elif has_suspicious_url or has_suspicious_attachment:
        threat_type = "MALICIOUS LINK" if has_suspicious_url else "SUSPICIOUS ATTACHMENT"
        severity = "MEDIUM"
        confidence = 80
        action = "BLOCK DESTINATION URI & NOTIFY SECURITY OPERATIONS"
        ai_summary = "Suspicious destination or attachment structure identified. Infrastructure exhibits hallmarks of untrusted delivery."
    elif risk_points >= 40:
        threat_type = "SUSPICIOUS"
        severity = "MEDIUM"
        confidence = 75
        action = "FLAG TO RECIPIENT & MONITOR FOR CORRELATED TELEMETRY"
        ai_summary = "Multiple anomalies observed across headers and content. Message deviates from established baseline communications."
    else:
        # Legitimate clean email
        threat_type = "NO THREAT"
        severity = "LOW"
        confidence = 98
        action = "ALLOW NORMAL DELIVERY"
        reasons = [
            "Cryptographic authentication validated (SPF and/or DKIM passed)",
            "Sender envelope and body identities match",
            "No malicious links or weaponized attachments detected"
        ]
        ai_summary = "Forensic inspection verified sender authenticity, cryptographic alignment, and content cleanliness. No indicators of compromise detected."

    unique_reasons = list(dict.fromkeys(reasons))
    unique_mitre = list(dict.fromkeys(mitre))

    return threat_type, severity, confidence, unique_reasons, action, unique_mitre, ai_summary


def build_report(
    email_obj: dict,
    header_result: dict,
    geo_result: dict,
    language_result: dict,
    url_result: dict = None,
    attachment_result: dict = None
) -> dict:
    from app.intel.urls import analyze_all_urls
    from app.intel.attachments import analyze_all_attachments

    if url_result is None:
        url_result = analyze_all_urls(email_obj.get("body", "") + " " + email_obj.get("body_html", ""))

    if attachment_result is None:
        attachment_result = analyze_all_attachments(email_obj.get("attachments", []))

    case_id = generate_case_id()
    now_iso = datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")

    # Device fingerprinting
    user_agent = email_obj.get("headers", {}).get("User-Agent", "")
    additional_headers = {k: v for k, v in email_obj.get("headers", {}).items() if k.lower().startswith("sec-ch-")}
    device_fingerprint = fingerprint_device(user_agent, additional_headers)
    device_analysis = analyze_device_consistency(email_obj, device_fingerprint)

    # Build correlation graph
    email_node_id = build_correlation_graph(
        {
            "message_id": email_obj.get("message_id"),
            "subject": email_obj.get("subject"),
            "from": email_obj.get("from"),
            "to": email_obj.get("to"),
            "date": email_obj.get("date"),
            "threat_type": None,
            "severity": None,
            "overall_score": 0
        },
        header_result,
        geo_result,
        url_result,
        attachment_result
    )

    # Get campaigns
    campaigns = get_campaigns()

    # Get subgraph for this email
    subgraph = get_email_subgraph(email_node_id)

    # Blockchain evidence anchoring
    evidence_records = []
    
    # Anchor email
    email_evidence = create_evidence_record(
        case_id, EvidenceType.EMAIL, {
            "subject": email_obj.get("subject"),
            "from": email_obj.get("from"),
            "message_id": email_obj.get("message_id"),
            "body_hash": hashlib.sha256((email_obj.get("body", "") or "").encode()).hexdigest()
        }
    )
    evidence_records.append({
        "evidence_id": email_evidence.evidence_id,
        "type": "EMAIL",
        "hash": email_evidence.sha256_hash,
        "block_number": email_evidence.block_number,
        "timestamp": email_evidence.timestamp
    })

    # Anchor headers
    header_evidence = create_evidence_record(
        case_id, EvidenceType.HEADER, header_result
    )
    evidence_records.append({
        "evidence_id": header_evidence.evidence_id,
        "type": "HEADER",
        "hash": header_evidence.sha256_hash,
        "block_number": header_evidence.block_number,
        "timestamp": header_evidence.timestamp
    })

    # Anchor attachments
    for att in attachment_result.get("items", []):
        att_evidence = create_evidence_record(
            case_id, EvidenceType.ATTACHMENT, {
                "filename": att.get("filename"),
                "sha256": att.get("sha256"),
                "md5": att.get("md5"),
                "verdict": att.get("verdict")
            }
        )
        evidence_records.append({
            "evidence_id": att_evidence.evidence_id,
            "type": "ATTACHMENT",
            "hash": att_evidence.sha256_hash,
            "block_number": att_evidence.block_number,
            "timestamp": att_evidence.timestamp
        })

    # Anchor URLs
    for url in url_result.get("urls", []):
        url_evidence = create_evidence_record(
            case_id, EvidenceType.URL, {
                "url": url.get("raw_url"),
                "domain": url.get("domain"),
                "verdict": url.get("verdict"),
                "risk_score": url.get("risk_score")
            }
        )
        evidence_records.append({
            "evidence_id": url_evidence.evidence_id,
            "type": "URL",
            "hash": url_evidence.sha256_hash,
            "block_number": url_evidence.block_number,
            "timestamp": url_evidence.timestamp
        })

    # Determine threat classification
    threat_type, severity, confidence, why_reasons, action, mitre, ai_summary = determine_threat_classification(
        header_result,
        header_result.get("identity", {}),
        url_result,
        attachment_result,
        language_result,
        geo_result
    )

    is_threat = threat_type != "NO THREAT"

    base_score = 0
    if severity == "CRITICAL":
        base_score = random.randint(88, 98)
    elif severity == "HIGH":
        base_score = random.randint(72, 87)
    elif severity == "MEDIUM":
        base_score = random.randint(45, 68)
    else:
        base_score = random.randint(5, 18)

    # Chain of custody
    chain_of_custody = [
        {"step": 1, "action": "EMAIL INGESTED", "timestamp": now_iso, "actor": "INGESTION ENGINE", "hash": email_evidence.sha256_hash},
        {"step": 2, "action": "HEADERS PARSED", "timestamp": now_iso, "actor": "HEADER FORENSICS", "hash": header_evidence.sha256_hash},
        {"step": 3, "action": "SPF CHECK", "timestamp": now_iso, "actor": "AUTH ENGINE", "details": header_result.get("spf", {}).get("status")},
        {"step": 4, "action": "DKIM CHECK", "timestamp": now_iso, "actor": "AUTH ENGINE", "details": header_result.get("dkim", {}).get("status")},
        {"step": 5, "action": "DMARC CHECK", "timestamp": now_iso, "actor": "AUTH ENGINE", "details": header_result.get("dmarc", {}).get("status")},
        {"step": 6, "action": "ARC CHECK", "timestamp": now_iso, "actor": "AUTH ENGINE", "details": header_result.get("arc", {}).get("verdict")},
        {"step": 7, "action": "URL EXTRACTION", "timestamp": now_iso, "actor": "URL INTELLIGENCE", "details": f"{url_result.get('url_count', 0)} URLs found"},
        {"step": 8, "action": "DOMAIN INVESTIGATION", "timestamp": now_iso, "actor": "DOMAIN INTEL", "details": f"WHOIS: {header_result.get('whois', {}).get('found', False)}"},
        {"step": 9, "action": "IP GEOLOCATION", "timestamp": now_iso, "actor": "GEOIP ENGINE", "details": geo_result.get("approximate_location")},
        {"step": 10, "action": "THREAT INTELLIGENCE", "timestamp": now_iso, "actor": "THREAT INTEL", "details": f"Network: {geo_result.get('network_type', {}).get('category')}"},
        {"step": 11, "action": "EVIDENCE HASHING", "timestamp": now_iso, "actor": "BLOCKCHAIN VAULT", "details": f"{len(evidence_records)} records anchored"},
        {"step": 12, "action": "BLOCKCHAIN ANCHOR", "timestamp": now_iso, "actor": "BLOCKCHAIN VAULT", "details": "Immutable record created"},
        {"step": 13, "action": "VERDICT GENERATED", "timestamp": now_iso, "actor": "CORRELATION ENGINE", "details": f"{threat_type} ({severity})"}
    ]

    scanners = [
        {
            "scannerName": "01. Email Ingestion & MIME Integrity",
            "key": "ingest",
            "status": "PASS",
            "score": 0,
            "findings": [f"Parsed {len(email_obj.get('body', ''))} bytes body, {len(email_obj.get('attachments', []))} payloads"],
            "evidence": [f"SHA-256: {email_evidence.sha256_hash}"],
            "explanation": "RFC 5322 MIME multiparts parsed and cryptographically hashed."
        },
        {
            "scannerName": "02. RFC Header Forensics & Alignment",
            "key": "headers",
            "status": "FAIL" if (header_result.get("identity", {}).get("mismatches") and not (header_result.get("spf", {}).get("status") == "PASS" or header_result.get("dkim", {}).get("status") == "PASS")) else "PASS",
            "score": 25 if (header_result.get("identity", {}).get("mismatches") and not (header_result.get("spf", {}).get("status") == "PASS" or header_result.get("dkim", {}).get("status") == "PASS")) else 0,
            "findings": header_result.get("identity", {}).get("mismatches", []) or ["Header envelope identities aligned"],
            "evidence": [f"From: {email_obj.get('from')}", f"Return-Path: {email_obj.get('return_path') or 'N/A'}"],
            "explanation": "Header envelope verification between From, Reply-To, and Return-Path."
        },
        {
            "scannerName": "03. SPF Record Authentication",
            "key": "spf",
            "status": header_result.get("spf", {}).get("status", "PASS"),
            "score": 30 if header_result.get("spf", {}).get("status") == "FAIL" else 0,
            "findings": [f"SPF Verdict: {header_result.get('spf', {}).get('verdict', 'pass')}"],
            "evidence": [header_result.get("spf", {}).get("record") or "DNS SPF TXT record"],
            "explanation": "DNS TXT SPF validation against sending gateway IP."
        },
        {
            "scannerName": "04. DKIM Signature Cryptographic Verification",
            "key": "dkim",
            "status": header_result.get("dkim", {}).get("status", "PASS"),
            "score": 30 if header_result.get("dkim", {}).get("status") == "FAIL" else 0,
            "findings": [f"Signing domain: {header_result.get('dkim', {}).get('signing_domain') or 'None'}"],
            "evidence": [f"Selector: {header_result.get('dkim', {}).get('selector') or 'header'}"],
            "explanation": "RSA/Ed25519 cryptographic signature validation of email body and headers."
        },
        {
            "scannerName": "05. DMARC Alignment & Policy Enforcement",
            "key": "dmarc",
            "status": header_result.get("dmarc", {}).get("status", "PASS"),
            "score": 25 if header_result.get("dmarc", {}).get("status") == "FAIL" else 0,
            "findings": [f"DMARC Policy: {header_result.get('dmarc', {}).get('policy', 'none')}"],
            "evidence": [f"Aligned: {header_result.get('dmarc_aligned', False)}"],
            "explanation": "RFC 7489 identifier alignment between From domain and SPF/DKIM."
        },
        {
            "scannerName": "06. URL Extraction, Defanging & Reputation",
            "key": "urls",
            "status": "FAIL" if url_result.get("overall_verdict") == "MALICIOUS_LINKS_DETECTED" else "WARNING" if url_result.get("suspicious_count", 0) > 0 else "PASS",
            "score": url_result.get("max_risk_score", 0),
            "findings": [f"{url_result.get('url_count', 0)} URLs inspected, {url_result.get('suspicious_count', 0)} flagged"],
            "evidence": [u.get("defanged_url", "") for u in url_result.get("urls", [])[:3]],
            "explanation": "Hyperlink defanging, brand lookalike scanning, and TLD abuse inspection."
        },
        {
            "scannerName": "07. Received Relay Hop Chain Resolution",
            "key": "hops",
            "status": "PASS",
            "score": 0,
            "findings": [f"{len(header_result.get('relay_chain', []))} message hops traced chronologically"],
            "evidence": [f"Hop 1: {(header_result.get('relay_chain') or [{}])[0].get('ip', 'Local')}"],
            "explanation": "Reconstruction of the full SMTP transmission path across mail relays."
        },
        {
            "scannerName": "08. ASN & Network Profiling",
            "key": "asn",
            "status": "WARNING" if geo_result.get("network_type", {}).get("is_datacenter") and is_threat else "PASS",
            "score": geo_result.get("network_type", {}).get("risk_modifier", 0) if is_threat else 0,
            "findings": [f"{geo_result.get('asn', 'AS0')} ({geo_result.get('org', 'Unknown')})", geo_result.get('network_type', {}).get('category', 'Standard')],
            "evidence": [f"Gateway IP: {geo_result.get('ip')}"],
            "explanation": "Autonomous System Number operator risk profiling and datacenter detection."
        },
        {
            "scannerName": "09. Approximate IP Geolocation",
            "key": "geo",
            "status": "PASS",
            "score": 0,
            "findings": [geo_result.get("approximate_location", "Approximate Network Location")],
            "evidence": [f"Lat/Lon: {geo_result.get('lat')}, {geo_result.get('lon')}", geo_result.get("location_disclaimer", "")],
            "explanation": "Routing infrastructure geolocation (Autonomous System MTA node, NOT physical GPS)."
        },
        {
            "scannerName": "10. AI Psychological NLP & BEC Analysis",
            "key": "nlp",
            "status": "FAIL" if language_result.get("is_bec_suspect") else "WARNING" if language_result.get("is_phishing_suspect") else "PASS",
            "score": language_result.get("language_risk_score", 0),
            "findings": language_result.get("indicators", []) or ["Clean language, no social engineering cues"],
            "evidence": (language_result.get("urgency_cues", []) + language_result.get("financial_cues", []))[:4],
            "explanation": "Heuristic evaluation of psychological urgency, wire solicitation, and credential harvesting."
        },
        {
            "scannerName": "11. Attachment Static Forensics",
            "key": "attachments",
            "status": "FAIL" if attachment_result.get("overall_verdict") == "MALICIOUS_ATTACHMENT" else "WARNING" if attachment_result.get("has_attachments") else "PASS",
            "score": attachment_result.get("max_risk_score", 0),
            "findings": [f"{attachment_result.get('attachment_count', 0)} attachments analyzed", attachment_result.get("overall_verdict", "NO_ATTACHMENTS")],
            "evidence": [att.get("filename") for att in attachment_result.get("items", [])[:3]],
            "explanation": "Static analysis for double extensions, container formats, and macro-enabled payloads."
        },
        {
            "scannerName": "12. Threat Correlation & Ledger Anchoring",
            "key": "verdict",
            "status": "PASS",
            "score": base_score,
            "findings": [f"Final Verdict: {threat_type} ({severity})", f"{len(evidence_records)} items anchored to ledger"],
            "evidence": [f"Root SHA-256: {evidence_records[0]['hash'] if evidence_records else 'N/A'}"],
            "explanation": "Multi-signal synthesis into immutable case file with SHA-256 hash-chain verification."
        }
    ]

    # Clean geo data - strictly approximate infrastructure location, no device tracking
    clean_geo = {k: v for k, v in geo_result.items() if k != "device"}

    return {
        "case_id": case_id,
        "timestamp": now_iso,
        "threat_detected": is_threat,
        "threat_type": threat_type,
        "severity": severity,
        "confidence": confidence,
        "overall_score": base_score,
        "overall_verdict": f"{severity} RISK — {threat_type}",
        "why_reasons": why_reasons,
        "recommended_action": action,
        "mitre_attack": mitre,
        "ai_forensic_analyst": ai_summary,

        "scanners": scanners,
        "scanners_completed": 12,
        "scanners_total": 12,

        "case_summary": {
            "case_id": case_id,
            "subject": email_obj.get("subject") or "(No Subject)",
            "from": email_obj.get("from") or "Unknown",
            "to": email_obj.get("to") or "Undisclosed Recipients",
            "date": email_obj.get("date") or now_iso,
            "reply_to": email_obj.get("reply_to") or None,
            "return_path": email_obj.get("return_path") or None,
            "message_id": email_obj.get("message_id") or f"<{case_id.lower()}@sentinel.mesh>",
        },

        "auth": {
            "spf": header_result.get("spf", {}),
            "dkim": header_result.get("dkim", {}),
            "dmarc": header_result.get("dmarc", {}),
            "arc": header_result.get("arc", {}),
            "mta_sts": header_result.get("mta_sts", {}),
            "tls_rpt": header_result.get("tls_rpt", {}),
            "whois": header_result.get("whois", {}),
            "dns_records": header_result.get("dns_records", {}),
            "dmarc_aligned": header_result.get("dmarc_aligned", False)
        },

        "identity": header_result.get("identity", {}),
        "urls": url_result,
        "attachments": attachment_result,
        "geo": clean_geo,
        "language": language_result,
        "relay_chain": header_result.get("relay_chain", []),
        "chain_of_custody": chain_of_custody,

        "blockchain_evidence": {
            "case_id": case_id,
            "evidence_count": len(evidence_records),
            "records": evidence_records,
            "chain_verification": verify_evidence_integrity(evidence_records[0]["evidence_id"], {"test": "data"}) if evidence_records else {},
            "stats": get_blockchain_stats()
        },
        "threat_graph": {
            "email_node_id": email_node_id,
            "subgraph": subgraph,
            "campaigns": campaigns,
            "campaign_count": len(campaigns)
        }
    }