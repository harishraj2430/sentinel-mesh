import { useState, useRef, useEffect } from "react";
import { Shield, Server, Globe, FileCode, AlertTriangle, ArrowRight, CheckCircle2, ZoomIn, ZoomOut, Maximize2, Info, X } from "lucide-react";

export default function EvidenceGraph({ report }) {
  const [hoveredNode, setHoveredNode] = useState(null);
  const [clickedNode, setClickedNode] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const graphRef = useRef(null);

  if (!report) return null;

  const isThreat = report.threat_detected;
  const fromDomain = report.identity?.from_domain || "sender-domain.com";
  const originIp = report.geo?.ip || "209.85.216.67";
  const asn = report.geo?.asn || "AS15169";
  const urlCount = report.urls?.url_count || 0;
  const hasAttachment = report.attachments?.has_attachments;
  const threatType = report.threat_type || "SUSPICIOUS";

  const nodes = [
    {
      id: "sender",
      label: "SENDER IDENTITY",
      sub: fromDomain,
      type: "identity",
      status: report.identity?.status === "PASS" ? "clean" : "anomaly",
      icon: Shield,
      x: 10,
      y: 50,
      details: `From: ${report.case_summary?.from} | Alignment: ${report.auth?.dmarc_aligned ? 'ALIGNED' : 'MISMATCH'} | Reply-To: ${report.case_summary?.reply_to || 'None'} | Return-Path: ${report.case_summary?.return_path || 'None'}`,
      extendedInfo: {
        "From Address": report.case_summary?.from,
        "From Domain": fromDomain,
        "Reply-To Domain": report.identity?.reply_domain,
        "Return-Path Domain": report.identity?.return_domain,
        "Display Name": report.identity?.display_name,
        "DMARC Aligned": report.auth?.dmarc_aligned ? "YES" : "NO",
        "Identity Status": report.identity?.verdict
      }
    },
    {
      id: "ip",
      label: "ORIGIN HOP IP",
      sub: originIp,
      type: "network",
      status: report.geo?.network_type?.is_datacenter ? "warning" : "clean",
      icon: Server,
      x: 32,
      y: 28,
      details: `IP: ${originIp} | ASN: ${asn} (${report.geo?.org || 'ISP'}) | Network: ${report.geo?.network_type?.category}`,
      extendedInfo: {
        "Origin IP": originIp,
        "ASN": asn,
        "Organization": report.geo?.org,
        "Hostname": report.geo?.hostname,
        "Network Type": report.geo?.network_type?.category,
        "Risk Label": report.geo?.network_type?.risk_label,
        "Is Datacenter": report.geo?.network_type?.is_datacenter ? "YES" : "NO",
        "Country": report.geo?.country,
        "City": report.geo?.city,
        "Region": report.geo?.region,
        "Coordinates": `${report.geo?.lat?.toFixed(4)}, ${report.geo?.lon?.toFixed(4)}`
      }
    },
    {
      id: "auth",
      label: "AUTHENTICATION",
      sub: `SPF: ${report.auth?.spf?.status} | DKIM: ${report.auth?.dkim?.status}`,
      type: "crypto",
      status: report.auth?.dmarc_aligned ? "clean" : "threat",
      icon: Shield,
      x: 32,
      y: 72,
      details: `DMARC: ${report.auth?.dmarc?.policy || 'none'} | SPF: ${report.auth?.spf?.status} | DKIM: ${report.auth?.dkim?.status}`,
      extendedInfo: {
        "SPF Status": report.auth?.spf?.status,
        "SPF Record": report.auth?.spf?.record,
        "SPF Policy": report.auth?.spf?.policy,
        "DKIM Status": report.auth?.dkim?.status,
        "DKIM Domain": report.auth?.dkim?.signing_domain,
        "DKIM Selector": report.auth?.dkim?.selector,
        "DKIM Algorithm": report.auth?.dkim?.algorithm,
        "DMARC Status": report.auth?.dmarc?.status,
        "DMARC Policy": report.auth?.dmarc?.policy,
        "DMARC Record": report.auth?.dmarc?.record,
        "DMARC Aligned": report.auth?.dmarc_aligned ? "YES" : "NO"
      }
    },
    {
      id: "payload",
      label: "PAYLOAD & HYPERLINKS",
      sub: `${urlCount} URLs | ${hasAttachment ? 'Weaponized File' : 'No Attachments'}`,
      type: "content",
      status: report.urls?.suspicious_count > 0 || hasAttachment ? "threat" : "clean",
      icon: Globe,
      x: 64,
      y: 50,
      details: `URL Risk: ${report.urls?.overall_verdict} | Attachments: ${report.attachments?.overall_verdict}`,
      extendedInfo: {
        "URL Count": urlCount,
        "Suspicious URLs": report.urls?.suspicious_count,
        "Max URL Risk": report.urls?.max_risk_score,
        "URL Verdict": report.urls?.overall_verdict,
        "Attachments": report.attachments?.attachment_count,
        "Attachment Verdict": report.attachments?.overall_verdict,
        "Max Attachment Risk": report.attachments?.max_risk_score
      }
    },
    {
      id: "verdict",
      label: "CORRELATED VERDICT",
      sub: threatType,
      type: "verdict",
      status: isThreat ? "threat" : "clean",
      icon: isThreat ? AlertTriangle : CheckCircle2,
      x: 90,
      y: 50,
      details: `Verdict: ${report.overall_verdict} (Confidence: ${report.confidence}%) | Score: ${report.overall_score}/100`,
      extendedInfo: {
        "Threat Type": threatType,
        "Severity": report.severity,
        "Confidence": `${report.confidence}%`,
        "Risk Score": `${report.overall_score}/100`,
        "Overall Verdict": report.overall_verdict,
        "Recommended Action": report.recommended_action,
        "MITRE ATT&CK": report.mitre_attack?.join(", ")
      }
    }
  ];

  const handleZoomIn = () => setZoom(prev => Math.min(prev * 1.25, 4));
  const handleZoomOut = () => setZoom(prev => Math.max(prev / 1.25, 0.4));
  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleMouseDown = (e) => {
    if (e.target.closest('.evidence-node, button, .node-detail-panel')) return;
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
        return Math.max(0.4, Math.min(4, prev * factor));
      });
    }
  };

  const getNodeColor = (status) => {
    switch (status) {
      case "threat": return "#ff2e4d";
      case "warning": 
      case "anomaly": return "#f59e0b";
      default: return "#00f3ff";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "threat": return <AlertTriangle size={12} />;
      case "warning": 
      case "anomaly": return <Info size={12} />;
      default: return <CheckCircle2 size={12} />;
    }
  };

  return (
    <div className="cyber-panel" style={{ borderRadius: "10px", padding: "28px", border: "1px solid rgba(0, 243, 255, 0.25)", marginTop: "24px" }}>
      {/* Title */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(0, 243, 255, 0.12)", paddingBottom: "16px", marginBottom: "20px" }}>
        <div>
          <h3 className="font-tech" style={{ fontSize: "1.2rem", letterSpacing: "2px", color: "#f1f5f9" }}>
            THREAT CORRELATION EVIDENCE GRAPH
          </h3>
          <p className="mono" style={{ fontSize: "0.8rem", color: "#94a3b8", marginTop: "2px" }}>
            MULTIDIMENSIONAL FORENSIC RELATIONSHIP MAPPING
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span className="mono" style={{ fontSize: "0.75rem", color: "#00f3ff", background: "rgba(0, 243, 255, 0.1)", padding: "4px 10px", borderRadius: "4px", border: "1px solid rgba(0, 243, 255, 0.3)" }}>
            INTERACTIVE IOC TOPOLOGY
          </span>
          <span className="mono" style={{ fontSize: "0.7rem", color: "#64748b" }}>
            ZOOM: {Math.round(zoom * 100)}%
          </span>
        </div>
      </div>

      {/* SVG Canvas with Interactive Nodes */}
      <div
        ref={graphRef}
        style={{
          background: "#040711",
          borderRadius: "8px",
          border: "1px solid rgba(0, 243, 255, 0.2)",
          position: "relative",
          minHeight: "380px",
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
        {/* Background Cyber Grid */}
        <div style={{
          position: "absolute",
          inset: 0,
          backgroundImage: "linear-gradient(rgba(0, 243, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 243, 255, 0.03) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
          transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
          transformOrigin: "center center",
          transition: "transform 0.1s ease-out",
          pointerEvents: "none"
        }} />

        {/* Dynamic Vector Lines */}
        <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`, transformOrigin: "center center", transition: "transform 0.1s ease-out" }}>
          <defs>
            <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto" markerUnits="strokeWidth">
              <polygon points="0 0, 10 3.5, 0 7" fill="#00f3ff" />
            </marker>
            <marker id="arrowhead-threat" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto" markerUnits="strokeWidth">
              <polygon points="0 0, 10 3.5, 0 7" fill="#ff2e4d" />
            </marker>
            <marker id="arrowhead-success" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto" markerUnits="strokeWidth">
              <polygon points="0 0, 10 3.5, 0 7" fill="#10b981" />
            </marker>
          </defs>
          {/* Sender -> IP */}
          <line x1="18%" y1="50%" x2="32%" y2="28%" stroke="#00f3ff" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.6" markerEnd="url(#arrowhead)" />
          {/* Sender -> Auth */}
          <line x1="18%" y1="50%" x2="32%" y2="72%" stroke="#00f3ff" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.6" markerEnd="url(#arrowhead)" />
          {/* IP -> Payload */}
          <line x1="32%" y1="28%" x2="64%" y2="50%" stroke={isThreat ? "#ff2e4d" : "#00f3ff"} strokeWidth="1.5" strokeDasharray="4 4" opacity="0.6" markerEnd={isThreat ? "url(#arrowhead-threat)" : "url(#arrowhead)"} />
          {/* Auth -> Payload */}
          <line x1="32%" y1="72%" x2="64%" y2="50%" stroke={isThreat ? "#ff2e4d" : "#00f3ff"} strokeWidth="1.5" strokeDasharray="4 4" opacity="0.6" markerEnd={isThreat ? "url(#arrowhead-threat)" : "url(#arrowhead)"} />
          {/* Payload -> Verdict */}
          <line x1="64%" y1="50%" x2="86%" y2="50%" stroke={isThreat ? "#ff2e4d" : "#10b981"} strokeWidth="2" opacity="0.8" markerEnd={isThreat ? "url(#arrowhead-threat)" : "url(#arrowhead-success)"} />
        </svg>

        {/* Nodes Layer */}
        {nodes.map((n) => {
          const IconComp = n.icon;
          const nodeColor = getNodeColor(n.status);
          const isClicked = clickedNode?.id === n.id;
          const isHovered = hoveredNode?.id === n.id;
          const nodeScale = zoom * (isClicked ? 1.2 : isHovered ? 1.14 : 1);

          return (
            <div
              key={n.id}
              className="evidence-node"
              onMouseEnter={() => setHoveredNode(n)}
              onMouseLeave={() => setHoveredNode(null)}
              onClick={(e) => { e.stopPropagation(); setClickedNode(isClicked ? null : n); }}
              style={{
                position: "absolute",
                top: `${n.y}%`,
                left: `${n.x}%`,
                transform: `translate(-50%, -50%) scale(${nodeScale})`,
                transformOrigin: "center center",
                transition: "transform 0.24s cubic-bezier(0.16, 1, 0.3, 1)",
                zIndex: isClicked ? 70 : isHovered ? 40 : 10,
                cursor: "pointer"
              }}
            >
              <div style={{
                background: isClicked 
                  ? "rgba(10, 20, 38, 0.98)" 
                  : isHovered 
                  ? "rgba(12, 22, 42, 0.96)" 
                  : "rgba(5, 7, 14, 0.92)",
                border: `2px solid ${isClicked ? "#00f3ff" : nodeColor}`,
                boxShadow: `0 0 ${isClicked ? 30 : isHovered ? 24 : 12}px ${nodeColor}${isClicked ? "95" : isHovered ? "80" : "40"}`,
                borderRadius: "10px",
                padding: "14px 18px",
                minWidth: "195px",
                maxWidth: "235px",
                textAlign: "center",
                transition: "all 0.22s ease",
                backdropFilter: "blur(12px)"
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", color: nodeColor, marginBottom: "6px" }}>
                  <IconComp size={18} />
                  <span className="font-tech" style={{ fontSize: "0.85rem", letterSpacing: "1.2px", fontWeight: 700 }}>
                    {n.label}
                  </span>
                  <span style={{ fontSize: "11px" }}>{getStatusIcon(n.status)}</span>
                </div>
                <p className="mono" style={{ fontSize: "0.78rem", color: "#f1f5f9", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontWeight: 500 }}>
                  {n.sub}
                </p>
                {isHovered && (
                  <div style={{ marginTop: "6px", paddingTop: "6px", borderTop: `1px solid ${nodeColor}30`, fontSize: "9.5px", color: nodeColor }} className="mono">
                    [CLICK TO PIN DETAILS]
                  </div>
                )}
              </div>
              
              {/* Interactive Zoom-In Evidence Information Panel */}
              {(isHovered || isClicked) && (
                <div style={{
                  position: "absolute",
                  top: n.y > 60 ? "auto" : "-10px",
                  bottom: n.y > 60 ? "100%" : "auto",
                  left: n.x > 65 ? "auto" : "100%",
                  right: n.x > 65 ? "100%" : "auto",
                  marginLeft: n.x > 65 ? 0 : "14px",
                  marginRight: n.x > 65 ? "14px" : 0,
                  marginBottom: n.y > 60 ? "10px" : 0,
                  background: "rgba(5, 7, 16, 0.98)",
                  border: `1.5px solid ${nodeColor}`,
                  boxShadow: `0 0 30px ${nodeColor}50`,
                  borderRadius: "8px",
                  padding: "14px 18px",
                  zIndex: 80,
                  minWidth: "300px",
                  maxWidth: "380px",
                  whiteSpace: "normal",
                  pointerEvents: isClicked ? "auto" : "none",
                  animation: "fadeIn 0.2s ease-out"
                }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px", paddingBottom: "8px", borderBottom: `1px solid ${nodeColor}40` }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span className="pulse-dot" style={{ background: nodeColor, boxShadow: `0 0 8px ${nodeColor}` }} />
                      <span className="font-tech" style={{ fontSize: "0.85rem", color: nodeColor, fontWeight: 700, letterSpacing: "1px" }}>
                        {n.label} FORENSIC TELEMETRY
                      </span>
                    </div>
                    {isClicked && (
                      <button onClick={(e) => { e.stopPropagation(); setClickedNode(null); }} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", padding: "2px" }}><X size={14} /></button>
                    )}
                  </div>
                  <p className="mono" style={{ fontSize: "0.78rem", color: "#f8fafc", lineHeight: 1.5, marginBottom: "10px" }}>{n.details}</p>
                  
                  {n.extendedInfo && (
                    <div style={{ maxHeight: "240px", overflowY: "auto", borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "8px" }}>
                      {Object.entries(n.extendedInfo).map(([key, value]) => (
                        <div key={key} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px solid rgba(255,255,255,0.04)", fontSize: "0.74rem" }}>
                          <span className="mono" style={{ color: "#94a3b8" }}>{key}:</span>
                          <span className="mono" style={{ color: "#fff", textAlign: "right", maxWidth: "62%", wordBreak: "break-word", fontWeight: 600 }}>{value || "None"}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Active Node Detail Hover Tooltip (fallback for non-clicked) */}
        {hoveredNode && !clickedNode && (
          <div style={{
            position: "absolute",
            bottom: "16px",
            left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(5, 7, 14, 0.95)",
            border: "1px solid #00f3ff",
            boxShadow: "0 0 20px rgba(0, 243, 255, 0.3)",
            borderRadius: "6px",
            padding: "8px 18px",
            zIndex: 30,
            whiteSpace: "nowrap",
            maxWidth: "90%",
            overflow: "hidden",
            textOverflow: "ellipsis"
          }}>
            <p className="mono" style={{ fontSize: "0.85rem", color: "#00f3ff" }}>
              &gt; {hoveredNode.details}
            </p>
          </div>
        )}

        {/* Zoom Controls */}
        <div style={{ position: "absolute", top: "16px", right: "16px", zIndex: 20, display: "flex", flexDirection: "column", gap: "6px" }}>
          <button onClick={handleZoomIn} title="Zoom In" style={{ background: "rgba(5,7,14,0.9)", border: "1px solid rgba(0,243,255,0.3)", color: "#00f3ff", width: "32px", height: "32px", borderRadius: "4px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><ZoomIn size={14} /></button>
          <button onClick={handleZoomOut} title="Zoom Out" style={{ background: "rgba(5,7,14,0.9)", border: "1px solid rgba(0,243,255,0.3)", color: "#00f3ff", width: "32px", height: "32px", borderRadius: "4px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><ZoomOut size={14} /></button>
          <button onClick={handleResetView} title="Reset View" style={{ background: "rgba(5,7,14,0.9)", border: "1px solid rgba(0,243,255,0.3)", color: "#00f3ff", width: "32px", height: "32px", borderRadius: "4px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Maximize2 size={14} /></button>
        </div>

        {/* Legend */}
        <div style={{ position: "absolute", bottom: "16px", left: "16px", zIndex: 15, background: "rgba(5,7,14,0.9)", border: "1px solid rgba(0,243,255,0.2)", padding: "10px 14px", borderRadius: "6px", display: "flex", flexDirection: "column", gap: "6px" }}>
          <span className="font-tech" style={{ fontSize: "0.7rem", color: "#00f3ff", letterSpacing: "1px" }}>NODE STATUS LEGEND</span>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}><div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#00f3ff", boxShadow: "0 0 8px #00f3ff" }} /><span className="mono" style={{ fontSize: "0.7rem", color: "#94a3b8" }}>CLEAN</span></div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}><div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#f59e0b", boxShadow: "0 0 8px #f59e0b" }} /><span className="mono" style={{ fontSize: "0.7rem", color: "#94a3b8" }}>WARNING</span></div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}><div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#ff2e4d", boxShadow: "0 0 8px #ff2e4d" }} /><span className="mono" style={{ fontSize: "0.7rem", color: "#94a3b8" }}>THREAT</span></div>
          </div>
        </div>

        {/* Click Instruction */}
        {!clickedNode && (
          <div style={{ position: "absolute", bottom: "16px", right: "16px", zIndex: 15, background: "rgba(5,7,14,0.9)", border: "1px solid rgba(0,243,255,0.2)", padding: "8px 12px", borderRadius: "6px", display: "flex", alignItems: "center", gap: "6px" }}>
            <Info size={12} color="#00f3ff" />
            <span className="mono" style={{ fontSize: "0.75rem", color: "#00f3ff" }}>Click node for details</span>
          </div>
        )}

      </div>
    </div>
  );
}