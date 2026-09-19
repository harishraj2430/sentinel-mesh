import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Shield, Server, Globe, FileCode, AlertTriangle, ArrowRight, CheckCircle2, ZoomIn, ZoomOut, Maximize2, Info, X, GripHorizontal } from "lucide-react";

// Floating, Draggable Inspector Portal for Fix 7
function FloatingInspectorPortal({ node, onClose, isLight }) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [hasUserMoved, setHasUserMoved] = useState(false);
  const panelRef = useRef(null);
  const isDragging = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  // Initial anchor position near node or center screen
  useEffect(() => {
    if (!hasUserMoved) {
      const padding = 20;
      const initialX = Math.min(window.innerWidth - 380 - padding, Math.max(padding, window.innerWidth * 0.58));
      const initialY = Math.min(window.innerHeight - 380 - padding, Math.max(padding, 140));
      setPosition({ x: initialX, y: initialY });
    }
  }, [node?.id, hasUserMoved]);

  // Esc key closes inspector
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Clamp on window resize
  useEffect(() => {
    const handleResize = () => {
      setPosition(prev => {
        const maxX = Math.max(10, window.innerWidth - 380);
        const maxY = Math.max(10, window.innerHeight - 320);
        return {
          x: Math.min(Math.max(10, prev.x), maxX),
          y: Math.min(Math.max(10, prev.y), maxY)
        };
      });
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handlePointerDown = (e) => {
    if (!panelRef.current) return;
    isDragging.current = true;
    dragOffset.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e) => {
    if (!isDragging.current) return;
    setHasUserMoved(true);
    const newX = e.clientX - dragOffset.current.x;
    const newY = e.clientY - dragOffset.current.y;
    const maxX = Math.max(10, window.innerWidth - 380);
    const maxY = Math.max(10, window.innerHeight - 260);

    setPosition({
      x: Math.min(Math.max(10, newX), maxX),
      y: Math.min(Math.max(10, newY), maxY)
    });
  };

  const handlePointerUp = (e) => {
    isDragging.current = false;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch (_) {}
  };

  if (!node) return null;

  const nodeColor = node.status === "threat" ? "var(--threat-red)" : node.status === "warning" || node.status === "anomaly" ? "var(--warning-amber)" : "var(--accent)";

  return createPortal(
    <div
      ref={panelRef}
      role="dialog"
      aria-label={`${node.label} Forensic Telemetry`}
      style={{
        position: "fixed",
        top: `${position.y}px`,
        left: `${position.x}px`,
        width: "min(360px, calc(100vw - 32px))",
        maxHeight: "min(70vh, calc(100dvh - 32px))",
        zIndex: 9999,
        background: isLight ? "rgba(255, 255, 255, 0.95)" : "rgba(10, 16, 30, 0.95)",
        backdropFilter: "blur(18px)",
        borderRadius: "10px",
        outline: `1.5px solid ${nodeColor}`,
        boxShadow: isLight ? "0 10px 35px rgba(0,0,0,0.12)" : `0 10px 40px rgba(0,0,0,0.6), 0 0 20px ${nodeColor}30`,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        userSelect: "none",
        animation: "fadeIn 0.18s ease-out"
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Draggable Grip Header */}
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        style={{
          padding: "10px 14px",
          background: isLight ? "rgba(241, 245, 249, 0.95)" : "rgba(6, 10, 20, 0.95)",
          borderBottom: "1px solid var(--border-subtle)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: "grab",
          touchAction: "none"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <GripHorizontal size={15} color="var(--muted)" />
          <span className="font-tech" style={{ fontSize: "0.85rem", color: nodeColor, fontWeight: 700, letterSpacing: "1px" }}>
            {node.label}
          </span>
        </div>
        <button
          onClick={onClose}
          aria-label="Close panel"
          style={{
            background: "none",
            border: "none",
            color: "var(--muted)",
            cursor: "pointer",
            padding: "2px",
            display: "flex",
            alignItems: "center"
          }}
        >
          <X size={16} />
        </button>
      </div>

      {/* Inner Scrollable Content */}
      <div style={{ padding: "14px 18px", overflowY: "auto", flex: 1, userSelect: "text" }}>
        <p className="mono" style={{ fontSize: "0.78rem", color: "var(--text)", lineHeight: 1.5, marginBottom: "12px" }}>
          {node.details}
        </p>

        {node.extendedInfo && (
          <div style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: "10px" }}>
            <span className="mono" style={{ fontSize: "0.7rem", color: "var(--muted)", letterSpacing: "1px", display: "block", marginBottom: "6px" }}>
              EXTENDED FORENSIC TELEMETRY:
            </span>
            {Object.entries(node.extendedInfo).map(([key, value]) => (
              <div key={key} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid var(--border-subtle)", fontSize: "0.74rem" }}>
                <span className="mono" style={{ color: "var(--muted)" }}>{key}:</span>
                <span className="mono" style={{ color: "var(--text)", textAlign: "right", maxWidth: "60%", wordBreak: "break-word", fontWeight: 600 }}>
                  {value || "None"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

export default function EvidenceGraph({ report }) {
  const [hoveredNode, setHoveredNode] = useState(null);
  const [clickedNode, setClickedNode] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [isLight, setIsLight] = useState(false);
  const graphRef = useRef(null);

  useEffect(() => {
    const checkTheme = () => {
      setIsLight(document.documentElement.getAttribute("data-theme") === "light");
    };
    checkTheme();
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);

  if (!report) return null;

  const isThreat = report.threat_detected;
  const fromDomain = report.identity?.from_domain || "sender-domain.com";
  const originIp = report.geo?.ip || "209.85.216.67";
  const asn = report.geo?.asn || "AS15169";
  const urlCount = report.urls?.url_count || 0;
  const hasAttachment = report.attachments?.has_attachments;
  const threatType = report.threat_type || "SUSPICIOUS";

  // Virtual Canvas Width & Height for exact 1:1 unified coordinate mapping (Fix 8)
  const CANVAS_WIDTH = 1000;
  const CANVAS_HEIGHT = 420;
  const NODE_WIDTH = 180;
  const NODE_HEIGHT = 74;

  const nodes = [
    {
      id: "sender",
      label: "SENDER IDENTITY",
      sub: fromDomain,
      type: "identity",
      status: report.identity?.status === "PASS" ? "clean" : "anomaly",
      icon: Shield,
      cx: 140,
      cy: 210,
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
      cx: 380,
      cy: 110,
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
      cx: 380,
      cy: 310,
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
      cx: 640,
      cy: 210,
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
      cx: 870,
      cy: 210,
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

  // Helper to calculate exact boundary intersection points between 2 rectangular nodes (Fix 8)
  const getNodeAnchor = (sourceNode, targetNode) => {
    const dx = targetNode.cx - sourceNode.cx;
    const dy = targetNode.cy - sourceNode.cy;
    const halfW = NODE_WIDTH / 2;
    const halfH = NODE_HEIGHT / 2;

    // Calculate source edge point
    let startX = sourceNode.cx;
    let startY = sourceNode.cy;
    if (Math.abs(dx) * halfH > Math.abs(dy) * halfW) {
      startX += dx > 0 ? halfW : -halfW;
      startY += (dy * halfW) / Math.abs(dx);
    } else {
      startY += dy > 0 ? halfH : -halfH;
      startX += (dx * halfH) / Math.abs(dy);
    }

    // Calculate target edge point (trimmed exactly to target boundary)
    let endX = targetNode.cx;
    let endY = targetNode.cy;
    if (Math.abs(-dx) * halfH > Math.abs(-dy) * halfW) {
      endX += -dx > 0 ? halfW : -halfW;
      endY += (-dy * halfW) / Math.abs(-dx);
    } else {
      endY += -dy > 0 ? halfH : -halfH;
      endX += (-dx * halfH) / Math.abs(-dy);
    }

    return { startX, startY, endX, endY };
  };

  const edges = [
    { from: "sender", to: "ip", color: "var(--accent)" },
    { from: "sender", to: "auth", color: "var(--accent)" },
    { from: "ip", to: "payload", color: isThreat ? "var(--threat-red)" : "var(--accent)" },
    { from: "auth", to: "payload", color: isThreat ? "var(--threat-red)" : "var(--accent)" },
    { from: "payload", to: "verdict", color: isThreat ? "var(--threat-red)" : "var(--success-green)" }
  ];

  const handleZoomIn = () => setZoom(prev => Math.min(prev * 1.2, 4));
  const handleZoomOut = () => setZoom(prev => Math.max(prev / 1.2, 0.25));
  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleMouseDown = (e) => {
    if (e.target.closest('.node-click-target, button')) return;
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
    setZoom(prev => Math.max(0.25, Math.min(4, prev * factor)));
  };

  const getNodeColor = (status) => {
    switch (status) {
      case "threat": return isLight ? "#dc2626" : "#ff2e4d";
      case "warning":
      case "anomaly": return isLight ? "#d97706" : "#f59e0b";
      case "clean": return isLight ? "#059669" : "#10b981";
      default: return isLight ? "#0284c7" : "#00f3ff";
    }
  };

  return (
    <div className="cyber-panel" style={{ borderRadius: "10px", padding: "24px", border: "1px solid var(--border)", marginTop: "24px" }}>
      {/* Title & Zoom Controls */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "14px", marginBottom: "18px", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h3 className="font-tech" style={{ fontSize: "1.15rem", letterSpacing: "2px", color: "var(--text)" }}>
            THREAT CORRELATION EVIDENCE GRAPH
          </h3>
          <p className="mono" style={{ fontSize: "0.78rem", color: "var(--muted)", marginTop: "2px" }}>
            MULTIDIMENSIONAL FORENSIC RELATIONSHIP MAPPING
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span className="mono" style={{ fontSize: "0.72rem", color: "var(--accent)", background: "rgba(0, 243, 255, 0.08)", padding: "4px 8px", borderRadius: "4px", border: "1px solid var(--border)" }}>
            ZOOM: {Math.round(zoom * 100)}%
          </span>
          <button onClick={handleZoomIn} title="Zoom In" style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text)", padding: "5px 8px", borderRadius: "4px", cursor: "pointer" }}>
            <ZoomIn size={14} />
          </button>
          <button onClick={handleZoomOut} title="Zoom Out" style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text)", padding: "5px 8px", borderRadius: "4px", cursor: "pointer" }}>
            <ZoomOut size={14} />
          </button>
          <button onClick={handleResetView} title="Reset View" style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text)", padding: "5px 8px", borderRadius: "4px", cursor: "pointer" }}>
            <Maximize2 size={14} />
          </button>
        </div>
      </div>

      {/* Unified Coordinate System Canvas (Fix 8: Nodes + Edges in single transform) */}
      <div
        ref={graphRef}
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
        {/* Unified SVG Canvas Container */}
        <svg
          viewBox={`0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}`}
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
          <defs>
            {/* Arrowhead markers with markerUnits=userSpaceOnUse (Fix 8: arrowheads stay readable at all zooms) */}
            <marker id="arrowhead-accent" markerWidth="12" markerHeight="12" refX="10" refY="6" orient="auto" markerUnits="userSpaceOnUse">
              <polygon points="0 2, 11 6, 0 10" fill={isLight ? "#0284c7" : "#00f3ff"} />
            </marker>
            <marker id="arrowhead-threat" markerWidth="12" markerHeight="12" refX="10" refY="6" orient="auto" markerUnits="userSpaceOnUse">
              <polygon points="0 2, 11 6, 0 10" fill={isLight ? "#dc2626" : "#ff2e4d"} />
            </marker>
            <marker id="arrowhead-success" markerWidth="12" markerHeight="12" refX="10" refY="6" orient="auto" markerUnits="userSpaceOnUse">
              <polygon points="0 2, 11 6, 0 10" fill={isLight ? "#059669" : "#10b981"} />
            </marker>
          </defs>

          {/* Background Grid inside unified coordinate system */}
          <pattern id="graph-grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke={isLight ? "rgba(0,0,0,0.04)" : "rgba(0, 243, 255, 0.04)"} strokeWidth="1" />
          </pattern>
          <rect width={CANVAS_WIDTH} height={CANVAS_HEIGHT} fill="url(#graph-grid)" />

          {/* EDGES: Vector non-scaling-stroke connecting computed node anchors */}
          {edges.map((e, idx) => {
            const src = nodes.find(n => n.id === e.from);
            const tgt = nodes.find(n => n.id === e.to);
            if (!src || !tgt) return null;
            const { startX, startY, endX, endY } = getNodeAnchor(src, tgt);

            const markerId = e.color === "var(--threat-red)"
              ? "url(#arrowhead-threat)"
              : e.color === "var(--success-green)"
              ? "url(#arrowhead-success)"
              : "url(#arrowhead-accent)";

            return (
              <line
                key={idx}
                x1={startX}
                y1={startY}
                x2={endX}
                y2={endY}
                stroke={e.color === "var(--threat-red)" ? (isLight ? "#dc2626" : "#ff2e4d") : e.color === "var(--success-green)" ? (isLight ? "#059669" : "#10b981") : (isLight ? "#0284c7" : "#00f3ff")}
                strokeWidth="2"
                vectorEffect="non-scaling-stroke"
                markerEnd={markerId}
                strokeDasharray={e.to === "verdict" ? "none" : "6 4"}
                opacity="0.85"
              />
            );
          })}

          {/* NODES: Placed in the exact same SVG coordinate system via foreignObject */}
          {nodes.map((n) => {
            const IconComp = n.icon;
            const nodeColor = getNodeColor(n.status);
            const isClicked = clickedNode?.id === n.id;
            const isHovered = hoveredNode?.id === n.id;

            return (
              <foreignObject
                key={n.id}
                x={n.cx - NODE_WIDTH / 2}
                y={n.cy - NODE_HEIGHT / 2}
                width={NODE_WIDTH}
                height={NODE_HEIGHT}
                style={{ overflow: "visible" }}
              >
                <div
                  className="node-click-target"
                  onMouseEnter={() => setHoveredNode(n)}
                  onMouseLeave={() => setHoveredNode(null)}
                  onClick={(e) => {
                    e.stopPropagation();
                    setClickedNode(isClicked ? null : n);
                  }}
                  style={{
                    width: `${NODE_WIDTH}px`,
                    height: `${NODE_HEIGHT}px`,
                    background: isLight 
                      ? (isClicked ? "#ffffff" : isHovered ? "#ffffff" : "rgba(255, 255, 255, 0.95)")
                      : (isClicked ? "rgba(10, 20, 38, 0.98)" : isHovered ? "rgba(12, 22, 42, 0.96)" : "rgba(5, 7, 14, 0.92)"),
                    outline: `2px solid ${isClicked ? (isLight ? "#0284c7" : "#00f3ff") : nodeColor}`,
                    borderRadius: "8px",
                    boxShadow: isLight
                      ? `0 4px 14px rgba(0,0,0,0.08)`
                      : `0 0 ${isClicked ? 24 : isHovered ? 18 : 10}px ${nodeColor}50`,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "8px 12px",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    boxSizing: "border-box"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", color: nodeColor, marginBottom: "3px" }}>
                    <IconComp size={15} />
                    <span className="font-tech" style={{ fontSize: "0.8rem", letterSpacing: "1px", fontWeight: 700 }}>
                      {n.label}
                    </span>
                  </div>
                  <p className="mono" style={{ fontSize: "0.72rem", color: isLight ? "#334155" : "#f1f5f9", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", width: "100%", textAlign: "center", fontWeight: 500 }}>
                    {n.sub}
                  </p>
                  <span className="mono" style={{ fontSize: "8.5px", color: nodeColor, marginTop: "2px" }}>
                    [CLICK TO INSPECT]
                  </span>
                </div>
              </foreignObject>
            );
          })}
        </svg>
      </div>

      {/* Floating Draggable Portal Inspector (Fix 7) */}
      {(clickedNode || hoveredNode) && (
        <FloatingInspectorPortal
          node={clickedNode || hoveredNode}
          onClose={() => { setClickedNode(null); setHoveredNode(null); }}
          isLight={isLight}
        />
      )}
    </div>
  );
}