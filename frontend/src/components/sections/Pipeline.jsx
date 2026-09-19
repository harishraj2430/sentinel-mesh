import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import EnvelopeCore from "../3d/EnvelopeCore";
import NeonGrid from "../3d/NeonGrid";
import TrustGates from "../3d/TrustGates";
import GeoGlobe from "../3d/GeoGlobe";

gsap.registerPlugin(ScrollTrigger);

const STAGES = [
  {
    id: "intake",
    label: "01 — EVIDENCE INGESTION",
    title: "RAW EMAIL EVIDENCE",
    description:
      "The .eml source is parsed into structured forensic evidence.",
  },
  {
    id: "headers",
    label: "02 — HEADER FORENSICS",
    title: "READ THE HEADER",
    description:
      "Sender identity, routing information and message metadata are examined.",
  },
  {
    id: "authentication",
    label: "03 — TRUST VERIFICATION",
    title: "SPF · DKIM · DMARC",
    description:
      "Authentication signals are evaluated using the analyzed email and live DNS results.",
  },
  {
    id: "trace",
    label: "04 — INFRASTRUCTURE TRACE",
    title: "TRACE THE ORIGIN",
    description:
      "A public IP from the received chain is investigated when one is available.",
  },
  {
    id: "geo",
    label: "05 — NETWORK GEOLOCATION",
    title: "MAP THE NETWORK",
    description: "IP intelligence provides an approximate network location.",
  },
  {
    id: "correlation",
    label: "06 — THREAT CORRELATION",
    title: "CORRELATE THE SIGNALS",
    description:
      "Authentication, header and language signals are combined into the final assessment.",
  },
];

// Scroll / animation tuning — centralized for easy adjustment
const SCROLL_END_DISTANCE = "+=5000";
const SCROLL_SCRUB = 1;
const CAMERA_YAW_RANGE = Math.PI * 0.8;
const CAMERA_PITCH_AMPLITUDE = 0.12;

// Static style objects (module-level so they aren't recreated every render)
const styles = {
  overlayLabel: {
    position: "absolute",
    top: "48px",
    left: "8%",
    zIndex: 5,
    color: "#00f3ff",
    letterSpacing: "3px",
    fontSize: "0.75rem",
  },
  stageCounter: {
    position: "absolute",
    top: "48px",
    right: "8%",
    zIndex: 5,
    color: "#666",
    fontSize: "0.7rem",
  },
  stageTextWrapper: {
    position: "absolute",
    left: "8%",
    bottom: "12%",
    zIndex: 5,
    maxWidth: "520px",
    pointerEvents: "none",
  },
  stageLabel: {
    color: "#00f3ff",
    fontSize: "0.75rem",
    letterSpacing: "3px",
    marginBottom: "14px",
  },
  stageTitle: {
    fontFamily: "Cinzel, serif",
    fontSize: "clamp(2rem, 5vw, 4rem)",
    lineHeight: 1,
    marginBottom: "18px",
  },
  stageDescription: {
    color: "#999",
    fontFamily: "Inter, sans-serif",
    lineHeight: 1.6,
    maxWidth: "480px",
  },
  geoBlock: {
    marginTop: "20px",
    color: "#d4af37",
    fontSize: "0.75rem",
    lineHeight: 1.8,
  },
  correlationBlock: {
    marginTop: "20px",
    fontSize: "0.8rem",
  },
  section: {
    height: "100vh",
    position: "relative",
    background: "#08080a",
    overflow: "hidden",
  },
};

