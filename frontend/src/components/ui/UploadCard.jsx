import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { UploadCloud, FileCode, CheckCircle2, Shield, AlertTriangle, Zap, X, AlertCircle } from "lucide-react";

const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15MB sensible limit
const ALLOWED_EXTENSIONS = [".eml", ".msg", ".txt"];

export default function UploadCard({ onFileSelected, onSelectSample, onClearFile }) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [validationError, setValidationError] = useState(null);
  const inputRef = useRef(null);

  const validateFile = async (file) => {
    if (!file) {
      return "Please attach a valid file to analyse (.eml, .msg, .txt).";
    }

    // Check size
    if (file.size === 0) {
      return "File is empty (0 bytes). Please upload a valid email file with headers and payload.";
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return `File exceeds the 15MB size limit (${(file.size / (1024 * 1024)).toFixed(1)}MB). Please upload a standard email artifact.`;
    }

    // Check extension
    const nameLower = file.name.toLowerCase();
    const hasValidExt = ALLOWED_EXTENSIONS.some(ext => nameLower.endsWith(ext));
    if (!hasValidExt) {
      return `Invalid file format "${file.name}". Supported formats are: .eml, .msg, .txt.`;
    }

    // Check content (non-whitespace)
    try {
      const slice = file.slice(0, 4096);
      const text = await slice.text();
      if (!text || text.trim().length === 0) {
        return "File contains only whitespace or empty content. Please attach a parseable email artifact.";
      }
    } catch (e) {
      return "Unable to read file content. Please check file permissions.";
    }

    return null;
  };

  const handleProcessFile = async (file) => {
    setValidationError(null);
    const errorMsg = await validateFile(file);
    if (errorMsg) {
      setValidationError(errorMsg);
      setSelectedFile(null);
      if (onClearFile) onClearFile();
      return;
    }

    setSelectedFile(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      handleProcessFile(file);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleProcessFile(file);
    }
  };

  const handleTriggerAnalysis = () => {
    if (!selectedFile) {
      setValidationError("Please attach a valid file to analyse (.eml, .msg, .txt).");
      return;
    }
    if (onFileSelected) {
      onFileSelected(selectedFile);
    }
  };

  const handleClear = (e) => {
    e.stopPropagation();
    setSelectedFile(null);
    setValidationError(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
    if (onClearFile) {
      onClearFile();
    }
  };

  return (
    <div className="cyber-panel" style={{ borderRadius: "10px", padding: "28px", border: "1px solid var(--border)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "14px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <FileCode size={20} color="var(--accent)" />
          <h3 className="font-tech" style={{ fontSize: "1.2rem", letterSpacing: "2px", color: "var(--text)" }}>
            ADVANCED EVIDENCE IMPORT // RAW .EML INGESTION
          </h3>
        </div>
        <span className="mono" style={{ fontSize: "0.75rem", color: "var(--accent)", background: "rgba(0, 243, 255, 0.1)", padding: "3px 8px", borderRadius: "3px" }}>
          RFC 5322 COMPLIANT
        </span>
      </div>

      {/* Main Drag & Drop Zone */}
      <motion.div
        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current.click()}
        whileHover={{ scale: 1.005 }}
        whileTap={{ scale: 0.995 }}
        animate={{
          borderColor: dragActive ? "var(--accent)" : "var(--border)",
          backgroundColor: dragActive ? "rgba(0, 243, 255, 0.08)" : "rgba(9, 13, 24, 0.5)"
        }}
        style={{
          border: "2px dashed var(--border)",
          borderRadius: "8px",
          padding: "36px 24px",
          textAlign: "center",
          cursor: "pointer",
          position: "relative",
          overflow: "hidden"
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".eml,.msg,.txt"
          style={{ display: "none" }}
          onChange={handleFileChange}
        />

        <div style={{
          width: "50px",
          height: "50px",
          borderRadius: "50%",
          background: "rgba(0, 243, 255, 0.1)",
          border: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 14px"
        }}>
          <UploadCloud size={24} color="var(--accent)" />
        </div>

        <h4 className="font-tech" style={{ fontSize: "1.1rem", color: "var(--text)", letterSpacing: "1px" }}>
          {selectedFile ? `EVIDENCE LOADED: ${selectedFile.name} (${(selectedFile.size / 1024).toFixed(1)} KB)` : "DROP .EML / .MSG / .TXT RAW EVIDENCE FILE HERE OR CLICK TO BROWSE"}
        </h4>

        <p className="mono" style={{ fontSize: "0.78rem", color: "var(--muted)", marginTop: "6px" }}>
          Maximum size: 15MB. Parses raw MIME boundaries, DKIM signatures, Received headers, and attachments.
        </p>

        {selectedFile && (
          <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", marginTop: "12px", background: "rgba(16, 185, 129, 0.15)", border: "1px solid var(--success-green)", padding: "4px 12px", borderRadius: "4px" }}>
            <CheckCircle2 size={14} color="var(--success-green)" />
            <span className="mono" style={{ fontSize: "0.78rem", color: "var(--success-green)" }}>VALIDATED FILE READY FOR EXTRACTION</span>
            <button
              onClick={handleClear}
              title="Remove file"
              style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", display: "flex", alignItems: "center", marginLeft: "4px" }}
            >
              <X size={14} />
            </button>
          </div>
        )}
      </motion.div>

      {/* Validation Error Message */}
      {validationError && (
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "14px", padding: "10px 14px", background: "rgba(255, 46, 77, 0.15)", border: "1px solid var(--threat-red)", borderRadius: "6px" }}>
          <AlertCircle size={16} color="var(--threat-red)" />
          <span className="mono" style={{ fontSize: "0.8rem", color: "var(--threat-red)" }}>
            {validationError}
          </span>
        </div>
      )}

      {/* Primary Action Button (Disabled when no valid file) */}
      <div style={{ marginTop: "18px", display: "flex", justifyContent: "flex-end" }}>
        <button
          onClick={handleTriggerAnalysis}
          disabled={!selectedFile}
          style={{
            padding: "12px 28px",
            background: selectedFile ? "linear-gradient(90deg, #2563eb, var(--accent))" : "rgba(255, 255, 255, 0.05)",
            border: `1px solid ${selectedFile ? "var(--accent)" : "rgba(255, 255, 255, 0.1)"}`,
            borderRadius: "6px",
            color: selectedFile ? "#05070e" : "var(--muted)",
            fontFamily: "var(--font-btn)",
            fontSize: "0.95rem",
            fontWeight: 700,
            letterSpacing: "1.5px",
            cursor: selectedFile ? "pointer" : "not-allowed",
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            boxShadow: selectedFile ? "0 0 20px var(--cyan-glow)" : "none",
            transition: "all 0.2s ease",
            opacity: selectedFile ? 1 : 0.6
          }}
        >
          <Shield size={16} />
          {selectedFile ? "LAUNCH FORENSIC DECONSTRUCTION →" : "ATTACH FILE TO ANALYSE"}
        </button>
      </div>

      {/* Quick-Load Sample Attack Scenarios */}
      <div style={{ marginTop: "24px", borderTop: "1px solid var(--border-subtle)", paddingTop: "18px" }}>
        <p className="mono" style={{ fontSize: "0.75rem", color: "var(--muted)", marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
          <Zap size={14} color="var(--accent)" />
          OR INSTANTLY LOAD PRE-CONFIGURED ATTACK SCENARIO:
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "10px" }}>
          <button
            onClick={() => onSelectSample && onSelectSample("case-bec-01")}
            style={{
              background: "rgba(255, 46, 77, 0.1)",
              border: "1px solid rgba(255, 46, 77, 0.3)",
              color: "var(--threat-red)",
              padding: "10px 14px",
              borderRadius: "6px",
              fontFamily: "var(--font-btn)",
              fontSize: "0.82rem",
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
              color: "var(--warning-amber)",
              padding: "10px 14px",
              borderRadius: "6px",
              fontFamily: "var(--font-btn)",
              fontSize: "0.82rem",
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
              color: "var(--threat-red)",
              padding: "10px 14px",
              borderRadius: "6px",
              fontFamily: "var(--font-btn)",
              fontSize: "0.82rem",
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
              color: "var(--success-green)",
              padding: "10px 14px",
              borderRadius: "6px",
              fontFamily: "var(--font-btn)",
              fontSize: "0.82rem",
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