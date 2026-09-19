import re
import socket
import requests
import json
import hashlib
import platform
from datetime import datetime
from user_agents import parse as parse_ua

# In-memory cache for geolocation lookups
_geo_cache = {}

def is_private_ip(ip: str) -> bool:
    parts = ip.split(".")
    if len(parts) != 4:
        return True
    try:
        a, b, c, d = [int(x) for x in parts]
    except ValueError:
        return True

    if not all(0 <= x <= 255 for x in [a, b, c, d]):
        return True

    if a == 10:
        return True
    if a == 172 and 16 <= b <= 31:
        return True
    if a == 192 and b == 168:
        return True
    if a == 127:
        return True
    if a == 169 and b == 254:
        return True
    return False


def get_first_untrusted_ip(relay_chain: list) -> str:
    for hop in reversed(relay_chain):
        ip = hop.get("ip")
        if ip and not is_private_ip(ip):
            return ip
    return None


def get_all_public_hops(relay_chain: list) -> list:
    hops = []
    for hop in relay_chain:
        ip = hop.get("ip")
        if ip and not is_private_ip(ip):
            hops.append(ip)
    return hops


def get_geolocation_ipinfo(ip: str) -> dict:
    """Get geolocation from ipinfo.io"""
    try:
        resp = requests.get(f"https://ipinfo.io/{ip}/json", timeout=3.5)
        if resp.status_code == 200:
            data = resp.json()
            loc = data.get("loc", "")
            lat, lon = 0, 0
            if loc:
                parts = loc.split(",")
                lat, lon = float(parts[0]), float(parts[1])
            
            org = data.get("org", "")
            asn = "AS15169"
            org_name = org or "Unknown"
            if org.startswith("AS"):
                parts = org.split(" ", 1)
                asn = parts[0]
                org_name = parts[1] if len(parts) > 1 else org
            
            return {
                "ip": ip,
                "city": data.get("city"),
                "region": data.get("region"),
                "country": data.get("country"),
                "country_code": data.get("country"),
                "lat": lat,
                "lon": lon,
                "org": org_name,
                "asn": asn,
                "postal": data.get("postal"),
                "timezone": data.get("timezone"),
                "source": "ipinfo.io"
            }
    except Exception:
        pass
    return None


def get_geolocation_ipapi(ip: str) -> dict:
    """Get geolocation from ip-api.com (free tier)"""
    try:
        resp = requests.get(f"http://ip-api.com/json/{ip}?fields=status,message,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as,query", timeout=3.5)
        if resp.status_code == 200:
            data = resp.json()
            if data.get("status") == "success":
                org = data.get("org", "")
                asn = data.get("as", "AS0")
                if asn.startswith("AS"):
                    asn_parts = asn.split(" ", 1)
                    asn = asn_parts[0]
                    org_name = asn_parts[1] if len(asn_parts) > 1 else org
                else:
                    org_name = org
                
                return {
                    "ip": ip,
                    "city": data.get("city"),
                    "region": data.get("regionName"),
                    "country": data.get("country"),
                    "country_code": data.get("countryCode"),
                    "lat": data.get("lat", 0),
                    "lon": data.get("lon", 0),
                    "org": org_name,
                    "asn": asn,
                    "postal": data.get("zip"),
                    "timezone": data.get("timezone"),
                    "isp": data.get("isp"),
                    "source": "ip-api.com"
                }
    except Exception:
        pass
    return None


def get_geolocation_abstractapi(ip: str) -> dict:
    """Get geolocation from AbstractAPI (backup)"""
    try:
        # Using free tier - would need API key for production
        resp = requests.get(f"https://ipgeolocation.abstractapi.com/v1/?ip_address={ip}", timeout=3.5)
        if resp.status_code == 200:
            data = resp.json()
            return {
                "ip": ip,
                "city": data.get("city"),
                "region": data.get("region"),
                "country": data.get("country"),
                "country_code": data.get("country_code"),
                "lat": data.get("latitude", 0),
                "lon": data.get("longitude", 0),
                "org": data.get("connection", {}).get("organization_name"),
                "asn": data.get("connection", {}).get("autonomous_system_number"),
                "timezone": data.get("timezone", {}).get("name"),
                "source": "abstractapi.com"
            }
    except Exception:
        pass
    return None


