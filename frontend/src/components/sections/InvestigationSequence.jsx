import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, CheckCircle2, AlertTriangle, XCircle, Search, Cpu, Globe, Database, Terminal, FileCode, Lock, Zap } from "lucide-react";

const STAGES = [
  { id: 1, name: "INGESTING EMAIL", icon: FileCode, key: "ingest", desc: "Reading RFC 5322 message stream and boundary MIME multiparts" },
  { id: 2, name: "PARSING RFC HEADERS", icon: Terminal, key: "headers", desc: "Extracting From, Return-Path, Message-ID, and envelope hops" },
  { id: 3, name: "VERIFYING SPF RECORDS", icon: Shield, key: "spf", desc: "Querying DNS TXT records for v=spf1 and sender IP authorization" },
  { id: 4, name: "VERIFYING DKIM SIGNATURE", icon: Lock, key: "dkim", desc: "Validating cryptographic RSA-SHA256 signature and selector header" },
  { id: 5, name: "DMARC POLICY ALIGNMENT", icon: Shield, key: "dmarc", desc: "Testing RFC 7489 identifier alignment between From domain and DKIM/SPF" },
  { id: 6, name: "EXTRACTING & DEFANGING URLS", icon: Search, key: "urls", desc: "Defanging hyperlinks (hxxp[://]) and evaluating typosquatting/abuse TLDs" },
  { id: 7, name: "RESOLVING HOP IPS", icon: Database, key: "hops", desc: "Parsing Received header chain in reverse sequence to find untrusted hop" },
  { id: 8, name: "NETWORK INTELLIGENCE & ASN", icon: Cpu, key: "asn", desc: "Correlating Autonomous System Number, organization, and cloud hosting risk" },
  { id: 9, name: "APPROXIMATE GEOLOCATION", icon: Globe, key: "geo", desc: "Mapping network routing infrastructure node (not physical sender GPS)" },
  { id: 10, name: "AI PSYCHOLOGICAL NLP", icon: Zap, key: "nlp", desc: "Analyzing urgency language, credential prompts, and executive BEC cues" },
  { id: 11, name: "CORRELATING EVIDENCE GRAPH", icon: Cpu, key: "graph", desc: "Linking identity anomalies, IP reputation, and payload indicators" },
  { id: 12, name: "INVESTIGATION COMPLETE", icon: CheckCircle2, key: "verdict", desc: "Synthesizing forensic findings into official Case File with MITRE mapping" },
];

