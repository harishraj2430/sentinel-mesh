import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { UploadCloud, FileCode, CheckCircle2, Shield, AlertTriangle, Zap } from "lucide-react";

export default function UploadCard({ onFileSelected, onSelectSample }) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState(null);
  const inputRef = useRef(null);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      setSelectedFileName(file.name);
      onFileSelected(file);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFileName(file.name);
      onFileSelected(file);
    }
  };

  return (
    <div className="cyber-panel" style={{ borderRadius: "10px", padding: "28px", border: "1px solid rgba(0, 243, 255, 0.25)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", borderBottom: "1px solid rgba(0, 243, 255, 0.1)", paddingBottom: "14px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <FileCode size={20} color="#00f3ff" />
          <h3 className="font-tech" style={{ fontSize: "1.2rem", letterSpacing: "2px", color: "#f1f5f9" }}>
            ADVANCED EVIDENCE IMPORT // RAW .EML INGESTION
          </h3>
        </div>
        <span className="mono" style={{ fontSize: "0.75rem", color: "#00f3ff", background: "rgba(0, 243, 255, 0.1)", padding: "3px 8px", borderRadius: "3px" }}>
          RFC 5322 COMPLIANT
        </span>
      </div>

      {/* Main Drag & Drop Zone */}
      <motion.div
        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current.click()}
        whileHover={{ scale: 1.01, borderColor: "rgba(0, 243, 255, 0.6)" }}
        whileTap={{ scale: 0.99 }}
        animate={{
          borderColor: dragActive ? "#00f3ff" : "rgba(0, 243, 255, 0.25)",
          backgroundColor: dragActive ? "rgba(0, 243, 255, 0.08)" : "rgba(9, 13, 24, 0.6)"
        }}
        style={{
          border: "2px dashed rgba(0, 243, 255, 0.25)",
          borderRadius: "8px",
          padding: "42px 24px",
          textAlign: "center",
          cursor: "pointer",
          position: "relative",
          overflow: "hidden"
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".eml"
          style={{ display: "none" }}
          onChange={handleFileChange}
        />

        <div style={{
          width: "52px",
          height: "52px",
          borderRadius: "50%",
          background: "rgba(0, 243, 255, 0.1)",
          border: "1px solid rgba(0, 243, 255, 0.3)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 16px"
        }}>
          <UploadCloud size={26} color="#00f3ff" />
        </div>

        <h4 className="font-tech" style={{ fontSize: "1.2rem", color: "#fff", letterSpacing: "1px" }}>
          {selectedFileName ? `EVIDENCE LOADED: ${selectedFileName}` : "DROP .EML RAW EVIDENCE FILE HERE OR CLICK TO BROWSE"}
        </h4>

        <p className="mono" style={{ fontSize: "0.8rem", color: "#94a3b8", marginTop: "8px" }}>
          Parses raw email headers, DKIM keys, MIME payloads, relay IP chain, and attachments for forensic extraction.
        </p>
      </motion.div>

      {/* Quick-Load Sample Attack Scenarios */}
      <div style={{ marginTop: "24px" }}>
        <p className="mono" style={{ fontSize: "0.75rem", color: "#94a3b8", marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
          <Zap size={14} color="#00f3ff" />
          OR INSTANTLY LOAD PRE-CONFIGURED ATTACK SCENARIO:
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "10px" }}>
          <button
            onClick={() => onSelectSample && onSelectSample("case-bec-01")}
            style={{
              background: "rgba(255, 46, 77, 0.1)",
              border: "1px solid rgba(255, 46, 77, 0.3)",
              color: "#ff2e4d",
              padding: "10px 14px",
              borderRadius: "6px",
              fontFamily: "'Chakra Petch', sans-serif",
              fontSize: "0.8rem",
              fontWeight: 600,
              cursor: "pointer",
              textAlign: "left",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}
          >
            <span>CEO WIRE FRAUD (BEC)</span>
            <AlertTriangle size={14} />
          </button>

          <button
            onClick={() => onSelectSample && onSelectSample("case-phish-02")}
            style={{
              background: "rgba(245, 158, 11, 0.1)",
              border: "1px solid rgba(245, 158, 11, 0.3)",
              color: "#f59e0b",
              padding: "10px 14px",
              borderRadius: "6px",
              fontFamily: "'Chakra Petch', sans-serif",
              fontSize: "0.8rem",
              fontWeight: 600,
              cursor: "pointer",
              textAlign: "left",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}
          >
            <span>M365 CREDENTIAL THEFT</span>
            <AlertTriangle size={14} />
          </button>

          <button
            onClick={() => onSelectSample && onSelectSample("case-malware-03")}
            style={{
              background: "rgba(255, 46, 77, 0.1)",
              border: "1px solid rgba(255, 46, 77, 0.3)",
              color: "#ff2e4d",
              padding: "10px 14px",
              borderRadius: "6px",
              fontFamily: "'Chakra Petch', sans-serif",
              fontSize: "0.8rem",
              fontWeight: 600,
              cursor: "pointer",
              textAlign: "left",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}
          >
            <span>INVOICE MALWARE (.ISO)</span>
            <AlertTriangle size={14} />
          </button>

          <button
            onClick={() => onSelectSample && onSelectSample("case-clean-04")}
            style={{
              background: "rgba(16, 185, 129, 0.1)",
              border: "1px solid rgba(16, 185, 129, 0.3)",
              color: "#10b981",
              padding: "10px 14px",
              borderRadius: "6px",
              fontFamily: "'Chakra Petch', sans-serif",
              fontSize: "0.8rem",
              fontWeight: 600,
              cursor: "pointer",
              textAlign: "left",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}
          >
            <span>CLEAN AUTHENTIC EMAIL</span>
            <CheckCircle2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}