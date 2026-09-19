import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail,
  Shield,
  Check,
  Lock,
  ChevronRight,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  X,
  Search,
  FileText,
  ArrowRight,
  Key,
  ShieldCheck,
  ExternalLink
} from "lucide-react";

export default function GmailConnectModal({ isOpen, onClose, sampleCases = [], onSelectEmailForInvestigation }) {
  const [step, setStep] = useState("auth"); // 'auth' | 'gis' | 'handshake' | 'mailbox'
  const [selectedCaseId, setSelectedCaseId] = useState(sampleCases[0]?.id || "case-bec-01");
  const [handshakeProgress, setHandshakeProgress] = useState(15);
  const [activeAccount, setActiveAccount] = useState("soc-analyst@enterprise-mesh.internal");

  useEffect(() => {
    if (step === "handshake") {
      const interval = setInterval(() => {
        setHandshakeProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setTimeout(() => setStep("mailbox"), 400);
            return 100;
          }
          return prev + 25;
        });
      }, 250);
      return () => clearInterval(interval);
    }
  }, [step]);

  if (!isOpen) return null;

  const activeEmail = sampleCases.find((c) => c.id === selectedCaseId) || sampleCases[0];

  const handleStartAnalysis = () => {
    if (onSelectEmailForInvestigation && activeEmail) {
      onSelectEmailForInvestigation(activeEmail.id);
      onClose();
    }
  };

  const getModalWidth = () => {
    if (step === "auth") return "560px";
    if (step === "gis") return "480px";
    if (step === "handshake") return "520px";
    return "980px";
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: "rgba(5, 7, 14, 0.88)",
        backdropFilter: "blur(12px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px"
      }}
    >
      <div
        className="cyber-panel"
        style={{
          width: "100%",
          maxWidth: getModalWidth(),
          borderRadius: "12px",
          border: "1px solid rgba(0, 243, 255, 0.3)",
          boxShadow: "0 0 50px rgba(0, 243, 255, 0.15)",
          overflow: "hidden",
          transition: "max-width 0.3s cubic-bezier(0.16, 1, 0.3, 1)"
        }}
      >
        {/* Modal Top Bar */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "16px 24px",
            background: "rgba(12, 17, 30, 0.95)",
            borderBottom: "1px solid rgba(0, 243, 255, 0.15)"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Mail size={18} color="#00f3ff" />
            <span className="font-tech" style={{ fontSize: "0.95rem", letterSpacing: "1.5px", color: "#f1f5f9" }}>
              GMAIL FORENSIC INTEGRATION // SECURE WORKSPACE
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: "#94a3b8",
              cursor: "pointer",
              padding: "4px"
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* STEP 1: AUTH GATEWAY INITIATION */}
        {step === "auth" && (
          <div style={{ padding: "32px 28px" }}>
            <div style={{ textAlign: "center", marginBottom: "28px" }}>
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "50%",
                  background: "rgba(0, 243, 255, 0.1)",
                  border: "1px solid #00f3ff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 16px"
                }}
              >
                <Shield size={28} color="#00f3ff" />
              </div>
              <h3 className="font-tech" style={{ fontSize: "1.4rem", color: "#fff", letterSpacing: "1px" }}>
                CONNECT SECURE GMAIL GATEWAY
              </h3>
              <p className="mono" style={{ fontSize: "0.85rem", color: "#94a3b8", marginTop: "8px" }}>
                Sentinel Mesh requests read-only programmatic access via Google Identity Services (OAuth 2.0 PKCE) to inspect headers, cryptographic signatures, and payload hashes.
              </p>
            </div>

            {/* Permission Scopes */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "28px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", background: "rgba(9, 13, 24, 0.6)", padding: "10px 14px", borderRadius: "6px", border: "1px solid rgba(255, 255, 255, 0.06)" }}>
                <Check size={16} color="#10b981" />
                <span className="mono" style={{ fontSize: "0.8rem", color: "#eaeaea" }}>https://www.googleapis.com/auth/gmail.readonly (MIME & Headers)</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", background: "rgba(9, 13, 24, 0.6)", padding: "10px 14px", borderRadius: "6px", border: "1px solid rgba(255, 255, 255, 0.06)" }}>
                <Check size={16} color="#10b981" />
                <span className="mono" style={{ fontSize: "0.8rem", color: "#eaeaea" }}>Cryptographic DKIM/SPF/ARC Public Key Cross-Check</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", background: "rgba(9, 13, 24, 0.6)", padding: "10px 14px", borderRadius: "6px", border: "1px solid rgba(255, 255, 255, 0.06)" }}>
                <Check size={16} color="#10b981" />
                <span className="mono" style={{ fontSize: "0.8rem", color: "#eaeaea" }}>Zero-Persistence Policy (Volatile RAM execution only)</span>
              </div>
            </div>

            {/* Authorize Button */}
            <button
              onClick={() => setStep("gis")}
              style={{
                width: "100%",
                padding: "14px",
                background: "linear-gradient(90deg, #2563eb, #00f3ff)",
                border: "none",
                borderRadius: "6px",
                color: "#05070e",
                fontFamily: "'Chakra Petch', sans-serif",
                fontSize: "1rem",
                fontWeight: 700,
                letterSpacing: "2px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
                boxShadow: "0 0 20px rgba(0, 243, 255, 0.3)"
              }}
            >
              <Lock size={18} />
              AUTHENTICATE VIA GOOGLE OAUTH 2.0
            </button>
          </div>
        )}

        {/* STEP 2: GOOGLE IDENTITY SERVICES (GIS) CONSENT DIALOG */}
        {step === "gis" && (
          <div style={{ padding: "28px 24px", background: "#ffffff", color: "#202124", borderRadius: "0 0 12px 12px" }}>
            {/* Google Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #e0e0e0", paddingBottom: "14px", marginBottom: "20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <svg width="22" height="22" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span style={{ fontFamily: "'Google Sans', Roboto, sans-serif", fontSize: "0.95rem", fontWeight: 500, color: "#3c4043" }}>
                  Google Identity Services
                </span>
              </div>
              <span style={{ fontSize: "0.72rem", color: "#5f6368", background: "#f1f3f4", padding: "3px 8px", borderRadius: "12px" }}>
                OAuth 2.0 PKCE
              </span>
            </div>

            <div style={{ textAlign: "center", marginBottom: "18px" }}>
              <h4 style={{ fontSize: "1.15rem", fontWeight: 500, color: "#202124", margin: "0 0 6px 0" }}>
                Sentinel Mesh Forensics wants to access your Google Account
              </h4>
              <p style={{ fontSize: "0.82rem", color: "#5f6368", margin: 0 }}>
                Choose an account to continue authorization
              </p>
            </div>

            {/* Selected User Account Chip */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "10px 14px",
                background: "#f8f9fa",
                border: "1px solid #dadce0",
                borderRadius: "8px",
                marginBottom: "20px"
              }}
            >
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  background: "#1a73e8",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 600,
                  fontSize: "0.9rem"
                }}
              >
                SM
              </div>
              <div style={{ flex: 1, textAlign: "left" }}>
                <p style={{ margin: 0, fontSize: "0.85rem", fontWeight: 500, color: "#202124" }}>Security Operations Lead</p>
                <p style={{ margin: 0, fontSize: "0.75rem", color: "#5f6368" }}>{activeAccount}</p>
              </div>
              <CheckCircle size={16} color="#188038" />
            </div>

            {/* Requested Scopes Info */}
            <div style={{ background: "#f8f9fa", borderRadius: "8px", padding: "14px", marginBottom: "22px", border: "1px solid #e8eaed" }}>
              <p style={{ fontSize: "0.78rem", fontWeight: 600, color: "#3c4043", margin: "0 0 8px 0" }}>
                This will allow Sentinel Mesh to:
              </p>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "8px", marginBottom: "8px" }}>
                <Mail size={14} color="#1a73e8" style={{ marginTop: "2px", flexShrink: 0 }} />
                <span style={{ fontSize: "0.76rem", color: "#3c4043" }}>
                  View email headers, authentication tags (SPF/DKIM/DMARC/ARC), and message metadata
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
                <ShieldCheck size={14} color="#188038" style={{ marginTop: "2px", flexShrink: 0 }} />
                <span style={{ fontSize: "0.76rem", color: "#3c4043" }}>
                  Verify cryptographic transport signatures in volatile client memory
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
              <button
                onClick={() => setStep("auth")}
                style={{
                  padding: "9px 18px",
                  background: "transparent",
                  border: "1px solid #dadce0",
                  borderRadius: "4px",
                  color: "#1a73e8",
                  fontSize: "0.85rem",
                  fontWeight: 500,
                  cursor: "pointer"
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => setStep("handshake")}
                style={{
                  padding: "9px 24px",
                  background: "#1a73e8",
                  border: "none",
                  borderRadius: "4px",
                  color: "#fff",
                  fontSize: "0.85rem",
                  fontWeight: 500,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px"
                }}
              >
                <span>Allow & Connect</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: OAUTH 2.0 PKCE HANDSHAKE TERMINAL */}
        {step === "handshake" && (
          <div style={{ padding: "32px 28px", textAlign: "center" }}>
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "50%",
                background: "rgba(0, 243, 255, 0.1)",
                border: "1px solid #00f3ff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px"
              }}
            >
              <RefreshCw size={26} color="#00f3ff" className="animate-spin" />
            </div>

            <h3 className="font-tech" style={{ fontSize: "1.3rem", color: "#fff", letterSpacing: "1px", marginBottom: "8px" }}>
              EXCHANGING OAUTH 2.0 PKCE TOKENS
            </h3>
            <p className="mono" style={{ fontSize: "0.82rem", color: "#94a3b8", marginBottom: "20px" }}>
              Validating TLS 1.3 cryptographic session with Google OAuth Gateway...
            </p>

            {/* Handshake Telemetry Box */}
            <div
              style={{
                background: "rgba(5, 7, 14, 0.8)",
                border: "1px solid rgba(0, 243, 255, 0.2)",
                borderRadius: "6px",
                padding: "16px",
                textAlign: "left",
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "0.75rem",
                color: "#64748b",
                marginBottom: "20px"
              }}
            >
              <p style={{ margin: "3px 0", color: "#94a3b8" }}>&gt; POST https://oauth2.googleapis.com/token</p>
              <p style={{ margin: "3px 0", color: "#10b981" }}>&gt; HTTP/2 200 OK — code_verifier MATCHED</p>
              <p style={{ margin: "3px 0", color: "#00f3ff" }}>
                &gt; ACCESS_TOKEN: ya29.a0AfH6SMbQ... [EXPIRES_IN: 3600]
              </p>
              <p style={{ margin: "3px 0", color: "#f59e0b" }}>
                &gt; SCOPES_CONFIRMED: gmail.readonly, gmail.metadata
              </p>
            </div>

            {/* Progress Bar */}
            <div style={{ width: "100%", height: "6px", background: "rgba(255, 255, 255, 0.1)", borderRadius: "3px", overflow: "hidden" }}>
              <div
                style={{
                  width: `${handshakeProgress}%`,
                  height: "100%",
                  background: "linear-gradient(90deg, #2563eb, #00f3ff)",
                  transition: "width 0.25s ease"
                }}
              />
            </div>
          </div>
        )}

        {/* STEP 4: MAILBOX EXPLORER */}
        {step === "mailbox" && (
          <div>
            {/* Live Active Account Badge Header */}
            <div
              style={{
                background: "rgba(9, 13, 24, 0.9)",
                borderBottom: "1px solid rgba(0, 243, 255, 0.15)",
                padding: "10px 20px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "10px"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    background: "#10b981",
                    boxShadow: "0 0 10px #10b981"
                  }}
                />
                <span className="mono" style={{ fontSize: "0.75rem", color: "#10b981", fontWeight: 600 }}>
                  GMAIL LIVE SESSION ACTIVE:
                </span>
                <span className="mono" style={{ fontSize: "0.75rem", color: "#f1f5f9" }}>
                  {activeAccount}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span
                  className="mono"
                  style={{
                    fontSize: "0.7rem",
                    color: "#00f3ff",
                    background: "rgba(0, 243, 255, 0.08)",
                    border: "1px solid rgba(0, 243, 255, 0.2)",
                    padding: "2px 8px",
                    borderRadius: "3px"
                  }}
                >
                  TOKEN EXPIRES: 59m 42s
                </span>
              </div>
            </div>

            {/* Mailbox Split Screen */}
            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", minHeight: "480px" }}>
              {/* Left: Email List View */}
              <div
                style={{
                  borderRight: "1px solid rgba(0, 243, 255, 0.15)",
                  background: "rgba(6, 9, 18, 0.75)",
                  display: "flex",
                  flexDirection: "column"
                }}
              >
                <div
                  style={{
                    padding: "14px 18px",
                    borderBottom: "1px solid rgba(0, 243, 255, 0.1)",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px"
                  }}
                >
                  <Search size={16} color="#64748b" />
                  <input
                    type="text"
                    readOnly
                    value="in:inbox is:unread (4 items flagged for audit)"
                    style={{
                      background: "transparent",
                      border: "none",
                      outline: "none",
                      color: "#00f3ff",
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: "0.8rem",
                      width: "100%"
                    }}
                  />
                </div>

                {/* Email List */}
                <div style={{ overflowY: "auto", flex: 1, padding: "8px", maxHeight: "420px" }}>
                  {sampleCases.map((c) => {
                    const isSelected = c.id === selectedCaseId;
                    const isCritical = c.risk_tag === "CRITICAL";
                    const isHigh = c.risk_tag === "HIGH";

                    return (
                      <div
                        key={c.id}
                        onClick={() => setSelectedCaseId(c.id)}
                        style={{
                          padding: "14px",
                          borderRadius: "6px",
                          marginBottom: "6px",
                          cursor: "pointer",
                          background: isSelected ? "rgba(0, 243, 255, 0.12)" : "rgba(12, 17, 30, 0.4)",
                          border: `1px solid ${isSelected ? "#00f3ff" : "rgba(255, 255, 255, 0.05)"}`,
                          transition: "all 0.15s ease"
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                          <span className="font-tech" style={{ fontSize: "0.85rem", color: isSelected ? "#00f3ff" : "#fff", fontWeight: 600 }}>
                            {c.sender.split("<")[0].replace(/"/g, "")}
                          </span>
                          <span
                            className="mono"
                            style={{
                              fontSize: "0.7rem",
                              padding: "2px 6px",
                              borderRadius: "3px",
                              background: isCritical ? "rgba(255, 46, 77, 0.2)" : isHigh ? "rgba(245, 158, 11, 0.2)" : "rgba(16, 185, 129, 0.2)",
                              color: isCritical ? "#ff2e4d" : isHigh ? "#f59e0b" : "#10b981",
                              border: `1px solid ${isCritical ? "#ff2e4d" : isHigh ? "#f59e0b" : "#10b981"}`
                            }}
                          >
                            {c.risk_tag}
                          </span>
                        </div>
                        <p className="font-tech" style={{ fontSize: "0.85rem", color: "#eaeaea", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {c.subject}
                        </p>
                        <p className="mono" style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "4px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {c.snippet}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right: Selected Email Detail Pane & Investigation Trigger */}
              <div
                style={{
                  padding: "24px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  background: "rgba(9, 13, 24, 0.85)"
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                    <span className="mono" style={{ fontSize: "0.75rem", color: "#00f3ff" }}>SCENARIO:</span>
                    <span className="font-tech" style={{ fontSize: "0.9rem", color: "#fff", fontWeight: 700 }}>
                      {activeEmail?.scenario}
                    </span>
                  </div>

                  <h4 className="font-tech" style={{ fontSize: "1.15rem", color: "#f1f5f9", marginBottom: "14px", lineHeight: 1.3 }}>
                    {activeEmail?.subject}
                  </h4>

                  <div
                    style={{
                      background: "rgba(5, 7, 14, 0.7)",
                      border: "1px solid rgba(0, 243, 255, 0.15)",
                      borderRadius: "6px",
                      padding: "12px",
                      marginBottom: "14px"
                    }}
                  >
                    <p className="mono" style={{ fontSize: "0.72rem", color: "#94a3b8" }}>FROM:</p>
                    <p className="mono" style={{ fontSize: "0.78rem", color: "#eaeaea", wordBreak: "break-all" }}>{activeEmail?.sender}</p>

                    <p className="mono" style={{ fontSize: "0.72rem", color: "#94a3b8", marginTop: "6px" }}>DATE:</p>
                    <p className="mono" style={{ fontSize: "0.78rem", color: "#eaeaea" }}>{activeEmail?.date}</p>
                  </div>

                  {/* Header Authentication Glimpse */}
                  <div
                    style={{
                      background: "rgba(5, 7, 14, 0.7)",
                      border: "1px solid rgba(255, 255, 255, 0.08)",
                      borderRadius: "6px",
                      padding: "12px",
                      marginBottom: "14px"
                    }}
                  >
                    <p className="mono" style={{ fontSize: "0.72rem", color: "#94a3b8", marginBottom: "4px" }}>
                      RFC 822 AUTHENTICATION SUMMARY:
                    </p>
                    <p className="mono" style={{ fontSize: "0.74rem", color: activeEmail?.risk_tag === "CLEAN" ? "#10b981" : "#ff2e4d", lineHeight: 1.4 }}>
                      {activeEmail?.risk_tag === "CLEAN"
                        ? "Authentication-Results: mx.google.com; dkim=pass; spf=pass; dmarc=pass; arc=pass"
                        : "Authentication-Results: mx.enterprise.internal; spf=fail; dkim=fail; dmarc=fail; arc=fail"}
                    </p>
                  </div>

                  <div
                    style={{
                      background: "rgba(5, 7, 14, 0.7)",
                      border: "1px solid rgba(255, 255, 255, 0.08)",
                      borderRadius: "6px",
                      padding: "12px"
                    }}
                  >
                    <p className="mono" style={{ fontSize: "0.72rem", color: "#94a3b8", marginBottom: "4px" }}>EMAIL PREVIEW:</p>
                    <p style={{ fontSize: "0.82rem", color: "#cbd5e1", lineHeight: 1.5 }}>
                      {activeEmail?.snippet}
                    </p>
                  </div>
                </div>

                {/* Trigger Button */}
                <button
                  onClick={handleStartAnalysis}
                  style={{
                    marginTop: "20px",
                    padding: "14px 20px",
                    background: "linear-gradient(90deg, #00f3ff, #2563eb)",
                    border: "none",
                    borderRadius: "6px",
                    color: "#05070e",
                    fontFamily: "'Chakra Petch', sans-serif",
                    fontSize: "0.95rem",
                    fontWeight: 700,
                    letterSpacing: "1.5px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "10px",
                    boxShadow: "0 0 25px rgba(0, 243, 255, 0.35)"
                  }}
                >
                  <Shield size={18} />
                  INGEST & INVESTIGATE THIS EMAIL
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
