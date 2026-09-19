import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield, Mail, UploadCloud, Terminal } from "lucide-react";
import ThemeSwitch from "./ThemeSwitch";

export default function Navbar({ onOpenGmail, onScrollToUpload }) {
  const location = useLocation();

  return (
    <nav style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      zIndex: 100,
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "16px 6%",
      backdropFilter: "blur(16px)",
      background: "rgba(5, 7, 14, 0.8)",
      borderBottom: "1px solid rgba(0, 243, 255, 0.12)"
    }}>
      {/* Brand Logo & Telemetry Subtitle */}
      <Link to="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "12px" }}>
        <div style={{
          width: "36px",
          height: "36px",
          borderRadius: "8px",
          background: "linear-gradient(135deg, rgba(0, 243, 255, 0.2), rgba(37, 99, 235, 0.4))",
          border: "1px solid #00f3ff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 0 15px rgba(0, 243, 255, 0.3)"
        }}>
          <Shield size={20} color="#00f3ff" />
        </div>
        <div>
          <span className="font-orbitron" style={{
            fontSize: "1.2rem",
            fontWeight: 800,
            letterSpacing: "3px",
            color: "#f8fafc",
            display: "block",
            lineHeight: 1.1
          }}>
            SENTINEL MESH
          </span>
          <span className="mono" style={{ fontSize: "0.65rem", color: "#00f3ff", letterSpacing: "1.5px" }}>
            EMAIL THREAT INVESTIGATION ENGINE
          </span>
        </div>
      </Link>

      {/* Nav Links */}
      <div style={{ display: "flex", alignItems: "center", gap: "28px" }}>
        <Link
          to="/"
          style={{
            color: location.pathname === "/" ? "#00f3ff" : "#94a3b8",
            textDecoration: "none",
            fontSize: "0.85rem",
            letterSpacing: "1.5px",
            fontFamily: "var(--font-ui)",
            fontWeight: 600,
            position: "relative"
          }}
        >
          INVESTIGATE
          {location.pathname === "/" && (
            <motion.div
              layoutId="nav-glow"
              style={{
                position: "absolute",
                bottom: "-6px",
                left: 0,
                right: 0,
                height: "2px",
                background: "#00f3ff",
                boxShadow: "0 0 8px #00f3ff"
              }}
            />
          )}
        </Link>

        <Link
          to="/console"
          style={{
            color: location.pathname === "/console" ? "#00f3ff" : "#94a3b8",
            textDecoration: "none",
            fontSize: "0.85rem",
            letterSpacing: "1.5px",
            fontFamily: "var(--font-ui)",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: "6px"
          }}
        >
          <Terminal size={14} />
          SOC CONSOLE
        </Link>
      </div>

      {/* Right Action Buttons */}
      <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          background: "rgba(16, 185, 129, 0.1)",
          border: "1px solid rgba(16, 185, 129, 0.3)",
          padding: "4px 10px",
          borderRadius: "4px"
        }}>
          <span className="pulse-dot" style={{ background: "#10b981", boxShadow: "0 0 8px #10b981" }} />
          <span className="mono" style={{ fontSize: "0.7rem", color: "#10b981", letterSpacing: "1px" }}>
            ENGINE ONLINE
          </span>
        </div>

        {onOpenGmail && (
          <button
            onClick={onOpenGmail}
            style={{
              background: "linear-gradient(90deg, #2563eb, #00f3ff)",
              border: "none",
              borderRadius: "4px",
              color: "#05070e",
              padding: "8px 16px",
              fontFamily: "var(--font-ui)",
              fontSize: "0.85rem",
              fontWeight: 700,
              letterSpacing: "1.5px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              boxShadow: "0 0 15px rgba(0, 243, 255, 0.3)",
              transition: "all 0.2s ease"
            }}
          >
            <Mail size={15} />
            CONNECT GMAIL
          </button>
        )}

        <ThemeSwitch />
      </div>
    </nav>
  );
}