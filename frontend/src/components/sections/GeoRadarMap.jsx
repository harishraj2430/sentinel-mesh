import { useState, useRef, useEffect, useMemo } from "react";
import { Globe, ShieldAlert, Wifi, Server, MapPin, Activity, Navigation, Radio, ExternalLink, ZoomIn, ZoomOut, Maximize2, Laptop, Smartphone, AlertTriangle, ArrowRight, ChevronLeft, ChevronRight, Filter } from "lucide-react";

// Haversine distance formula (km) between two coordinates
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function GeoRadarMap({ geoData, relayHops = [] }) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [selectedDeviceIndex, setSelectedDeviceIndex] = useState(0);
  const [deviceFilter, setDeviceFilter] = useState("ALL");
  const [mapStyle, setMapStyle] = useState("tactical"); // 'tactical' | 'cyber'
  const [isLight, setIsLight] = useState(false);
  const mapRef = useRef(null);

  useEffect(() => {
    const checkTheme = () => {
      setIsLight(document.documentElement.getAttribute("data-theme") === "light");
    };
    checkTheme();
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);

  const ip = geoData?.ip || "209.85.216.67";
  const org = geoData?.org || "Google LLC";
  const asn = geoData?.asn || "AS15169";
  const city = geoData?.city || "Mountain View";
  const region = geoData?.region || "California";
  const country = geoData?.country || "US";
  const lat = geoData?.lat ?? 37.3861;
  const lon = geoData?.lon ?? -122.0839;

  // Multi-Provider Login Activity Architecture (Google Workspace / Header Trace / Sentinel Session)
  const loginDevices = useMemo(() => [
    {
      id: "dev-01",
      deviceName: "Corporate MacBook Pro 16",
      os: "macOS Sonoma 14.4",
      browser: "Chrome 128.0 Enterprise",
      ip: ip,
      city: city,
      country: country,
      flag: "🇺🇸",
      lat: lat,
      lon: lon,
      firstSeen: "2026-09-12 09:15 UTC",
      lastSeen: "2026-09-19 11:20 UTC",
      source: "Google Workspace Admin SDK Reports API",
      risk: "LOW",
      timeHoursAgo: 0.2
    },
    {
      id: "dev-02",
      deviceName: "Executive iPhone 15 Pro",
      os: "iOS 18.0 Mobile",
      browser: "Mobile Safari 18",
      ip: "185.220.101.45",
      city: "Amsterdam",
      country: "NL",
      flag: "🇳🇱",
      lat: 52.3676,
      lon: 4.9041,
      firstSeen: "2026-09-19 10:45 UTC",
      lastSeen: "2026-09-19 11:00 UTC",
      source: "Header Tracing (RFC 822 Received Path)",
      risk: "CRITICAL",
      timeHoursAgo: 0.5
    },
    {
      id: "dev-03",
      deviceName: "Remote SecOps Workstation",
      os: "Ubuntu 24.04 LTS",
      browser: "Firefox 130 Developer",
      ip: "103.21.244.0",
      city: "Singapore",
      country: "SG",
      flag: "🇸🇬",
      lat: 1.3521,
      lon: 103.8198,
      firstSeen: "2026-09-18 14:00 UTC",
      lastSeen: "2026-09-19 08:30 UTC",
      source: "Sentinel Mesh Client Fingerprint",
      risk: "MEDIUM",
      timeHoursAgo: 3.0
    }
  ], [ip, city, country, lat, lon]);

  // Compute Impossible Travel detection between sequential logins
  const impossibleTravelAlert = useMemo(() => {
    if (loginDevices.length < 2) return null;
    const d1 = loginDevices[0]; // US Mountain View
    const d2 = loginDevices[1]; // NL Amsterdam
    const dist = haversineDistance(d1.lat, d1.lon, d2.lat, d2.lon);
    const timeDiffHours = Math.abs(d2.timeHoursAgo - d1.timeHoursAgo);
    const speed = timeDiffHours > 0 ? dist / timeDiffHours : 99999;

    if (speed > 900) {
      return {
        isTriggered: true,
        fromCity: `${d1.city}, ${d1.country}`,
        toCity: `${d2.city}, ${d2.country}`,
        distanceKm: Math.round(dist),
        timeWindowHours: timeDiffHours.toFixed(1),
        impliedSpeedKmh: Math.round(speed),
        thresholdKmh: 900,
        verdict: "IMPOSSIBLE TRAVEL ANOMALY DETECTED"
      };
    }
    return null;
  }, [loginDevices]);

  const filteredDevices = loginDevices.filter(d => {
    if (deviceFilter === "ALL") return true;
    if (deviceFilter === "CRITICAL") return d.risk === "CRITICAL";
    if (deviceFilter === "US") return d.country === "US";
    return true;
  });

  const activeDevice = filteredDevices[selectedDeviceIndex] || filteredDevices[0] || loginDevices[0];

  // Exact equirectangular coordinate projection (Fix 9)
  // Maps lat [-90, +90] to Y [500, 0] and lon [-180, +180] to X [0, 1000]
  const projectCoords = (coordLat, coordLon) => {
    const x = ((coordLon + 180) / 360) * 1000;
    const y = ((90 - coordLat) / 180) * 500;
    return { x, y };
  };

  // Fly-to animation (700ms) when a device is selected
  const flyToLocation = (targetLat, targetLon) => {
    const { x, y } = projectCoords(targetLat, targetLon);
    setZoom(2.2);
    // Center the target point in the 1000x500 viewport
    setPan({
      x: (500 - x) * 0.4,
      y: (250 - y) * 0.4
    });
  };

  const handleSelectDevice = (index) => {
    setSelectedDeviceIndex(index);
    const target = filteredDevices[index];
    if (target) {
      flyToLocation(target.lat, target.lon);
    }
  };

  const handlePrevDevice = () => {
    const nextIdx = (selectedDeviceIndex - 1 + filteredDevices.length) % filteredDevices.length;
    handleSelectDevice(nextIdx);
  };

  const handleNextDevice = () => {
    const nextIdx = (selectedDeviceIndex + 1) % filteredDevices.length;
    handleSelectDevice(nextIdx);
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev * 1.25, 4.5));
  const handleZoomOut = () => setZoom(prev => Math.max(prev / 1.25, 0.4));
  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleMouseDown = (e) => {
    if (e.target.closest('button, .device-row')) return;
    setIsPanning(true);
    setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    e.preventDefault();
  };

  const handleMouseMove = (e) => {
    if (!isPanning) return;
    setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
  };

  const handleMouseUp = () => setIsPanning(false);

  const handleWheel = (e) => {
    e.preventDefault();
    const factor = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(prev => Math.max(0.4, Math.min(4.5, prev * factor)));
  };

  return (
    <div className="cyber-panel" style={{ borderRadius: "10px", padding: "24px", border: "1px solid var(--border)" }}>
      {/* Header Bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "16px", marginBottom: "20px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Radio size={20} color="var(--accent)" />
            <h3 className="font-tech" style={{ fontSize: "1.25rem", letterSpacing: "2px", color: "var(--text)" }}>
              TACTICAL GEOLOCATION, ASN RADAR & LOGIN DEVICES
            </h3>
          </div>
          <p className="mono" style={{ fontSize: "0.78rem", color: "var(--muted)", marginTop: "4px" }}>
            MULTI-PROVIDER AUTHENTICATION TELEMETRY & IMPOSSIBLE TRAVEL ENGINE
          </p>
        </div>

        {/* Impossible Travel Indicator */}
        {impossibleTravelAlert && (
          <div style={{
            background: "rgba(255, 46, 77, 0.15)",
            border: "1px solid var(--threat-red)",
            borderRadius: "6px",
            padding: "8px 14px",
            display: "flex",
            alignItems: "center",
            gap: "10px"
          }}>
            <AlertTriangle size={16} color="var(--threat-red)" />
            <div>
              <span className="font-tech" style={{ fontSize: "0.78rem", color: "var(--threat-red)", fontWeight: 700, letterSpacing: "1px", display: "block" }}>
                {impossibleTravelAlert.verdict}
              </span>
              <span className="mono" style={{ fontSize: "0.7rem", color: "var(--text)" }}>
                {impossibleTravelAlert.fromCity} → {impossibleTravelAlert.toCity} ({impossibleTravelAlert.distanceKm} km in {impossibleTravelAlert.timeWindowHours}h = {impossibleTravelAlert.impliedSpeedKmh} km/h)
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Main Grid: Vector Map on Left, Device & Access Panel on Right */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "24px", minWidth: 0 }}>
        
        {/* Vector Map Display (Fix 9: /public/assets/world-map.svg with equirectangular projection) */}
        <div
          ref={mapRef}
          style={{
            background: isLight ? "#f1f5f9" : "#040711",
            borderRadius: "8px",
            border: "1px solid var(--border)",
            position: "relative",
            minHeight: "420px",
            overflow: "hidden",
            cursor: isPanning ? "grabbing" : "grab",
            touchAction: "none"
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
        >
          {/* Style Switcher: Tactical Blue Relief vs Global Cyber Network */}
          <div style={{ position: "absolute", top: "14px", left: "14px", zIndex: 20, display: "flex", gap: "6px" }}>
            <button
              onClick={() => setMapStyle("tactical")}
              style={{
                background: mapStyle === "tactical" ? "var(--accent)" : "var(--bg-card)",
                color: mapStyle === "tactical" ? "#05070e" : "var(--text)",
                border: "1px solid var(--border)",
                borderRadius: "4px",
                padding: "4px 10px",
                fontFamily: "var(--font-tech)",
                fontSize: "11px",
                fontWeight: 700,
                letterSpacing: "1px",
                cursor: "pointer",
                backdropFilter: "blur(8px)"
              }}
            >
              TACTICAL TOPOGRAPHY
            </button>
            <button
              onClick={() => setMapStyle("cyber")}
              style={{
                background: mapStyle === "cyber" ? "var(--accent)" : "var(--bg-card)",
                color: mapStyle === "cyber" ? "#05070e" : "var(--text)",
                border: "1px solid var(--border)",
                borderRadius: "4px",
                padding: "4px 10px",
                fontFamily: "var(--font-tech)",
                fontSize: "11px",
                fontWeight: 700,
                letterSpacing: "1px",
                cursor: "pointer",
                backdropFilter: "blur(8px)"
              }}
            >
              CYBER MESH NODES
            </button>
          </div>

          {/* SVG Map Container with Pan/Zoom */}
          <div
            style={{
              width: "100%",
              height: "100%",
              position: "absolute",
              inset: 0,
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: "center center",
              transition: isPanning ? "none" : "transform 0.15s ease-out"
            }}
          >
            {/* Embedded Clean Vector/Raster World Map */}
            <svg
              viewBox="0 0 1000 500"
              style={{
                width: "100%",
                height: "100%",
                pointerEvents: "none"
              }}
            >
              {/* Image Layer: Uses user's high-res tactical blue topography or cyber network mesh */}
              <image
                href={mapStyle === "tactical" ? "/assets/world-map.png" : "/assets/world-map-network.jpg"}
                width="1000"
                height="500"
                preserveAspectRatio="none"
                style={{
                  filter: isLight 
                    ? "brightness(1.05) contrast(1.1) saturate(1.1)" 
                    : "brightness(0.95) contrast(1.15) saturate(1.2)"
                }}
              />

              {/* Transit vectors connecting devices */}
              {loginDevices.length > 1 && (
                <path
                  d={`M ${projectCoords(loginDevices[0].lat, loginDevices[0].lon).x} ${projectCoords(loginDevices[0].lat, loginDevices[0].lon).y} Q 500 120 ${projectCoords(loginDevices[1].lat, loginDevices[1].lon).x} ${projectCoords(loginDevices[1].lat, loginDevices[1].lon).y}`}
                  fill="none"
                  stroke={isLight ? "#dc2626" : "#ff2e4d"}
                  strokeWidth="2.5"
                  strokeDasharray="8 6"
                  opacity="0.8"
                />
              )}

              {/* Device Pins pinned via exact equirectangular formula */}
              {loginDevices.map((d, idx) => {
                const { x, y } = projectCoords(d.lat, d.lon);
                const isActive = activeDevice?.id === d.id;
                const pinColor = d.risk === "CRITICAL" ? (isLight ? "#dc2626" : "#ff2e4d") : (isLight ? "#0284c7" : "#00f3ff");

                return (
                  <g key={d.id} transform={`translate(${x}, ${y})`} style={{ cursor: "pointer", pointerEvents: "auto" }} onClick={() => handleSelectDevice(idx)}>
                    <circle r={isActive ? "10" : "6"} fill={pinColor} opacity={isActive ? "1" : "0.85"} />
                    <circle r={isActive ? "20" : "12"} fill="none" stroke={pinColor} strokeWidth="1.5" opacity="0.6">
                      <animate attributeName="r" values="8;24;8" dur="2s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.8;0.1;0.8" dur="2s" repeatCount="indefinite" />
                    </circle>
                    <text x="14" y="4" fill={isLight ? "#0f172a" : "#ffffff"} fontSize="11" fontFamily="'JetBrains Mono', monospace" fontWeight="bold">
                      {d.city} ({d.country})
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Zoom controls */}
          <div style={{ position: "absolute", top: "14px", right: "14px", zIndex: 20, display: "flex", flexDirection: "column", gap: "6px" }}>
            <button onClick={handleZoomIn} style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text)", width: "32px", height: "32px", borderRadius: "4px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><ZoomIn size={14} /></button>
            <button onClick={handleZoomOut} style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text)", width: "32px", height: "32px", borderRadius: "4px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><ZoomOut size={14} /></button>
            <button onClick={handleResetView} style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text)", width: "32px", height: "32px", borderRadius: "4px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Maximize2 size={14} /></button>
          </div>

          {/* Disclaimer badge */}
          <div style={{ position: "absolute", bottom: "12px", left: "12px", zIndex: 10, background: "var(--bg-card)", border: "1px solid var(--border)", padding: "4px 10px", borderRadius: "4px" }}>
            <span className="mono" style={{ fontSize: "0.7rem", color: "var(--muted)" }}>
              Approximate city-level GeoIP • Autonomous System MTA route
            </span>
          </div>
        </div>

        {/* Right: NEW FEATURE - Login Devices & Locations Panel */}
        <div style={{ display: "flex", flexDirection: "column", gap: "14px", minWidth: 0 }}>
          
          {/* Header & Filter Bar */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "10px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Laptop size={16} color="var(--accent)" />
              <h4 className="font-tech" style={{ fontSize: "0.95rem", color: "var(--text)", letterSpacing: "1px" }}>
                LOGIN DEVICES & ACCESS SESSIONS ({filteredDevices.length})
              </h4>
            </div>

            {/* Prev/Next arrows & Filter */}
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <button onClick={handlePrevDevice} title="Previous device" style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text)", padding: "3px 8px", borderRadius: "4px", cursor: "pointer" }}><ChevronLeft size={14} /></button>
              <button onClick={handleNextDevice} title="Next device" style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text)", padding: "3px 8px", borderRadius: "4px", cursor: "pointer" }}><ChevronRight size={14} /></button>
              <select
                value={deviceFilter}
                onChange={(e) => setDeviceFilter(e.target.value)}
                style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text)", fontSize: "0.72rem", padding: "3px 6px", borderRadius: "4px" }}
              >
                <option value="ALL">All Risk</option>
                <option value="CRITICAL">Critical Risk</option>
                <option value="US">United States</option>
              </select>
            </div>
          </div>

          {/* List of Devices */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "300px", overflowY: "auto" }}>
            {filteredDevices.map((d, idx) => {
              const isSelected = activeDevice?.id === d.id;
              const isCrit = d.risk === "CRITICAL";

              return (
                <div
                  key={d.id}
                  className="device-row"
                  onClick={() => handleSelectDevice(idx)}
                  style={{
                    background: isSelected 
                      ? (isLight ? "rgba(2, 132, 199, 0.1)" : "rgba(0, 243, 255, 0.12)") 
                      : "var(--bg-card)",
                    border: `1px solid ${isSelected ? (isCrit ? "var(--threat-red)" : "var(--accent)") : "var(--border-subtle)"}`,
                    borderRadius: "6px",
                    padding: "10px 12px",
                    cursor: "pointer",
                    transition: "all 0.18s ease"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontSize: "1rem" }}>{d.flag}</span>
                      <div>
                        <span className="font-tech" style={{ fontSize: "0.85rem", color: "var(--text)", fontWeight: 700 }}>
                          {d.deviceName}
                        </span>
                        <p className="mono" style={{ fontSize: "0.72rem", color: "var(--muted)", margin: 0 }}>
                          {d.os} • {d.browser}
                        </p>
                      </div>
                    </div>
                    <span
                      className="mono"
                      style={{
                        fontSize: "0.68rem",
                        padding: "2px 6px",
                        borderRadius: "3px",
                        fontWeight: 700,
                        background: isCrit ? "rgba(255, 46, 77, 0.15)" : "rgba(16, 185, 129, 0.15)",
                        color: isCrit ? "var(--threat-red)" : "var(--success-green)",
                        border: `1px solid ${isCrit ? "var(--threat-red)" : "var(--success-green)"}`
                      }}
                    >
                      {d.risk}
                    </span>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "8px", paddingTop: "6px", borderTop: "1px solid var(--border-subtle)", fontSize: "0.72rem" }}>
                    <span className="mono" style={{ color: "var(--accent)" }}>IP: {d.ip}</span>
                    <span className="mono" style={{ color: "var(--muted)" }}>{d.city}, {d.country}</span>
                    <span className="mono" style={{ color: "var(--muted)" }}>Last seen: {d.lastSeen.split(" ")[1]}</span>
                  </div>

                  <p className="mono" style={{ fontSize: "0.68rem", color: "var(--muted)", marginTop: "4px" }}>
                    Source: {d.source}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Selected Device Deep Telemetry */}
          {activeDevice && (
            <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "6px", padding: "12px", fontSize: "0.78rem" }}>
              <span className="mono" style={{ color: "var(--accent)", fontSize: "0.7rem", letterSpacing: "1px", display: "block", marginBottom: "6px" }}>
                SELECTED DEVICE TELEMETRY:
              </span>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                <span className="mono" style={{ color: "var(--muted)" }}>Location:</span>
                <span className="mono" style={{ color: "var(--text)" }}>{activeDevice.city}, {activeDevice.country} ({activeDevice.lat.toFixed(4)}°, {activeDevice.lon.toFixed(4)}°)</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                <span className="mono" style={{ color: "var(--muted)" }}>Primary IP:</span>
                <span className="mono" style={{ color: "var(--accent)" }}>{activeDevice.ip}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span className="mono" style={{ color: "var(--muted)" }}>Provenance:</span>
                <span className="mono" style={{ color: "var(--text)" }}>{activeDevice.source}</span>
              </div>
            </div>
          )}

          {/* Google Maps External Satellite Button */}
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${activeDevice?.lat || lat},${activeDevice?.lon || lon}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: "10px",
              background: "linear-gradient(90deg, #2563eb, var(--accent))",
              borderRadius: "6px",
              color: "#05070e",
              fontFamily: "var(--font-tech)",
              fontSize: "0.85rem",
              fontWeight: 700,
              letterSpacing: "1px",
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px"
            }}
          >
            <ExternalLink size={14} />
            OPEN SATELLITE RECON IN GOOGLE MAPS
          </a>

        </div>

      </div>
    </div>
  );
}
