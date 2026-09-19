import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export default function CustomCursor() {
  const [pos, setPos] = useState({ x: -100, y: -100 });
  const [hoverType, setHoverType] = useState(null); // 'button', 'node', 'pin', null
  const [clicking, setClicking] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Hide cursor on touch devices
    if (window.matchMedia("(pointer: coarse)").matches) {
      return;
    }

    const move = (e) => {
      setPos({ x: e.clientX, y: e.clientY });
      if (!visible) setVisible(true);
    };

    const down = () => setClicking(true);
    const up = () => setClicking(false);

    const overCheck = (e) => {
      const pin = e.target.closest(".geo-pin");
      const node = e.target.closest(".evidence-node, .clickable-node");
      const btn = e.target.closest("button, a, input, [role='button'], [data-cursor-hover]");

      if (pin) {
        setHoverType("pin");
      } else if (node) {
        setHoverType("node");
      } else if (btn) {
        setHoverType("interactive");
      } else {
        setHoverType(null);
      }
    };

    const leave = () => setVisible(false);
    const enter = () => setVisible(true);

    window.addEventListener("mousemove", move);
    window.addEventListener("mousemove", overCheck);
    window.addEventListener("mousedown", down);
    window.addEventListener("mouseup", up);
    document.addEventListener("mouseleave", leave);
    document.addEventListener("mouseenter", enter);

    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mousemove", overCheck);
      window.removeEventListener("mousedown", down);
      window.removeEventListener("mouseup", up);
      document.removeEventListener("mouseleave", leave);
      document.removeEventListener("mouseenter", enter);
    };
  }, [visible]);

  if (!visible) return null;

  const isHovered = !!hoverType;
  const isNode = hoverType === "node";
  const isPin = hoverType === "pin";

  return (
    <>
      {/* Precision Reticle Crosshair */}
      <motion.div
        animate={{
          x: pos.x - 12,
          y: pos.y - 12,
          scale: clicking ? 0.85 : isHovered ? 1.25 : 1,
          rotate: clicking ? 45 : isHovered ? 90 : 0,
        }}
        transition={{ type: "spring", stiffness: 950, damping: 45, mass: 0.1 }}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: 24,
          height: 24,
          pointerEvents: "none",
          zIndex: 99999,
          transformOrigin: "center center",
        }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" style={{ filter: "drop-shadow(0 0 5px rgba(0, 243, 255, 0.7))" }}>
          {/* Subtle 4 Corner Brackets */}
          <path
            d={isHovered ? "M4 8 L4 4 L8 4 M16 4 L20 4 L20 8 M20 16 L20 20 L16 20 M8 20 L4 20 L4 16" : "M6 9 L6 6 L9 6 M15 6 L18 6 L18 9 M18 15 L18 18 L15 18 M9 18 L6 18 L6 15"}
            stroke={isNode || isPin ? "#00f3ff" : isHovered ? "#38bdf8" : "rgba(0, 243, 255, 0.85)"}
            strokeWidth="1.2"
            fill="none"
            strokeLinecap="round"
          />

          {/* Precision Crosshairs with center gap */}
          <line x1="12" y1="2" x2="12" y2="7" stroke="rgba(0, 243, 255, 0.9)" strokeWidth="1" strokeLinecap="round" />
          <line x1="12" y1="17" x2="12" y2="22" stroke="rgba(0, 243, 255, 0.9)" strokeWidth="1" strokeLinecap="round" />
          <line x1="2" y1="12" x2="7" y2="12" stroke="rgba(0, 243, 255, 0.9)" strokeWidth="1" strokeLinecap="round" />
          <line x1="17" y1="12" x2="22" y2="12" stroke="rgba(0, 243, 255, 0.9)" strokeWidth="1" strokeLinecap="round" />

          {/* Tiny Center Targeting Dot (2px) */}
          <circle cx="12" cy="12" r={isHovered ? "2" : "1.2"} fill={isNode ? "#ff2e4d" : "#00f3ff"} />
        </svg>
      </motion.div>

      {/* Micro Targeting Status Badge on Interactive Elements */}
      {isHovered && (
        <motion.div
          animate={{
            x: pos.x + 16,
            y: pos.y + 12,
            opacity: 1,
            scale: 1,
          }}
          initial={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.15 }}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            pointerEvents: "none",
            zIndex: 99998,
            background: "rgba(5, 7, 14, 0.92)",
            border: `1px solid ${isNode ? "rgba(255, 46, 77, 0.6)" : "rgba(0, 243, 255, 0.5)"}`,
            borderRadius: "3px",
            padding: "2px 6px",
            backdropFilter: "blur(6px)",
            boxShadow: "0 0 10px rgba(0, 243, 255, 0.25)",
            fontFamily: "var(--font-mono)",
            fontSize: "9px",
            letterSpacing: "0.8px",
            color: isNode ? "#ff2e4d" : "#00f3ff",
            whiteSpace: "nowrap",
          }}
        >
          {isPin ? "GEO TARGET LOCK" : isNode ? "IOC TELEMETRY" : "SELECT"}
        </motion.div>
      )}
    </>
  );
}