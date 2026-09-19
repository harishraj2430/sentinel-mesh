import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Shield, Mail, UploadCloud, Lock, Globe, Cpu, Terminal } from "lucide-react";

export default function Hero({ onOpenGmail, onScrollToUpload }) {
  const [headlineIndex, setHeadlineIndex] = useState(0);

  const headlines = [
    { line1: "EMAIL IS THE EVIDENCE.", line2: "FIND WHAT HIDES INSIDE." },
    { line1: "REVEAL THE THREAT.", line2: "BEFORE IT BECOMES THE BREACH." }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setHeadlineIndex((prev) => (prev + 1) % headlines.length);
    }, 6500);
    return () => clearInterval(timer);
  }, []);

  const currentHeadline = headlines[headlineIndex];

  return (
    <section style={{
      minHeight: "100dvh",
      position: "relative",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      paddingTop: "clamp(72px, 8vh, 96px)",
      paddingBottom: "24px",
      overflow: "hidden"
    }}>
      {/* Background Cyber Visual with Scanner */}
      <div className="zoom-frame" style={{ position: "absolute", inset: 0, zIndex: 0 }}>
        <div style={{
          position: "absolute",
          inset: 0,
          background: `
            radial-gradient(circle at 50% 25%, rgba(0, 243, 255, 0.12) 0%, transparent 60%),
            radial-gradient(circle at 85% 70%, rgba(37, 99, 235, 0.15) 0%, transparent 50%),
            linear-gradient(180deg, rgba(5, 7, 14, 0.6) 0%, rgba(5, 7, 14, 0.95) 85%, #05070e 100%)
          `
        }} />
        <div className="scanner-line" />
      </div>

      {/* Hero Content Container */}
      <div style={{ position: "relative", zIndex: 2, padding: "0 6%", maxWidth: "1240px", width: "100%", margin: "0 auto" }}>
        
        {/* System Telemetry Tag */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            background: "rgba(0, 243, 255, 0.08)",
            border: "1px solid rgba(0, 243, 255, 0.28)",
            padding: "4px 12px",
            borderRadius: "16px",
            marginBottom: "16px"
          }}
        >
          <span className="pulse-dot" />
          <span className="font-tech" style={{ color: "var(--cyan)", letterSpacing: "1.8px", fontSize: "0.75rem", fontWeight: 700 }}>
            LIVE FORENSIC ENGINE // SENTINEL CORE v2.0 ONLINE
          </span>
        </motion.div>

        {/* Scaled H1 Typography: clamp(30px, 3.6vw + 8px, 60px), max 2 lines */}
        <div style={{ minHeight: "clamp(68px, 9vw, 130px)", display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <motion.div
            key={currentHeadline.line1}
            initial={{ opacity: 0, y: 15, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -15, filter: "blur(6px)" }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <h1 className="gradient-text-silver font-display" style={{
              fontSize: "clamp(30px, 3.6vw + 8px, 60px)",
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
              textTransform: "uppercase",
              textShadow: "0 6px 20px rgba(0,0,0,0.5)",
              margin: 0
            }}>
              {currentHeadline.line1}
            </h1>
          </motion.div>

          <motion.div
            key={currentHeadline.line2}
            initial={{ opacity: 0, y: 15, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -15, filter: "blur(6px)" }}
            transition={{ duration: 0.6, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          >
            <h1 className="gradient-text-cyan glow-cyan font-display" style={{
              fontSize: "clamp(30px, 3.6vw + 8px, 60px)",
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
              textTransform: "uppercase",
              margin: 0
            }}>
              {currentHeadline.line2}
            </h1>
          </motion.div>
        </div>

        {/* Subtitle description: body font, clamp(15px, 0.35vw + 14px, 18px), max-width 60ch */}
        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          style={{
            fontSize: "clamp(15px, 0.35vw + 14px, 18px)",
            fontFamily: "var(--font-body)",
            color: "var(--text-secondary)",
            marginTop: "16px",
            maxWidth: "60ch",
            lineHeight: 1.6
          }}
        >
          High-fidelity email threat investigation platform designed for SOC analysts and incident response teams.
          Traces cryptographic envelope routing, defangs malicious hyperlinks, isolates weaponized attachments, and delivers grounded forensic attribution.
        </motion.p>

        {/* CTA Buttons: 48-52px height */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          style={{ display: "flex", flexWrap: "wrap", gap: "14px", marginTop: "24px" }}
        >
          <button
            onClick={onOpenGmail}
            style={{
              height: "50px",
              padding: "0 28px",
              background: "linear-gradient(90deg, #00f3ff, #2563eb)",
              border: "none",
              borderRadius: "6px",
              color: "#05070e",
              fontFamily: "var(--font-tech)",
              fontSize: "0.92rem",
              fontWeight: 700,
              letterSpacing: "1.5px",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
              boxShadow: "0 0 24px rgba(0, 243, 255, 0.35)",
              transition: "transform 0.18s ease"
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.02)"}
            onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
          >
            <Mail size={18} />
            CONNECT GMAIL WORKSPACE
          </button>

          <button
            onClick={onScrollToUpload}
            style={{
              height: "50px",
              padding: "0 24px",
              background: "rgba(12, 17, 30, 0.75)",
              border: "1px solid rgba(0, 243, 255, 0.35)",
              borderRadius: "6px",
              color: "var(--text)",
              fontFamily: "var(--font-tech)",
              fontSize: "0.92rem",
              fontWeight: 600,
              letterSpacing: "1.5px",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
              backdropFilter: "blur(10px)",
              transition: "all 0.18s ease"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "var(--cyan)";
              e.currentTarget.style.color = "var(--cyan)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "rgba(0, 243, 255, 0.35)";
              e.currentTarget.style.color = "var(--text)";
            }}
          >
            <UploadCloud size={18} />
            ADVANCED EVIDENCE IMPORT (.EML)
          </button>
        </motion.div>

        {/* Forensic Capabilities Ticker Bar */}
        <div style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: "20px",
          marginTop: "32px",
          borderTop: "1px solid rgba(255, 255, 255, 0.08)",
          paddingTop: "16px"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Lock size={14} color="#00f3ff" />
            <span className="mono" style={{ fontSize: "0.72rem", color: "var(--muted)" }}>SPF / DKIM / DMARC GATES</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Globe size={14} color="#00f3ff" />
            <span className="mono" style={{ fontSize: "0.72rem", color: "var(--muted)" }}>APPROXIMATE NETWORK RADAR</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Cpu size={14} color="#00f3ff" />
            <span className="mono" style={{ fontSize: "0.72rem", color: "var(--muted)" }}>GROUNDED AI FORENSIC ANALYST</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Terminal size={14} color="#00f3ff" />
            <span className="mono" style={{ fontSize: "0.72rem", color: "var(--muted)" }}>MITRE ATT&CK T1566 MAPPING</span>
          </div>
        </div>

      </div>

      {/* Horizontal Cyber Marquee Ticker */}
      <div style={{
        marginTop: "24px",
        background: "rgba(9, 13, 24, 0.9)",
        borderTop: "1px solid rgba(0, 243, 255, 0.15)",
        borderBottom: "1px solid rgba(0, 243, 255, 0.15)",
        padding: "8px 0",
        overflow: "hidden"
      }}>
        <div className="marquee-container">
          <div className="marquee-content">
            <span className="mono" style={{ fontSize: "0.78rem", color: "var(--cyan)", letterSpacing: "2px", margin: "0 24px" }}>
              ⚡ SENTINEL MESH FORENSIC SUITE // LIVE RFC 5322 PARSER // DMARC REJECT ENFORCEMENT // DEFANGED URI TELEMETRY // SHA-256 PAYLOAD HASHING // REVERSE ASN HOP TRACING // SOC READY //
            </span>
            <span className="mono" style={{ fontSize: "0.78rem", color: "var(--cyan)", letterSpacing: "2px", margin: "0 24px" }}>
              ⚡ SENTINEL MESH FORENSIC SUITE // LIVE RFC 5322 PARSER // DMARC REJECT ENFORCEMENT // DEFANGED URI TELEMETRY // SHA-256 PAYLOAD HASHING // REVERSE ASN HOP TRACING // SOC READY //
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}