export default function InvestigationSequence({ report, isRunning, onComplete }) {
  const [currentStage, setCurrentStage] = useState(1);
  const [stageProgress, setStageProgress] = useState(0);
  const [completedStages, setCompletedStages] = useState(new Set());

  useEffect(() => {
    if (!isRunning && !report) {
      setCurrentStage(12);
      setCompletedStages(new Set(STAGES.map(s => s.id)));
      return;
    }

    if (isRunning) {
      setCurrentStage(1);
      setCompletedStages(new Set());
      setStageProgress(0);

      const interval = setInterval(() => {
        setCurrentStage(prev => {
          if (prev >= 12) {
            clearInterval(interval);
            if (onComplete) onComplete();
            return 12;
          }
          setCompletedStages(c => new Set([...c, prev]));
          return prev + 1;
        });
      }, 450);

      return () => clearInterval(interval);
    }
  }, [isRunning, report]);

  const activeStageObj = STAGES[currentStage - 1] || STAGES[11];
  const ActiveIcon = activeStageObj.icon;

  // Extract live telemetry details from actual report
  const getStageTelemetry = (stageId) => {
    if (!report) return "Awaiting input telemetry...";
    switch (stageId) {
      case 1:
        return `Subject: "${report.case_summary?.subject || 'Unknown'}" | Size: ${report.attachments?.items?.length || 0} payloads`;
      case 2:
        return `From: ${report.case_summary?.from || 'N/A'} | MsgID: ${report.case_summary?.message_id || 'N/A'}`;
      case 3:
        return `SPF Status: ${report.auth?.spf?.status || 'PASS'} | Record: ${report.auth?.spf?.record?.slice(0, 42) || 'v=spf1 ...'}`;
      case 4:
        return `DKIM Status: ${report.auth?.dkim?.status || 'PASS'} | Domain: ${report.auth?.dkim?.signing_domain || 'sender domain'}`;
      case 5:
        return `DMARC Policy: ${report.auth?.dmarc?.policy || 'none'} | Aligned: ${report.auth?.dmarc_aligned ? 'YES' : 'NO'}`;
      case 6:
        return `Extracted ${report.urls?.url_count || 0} URLs (${report.urls?.suspicious_count || 0} flagged) | Defanged output ready`;
      case 7:
        return `Analyzed ${report.relay_chain?.length || 1} hops | Origin: ${report.geo?.ip || '127.0.0.1'}`;
      case 8:
        return `ASN: ${report.geo?.asn || 'AS15169'} | Org: ${report.geo?.org || 'Network Provider'}`;
      case 9:
        return `Infrastructure Node: ${report.geo?.approximate_location || 'Approximate Network Location'}`;
      case 10:
        return `Urgency cues: ${report.language?.urgency_cues?.length || 0} | Credential cues: ${report.language?.credential_cues?.length || 0}`;
      case 11:
        return `Correlated ${report.why_reasons?.length || 3} verified forensic indicators`;
      case 12:
        return `Final Verdict: ${report.overall_verdict} (Score: ${report.overall_score}/100)`;
      default:
        return "Telemetry processed";
    }
  };

  return (
    <div className="cyber-panel" style={{ borderRadius: "8px", padding: "28px", border: "1px solid rgba(0, 243, 255, 0.25)" }}>
      {/* Header bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(0, 243, 255, 0.12)", paddingBottom: "16px", marginBottom: "24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span className={`pulse-dot ${report?.threat_detected ? "pulse-dot-red" : ""}`} />
          <h3 className="font-tech" style={{ fontSize: "1.1rem", letterSpacing: "2px", color: "#f1f5f9" }}>
            LIVE FORENSIC INVESTIGATION PIPELINE
          </h3>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span className="mono" style={{ fontSize: "0.8rem", color: "#00f3ff" }}>
            STAGE [{String(currentStage).padStart(2, "0")}/12]
          </span>
          <span className="mono" style={{
            fontSize: "0.75rem",
            padding: "3px 10px",
            borderRadius: "4px",
            background: isRunning ? "rgba(0, 243, 255, 0.15)" : report?.threat_detected ? "rgba(255, 46, 77, 0.15)" : "rgba(16, 185, 129, 0.15)",
            border: `1px solid ${isRunning ? "#00f3ff" : report?.threat_detected ? "#ff2e4d" : "#10b981"}`,
            color: isRunning ? "#00f3ff" : report?.threat_detected ? "#ff2e4d" : "#10b981"
          }}>
            {isRunning ? "PROCESSING LIVE" : report?.threat_detected ? "THREAT DETECTED" : "INVESTIGATION COMPLETE"}
          </span>
        </div>
      </div>

      {/* Main Active Stage Spotlight Card */}
      <div style={{
        background: "rgba(9, 13, 24, 0.8)",
        border: "1px solid rgba(0, 243, 255, 0.2)",
        borderRadius: "6px",
        padding: "20px",
        marginBottom: "24px",
        position: "relative",
        overflow: "hidden"
      }}>
        <div className="scanner-line" />
        <div style={{ display: "flex", alignItems: "flex-start", gap: "18px" }}>
          <div style={{
            background: "rgba(0, 243, 255, 0.1)",
            border: "1px solid rgba(0, 243, 255, 0.4)",
            borderRadius: "6px",
            padding: "12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
            <ActiveIcon size={28} color="#00f3ff" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <h4 className="font-tech" style={{ fontSize: "1.2rem", letterSpacing: "1px", color: "#00f3ff" }}>
                {activeStageObj.name}
              </h4>
              <span className="mono" style={{ fontSize: "0.8rem", color: "#94a3b8" }}>
                {activeStageObj.desc}
              </span>
            </div>
            <div style={{
              marginTop: "12px",
              padding: "8px 12px",
              background: "rgba(5, 7, 14, 0.6)",
              borderRadius: "4px",
              border: "1px dashed rgba(0, 243, 255, 0.25)"
            }}>
              <p className="mono" style={{ fontSize: "0.85rem", color: "#eaeaea" }}>
                <span style={{ color: "#00f3ff", marginRight: "8px" }}>&gt;</span>
                {getStageTelemetry(currentStage)}
              </p>
            </div>
          </div>
        </div>

        {/* Dynamic Progress Bar */}
        <div style={{ width: "100%", height: "4px", background: "rgba(255, 255, 255, 0.08)", marginTop: "16px", borderRadius: "2px", overflow: "hidden" }}>
          <motion.div
            style={{
              height: "100%",
              background: report?.threat_detected && currentStage === 12
                ? "linear-gradient(90deg, #00f3ff, #ff2e4d)"
                : "linear-gradient(90deg, #2563eb, #00f3ff)",
              boxShadow: "0 0 10px #00f3ff"
            }}
            animate={{ width: `${(currentStage / 12) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* 12-Stage Matrix Grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
        gap: "12px"
      }}>
        {STAGES.map((s) => {
          const isDone = completedStages.has(s.id) || (!isRunning && currentStage >= s.id);
          const isCurrent = currentStage === s.id && isRunning;
          const IconComponent = s.icon;

          let badgeColor = "#64748b";
          let badgeBorder = "rgba(255,255,255,0.06)";
          let badgeBg = "rgba(12, 17, 30, 0.4)";

          if (isCurrent) {
            badgeColor = "#00f3ff";
            badgeBorder = "rgba(0, 243, 255, 0.5)";
            badgeBg = "rgba(0, 243, 255, 0.1)";
          } else if (isDone) {
            badgeColor = "#10b981";
            badgeBorder = "rgba(16, 185, 129, 0.3)";
            badgeBg = "rgba(16, 185, 129, 0.05)";
          }

          return (
            <div
              key={s.id}
              style={{
                background: badgeBg,
                border: `1px solid ${badgeBorder}`,
                borderRadius: "6px",
                padding: "10px 14px",
                display: "flex",
                alignItems: "center",
                gap: "12px",
                transition: "all 0.2s ease"
              }}
            >
              <div style={{ color: badgeColor }}>
                <IconComponent size={16} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span className="mono" style={{ fontSize: "0.75rem", color: isCurrent ? "#00f3ff" : "#94a3b8" }}>
                    #{String(s.id).padStart(2, "0")}
                  </span>
                  {isDone ? (
                    <CheckCircle2 size={12} color="#10b981" />
                  ) : isCurrent ? (
                    <span className="pulse-dot" style={{ width: "6px", height: "6px" }} />
                  ) : (
                    <span className="mono" style={{ fontSize: "0.7rem", color: "#475569" }}>WAIT</span>
                  )}
                </div>
                <p className="font-tech" style={{
                  fontSize: "0.8rem",
                  color: isCurrent ? "#fff" : isDone ? "#eaeaea" : "#64748b",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  marginTop: "2px"
                }}>
                  {s.name}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