def determine_network_type(org_str: str, asn: str = "") -> dict:
    org_lower = (org_str or "").lower()
    asn_lower = (asn or "").lower()
    
    datacenter_keywords = [
        "amazon", "aws", "google", "digitalocean", "ovh", "linode", "hetzner", 
        "microsoft", "azure", "alibaba", "vultr", "oracle", "hosting", "cloud", 
        "vps", "server", "datacenter", "data center", "colocation", "rackspace",
        "cloudflare", "akamai", "fastly", "incapsula", "sucuri"
    ]
    
    vpn_tor_keywords = [
        "nordvpn", "mullvad", "tor-exit", "expressvpn", "surfshark", "proton", 
        "proxy", "vpn", "anonymizer", "private internet access", "pia", "cyberghost",
        "torproject", "tor exit", "exit node"
    ]

    hosting_asns = [
        "AS16509", "AS14618", "AS15169", "AS8075", "AS14061", "AS13335", 
        "AS209242", "AS24940", "AS396982", "AS63949", "AS20473", "AS62567"
    ]

    if any(k in org_lower for k in vpn_tor_keywords) or any(k in asn_lower for k in vpn_tor_keywords):
        return {
            "category": "VPN / Proxy Exit",
            "is_datacenter": True,
            "risk_modifier": 25,
            "risk_label": "High Anonymity Infrastructure"
        }
    
    if any(k in org_lower for k in datacenter_keywords) or any(asn in asn for asn in hosting_asns):
        return {
            "category": "Datacenter / Cloud Infrastructure",
            "is_datacenter": True,
            "risk_modifier": 20,
            "risk_label": "Cloud Hosted MTA (Frequent in bulletproof spam)"
        }
    
    return {
        "category": "Residential / Commercial ISP",
        "is_datacenter": False,
        "risk_modifier": 0,
        "risk_label": "Standard Telecommunications Gateway"
    }


def enrich_ip_intelligence(ip: str) -> dict:
    """Enrich IP with threat intelligence"""
    intel = {
        "is_tor": False,
        "is_vpn": False,
        "is_proxy": False,
        "is_datacenter": False,
        "is_malicious": False,
        "reputation": "unknown",
        "threat_types": [],
        "last_seen": None
    }
    
    try:
        # Check against known Tor exit nodes (simplified - in production use a proper feed)
        resp = requests.get("https://check.torproject.org/torbulkexitlist", timeout=3.0)
        if resp.status_code == 200 and ip in resp.text:
            intel["is_tor"] = True
            intel["threat_types"].append("TOR_EXIT_NODE")
    except Exception:
        pass
    
    return intel


def trace_origin(relay_chain: list) -> dict:
    ip = get_first_untrusted_ip(relay_chain)

    if not ip:
        return {
            "ip": "127.0.0.1",
            "verdict": "no_public_ip_found",
            "approximate_location": "Local / Internal Network",
            "city": "Internal Relay",
            "region": "Private Subnet",
            "country": "Localhost",
            "country_code": "LOC",
            "org": "Private Infrastructure (RFC 1918)",
            "asn": "AS0 (Internal)",
            "lat": 37.7749,
            "lon": -122.4194,
            "network_type": {
                "category": "Internal Subnet",
                "is_datacenter": False,
                "risk_modifier": 0,
                "risk_label": "Internal Origin"
            },
            "location_disclaimer": "Internal / non-routable IP. No external geolocation available.",
            "all_hops": get_all_public_hops(relay_chain)
        }

    # Check cache first
    cache_key = f"geo_{ip}"
    if cache_key in _geo_cache:
        cached = _geo_cache[cache_key]
        if (datetime.now() - cached["timestamp"]).seconds < 3600:
            return cached["data"]

    # Reverse DNS lookup
    hostname = None
    try:
        hostname = socket.gethostbyaddr(ip)[0]
    except Exception:
        hostname = f"host-{ip.replace('.', '-')}.net"

    # Try multiple geolocation providers
    geo_data = None
    for provider in [get_geolocation_ipinfo, get_geolocation_ipapi]:
        geo_data = provider(ip)
        if geo_data:
            break

    if not geo_data:
        # Fallback
        geo_data = {
            "ip": ip,
            "city": "Unknown",
            "region": "Unknown",
            "country": "XX",
            "country_code": "XX",
            "lat": 0,
            "lon": 0,
            "org": "Unknown",
            "asn": "AS0",
            "source": "fallback"
        }

    # Enrich with threat intelligence
    intel = enrich_ip_intelligence(ip)
    
    org = geo_data.get("org", "")
    asn = geo_data.get("asn", "AS0")
    net_type = determine_network_type(org, asn)
    
    # Adjust risk based on threat intel
    if intel["is_tor"]:
        net_type["category"] = "Tor Exit Node"
        net_type["risk_modifier"] = 35
        net_type["risk_label"] = "Tor Anonymity Network Exit"
        net_type["is_datacenter"] = True

    lat = geo_data.get("lat", 0)
    lon = geo_data.get("lon", 0)
    city = geo_data.get("city") or "Unknown"
    region = geo_data.get("region") or "Unknown"
    country = geo_data.get("country") or "XX"

    result = {
        "ip": ip,
        "hostname": hostname,
        "verdict": "resolved",
        "asn": asn,
        "org": org,
        "city": city,
        "region": region,
        "country": country,
        "country_code": geo_data.get("country_code", "XX"),
        "approximate_location": f"{city}, {region}, {country}",
        "lat": lat,
        "lon": lon,
        "network_type": net_type,
        "threat_intel": intel,
        "location_disclaimer": "Approximate Network Infrastructure Location (Autonomous System MTA gateway, NOT physical user location)",
        "all_hops": get_all_public_hops(relay_chain),
        "geolocation_source": geo_data.get("source", "unknown")
    }

    # Cache the result
    _geo_cache[cache_key] = {
        "data": result,
        "timestamp": datetime.now()
    }

    return result


