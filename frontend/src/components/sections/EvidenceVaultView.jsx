import { useState, useEffect } from "react";
import { Shield, Hash, CheckCircle, AlertTriangle, Database, Lock, RefreshCw, Cpu, Link as LinkIcon, Play } from "lucide-react";
import { getEvidenceVault, getBlockchainBlocks, verifyBlockchain, demoTamperDetection } from "../../services/api";

export default function EvidenceVaultView() {
  const [vaultItems, setVaultItems] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [chainStatus, setChainStatus] = useState({ valid: true, status: "checking" });
  const [tamperDemo, setTamperDemo] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [vaultRes, blocksRes, verifyRes] = await Promise.all([
        getEvidenceVault(),
        getBlockchainBlocks(),
        verifyBlockchain()
      ]);
      setVaultItems(vaultRes.items || []);
      setBlocks(blocksRes.blocks || []);
      setChainStatus(verifyRes);
    } catch (err) {
      console.error("Failed to load blockchain vault", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRunTamperDemo = async () => {
    try {
      const res = await demoTamperDetection();
      setTamperDemo(res);
    } catch (err) {
      console.error("Demo failed", err);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
      {/* Top Banner: Tamper-Evident Status & Purpose */}
      <div className="cyber-panel" style={{
        padding: "20px 24px",
        borderRadius: "8px",
        border: "1px solid var(--border)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "16px"
      }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Database size={22} color="var(--accent)" />
            <h2 className="font-tech" style={{ fontSize: "1.3rem", letterSpacing: "1.5px", color: "var(--text)" }}>
              EVIDENCE VAULT & BLOCKCHAIN LEDGER
            </h2>
          </div>
          <p className="mono" style={{ fontSize: "0.8rem", color: "var(--muted)", marginTop: "6px" }}>
            IMMUTABLE SHA-256 CHAIN-OF-CUSTODY & DIGITAL FORENSIC INTEGRITY
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            background: chainStatus.valid ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)",
            border: `1px solid ${chainStatus.valid ? "rgba(16, 185, 129, 0.4)" : "rgba(239, 68, 68, 0.4)"}`,
            padding: "8px 16px",
            borderRadius: "6px"
          }}>
            {chainStatus.valid ? <CheckCircle size={16} color="#10b981" /> : <AlertTriangle size={16} color="#ef4444" />}
            <span className="mono" style={{ fontSize: "0.8rem", fontWeight: 700, color: chainStatus.valid ? "#10b981" : "#ef4444" }}>
              {chainStatus.valid ? "✓ LEDGER INTEGRITY VERIFIED (0 TAMPERING)" : "⚠ INTEGRITY COMPROMISED"}
            </span>
          </div>

          <button
            onClick={loadData}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: "6px",
              padding: "8px 14px",
              color: "var(--text)",
              fontSize: "0.8rem",
              fontWeight: 600,
              cursor: "pointer"
            }}
          >
            <RefreshCw size={14} />
            Verify Chain
          </button>
        </div>
      </div>

      {/* Interactive Tamper Resistance Demo Panel */}
      <div className="cyber-panel" style={{
        padding: "20px 24px",
        borderRadius: "8px",
        border: "1px solid rgba(0, 243, 255, 0.25)",
        background: "linear-gradient(135deg, rgba(0, 243, 255, 0.04), rgba(37, 99, 235, 0.02))"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", marginBottom: "14px" }}>
          <div>
            <h3 className="font-tech" style={{ fontSize: "1.1rem", letterSpacing: "1px", color: "var(--text)" }}>
              LIVE DEMO: DETERMINISTIC SHA-256 TAMPER DETECTION
            </h3>
            <p className="mono" style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: "4px" }}>
              Test why blockchain provides a tamper-evident record of evidence integrity.
            </p>
          </div>

          <button
            onClick={handleRunTamperDemo}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              background: "linear-gradient(90deg, #2563eb, #00f3ff)",
              color: "#05070e",
              border: "none",
              borderRadius: "6px",
              padding: "8px 18px",
              fontFamily: "var(--font-ui)",
              fontSize: "0.85rem",
              fontWeight: 700,
              cursor: "pointer"
            }}
          >
            <Play size={14} />
            Simulate 1-Byte Tamper Test
          </button>
        </div>

        {tamperDemo && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginTop: "16px" }}>
            <div style={{ padding: "14px", background: "rgba(16, 185, 129, 0.06)", border: "1px solid rgba(16, 185, 129, 0.3)", borderRadius: "6px" }}>
              <span className="mono" style={{ fontSize: "0.75rem", color: "#10b981", fontWeight: 700 }}>AUTHENTIC ARTIFACT</span>
              <pre className="mono" style={{ fontSize: "0.75rem", marginTop: "6px", color: "var(--text)", whiteSpace: "pre-wrap" }}>
                {tamperDemo.authentic_payload}
              </pre>
              <div className="mono" style={{ fontSize: "0.7rem", color: "#10b981", marginTop: "8px", wordBreak: "break-all" }}>
                SHA-256: {tamperDemo.authentic_sha256}
              </div>
            </div>

            <div style={{ padding: "14px", background: "rgba(239, 68, 68, 0.06)", border: "1px solid rgba(239, 68, 68, 0.3)", borderRadius: "6px" }}>
              <span className="mono" style={{ fontSize: "0.75rem", color: "#ef4444", fontWeight: 700 }}>TAMPERED ARTIFACT (+1 ZERO IN AMOUNT)</span>
              <pre className="mono" style={{ fontSize: "0.75rem", marginTop: "6px", color: "var(--text)", whiteSpace: "pre-wrap" }}>
                {tamperDemo.tampered_payload}
              </pre>
              <div className="mono" style={{ fontSize: "0.7rem", color: "#ef4444", marginTop: "8px", wordBreak: "break-all" }}>
                SHA-256: {tamperDemo.tampered_sha256}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Blockchain Ledger Explorer */}
      <div className="cyber-panel" style={{ borderRadius: "8px", border: "1px solid var(--border)", overflow: "hidden" }}>
        <div style={{ padding: "18px 22px", background: "var(--bg-card)", borderBottom: "1px solid var(--border-subtle)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h3 className="font-tech" style={{ fontSize: "1.1rem", letterSpacing: "1px", color: "var(--text)" }}>
              CHAIN OF CUSTODY LEDGER BLOCKS ({blocks.length})
            </h3>
            <p className="mono" style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: "4px" }}>
              APPEND-ONLY AUDIT TRAIL ANCHORED BY PREVIOUS HASH POINTERS
            </p>
          </div>
          <span className="mono" style={{ fontSize: "0.75rem", color: "var(--accent)" }}>
            PostgreSQL Trigger Enforced
          </span>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.85rem" }}>
            <thead>
              <tr style={{ background: "rgba(255, 255, 255, 0.02)", borderBottom: "1px solid var(--border)", color: "var(--muted)" }}>
                <th style={{ padding: "12px 18px" }}>BLOCK / EVENT</th>
                <th style={{ padding: "12px 18px" }}>EVIDENCE ID</th>
                <th style={{ padding: "12px 18px" }}>ACTOR</th>
                <th style={{ padding: "12px 18px" }}>PREV HASH</th>
                <th style={{ padding: "12px 18px" }}>BLOCK SHA-256 HASH</th>
                <th style={{ padding: "12px 18px" }}>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {blocks.map((b, idx) => {
                const payload = b.payload || {};
                return (
                  <tr key={b.id || idx} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                    <td style={{ padding: "12px 18px" }}>
                      <div style={{ fontWeight: 700, color: "var(--text)" }}>
                        #{String(idx).padStart(3, "0")} {payload.event || "BLOCK"}
                      </div>
                      <span className="mono" style={{ fontSize: "0.7rem", color: "var(--muted)" }}>
                        {b.created_at || payload.timestamp}
                      </span>
                    </td>
                    <td style={{ padding: "12px 18px", fontFamily: "var(--font-mono)", color: "var(--accent)" }}>
                      {payload.evidence_id || "GENESIS"}
                    </td>
                    <td style={{ padding: "12px 18px", color: "var(--text-dim)" }}>
                      {payload.user_id || "system"}
                    </td>
                    <td style={{ padding: "12px 18px", fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--muted)" }}>
                      {b.prev_hash ? `${b.prev_hash.slice(0, 10)}...${b.prev_hash.slice(-6)}` : "GENESIS_ROOT"}
                    </td>
                    <td style={{ padding: "12px 18px", fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--accent)" }}>
                      {b.hash ? `${b.hash.slice(0, 14)}...${b.hash.slice(-8)}` : "—"}
                    </td>
                    <td style={{ padding: "12px 18px" }}>
                      <span style={{
                        background: "rgba(16, 185, 129, 0.1)",
                        color: "#10b981",
                        border: "1px solid rgba(16, 185, 129, 0.3)",
                        padding: "2px 8px",
                        borderRadius: "4px",
                        fontSize: "0.7rem",
                        fontFamily: "var(--font-mono)"
                      }}>
                        VERIFIED
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Captured Evidence Vault */}
      <div className="cyber-panel" style={{ borderRadius: "8px", border: "1px solid var(--border)", overflow: "hidden" }}>
        <div style={{ padding: "18px 22px", background: "var(--bg-card)", borderBottom: "1px solid var(--border-subtle)" }}>
          <h3 className="font-tech" style={{ fontSize: "1.1rem", letterSpacing: "1px", color: "var(--text)" }}>
            CAPTURED FORENSIC ARTIFACTS VAULT ({vaultItems.length})
          </h3>
          <p className="mono" style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: "4px" }}>
            DIGITAL FINGERPRINTS CAPTURED AT INGESTION TIME
          </p>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.85rem" }}>
            <thead>
              <tr style={{ background: "rgba(255, 255, 255, 0.02)", borderBottom: "1px solid var(--border)", color: "var(--muted)" }}>
                <th style={{ padding: "12px 18px" }}>EVIDENCE ID</th>
                <th style={{ padding: "12px 18px" }}>TYPE</th>
                <th style={{ padding: "12px 18px" }}>FILE / ARTIFACT</th>
                <th style={{ padding: "12px 18px" }}>SHA-256 DIGITAL FINGERPRINT</th>
                <th style={{ padding: "12px 18px" }}>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {vaultItems.map((item) => (
                <tr key={item.evidence_id} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                  <td style={{ padding: "12px 18px", fontFamily: "var(--font-mono)", color: "var(--accent)" }}>
                    {item.evidence_id}
                  </td>
                  <td style={{ padding: "12px 18px" }}>
                    <span style={{
                      background: "rgba(0, 243, 255, 0.1)",
                      color: "var(--accent)",
                      padding: "2px 8px",
                      borderRadius: "4px",
                      fontSize: "0.75rem",
                      fontWeight: 600
                    }}>
                      {item.type}
                    </span>
                  </td>
                  <td style={{ padding: "12px 18px", color: "var(--text)" }}>
                    {item.file_name}
                  </td>
                  <td style={{ padding: "12px 18px", fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--text-dim)", wordBreak: "break-all" }}>
                    {item.sha256}
                  </td>
                  <td style={{ padding: "12px 18px" }}>
                    <span style={{
                      background: "rgba(16, 185, 129, 0.1)",
                      color: "#10b981",
                      border: "1px solid rgba(16, 185, 129, 0.3)",
                      padding: "2px 8px",
                      borderRadius: "4px",
                      fontSize: "0.7rem",
                      fontFamily: "var(--font-mono)"
                    }}>
                      {item.status || "VERIFIED"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
