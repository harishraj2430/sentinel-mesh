import { useState, useEffect } from "react";
import { Terminal, Shield, AlertTriangle, CheckCircle, Search, Filter, Database, Hash, Globe, Server, RefreshCw } from "lucide-react";
import { getSampleCases, analyzeSampleCase, checkHealth } from "../services/api";
import CaseReport from "../components/sections/CaseReport";
import GeoRadarMap from "../components/sections/GeoRadarMap";
import EvidenceGraph from "../components/sections/EvidenceGraph";

export default function Console() {
  const [cases, setCases] = useState([]);
  const [selectedCaseId, setSelectedCaseId] = useState("case-bec-01");
  const [activeReport, setActiveReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("ALL");
  const [engineHealth, setEngineHealth] = useState({ status: "checking" });

  useEffect(() => {
    async function loadData() {
      const health = await checkHealth();
      setEngineHealth(health);

      const sampleList = await getSampleCases();
      setCases(sampleList);

      if (sampleList.length > 0) {
        handleInspectCase(sampleList[0].id);
      }
    }
    loadData();
  }, []);

  const handleInspectCase = async (id) => {
    setSelectedCaseId(id);
    setLoading(true);
    try {
      const rep = await analyzeSampleCase(id);
      setActiveReport(rep);
    } catch (err) {
      console.error("Failed to load case report", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredCases = cases.filter(c => {
    if (filter === "ALL") return true;
    if (filter === "THREATS") return c.risk_tag !== "CLEAN";
    if (filter === "CLEAN") return c.risk_tag === "CLEAN";
    return true;
  });

  return (
    <div style={{ padding: "clamp(80px, 10vh, 110px) 5% 60px", minHeight: "100dvh", background: "var(--bg)" }}>
      {/* Console Top Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px", marginBottom: "32px", borderBottom: "1px solid var(--border)", paddingBottom: "20px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Terminal size={24} color="var(--accent)" />
            <h1 className="font-tech" style={{ fontSize: "clamp(1.5rem, 2.5vw, 2rem)", letterSpacing: "2px", color: "var(--text)" }}>
              SECURITY OPERATIONS CONSOLE (SOC)
            </h1>
          </div>
          <p className="mono" style={{ color: "var(--muted)", fontSize: "0.85rem", marginTop: "6px" }}>
            CASE ARTIFACTS, TELEMETRY REPOSITORY & FORENSIC ATTRIBUTION
          </p>
        </div>

        {/* Engine Status Badge */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: "8px",
          padding: "10px 18px"
        }}>
          <span className="pulse-dot" />
          <div>
            <p className="font-tech" style={{ fontSize: "0.85rem", color: "var(--text)", fontWeight: 600 }}>
              FORENSIC ENGINE STATUS
            </p>
            <p className="mono" style={{ fontSize: "0.75rem", color: "var(--accent)" }}>
              {engineHealth.status === "online" ? "SENTINEL CORE ONLINE (PORT 8000/8001)" : "SIMULATION MODE ACTIVE"}
            </p>
          </div>
        </div>
      </div>

      {/* Main Layout: Case Archive List on Left, Deep Case Inspector on Right */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "24px", alignItems: "start", minWidth: 0 }}>
        
        {/* Left: Case Repository Sidebar */}
        <div className="cyber-panel" style={{ borderRadius: "8px", border: "1px solid rgba(0, 243, 255, 0.2)", overflow: "hidden" }}>
          <div style={{ padding: "16px", background: "rgba(12, 17, 30, 0.8)", borderBottom: "1px solid rgba(0, 243, 255, 0.12)" }}>
            <span className="font-tech" style={{ fontSize: "0.95rem", color: "#fff", letterSpacing: "1px", fontWeight: 700 }}>
              INCIDENT CASE LOGS
            </span>
            {/* Filter Tabs */}
            <div style={{ display: "flex", gap: "6px", marginTop: "12px" }}>
              {["ALL", "THREATS", "CLEAN"].map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  style={{
                    flex: 1,
                    padding: "6px",
                    background: filter === f ? "rgba(0, 243, 255, 0.2)" : "rgba(5, 7, 14, 0.6)",
                    border: `1px solid ${filter === f ? "#00f3ff" : "rgba(255,255,255,0.06)"}`,
                    color: filter === f ? "#00f3ff" : "#94a3b8",
                    fontFamily: "var(--font-ui)",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    borderRadius: "4px",
                    cursor: "pointer"
                  }}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Cases List */}
          <div style={{ maxHeight: "650px", overflowY: "auto", padding: "12px" }}>
            {filteredCases.map(c => {
              const isSelected = c.id === selectedCaseId;
              const isCritical = c.risk_tag === "CRITICAL";
              const isHigh = c.risk_tag === "HIGH";

              return (
                <div
                  key={c.id}
                  onClick={() => handleInspectCase(c.id)}
                  style={{
                    padding: "14px",
                    borderRadius: "6px",
                    marginBottom: "8px",
                    cursor: "pointer",
                    background: isSelected ? "rgba(0, 243, 255, 0.12)" : "rgba(9, 13, 24, 0.5)",
                    border: `1px solid ${isSelected ? "#00f3ff" : "rgba(255,255,255,0.05)"}`,
                    transition: "all 0.15s ease"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                    <span className="mono" style={{ fontSize: "0.75rem", color: isSelected ? "#00f3ff" : "#cbd5e1" }}>
                      {c.scenario}
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
                  <h4 className="font-tech" style={{ fontSize: "0.85rem", color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {c.subject}
                  </h4>
                  <p className="mono" style={{ fontSize: "0.7rem", color: "#64748b", marginTop: "4px" }}>
                    {c.date}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Deep Case Telemetry & Report Inspector */}
        <div>
          {loading ? (
            <div className="cyber-panel" style={{ borderRadius: "8px", padding: "60px 24px", textAlign: "center" }}>
              <RefreshCw size={28} color="#00f3ff" className="animate-spin" style={{ margin: "0 auto 16px" }} />
              <p className="font-tech" style={{ fontSize: "1.1rem", color: "#00f3ff", letterSpacing: "2px" }}>
                LOADING FORENSIC ARTIFACTS...
              </p>
            </div>
          ) : activeReport ? (
            <div>
              {/* Full Case Report */}
              <CaseReport report={activeReport} />

              {/* Geolocation & Radar */}
              <div style={{ marginTop: "28px" }}>
                <GeoRadarMap geoData={activeReport.geo} relayHops={activeReport.relay_chain} />
              </div>

              {/* Evidence Graph */}
              <div style={{ marginTop: "28px" }}>
                <EvidenceGraph report={activeReport} />
              </div>
            </div>
          ) : (
            <div className="cyber-panel" style={{ borderRadius: "8px", padding: "40px", textAlign: "center", color: "#94a3b8" }}>
              Select an incident from the repository to inspect forensic telemetry.
            </div>
          )}
        </div>

      </div>
    </div>
  );
}