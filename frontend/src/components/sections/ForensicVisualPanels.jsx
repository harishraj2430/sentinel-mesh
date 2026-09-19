import { useState } from "react";
import { Shield, Search, Globe, Cpu, Terminal, Eye, Layers } from "lucide-react";

const PANELS = [
  {
    id: "investigation",
    title: "CYBER INVESTIGATION ROOM",
    subtitle: "LIVE SOC OPERATIONS & INCIDENT TRIAGE",
    tag: "TELEMETRY",
    description: "Multi-layered threat analysis console correlating active phishing vectors, malicious lookalike domains, and rogue MTA nodes.",
    metrics: [
      { label: "MTA HOPS ANALYZED", value: "14,892" },
      { label: "THREAT CONFIDENCE", value: "94.2%" },
      { label: "AVERAGE TRIAGE TIME", value: "1.4s" }
    ],
    overlayData: [
      "EXTRACTING RECEIVED HEADERS...",
      "MATCHING AGAINST MITRE ATT&CK T1566...",
      "AUTONOMOUS CORRELATION ACTIVE"
    ]
  },
  {
    id: "forensics",
    title: "EMAIL FORENSIC ANALYZER",
    subtitle: "RFC 5322 HEADER & MIME DISASSEMBLER",
    tag: "DECONSTRUCTION",
    description: "Deconstructs raw email streams into authenticated cryptographic signatures, DKIM selectors, Return-Path discrepancies, and payload hashes.",
    metrics: [
      { label: "CRYPTO CHECKS", value: "SPF / DKIM / DMARC" },
      { label: "HASH ALGORITHM", value: "SHA-256 / MD5" },
      { label: "DEFANGED URIS", value: "100% COVERAGE" }
    ],
    overlayData: [
      "DKIM SIGNATURE VERIFIED: RSA-SHA256",
      "SPF SENDER ENVELOPE: ALIGNED",
      "ATTACHMENT DBL EXTENSION: SCANNED"
    ]
  },
  {
    id: "network",
    title: "GLOBAL IP INTELLIGENCE",
    subtitle: "AUTONOMOUS SYSTEM & ROUTING HOP TRACER",
    tag: "TRANSIT MAPPING",
    description: "Traces the origin hop back through the public internet routing infrastructure to isolate bulletproof hosting providers and proxy exit nodes.",
    metrics: [
      { label: "ASN RESOLUTION", value: "REAL-TIME" },
      { label: "NETWORK TYPE", value: "CLOUD / RESIDENTIAL" },
      { label: "GEOLOCATION", value: "APPROXIMATE ROUTING NODE" }
    ],
    overlayData: [
      "HOP #1: 185.220.101.45 (AS44050)",
      "TRANSIT: AMSTERDAM (NL) -> FRANKFURT",
      "CLASSIFICATION: BULLETPROOF VPS"
    ]
  },
  {
    id: "threat-graph",
    title: "THREAT VISUALIZATION CORE",
    subtitle: "NODE-LINK EVIDENCE CORRELATION MATRIX",
    tag: "INTELLIGENCE",
    description: "Transforms isolated email indicators into a connected threat graph linking the sender persona, deceptive link destinations, and file hashes.",
    metrics: [
      { label: "GRAPH EDGES", value: "CORRELATED" },
      { label: "ATTACK CLASSIFIER", value: "BEC / PHISHING / MALWARE" },
      { label: "SOC ACTION", value: "DEFENSE RECOMMENDATION" }
    ],
    overlayData: [
      "CORRELATING SENDER -> DESTINATION URI",
      "FLAGGING HOMOGLYPH DOMAIN MISMATCH",
      "RECOMMENDED ACTION: ISOLATE GATEWAY"
    ]
  }
];

