import { useState, useRef, useEffect } from "react";
import Lenis from "lenis";
import { Shield, Sparkles, RefreshCw, AlertTriangle, CheckCircle, ChevronDown } from "lucide-react";

import Hero from "../components/sections/Hero";
import ThreatCore from "../components/3d/ThreatCore";
import ForensicVisualPanels from "../components/sections/ForensicVisualPanels";
import InvestigationSequence from "../components/sections/InvestigationSequence";
import GeoRadarMap from "../components/sections/GeoRadarMap";
import CaseReport from "../components/sections/CaseReport";
import EvidenceGraph from "../components/sections/EvidenceGraph";
import UploadCard from "../components/ui/UploadCard";
import GmailConnectModal from "../components/ui/GmailConnectModal";

import { analyzeEmail, analyzeSampleCase, getSampleCases } from "../services/api";

export default function LandingPage() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sampleCases, setSampleCases] = useState([]);
  const [isGmailModalOpen, setIsGmailModalOpen] = useState(false);
  const [isDeconstructedCore, setIsDeconstructedCore] = useState(false);

  const uploadRef = useRef(null);
  const sequenceRef = useRef(null);
  const reportRef = useRef(null);

  // Smooth Lenis scrolling
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    // Fetch preloaded sample cases
    async function loadSamples() {
      const list = await getSampleCases();
      setSampleCases(list);
    }
    loadSamples();

    return () => {
      lenis.destroy();
    };
  }, []);

  const runInvestigationPipeline = async (fetchReportPromise) => {
    setLoading(true);
    setError(null);
    setIsDeconstructedCore(true);

    // Scroll to sequence
    setTimeout(() => {
      sequenceRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);

    try {
      const result = await fetchReportPromise;
      setReport(result);
      // After sequence runs, scroll smoothly to the report
      setTimeout(() => {
        reportRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 5500);
    } catch (err) {
      console.error("ANALYSIS ERROR:", err);
      setError("Investigation engine encountered an error. Switched to fallback simulation.");
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelected = (file) => {
    if (!file) return;
    runInvestigationPipeline(analyzeEmail(file));
  };

  const handleSampleSelected = (caseId) => {
    runInvestigationPipeline(analyzeSampleCase(caseId));
  };

  return (
    <div style={{ background: "var(--bg)", minHeight: "100dvh" }}>
      {/* 1. CINEMATIC HERO */}
      <Hero
        onOpenGmail={() => setIsGmailModalOpen(true)}
        onScrollToUpload={() => uploadRef.current?.scrollIntoView({ behavior: "smooth" })}
      />

      {/* 2. FORENSIC EMAIL CORE 3D SHOWCASE */}
      <section style={{ padding: "80px 8% 40px", position: "relative" }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "20px", marginBottom: "32px" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                <Shield size={18} color="#00f3ff" />
                <span className="mono" style={{ fontSize: "0.8rem", color: "#00f3ff", letterSpacing: "2px" }}>
                  INTERACTIVE CRYPTOGRAPHIC ENGINE
                </span>
              </div>
              <h2 style={{ fontSize: "clamp(1.8rem, 3.2vw, 2.8rem)", textTransform: "uppercase", letterSpacing: "-0.02em" }}>
                THE FORENSIC EMAIL CORE
              </h2>
              <p style={{ color: "#94a3b8", maxWidth: "600px", marginTop: "8px", fontSize: "1rem" }}>
                When investigation commences, the encrypted email payload physically separates into its core constituent nodes: SPF, DKIM, DMARC, routing IP hops, header integrity, and payload hashes.
              </p>
            </div>
          </div>

          {/* 3D Canvas Box */}
          <div className="cyber-panel" style={{ borderRadius: "12px", height: "520px", border: "1px solid rgba(0, 243, 255, 0.3)", overflow: "hidden" }}>
            <ThreatCore
              isDeconstructed={isDeconstructedCore}
              isThreat={report?.threat_detected}
              onToggleDeconstruct={(val) => setIsDeconstructedCore(val)}
            />
          </div>
        </div>
      </section>

      {/* 3. FORENSIC VISUAL PANELS */}
      <ForensicVisualPanels />

      {/* 4. INVESTIGATION PIPELINE & UPLOAD SUITE */}
      <section ref={uploadRef} style={{ padding: "80px 8%", position: "relative" }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
          <div style={{ marginBottom: "32px" }}>
            <span className="mono" style={{ fontSize: "0.8rem", color: "#00f3ff", letterSpacing: "2px" }}>
              INVESTIGATION WORKSTATION
            </span>
            <h2 style={{ fontSize: "clamp(1.8rem, 3.2vw, 2.6rem)", textTransform: "uppercase", letterSpacing: "-0.02em", marginTop: "4px" }}>
              INGEST EVIDENCE FOR ANALYSIS
            </h2>
            <p style={{ color: "#94a3b8", maxWidth: "650px", marginTop: "8px" }}>
              Connect your Gmail account for automatic live scanning, drag & drop raw .eml evidence, or choose from pre-configured threat scenarios.
            </p>
          </div>

          {/* Advanced Evidence Upload Card */}
          <UploadCard
            onFileSelected={handleFileSelected}
            onSelectSample={handleSampleSelected}
          />

          {/* 5. 12-STAGE ANIMATED INVESTIGATION SEQUENCE */}
          <div ref={sequenceRef} style={{ marginTop: "48px" }}>
            <InvestigationSequence
              report={report}
              isRunning={loading}
              onComplete={() => {
                reportRef.current?.scrollIntoView({ behavior: "smooth" });
              }}
            />
          </div>

          {/* 6. FULL FORENSIC INVESTIGATION REPORT */}
          {report && (
            <div ref={reportRef}>
              <CaseReport report={report} />

              {/* 7. SENIOR WEB DESIGNER TACTICAL GEOLOCATION RADAR */}
              <div style={{ marginTop: "40px" }}>
                <GeoRadarMap
                  geoData={report.geo}
                  relayHops={report.relay_chain}
                />
              </div>

              {/* 8. THREAT CORRELATION EVIDENCE GRAPH */}
              <div style={{ marginTop: "40px" }}>
                <EvidenceGraph report={report} />
              </div>
            </div>
          )}

        </div>
      </section>

      {/* GMAIL CONNECT & MAILBOX MODAL */}
      <GmailConnectModal
        isOpen={isGmailModalOpen}
        onClose={() => setIsGmailModalOpen(false)}
        sampleCases={sampleCases}
        onSelectEmailForInvestigation={(caseId) => {
          handleSampleSelected(caseId);
        }}
      />
    </div>
  );
}