function StageText({ stage, report }) {
  const current = STAGES[stage];

  const geoLocation = useMemo(() => {
    if (!report?.geo) return null;
    return (
      [report.geo.city, report.geo.region, report.geo.country]
        .filter(Boolean)
        .join(", ") || "UNAVAILABLE"
    );
  }, [report?.geo]);

  return (
    <div style={styles.stageTextWrapper} aria-live="polite">
      <div className="mono" style={styles.stageLabel}>
        {current.label}
      </div>

      <h2 style={styles.stageTitle}>{current.title}</h2>

      <p style={styles.stageDescription}>{current.description}</p>

      {current.id === "geo" && report?.geo && (
        <div className="mono" style={styles.geoBlock}>
          <div>IP: {report.geo.ip || "UNAVAILABLE"}</div>
          <div>LOCATION: {geoLocation}</div>
          <div>PROVIDER: {report.geo.org || "UNAVAILABLE"}</div>
        </div>
      )}

      {current.id === "correlation" && report && (
        <div className="mono" style={styles.correlationBlock}>
          <div>
            SCORE:{" "}
            <span style={{ color: "#d4af37" }}>
              {report.overall_score ?? "—"}/100
            </span>
          </div>

          <div>
            VERDICT:{" "}
            <span style={{ color: "#00f3ff" }}>
              {report.overall_verdict || "UNKNOWN"}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Pipeline({ report }) {
  const containerRef = useRef(null);
  const cameraGroupRef = useRef(null);
  const [stage, setStage] = useState(0);

  /*
   * IMPORTANT:
   * No fake authentication data.
   * No fake geo coordinates.
   *
   * Before an actual email is analyzed, the 3D scene remains neutral.
   */
  const auth = report?.auth || null;
  const geo = report?.geo || null;

  useEffect(() => {
    if (!containerRef.current) return undefined;

    const ctx = gsap.context(() => {
      const trigger = ScrollTrigger.create({
        trigger: containerRef.current,
        start: "top top",
        end: SCROLL_END_DISTANCE,
        scrub: SCROLL_SCRUB,
        pin: true,

        onUpdate: (self) => {
          const progress = self.progress;

          const nextStage = Math.min(
            STAGES.length - 1,
            Math.floor(progress * STAGES.length)
          );

          setStage((previous) =>
            previous === nextStage ? previous : nextStage
          );

          if (cameraGroupRef.current) {
            cameraGroupRef.current.rotation.y = progress * CAMERA_YAW_RANGE;
            cameraGroupRef.current.rotation.x =
              Math.sin(progress * Math.PI) * CAMERA_PITCH_AMPLITUDE;
          }
        },
      });

      return () => trigger.kill();
    }, containerRef);

    return () => ctx.revert();
  }, []);

  // Central mapping of stage index -> 3D scene, avoids repetitive JSX conditionals
  const stageScene = useMemo(() => {
    switch (stage) {
      case 0:
        return <EnvelopeCore active={!!report} />;
      case 1:
        return <EnvelopeCore active={true} />;
      case 2:
      case 3:
        return <TrustGates auth={auth} />;
      case 4:
        return <GeoGlobe geo={geo} />;
      case 5:
        return <EnvelopeCore active={true} />;
      default:
        return null;
    }
  }, [stage, report, auth, geo]);

  return (
    <section ref={containerRef} style={styles.section}>
      <div className="mono" style={styles.overlayLabel}>
        SENTINEL-MESH / LIVE INVESTIGATION
      </div>

      <StageText stage={stage} report={report} />

      <div className="mono" style={styles.stageCounter}>
        {String(stage + 1).padStart(2, "0")} /{" "}
        {String(STAGES.length).padStart(2, "0")}
      </div>

      <Canvas
        camera={{
          position: [0, 0.5, 5],
          fov: 45,
        }}
      >
        <ambientLight intensity={0.35} />

        <pointLight position={[5, 5, 5]} color="#00f3ff" intensity={1} />

        <pointLight
          position={[-5, -3, -5]}
          color="#d4af37"
          intensity={0.7}
        />

        <group ref={cameraGroupRef}>{stageScene}</group>

        <NeonGrid />

        <EffectComposer>
          <Bloom
            intensity={0.5}
            luminanceThreshold={0.2}
            luminanceSmoothing={0.9}
          />
        </EffectComposer>
      </Canvas>
    </section>
  );
}