export default function ForensicVisualPanels() {
  const [activePanelId, setActivePanelId] = useState("investigation");

  const activePanel = PANELS.find(p => p.id === activePanelId) || PANELS[0];

  return (
    <section style={{ padding: "80px 8%", background: "#05070e", position: "relative" }}>
      {/* Section Header */}
      <div style={{ marginBottom: "40px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
          <Layers size={18} color="#00f3ff" />
          <span className="mono" style={{ fontSize: "0.8rem", color: "#00f3ff", letterSpacing: "2px" }}>
            FORENSIC WORKSTATION VISUAL SYSTEM
          </span>
        </div>
        <h2 style={{ fontSize: "clamp(2rem, 3.5vw, 3rem)", textTransform: "uppercase", letterSpacing: "-0.02em" }}>
          ENGINEERED FOR MULTI-STAGE INVESTIGATION
        </h2>
        <p style={{ color: "#94a3b8", maxWidth: "600px", marginTop: "8px", fontSize: "1rem" }}>
          From raw RFC stream deconstruction to global IP routing and grounded threat correlation.
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", marginBottom: "28px" }}>
        {PANELS.map((p) => {
          const isActive = p.id === activePanelId;
          return (
            <button
              key={p.id}
              onClick={() => setActivePanelId(p.id)}
              style={{
                background: isActive ? "rgba(0, 243, 255, 0.15)" : "rgba(12, 17, 30, 0.6)",
                border: `1px solid ${isActive ? "#00f3ff" : "rgba(255, 255, 255, 0.08)"}`,
                color: isActive ? "#00f3ff" : "#94a3b8",
                padding: "10px 18px",
                borderRadius: "6px",
                fontFamily: "'Chakra Petch', sans-serif",
                fontSize: "0.85rem",
                fontWeight: 600,
                letterSpacing: "1px",
                cursor: "pointer",
                transition: "all 0.2s ease"
              }}
            >
              {p.title}
            </button>
          );
        })}
      </div>

      {/* Active Panel Stage Display */}
      <div
        className="cyber-panel zoom-frame"
        style={{
          borderRadius: "12px",
          border: "1px solid rgba(0, 243, 255, 0.3)",
          minHeight: "440px",
          position: "relative",
          overflow: "hidden",
          display: "grid",
          gridTemplateColumns: "1.2fr 1fr"
        }}
      >
        <div className="scanner-line" />

        {/* Visual Graphics Background representation */}
        <div style={{
          position: "relative",
          background: `
            radial-gradient(circle at 30% 40%, rgba(0, 243, 255, 0.15) 0%, transparent 60%),
            radial-gradient(circle at 70% 80%, rgba(37, 99, 235, 0.2) 0%, transparent 50%),
            #040711
          `,
          borderRight: "1px solid rgba(0, 243, 255, 0.15)",
          padding: "36px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between"
        }}>
          {/* Top Tag */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span className="mono" style={{ fontSize: "0.75rem", color: "#00f3ff", background: "rgba(0, 243, 255, 0.1)", padding: "4px 10px", borderRadius: "4px", border: "1px solid rgba(0, 243, 255, 0.3)" }}>
              [{activePanel.tag}] // ACTIVE SCAN
            </span>
            <span className="pulse-dot" />
          </div>

          {/* Holographic Data Overlay simulation */}
          <div style={{
            background: "rgba(5, 7, 14, 0.8)",
            border: "1px solid rgba(0, 243, 255, 0.25)",
            borderRadius: "8px",
            padding: "20px",
            backdropFilter: "blur(8px)",
            boxShadow: "0 0 30px rgba(0, 243, 255, 0.08)"
          }}>
            <p className="mono" style={{ fontSize: "0.75rem", color: "#00f3ff", marginBottom: "12px", letterSpacing: "1px" }}>
              // REAL-TIME SYSTEM TELEMETRY FEED
            </p>
            {activePanel.overlayData.map((d, i) => (
              <p key={i} className="mono" style={{ fontSize: "0.85rem", color: "#eaeaea", marginTop: "6px" }}>
                <span style={{ color: "#00f3ff", marginRight: "8px" }}>&gt;</span>
                {d}
              </p>
            ))}
          </div>

          <div className="mono" style={{ fontSize: "0.75rem", color: "#64748b" }}>
            SENTINEL MESH PROTOCOL v2.0 // DEEP PACKET INSPECTION
          </div>
        </div>

        {/* Panel Details & Metrics */}
        <div style={{
          padding: "40px 36px",
          background: "rgba(9, 13, 24, 0.9)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between"
        }}>
          <div>
            <span className="mono" style={{ fontSize: "0.8rem", color: "#00f3ff" }}>
              {activePanel.subtitle}
            </span>
            <h3 className="font-tech" style={{ fontSize: "1.8rem", color: "#fff", letterSpacing: "1px", marginTop: "8px", lineHeight: 1.2 }}>
              {activePanel.title}
            </h3>
            <p style={{ color: "#94a3b8", fontSize: "0.95rem", lineHeight: 1.6, marginTop: "16px" }}>
              {activePanel.description}
            </p>
          </div>

          {/* Metric Badges */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "16px", marginTop: "28px" }}>
            {activePanel.metrics.map((m, i) => (
              <div key={i} style={{ background: "rgba(5, 7, 14, 0.7)", border: "1px solid rgba(255, 255, 255, 0.08)", padding: "12px", borderRadius: "6px" }}>
                <span className="mono" style={{ fontSize: "0.7rem", color: "#94a3b8" }}>{m.label}</span>
                <p className="font-tech" style={{ fontSize: "1.1rem", color: "#00f3ff", fontWeight: 700, marginTop: "4px" }}>
                  {m.value}
                </p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
