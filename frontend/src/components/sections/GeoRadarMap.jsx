import { useState, useRef, useEffect } from "react";
import { Radio, ExternalLink, ZoomIn, ZoomOut, Maximize2, Server, Globe, MapPin, Shield } from "lucide-react";

export default function GeoRadarMap({ geoData, relayHops = [] }) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
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
  const networkCategory = geoData?.network_type?.category || "Standard Autonomous System (MTA Gateway)";
  const isDatacenter = geoData?.network_type?.is_datacenter ?? false;

  // Exact equirectangular coordinate projection
  // Maps lat [-90, +90] to Y [500, 0] and lon [-180, +180] to X [0, 1000]
  const projectCoords = (coordLat, coordLon) => {
    const x = ((coordLon + 180) / 360) * 1000;
    const y = ((90 - coordLat) / 180) * 500;
    return { x, y };
  };

  const originCoords = projectCoords(lat, lon);

  const handleZoomIn = () => setZoom(prev => Math.min(prev * 1.25, 4.5));
  const handleZoomOut = () => setZoom(prev => Math.max(prev / 1.25, 0.4));
  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleMouseDown = (e) => {
    if (e.target.closest('button, a')) return;
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
              TACTICAL GEOLOCATION & ASN RADAR
            </h3>
          </div>
          <p className="mono" style={{ fontSize: "0.78rem", color: "var(--muted)", marginTop: "4px" }}>
            AUTONOMOUS SYSTEM NETWORK TRACING & INFRASTRUCTURE RECONNAISSANCE
          </p>
        </div>

        <div style={{
          background: isDatacenter ? "rgba(245, 158, 11, 0.12)" : "rgba(16, 185, 129, 0.12)",
          border: `1px solid ${isDatacenter ? "var(--warning-amber)" : "var(--success-green)"}`,
          borderRadius: "6px",
          padding: "6px 14px",
          display: "flex",
          alignItems: "center",
          gap: "8px"
        }}>
          <Server size={15} color={isDatacenter ? "var(--warning-amber)" : "var(--success-green)"} />
          <span className="mono" style={{ fontSize: "0.74rem", color: isDatacenter ? "var(--warning-amber)" : "var(--success-green)", fontWeight: 700 }}>
            {isDatacenter ? "DATACENTER / CLOUD HOSTED MTA" : "ENTERPRISE MTA GATEWAY"}
          </span>
        </div>
      </div>

      {/* Main Grid: Vector Map on Left, Technical Intelligence Panel on Right */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "24px", minWidth: 0 }}>
        
        {/* World Map Display with Pan/Zoom */}
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
            <svg
              viewBox="0 0 1000 500"
              style={{
                width: "100%",
                height: "100%",
                pointerEvents: "none"
              }}
            >
              {/* Tactical Topography World Map */}
              <image
                href="/assets/world-map.png"
                width="1000"
                height="500"
                preserveAspectRatio="none"
                style={{
                  filter: isLight 
                    ? "brightness(1.05) contrast(1.1) saturate(1.1)" 
                    : "brightness(0.95) contrast(1.15) saturate(1.2)"
                }}
              />

              {/* Origin IP Radar Marker */}
              <g transform={`translate(${originCoords.x}, ${originCoords.y})`} style={{ pointerEvents: "auto" }}>
                <circle r="6" fill={isLight ? "#0284c7" : "#00f3ff"} />
                <circle r="14" fill="none" stroke={isLight ? "#0284c7" : "#00f3ff"} strokeWidth="1.5" opacity="0.7">
                  <animate attributeName="r" values="6;22;6" dur="2.4s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.8;0.1;0.8" dur="2.4s" repeatCount="indefinite" />
                </circle>
                <text x="12" y="4" fill={isLight ? "#0f172a" : "#ffffff"} fontSize="11" fontFamily="var(--font-mono)" fontWeight="bold">
                  {city}, {country} ({ip})
                </text>
              </g>
            </svg>
          </div>

          {/* Zoom controls */}
          <div style={{ position: "absolute", top: "14px", right: "14px", zIndex: 20, display: "flex", flexDirection: "column", gap: "6px" }}>
            <button onClick={handleZoomIn} title="Zoom In" style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text)", width: "32px", height: "32px", borderRadius: "4px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><ZoomIn size={14} /></button>
            <button onClick={handleZoomOut} title="Zoom Out" style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text)", width: "32px", height: "32px", borderRadius: "4px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><ZoomOut size={14} /></button>
            <button onClick={handleResetView} title="Reset View" style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text)", width: "32px", height: "32px", borderRadius: "4px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Maximize2 size={14} /></button>
          </div>

          {/* Disclaimer badge */}
          <div style={{ position: "absolute", bottom: "12px", left: "12px", zIndex: 10, background: "var(--bg-card)", border: "1px solid var(--border)", padding: "4px 10px", borderRadius: "4px" }}>
            <span className="mono" style={{ fontSize: "0.7rem", color: "var(--muted)" }}>
              Approximate Infrastructure Location (Autonomous System MTA gateway, NOT physical sender GPS)
            </span>
          </div>
        </div>

        {/* Technical Infrastructure & Geolocation Telemetry Panel */}
        <div style={{ display: "flex", flexDirection: "column", gap: "14px", minWidth: 0 }}>
          
          {/* Primary Routing IP */}
          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "6px", padding: "14px" }}>
            <span className="mono" style={{ fontSize: "0.72rem", color: "var(--muted)", letterSpacing: "1px" }}>PRIMARY ROUTING IP</span>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "4px" }}>
              <span className="mono" style={{ fontSize: "1.15rem", color: "var(--accent)", fontWeight: 700 }}>{ip}</span>
              <span className="mono" style={{ fontSize: "0.72rem", color: "var(--success-green)", background: "rgba(16, 185, 129, 0.12)", border: "1px solid var(--success-green)", padding: "2px 8px", borderRadius: "4px", fontWeight: 600 }}>
                PUBLIC GATEWAY
              </span>
            </div>
          </div>

          {/* Autonomous System & Operator */}
          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "6px", padding: "14px" }}>
            <span className="mono" style={{ fontSize: "0.72rem", color: "var(--muted)", letterSpacing: "1px" }}>AUTONOMOUS SYSTEM (ASN) & OPERATOR</span>
            <p className="font-tech" style={{ fontSize: "1.05rem", color: "var(--text)", fontWeight: 700, marginTop: "4px" }}>
              {asn} — {org}
            </p>
          </div>

          {/* Infrastructure Geolocation */}
          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "6px", padding: "14px" }}>
            <span className="mono" style={{ fontSize: "0.72rem", color: "var(--muted)", letterSpacing: "1px" }}>PROBABLE INFRASTRUCTURE LOCATION</span>
            <p className="font-tech" style={{ fontSize: "1.05rem", color: "var(--text)", fontWeight: 700, marginTop: "4px" }}>
              {city}, {region} ({country})
            </p>
            <p className="mono" style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: "4px" }}>
              COORDINATES: {lat.toFixed(4)}° N, {lon.toFixed(4)}° E
            </p>
          </div>

          {/* Network Classification */}
          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "6px", padding: "14px" }}>
            <span className="mono" style={{ fontSize: "0.72rem", color: "var(--muted)", letterSpacing: "1px" }}>ROUTING CLASSIFICATION</span>
            <p className="font-tech" style={{ fontSize: "0.92rem", color: "var(--text)", fontWeight: 600, marginTop: "4px" }}>
              {networkCategory}
            </p>
          </div>

          {/* Google Maps External Satellite Button */}
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${lat},${lon}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: "12px",
              background: "linear-gradient(90deg, #2563eb, var(--accent))",
              borderRadius: "6px",
              color: "#05070e",
              fontFamily: "var(--font-btn)",
              fontSize: "0.85rem",
              fontWeight: 700,
              letterSpacing: "1px",
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              marginTop: "auto"
            }}
          >
            <ExternalLink size={15} />
            OPEN SATELLITE RECON IN GOOGLE MAPS
          </a>

        </div>

      </div>
    </div>
  );
}