def fingerprint_device(user_agent: str, additional_headers: dict = None) -> dict:
    """Extract device fingerprint from User-Agent and headers"""
    if not user_agent:
        return {
            "device_type": "Unknown",
            "os": "Unknown",
            "browser": "Unknown",
            "browser_version": "Unknown",
            "device_model": "Unknown",
            "is_mobile": False,
            "is_tablet": False,
            "is_pc": False,
            "is_bot": False,
            "user_agent": user_agent
        }
    
    ua = parse_ua(user_agent)
    
    device_type = "Desktop"
    if ua.is_mobile:
        device_type = "Mobile"
    elif ua.is_tablet:
        device_type = "Tablet"
    elif ua.is_bot:
        device_type = "Bot/Crawler"
    
    # Extract additional info from headers
    client_hints = {}
    if additional_headers:
        for key, value in additional_headers.items():
            if key.lower().startswith("sec-ch-"):
                client_hints[key] = value
    
    return {
        "device_type": device_type,
        "os": f"{ua.os.family} {ua.os.version_string}" if ua.os.version_string else ua.os.family,
        "browser": f"{ua.browser.family} {ua.browser.version_string}" if ua.browser.version_string else ua.browser.family,
        "browser_version": ua.browser.version_string,
        "device_model": ua.device.family,
        "device_brand": ua.device.brand,
        "is_mobile": ua.is_mobile,
        "is_tablet": ua.is_tablet,
        "is_pc": ua.is_pc,
        "is_bot": ua.is_bot,
        "is_touch_capable": ua.is_touch_capable if hasattr(ua, 'is_touch_capable') else False,
        "user_agent": user_agent,
        "client_hints": client_hints,
        "fingerprint_hash": hashlib.sha256(f"{ua.browser.family}{ua.browser.version_string}{ua.os.family}{ua.os.version_string}{ua.device.family}".encode()).hexdigest()[:16]
    }


def analyze_device_consistency(email_obj: dict, fingerprint: dict) -> dict:
    """Analyze if device fingerprint is consistent with email context"""
    anomalies = []
    risk_score = 0
    
    # Check if user agent claims mobile but headers suggest otherwise
    ua = email_obj.get("headers", {}).get("User-Agent", "")
    if ua:
        parsed = parse_ua(ua)
        if parsed.is_mobile != fingerprint.get("is_mobile"):
            anomalies.append("User-Agent device type mismatch")
            risk_score += 15
    
    # Check for automation/bot indicators
    if fingerprint.get("is_bot"):
        anomalies.append("Automated client/bot detected")
        risk_score += 30
    
    # Check for suspicious client hints
    client_hints = fingerprint.get("client_hints", {})
    if "sec-ch-ua-platform" in client_hints:
        platform = client_hints["sec-ch-ua-platform"].lower()
        if "linux" in platform and fingerprint.get("os", "").lower().find("windows") != -1:
            anomalies.append("Platform mismatch in Client Hints")
            risk_score += 10
    
    return {
        "anomalies": anomalies,
        "risk_score": min(risk_score, 100),
        "consistent": len(anomalies) == 0
    }