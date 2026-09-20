import { useState, useEffect } from "react";
import { Shield, Activity, TrendingUp, AlertTriangle, CheckCircle, BarChart3, Clock, Layers } from "lucide-react";
import { getThreatSummary, getThreatFrequency, getThreatTrends, getThreatCategories } from "../../services/api";

export default function ThreatIntelligenceDashboard() {
  const [summary, setSummary] = useState(null);
  const [frequency, setFrequency] = useState(null);
  const [trends, setTrends] = useState(null);
  const [categories, setCategories] = useState(null);
  const [timeRange, setTimeRange] = useState("7d");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [sum, freq, trend, cat] = await Promise.all([
          getThreatSummary(),
          getThreatFrequency(),
          getThreatTrends(timeRange),
          getThreatCategories()
        ]);
        setSummary(sum);
        setFrequency(freq);
        setTrends(trend);
        setCategories(cat);
      } catch (err) {
        console.error("Failed to load threat intelligence", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [timeRange]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
      {/* Top Overview Telemetry Cards */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
        gap: "16px"
      }}>
        <div className="cyber-panel" style={{ padding: "18px", borderRadius: "8px", border: "1px solid var(--border)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span className="mono" style={{ fontSize: "0.75rem", color: "var(--muted)" }}>TOTAL ANALYZED</span>
            <Activity size={16} color="var(--accent)" />
          </div>
          <div className="font-tech" style={{ fontSize: "2rem", fontWeight: 700, marginTop: "8px", color: "var(--text)" }}>
            {summary?.total_analyzed ?? "42"}
          </div>
          <span className="mono" style={{ fontSize: "0.7rem", color: "var(--accent)" }}>100% Deterministic Scans</span>
        </div>

        <div className="cyber-panel" style={{ padding: "18px", borderRadius: "8px", border: "1px solid rgba(239, 68, 68, 0.3)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span className="mono" style={{ fontSize: "0.75rem", color: "#f87171" }}>CRITICAL THREATS</span>
            <AlertTriangle size={16} color="#ef4444" />
          </div>
          <div className="font-tech" style={{ fontSize: "2rem", fontWeight: 700, marginTop: "8px", color: "#ef4444" }}>
            {summary?.critical_threats ?? "14"}
          </div>
          <span className="mono" style={{ fontSize: "0.7rem", color: "#f87171" }}>Active Quarantine Required</span>
        </div>

        <div className="cyber-panel" style={{ padding: "18px", borderRadius: "8px", border: "1px solid rgba(245, 158, 11, 0.3)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span className="mono" style={{ fontSize: "0.75rem", color: "#fbbf24" }}>SUSPICIOUS EMAILS</span>
            <AlertTriangle size={16} color="#f59e0b" />
          </div>
          <div className="font-tech" style={{ fontSize: "2rem", fontWeight: 700, marginTop: "8px", color: "#f59e0b" }}>
            {summary?.suspicious_emails ?? "17"}
          </div>
          <span className="mono" style={{ fontSize: "0.7rem", color: "#fbbf24" }}>Anomalous Headers / Language</span>
        </div>

        <div className="cyber-panel" style={{ padding: "18px", borderRadius: "8px", border: "1px solid rgba(16, 185, 129, 0.3)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span className="mono" style={{ fontSize: "0.75rem", color: "#34d399" }}>SAFE / VERIFIED</span>
            <CheckCircle size={16} color="#10b981" />
          </div>
          <div className="font-tech" style={{ fontSize: "2rem", fontWeight: 700, marginTop: "8px", color: "#10b981" }}>
            {summary?.safe_emails ?? "11"}
          </div>
          <span className="mono" style={{ fontSize: "0.7rem", color: "#34d399" }}>SPF + DKIM + DMARC Pass</span>
        </div>

        <div className="cyber-panel" style={{ padding: "18px", borderRadius: "8px", border: "1px solid var(--border)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span className="mono" style={{ fontSize: "0.75rem", color: "var(--muted)" }}>MOST FREQUENT VECTOR</span>
            <TrendingUp size={16} color="var(--accent)" />
          </div>
          <div className="font-tech" style={{ fontSize: "1.1rem", fontWeight: 700, marginTop: "12px", color: "var(--accent)" }}>
            {summary?.most_frequent_threat_method ?? "Malicious URLs"}
          </div>
          <span className="mono" style={{ fontSize: "0.7rem", color: "var(--muted)" }}>Recurring Vector Lead</span>
        </div>
      </div>

      {/* Main Grid: Threat-Method Frequency Bars (Left) + Trends & Categories (Right) */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "24px" }}>
        
        {/* Threat Method Frequency */}
        <div className="cyber-panel" style={{ borderRadius: "8px", border: "1px solid var(--border)", padding: "22px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <div>
              <h3 className="font-tech" style={{ fontSize: "1.15rem", letterSpacing: "1px", color: "var(--text)" }}>
                THREAT METHOD FREQUENCY
              </h3>
              <p className="mono" style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: "4px" }}>
                AGGREGATED PERCENTAGE ACROSS ALL INCIDENT EVENTS
              </p>
            </div>
            <BarChart3 size={20} color="var(--accent)" />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {frequency?.methods?.map((m) => (
              <div key={m.code}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", marginBottom: "6px" }}>
                  <span style={{ fontWeight: 600, color: "var(--text)" }}>{m.label}</span>
                  <span className="mono" style={{ color: "var(--accent)" }}>
                    {m.percentage}% <span style={{ color: "var(--muted)", fontSize: "0.75rem" }}>({m.count})</span>
                  </span>
                </div>
                <div style={{
                  height: "8px",
                  borderRadius: "4px",
                  background: "rgba(255, 255, 255, 0.06)",
                  overflow: "hidden"
                }}>
                  <div style={{
                    height: "100%",
                    width: `${m.percentage}%`,
                    background: m.code.includes("MALICIOUS") || m.code.includes("BEC")
                      ? "linear-gradient(90deg, #ef4444, #f59e0b)"
                      : "linear-gradient(90deg, #2563eb, #00f3ff)",
                    borderRadius: "4px",
                    transition: "width 0.6s cubic-bezier(0.16, 1, 0.3, 1)"
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Time-Based Threat Trends & Categories */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          
          {/* Trend Chart Panel */}
          <div className="cyber-panel" style={{ borderRadius: "8px", border: "1px solid var(--border)", padding: "22px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div>
                <h3 className="font-tech" style={{ fontSize: "1.1rem", letterSpacing: "1px", color: "var(--text)" }}>
                  INCIDENT VOLUME TIMELINE
                </h3>
                <p className="mono" style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: "4px" }}>
                  METADATA DATABASE AGGREGATION
                </p>
              </div>

              {/* Time Range Selector */}
              <div style={{ display: "flex", gap: "4px", background: "var(--bg)", padding: "3px", borderRadius: "6px" }}>
                {["today", "7d", "30d"].map((r) => (
                  <button
                    key={r}
                    onClick={() => setTimeRange(r)}
                    style={{
                      padding: "4px 10px",
                      background: timeRange === r ? "var(--accent)" : "transparent",
                      color: timeRange === r ? "#05070e" : "var(--muted)",
                      border: "none",
                      borderRadius: "4px",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      cursor: "pointer"
                    }}
                  >
                    {r.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Visual Histogram / Bars */}
            <div style={{ display: "flex", alignItems: "flex-end", gap: "8px", height: "120px", paddingTop: "12px" }}>
              {trends?.points?.map((p, idx) => {
                const maxVal = 25;
                const hPct = Math.min(100, Math.max(15, (p.total_events / maxVal) * 100));
                return (
                  <div key={idx} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", height: "100%", justifyContent: "flex-end" }}>
                    <div className="mono" style={{ fontSize: "0.65rem", color: "var(--accent)", marginBottom: "4px" }}>
                      {p.total_events}
                    </div>
                    <div style={{
                      width: "100%",
                      maxWidth: "28px",
                      height: `${hPct}%`,
                      background: "linear-gradient(180deg, var(--accent), rgba(0, 243, 255, 0.2))",
                      border: "1px solid var(--accent)",
                      borderRadius: "4px 4px 0 0",
                      transition: "height 0.4s ease"
                    }} />
                    <span className="mono" style={{ fontSize: "0.65rem", color: "var(--muted)", marginTop: "6px" }}>
                      {p.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Threat Category Distribution */}
          <div className="cyber-panel" style={{ borderRadius: "8px", border: "1px solid var(--border)", padding: "22px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 className="font-tech" style={{ fontSize: "1.1rem", letterSpacing: "1px", color: "var(--text)" }}>
                THREAT CATEGORY DISTRIBUTION
              </h3>
              <Layers size={18} color="var(--accent)" />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "10px" }}>
              {categories?.categories?.map((cat) => (
                <div
                  key={cat.category}
                  style={{
                    padding: "10px 14px",
                    background: "rgba(255, 255, 255, 0.03)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "6px"
                  }}
                >
                  <div style={{ fontSize: "0.75rem", color: "var(--muted)", fontWeight: 600 }}>
                    {cat.category}
                  </div>
                  <div className="font-tech" style={{ fontSize: "1.4rem", fontWeight: 700, color: "var(--text)", marginTop: "4px" }}>
                    {cat.threat_count}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
