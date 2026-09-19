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
      minHeight: "100vh",
      position: "relative",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      paddingTop: "100px",
      overflow: "hidden"
    }}>
      {/* Background Cyber Visual with Ken-Burns and Scanner */}
      <div className="zoom-frame" style={{ position: "absolute", inset: 0, zIndex: 0 }}>
        <div style={{
          position: "absolute",
          inset: 0,
          background: `
            radial-gradient(circle at 50% 30%, rgba(0, 243, 255, 0.12) 0%, transparent 60%),
            radial-gradient(circle at 85% 70%, rgba(37, 99, 235, 0.15) 0%, transparent 50%),
            linear-gradient(180deg, rgba(5, 7, 14, 0.6) 0%, rgba(5, 7, 14, 0.95) 85%, #05070e 100%)
          `
        }} />
        <div className="scanner-line" />
      </div>

      {/* Hero Content Container */}
      <div style={{ position: "relative", zIndex: 2, padding: "0 8%", maxWidth: "1280px" }}>
        
        {/* System Telemetry Tag */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          style={{ display: "inline-flex", alignItems: "center", gap: "10px", background: "rgba(0, 243, 255, 0.08)", border: "1px solid rgba(0, 243, 255, 0.3)", padding: "6px 14px", borderRadius: "20px", marginBottom: "24px" }}
        >
          <span className="pulse-dot" />
          <span className="font-orbitron" style={{ color: "#00f3ff", letterSpacing: "2.5px", fontSize: "0.75rem", fontWeight: 700 }}>
            LIVE FORENSIC ENGINE // SENTINEL CORE v2.0 ONLINE
          </span>
        </motion.div>

        {/* Giant Animated Staggered Typography with Syne Font */}
        <div style={{ minHeight: "180px" }}>
          <motion.div
            key={currentHeadline.line1}
            initial={{ opacity: 0, y: 25, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -25, filter: "blur(10px)" }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <h1 className="gradient-text-silver font-display" style={{
              fontSize: "clamp(2.8rem, 7.5vw, 6.4rem)",
              fontWeight: 800,
              lineHeight: 1.02,
              letterSpacing: "-0.04em",
              textTransform: "uppercase",
              textShadow: "0 10px 30px rgba(0,0,0,0.5)"
            }}>
              {currentHeadline.line1}
            </h1>
          </motion.div>

          <motion.div
            key={currentHeadline.line2}
            initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -30, filter: "blur(10px)" }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          >
            <h1 className="gradient-text-cyan glow-cyan font-display" style={{
              fontSize: "clamp(2.8rem, 7.5vw, 6.4rem)",
              fontWeight: 800,
              lineHeight: 1.02,
              letterSpacing: "-0.04em",
              textTransform: "uppercase"
            }}>
              {currentHeadline.line2}
            </h1>
          </motion.div>
        </div>

        {/* Subtitle description */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          style={{
            fontSize: "clamp(1rem, 1.8vw, 1.25rem)",
            color: "#94a3b8",
            marginTop: "24px",
            maxWidth: "680px",
            lineHeight: 1.6
          }}
        >
          High-fidelity email threat investigation platform designed for SOC analysts and incident response teams.
          Traces cryptographic envelope routing, defangs malicious hyperlinks, isolates weaponized attachments, and delivers grounded forensic attribution.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.55 }}
          style={{ display: "flex", flexWrap: "wrap", gap: "16px", marginTop: "36px" }}
        >
          <button
            onClick={onOpenGmail}
            style={{
              padding: "16px 32px",
              background: "linear-gradient(90deg, #00f3ff, #2563eb)",
              border: "none",
              borderRadius: "6px",
              color: "#05070e",
              fontFamily: "'Chakra Petch', sans-serif",
              fontSize: "1rem",
              fontWeight: 700,
              letterSpacing: "1.5px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              boxShadow: "0 0 30px rgba(0, 243, 255, 0.4)",
              transition: "transform 0.2s ease"
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.03)"}
            onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
          >
            <Mail size={18} />
            CONNECT GMAIL WORKSPACE
          </button>

          <button
            onClick={onScrollToUpload}
            style={{
              padding: "16px 28px",
              background: "rgba(12, 17, 30, 0.7)",
              border: "1px solid rgba(0, 243, 255, 0.4)",
              borderRadius: "6px",
              color: "#eaeaea",
              fontFamily: "'Chakra Petch', sans-serif",
              fontSize: "1rem",
              fontWeight: 600,
              letterSpacing: "1.5px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              backdropFilter: "blur(10px)",
              transition: "all 0.2s ease"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#00f3ff";
              e.currentTarget.style.color = "#00f3ff";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "rgba(0, 243, 255, 0.4)";
              e.currentTarget.style.color = "#eaeaea";
            }}
          >
            <UploadCloud size={18} />
            ADVANCED EVIDENCE IMPORT (.EML)
          </button>
        </motion.div>

        {/* Forensic Capabilities Ticker Bar */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "28px",
          marginTop: "60px",
          borderTop: "1px solid rgba(255, 255, 255, 0.08)",
          paddingTop: "20px"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Lock size={15} color="#00f3ff" />
            <span className="mono" style={{ fontSize: "0.75rem", color: "#94a3b8" }}>SPF / DKIM / DMARC GATES</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Globe size={15} color="#00f3ff" />
            <span className="mono" style={{ fontSize: "0.75rem", color: "#94a3b8" }}>APPROXIMATE NETWORK RADAR</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Cpu size={15} color="#00f3ff" />
            <span className="mono" style={{ fontSize: "0.75rem", color: "#94a3b8" }}>GROUNDED AI FORENSIC ANALYST</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Terminal size={15} color="#00f3ff" />
            <span className="mono" style={{ fontSize: "0.75rem", color: "#94a3b8" }}>MITRE ATT&CK T1566 MAPPING</span>
          </div>
        </div>

      </div>

      {/* Horizontal Cyber Marquee Ticker */}
      <div style={{
        marginTop: "48px",
        background: "rgba(9, 13, 24, 0.9)",
        borderTop: "1px solid rgba(0, 243, 255, 0.15)",
        borderBottom: "1px solid rgba(0, 243, 255, 0.15)",
        padding: "10px 0",
        overflow: "hidden"
      }}>
        <div className="marquee-container">
          <div className="marquee-content">
            <span className="mono" style={{ fontSize: "0.8rem", color: "#00f3ff", letterSpacing: "2px", margin: "0 24px" }}>
              ⚡ SENTINEL MESH FORENSIC SUITE // LIVE RFC 5322 PARSER // DMARC REJECT ENFORCEMENT // DEFANGED URI TELEMETRY // SHA-256 PAYLOAD HASHING // REVERSE ASN HOP TRACING // SOC READY //
            </span>
            <span className="mono" style={{ fontSize: "0.8rem", color: "#00f3ff", letterSpacing: "2px", margin: "0 24px" }}>
              ⚡ SENTINEL MESH FORENSIC SUITE // LIVE RFC 5322 PARSER // DMARC REJECT ENFORCEMENT // DEFANGED URI TELEMETRY // SHA-256 PAYLOAD HASHING // REVERSE ASN HOP TRACING // SOC READY //
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}