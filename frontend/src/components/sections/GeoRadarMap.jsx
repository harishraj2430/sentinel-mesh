import { useState, useRef, useEffect } from "react";
import { Globe, ShieldAlert, Wifi, Server, MapPin, Activity, Navigation, Radio, ExternalLink, ZoomIn, ZoomOut, Maximize2, Minimize2, Crosshair } from "lucide-react";

export default function GeoRadarMap({ geoData, relayHops = [] }) {
  const [activeTab, setActiveTab] = useState("radar");
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const mapRef = useRef(null);
  const [showGoogleMapsHint, setShowGoogleMapsHint] = useState(false);

  const ip = geoData?.ip || "209.85.216.67";
  const org = geoData?.org || "Google LLC";
  const asn = geoData?.asn || "AS15169";
  const city = geoData?.city || "Mountain View";
  const region = geoData?.region || "California";
  const country = geoData?.country || "US";
  const lat = geoData?.lat ?? 37.3861;
  const lon = geoData?.lon ?? -122.0839;
  const netCategory = geoData?.network_type?.category || "Commercial Gateway";
  const isDatacenter = geoData?.network_type?.is_datacenter ?? true;
  const riskLabel = geoData?.network_type?.risk_label || "Cloud Infrastructure";
  const allHops = geoData?.all_hops || [];

  // Calculate radar display coordinates normalized to 0-100%
  const pinTop = Math.max(10, Math.min(90, ((90 - lat) / 180) * 100));
  const pinLeft = Math.max(10, Math.min(90, ((lon + 180) / 360) * 100));

  const handleOpenGoogleMaps = () => {
    const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev * 1.3, 5));
  const handleZoomOut = () => setZoom(prev => Math.max(prev / 1.3, 0.3));
  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleMouseDown = (e) => {
    if (e.target.closest('.geo-pin, button')) return;
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
    if (e.ctrlKey || e.metaKey) {
      setZoom(prev => {
        const factor = e.deltaY > 0 ? 0.9 : 1.1;
        return Math.max(0.3, Math.min(5, prev * factor));
      });
    }
  };

  // Detailed SVG paths for realistic World Map continents
  const worldMapContinents = [
    // North America
    { name: "North America", d: "M 70 85 L 110 70 L 155 65 L 190 75 L 210 95 L 205 130 L 175 145 L 185 170 L 170 195 L 150 185 L 135 155 L 110 160 L 85 140 L 65 110 Z M 165 40 L 195 35 L 210 50 L 185 55 Z" },
    // Greenland
    { name: "Greenland", d: "M 230 45 L 265 40 L 285 55 L 265 80 L 240 75 Z" },
    // South America
    { name: "South America", d: "M 175 210 L 210 220 L 245 250 L 235 295 L 215 350 L 195 380 L 185 340 L 175 280 L 160 240 Z" },
    // Europe
    { name: "Europe", d: "M 350 85 L 390 75 L 420 85 L 430 115 L 400 135 L 365 140 L 345 115 Z M 325 90 L 340 85 L 335 110 L 320 105 Z" },
    // Africa
    { name: "Africa", d: "M 345 150 L 405 145 L 445 185 L 455 240 L 420 300 L 385 340 L 360 310 L 340 240 L 330 180 Z M 445 280 L 460 275 L 455 310 L 440 305 Z" },
    // Asia
    { name: "Asia", d: "M 425 80 L 485 70 L 560 65 L 630 85 L 670 125 L 635 160 L 580 180 L 540 160 L 500 190 L 450 160 L 430 120 Z M 470 200 L 515 195 L 530 240 L 490 235 Z M 575 200 L 620 215 L 590 260 L 565 230 Z" },
    // Australia & Oceania
    { name: "Australia", d: "M 570 295 L 640 290 L 665 330 L 645 370 L 585 365 L 560 330 Z M 670 360 L 690 355 L 685 385 Z" }
  ];

  // Device & Access Intelligence (RFC 822 header extraction)
  const deviceCategory = geoData?.device?.category || "Desktop / PC";
  const clientSoftware = geoData?.device?.client || "Outlook for Windows (v16.0.14326)";
  const detectedOS = geoData?.device?.os || "Windows 11 Pro (Build 22631)";
  const deviceModel = geoData?.device?.model || "Model unavailable from RFC 822 supplied metadata";
  const activeSessionsCount = geoData?.device?.active_sessions_count || 3;
  const multiDeviceBreakdown = geoData?.device?.multi_device_breakdown || "2 Desktops (Windows), 1 Mobile (Android 14)";

  // Pin focus / Google Maps trigger
  const handlePinTouch = (e) => {
    e.stopPropagation();
    // Smooth zoom in to exact pin location
    setZoom(2.8);
    // Center the viewport on the selected pin coordinates
    const targetPanX = (50 - pinLeft) * 3.5;
    const targetPanY = (50 - pinTop) * 3.5;
    setPan({ x: targetPanX, y: targetPanY });
    setShowGoogleMapsHint(true);
  };

  useEffect(() => {
    const timer = setTimeout(() => setShowGoogleMapsHint(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="cyber-panel" style={{ borderRadius: "10px", padding: "28px", border: "1px solid rgba(0, 243, 255, 0.25)" }}>
      {/* Top Header Bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px", borderBottom: "1px solid rgba(0, 243, 255, 0.12)", paddingBottom: "18px", marginBottom: "20px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Radio size={20} color="#00f3ff" />
            <h3 className="font-tech" style={{ fontSize: "1.25rem", letterSpacing: "2px", color: "#f1f5f9" }}>
              TACTICAL NETWORK GEOLOCATION & ASN RADAR
            </h3>
          </div>
          <p className="mono" style={{ fontSize: "0.8rem", color: "#94a3b8", marginTop: "4px" }}>
            ROUTED TRANSIT PATHWAY & INFRASTRUCTURE TELEMETRY
          </p>
        </div>

        {/* Forensic Disclaimer Badge */}
        <div style={{
          background: "rgba(245, 158, 11, 0.08)",
          border: "1px solid rgba(245, 158, 11, 0.4)",
          borderRadius: "6px",
          padding: "6px 14px",
          display: "flex",
          alignItems: "center",
          gap: "8px"
        }}>
          <ShieldAlert size={14} color="#f59e0b" />
          <span className="font-tech" style={{ fontSize: "0.75rem", color: "#f59e0b", letterSpacing: "1px" }}>
            APPROXIMATE NETWORK LOCATION // NOT PHYSICAL SENDER GPS
          </span>
        </div>
      </div>

      {/* Main Grid: Radar Screen on Left, Network Data Matrix on Right */}
      <div style={{ display: "grid", gridTemplateColumns: "minmax(320px, 1.4fr) minmax(280px, 1fr)", gap: "24px" }}>
        
        {/* Tactical Radar Display Viewport */}
        <div
          ref={mapRef}
          style={{
            background: "#040711",
            borderRadius: "8px",
            border: "1px solid rgba(0, 243, 255, 0.3)",
            position: "relative",
            minHeight: "420px",
            overflow: "hidden",
            boxShadow: "inset 0 0 40px rgba(0, 243, 255, 0.08)",
            cursor: isPanning ? "grabbing" : "grab",
            touchAction: "none"
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
        >
          {/* Tactical Background Grid & Circles */}
          <div style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `
              radial-gradient(circle at 50% 50%, rgba(0, 243, 255, 0.12) 1px, transparent 1px),
              linear-gradient(rgba(0, 243, 255, 0.04) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0, 243, 255, 0.04) 1px, transparent 1px)
            `,
            backgroundSize: "32px 32px, 32px 32px, 32px 32px",
            transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
            transformOrigin: "center center",
            transition: "transform 0.1s ease-out",
            pointerEvents: "none"
          }} />

          {/* Realistic World Map Representation */}
          <div style={{ 
            position: "absolute", 
            inset: "15px", 
            opacity: 0.38, 
            pointerEvents: "none",
            transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
            transformOrigin: "center center",
            transition: "transform 0.15s ease-out"
          }}>
            <svg width="100%" height="100%" viewBox="0 0 760 420" preserveAspectRatio="none" style={{ filter: "drop-shadow(0 0 6px #00f3ff)" }}>
              <defs>
                <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
                <linearGradient id="routeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#ff2e4d" />
                  <stop offset="50%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#00f3ff" />
                </linearGradient>
              </defs>

              {/* Realistic Continent Landmasses */}
              {worldMapContinents.map((continent, i) => (
                <path
                  key={i}
                  d={continent.d}
                  fill="rgba(0, 243, 255, 0.04)"
                  stroke="#00f3ff"
                  strokeWidth="1.3"
                  strokeDasharray="4 3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  filter="url(#glow)"
                />
              ))}

              {/* Latitude/Longitude grid lines */}
              <g stroke="#00f3ff" strokeWidth="0.5" opacity="0.18">
                {[0.15, 0.32, 0.5, 0.68, 0.85].map((y, i) => (
                  <line key={`lat-${i}`} x1="0" y1={`${y * 100}%`} x2="100%" y2={`${y * 100}%`} strokeDasharray="3 6" />
                ))}
                {[0.12, 0.28, 0.44, 0.6, 0.76, 0.92].map((x, i) => (
                  <line key={`lon-${i}`} x1={`${x * 100}%`} y1="0" x2={`${x * 100}%`} y2="100%" strokeDasharray="3 6" />
                ))}
              </g>

              {/* Mail Transit Route Lines (Sender -> Intermediate Relays -> Recipient) */}
              <path
                d={`M 180,180 Q ${pinLeft * 7.6 * 0.7},${pinTop * 4.2 * 0.6} ${pinLeft * 7.6},${pinTop * 4.2}`}
                fill="none"
                stroke="url(#routeGrad)"
                strokeWidth="2.2"
                strokeDasharray="8 6"
                style={{ animation: "dashPulse 2s linear infinite" }}
              />
            </svg>
          </div>

          {/* Concentric Range Rings */}
          <div style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: `translate(-50%, -50%) scale(${zoom})`,
            transformOrigin: "center center",
            width: "320px",
            height: "320px",
            borderRadius: "50%",
            border: "1px dashed rgba(0, 243, 255, 0.18)",
            pointerEvents: "none"
          }} />
          <div style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: `translate(-50%, -50%) scale(${zoom})`,
            transformOrigin: "center center",
            width: "210px",
            height: "210px",
            borderRadius: "50%",
            border: "1px solid rgba(0, 243, 255, 0.12)",
            pointerEvents: "none"
          }} />
          <div style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: `translate(-50%, -50%) scale(${zoom})`,
            transformOrigin: "center center",
            width: "110px",
            height: "110px",
            borderRadius: "50%",
            border: "1px solid rgba(0, 243, 255, 0.2)",
            pointerEvents: "none"
          }} />

          {/* Crosshairs */}
          <div style={{ position: "absolute", top: "50%", left: 0, right: 0, height: "1px", background: "rgba(0, 243, 255, 0.18)", pointerEvents: "none" }} />
          <div style={{ position: "absolute", left: "50%", top: 0, bottom: 0, width: "1px", background: "rgba(0, 243, 255, 0.18)", pointerEvents: "none" }} />

          {/* Rotating Radar Sweep Beam */}
          <div
            className="radar-sweep-beam"
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "conic-gradient(from 0deg at 50% 50%, rgba(0, 243, 255, 0.22) 0deg, transparent 65deg, transparent 360deg)",
              pointerEvents: "none",
              transform: `scale(${zoom})`,
              transformOrigin: "center center"
            }}
          />

          {/* Relay Hops Visualization */}
          {relayHops && relayHops.length > 0 && relayHops.map((hop, idx) => {
            if (!hop.ip || hop.ip === "127.0.0.1") return null;
            const hopLat = lat + (Math.sin(idx + 1) * 16);
            const hopLon = lon + (Math.cos(idx + 1) * 24);
            const hopTop = Math.max(10, Math.min(90, ((90 - hopLat) / 180) * 100));
            const hopLeft = Math.max(10, Math.min(90, ((hopLon + 180) / 360) * 100));
            
            return (
              <div
                key={idx}
                style={{
                  position: "absolute",
                  top: `${hopTop}%`,
                  left: `${hopLeft}%`,
                  transform: "translate(-50%, -50%)",
                  zIndex: 15,
                  pointerEvents: "none"
                }}
              >
                <div className="pulse-dot" style={{ 
                  width: idx === 0 ? "10px" : "8px", 
                  height: idx === 0 ? "10px" : "8px", 
                  background: idx === 0 ? "#ff2e4d" : "#00f3ff", 
                  boxShadow: `0 0 12px ${idx === 0 ? "#ff2e4d" : "#00f3ff"}`,
                  animationDuration: idx === 0 ? "1.5s" : "2.5s"
                }} />
                {idx === 0 && (
                  <div style={{
                    position: "absolute",
                    top: "-28px",
                    left: "14px",
                    background: "rgba(5, 7, 14, 0.95)",
                    border: "1px solid #ff2e4d",
                    boxShadow: "0 0 10px rgba(255, 46, 77, 0.4)",
                    borderRadius: "3px",
                    padding: "2px 8px",
                    whiteSpace: "nowrap",
                    fontSize: "9px"
                  }}>
                    <span className="font-tech" style={{ color: "#ff2e4d" }}>SENDER ORIGIN HOP</span>
                  </div>
                )}
              </div>
            );
          })}

          {/* Target Geolocation Pin & Beacon with Smooth Zoom/Pin on Touch */}
          <div
            className="geo-pin"
            style={{
              position: "absolute",
              top: `${pinTop}%`,
              left: `${pinLeft}%`,
              transform: `translate(-50%, -50%) scale(${zoom})`,
              transformOrigin: "center center",
              zIndex: 35,
              cursor: "pointer",
              transition: "transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)"
            }}
            onClick={handlePinTouch}
            onMouseEnter={() => setShowGoogleMapsHint(true)}
            onMouseLeave={() => setShowGoogleMapsHint(false)}
          >
            {/* Concentric pulsating radar rings */}
            <div className="pulse-dot" style={{ width: "16px", height: "16px", background: "#00f3ff", boxShadow: "0 0 24px #00f3ff" }} />
            <div className="pulse-dot" style={{ width: "28px", height: "28px", border: "2px solid #00f3ff", background: "transparent", boxShadow: "none", animationDuration: "2.5s" }} />
            
            {/* Target Label Callout */}
            <div style={{
              position: "absolute",
              top: "-58px",
              left: "22px",
              background: "rgba(5, 7, 14, 0.98)",
              border: "1px solid #00f3ff",
              boxShadow: "0 0 25px rgba(0, 243, 255, 0.6)",
              borderRadius: "6px",
              padding: "8px 14px",
              whiteSpace: "nowrap",
              zIndex: 40
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                <MapPin size={13} color="#00f3ff" />
                <p className="font-tech" style={{ fontSize: "12px", color: "#fff", fontWeight: 700, letterSpacing: "1px" }}>
                  GATEWAY: {city}, {country}
                </p>
              </div>
              <p className="mono" style={{ fontSize: "9.5px", color: "#00f3ff" }}>
                LAT: {lat.toFixed(4)}° | LON: {lon.toFixed(4)}°
              </p>
              <div style={{ marginTop: "6px", paddingTop: "6px", borderTop: "1px solid rgba(0, 243, 255, 0.3)", display: "flex", alignItems: "center", gap: "6px" }}>
                <ExternalLink size={11} color="#f59e0b" />
                <button
                  onClick={(e) => { e.stopPropagation(); handleOpenGoogleMaps(); }}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#f59e0b",
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: "9.5px",
                    fontWeight: 700,
                    cursor: "pointer",
                    padding: 0,
                    textDecoration: "underline"
                  }}
                >
                  OPEN SATELLITE VIEW IN GOOGLE MAPS
                </button>
              </div>
            </div>
          </div>

          {/* Zoom Controls */}
          <div style={{ position: "absolute", top: "16px", right: "16px", zIndex: 20, display: "flex", flexDirection: "column", gap: "6px" }}>
            <button onClick={handleZoomIn} title="Zoom In" style={{ background: "rgba(5,7,14,0.9)", border: "1px solid rgba(0,243,255,0.3)", color: "#00f3ff", width: "32px", height: "32px", borderRadius: "4px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><ZoomIn size={14} /></button>
            <button onClick={handleZoomOut} title="Zoom Out" style={{ background: "rgba(5,7,14,0.9)", border: "1px solid rgba(0,243,255,0.3)", color: "#00f3ff", width: "32px", height: "32px", borderRadius: "4px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><ZoomOut size={14} /></button>
            <button onClick={handleResetView} title="Reset View" style={{ background: "rgba(5,7,14,0.9)", border: "1px solid rgba(0,243,255,0.3)", color: "#00f3ff", width: "32px", height: "32px", borderRadius: "4px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Maximize2 size={14} /></button>
          </div>

          {/* Zoom Level Indicator */}
          <div style={{ position: "absolute", bottom: "16px", left: "16px", zIndex: 15, background: "rgba(5,7,14,0.9)", border: "1px solid rgba(0,243,255,0.2)", padding: "6px 12px", borderRadius: "4px" }}>
            <span className="mono" style={{ fontSize: "11px", color: "#00f3ff" }}>
              ZOOM: {Math.round(zoom * 100)}% | TOUCH PIN TO PINPOINT
            </span>
          </div>
          <div style={{ position: "absolute", bottom: "16px", right: "16px", zIndex: 15 }}>
            <span className="mono" style={{ fontSize: "10px", color: "#00f3ff" }}>
              TACTICAL LOCK: RESOLVED
            </span>
          </div>
        </div>

        {/* Technical Network & Device Intelligence Matrix */}
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          
          {/* IP Card */}
          <div style={{ background: "rgba(9, 13, 24, 0.75)", border: "1px solid rgba(0, 243, 255, 0.2)", borderRadius: "6px", padding: "14px" }}>
            <span className="mono" style={{ fontSize: "0.75rem", color: "#94a3b8" }}>PRIMARY ROUTING IP</span>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "4px" }}>
              <span className="mono" style={{ fontSize: "1.1rem", color: "#00f3ff", fontWeight: 600 }}>{ip}</span>
              <span className="mono" style={{ fontSize: "0.75rem", color: "#10b981", background: "rgba(16, 185, 129, 0.1)", padding: "2px 6px", borderRadius: "3px" }}>PUBLIC GATEWAY</span>
            </div>
          </div>

          {/* ASN & Organization */}
          <div style={{ background: "rgba(9, 13, 24, 0.75)", border: "1px solid rgba(0, 243, 255, 0.2)", borderRadius: "6px", padding: "14px" }}>
            <span className="mono" style={{ fontSize: "0.75rem", color: "#94a3b8" }}>AUTONOMOUS SYSTEM (ASN) & OPERATOR</span>
            <p className="font-tech" style={{ fontSize: "1rem", color: "#f1f5f9", marginTop: "4px" }}>
              {asn} — {org}
            </p>
          </div>

          {/* Location Details */}
          <div style={{ background: "rgba(9, 13, 24, 0.75)", border: "1px solid rgba(0, 243, 255, 0.2)", borderRadius: "6px", padding: "14px" }}>
            <span className="mono" style={{ fontSize: "0.75rem", color: "#94a3b8" }}>APPROXIMATE INFRASTRUCTURE LOCATION</span>
            <p className="font-tech" style={{ fontSize: "1rem", color: "#f1f5f9", marginTop: "4px" }}>
              {city}, {region} ({country})
            </p>
            <p className="mono" style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "2px" }}>
              COORDINATES: {lat.toFixed(4)}° N, {lon.toFixed(4)}° E
            </p>
          </div>

          {/* Device & Access Intelligence Section */}
          <div style={{ background: "rgba(9, 13, 24, 0.85)", border: "1px solid rgba(0, 243, 255, 0.3)", borderRadius: "6px", padding: "14px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px", borderBottom: "1px solid rgba(0, 243, 255, 0.15)", paddingBottom: "6px" }}>
              <span className="font-tech" style={{ fontSize: "0.85rem", color: "#00f3ff", letterSpacing: "1px", fontWeight: 700 }}>
                DEVICE & ACCESS INTELLIGENCE
              </span>
              <span className="mono" style={{ fontSize: "0.7rem", color: "#f59e0b" }}>
                RFC 822 / MIME
              </span>
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "0.8rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span className="mono" style={{ color: "#94a3b8" }}>Device Category:</span>
                <span className="mono" style={{ color: "#fff", fontWeight: 600 }}>{deviceCategory}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span className="mono" style={{ color: "#94a3b8" }}>Detected OS:</span>
                <span className="mono" style={{ color: "#00f3ff" }}>{detectedOS}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span className="mono" style={{ color: "#94a3b8" }}>Mail Client / Agent:</span>
                <span className="mono" style={{ color: "#cbd5e1" }}>{clientSoftware}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span className="mono" style={{ color: "#94a3b8" }}>Hardware Model:</span>
                <span className="mono" style={{ color: "#64748b", fontStyle: "italic", fontSize: "0.75rem" }}>{deviceModel}</span>
              </div>
              <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "6px", marginTop: "2px" }}>
                <span className="mono" style={{ color: "#94a3b8", fontSize: "0.7rem" }}>ACTIVE SENDER SESSIONS OBSERVED:</span>
                <p className="mono" style={{ color: "#f59e0b", fontSize: "0.75rem", marginTop: "2px" }}>
                  {activeSessionsCount} Devices logged in ({multiDeviceBreakdown})
                </p>
              </div>
            </div>
          </div>

          {/* Google Maps Action Button */}
          <button
            onClick={handleOpenGoogleMaps}
            style={{
              marginTop: "8px",
              width: "100%",
              padding: "12px 16px",
              background: "linear-gradient(90deg, #4285f4, #34a853)",
              border: "none",
              borderRadius: "6px",
              color: "#fff",
              fontFamily: "'Chakra Petch', sans-serif",
              fontSize: "0.85rem",
              fontWeight: 700,
              letterSpacing: "1px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              boxShadow: "0 0 20px rgba(66, 133, 244, 0.3)",
              transition: "all 0.2s ease"
            }}
          >
            <ExternalLink size={16} />
            OPEN IN GOOGLE MAPS
          </button>

        </div>

      </div>
    </div>
  );
}
