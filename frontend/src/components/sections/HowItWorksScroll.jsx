import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const STEPS = [
  { title: "INGEST", desc: "Raw .eml file parsed into a structured object — headers, body, attachments." },
  { title: "AUTHENTICATE", desc: "SPF, DKIM, and DMARC checked live against DNS records." },
  { title: "TRACE", desc: "First untrusted IP extracted from the relay chain, geolocated in real time." },
  { title: "SCORE LANGUAGE", desc: "Body text scanned for urgency and credential-harvesting phrasing." },
  { title: "CORRELATE", desc: "All signals merged into one confidence-calibrated verdict." },
];

export default function HowItWorksScroll() {
  const containerRef = useRef(null);
  const stepRefs = useRef([]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const panels = stepRefs.current;

      gsap.set(panels, { opacity: 0, y: 40 });
      gsap.set(panels[0], { opacity: 1, y: 0 });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top top",
          end: `+=${panels.length * 500}`,
          scrub: 1,
          pin: true,
        },
      });

      panels.forEach((panel, i) => {
        if (i > 0) {
          tl.to(panels[i - 1], { opacity: 0, y: -40, duration: 0.3 })
            .to(panel, { opacity: 1, y: 0, duration: 0.3 }, "<");
        }
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={containerRef} style={{
      height: "100vh", position: "relative", display: "flex",
      alignItems: "center", justifyContent: "center", overflow: "hidden"
    }}>
      <p className="mono" style={{ position: "absolute", top: "48px", left: "8%", color: "#00e5c8", letterSpacing: "3px" }}>
        HOW SENTINEL-MESH WORKS
      </p>
      {STEPS.map((step, i) => (
        <div
          key={i}
          ref={(el) => (stepRefs.current[i] = el)}
          style={{ position: "absolute", textAlign: "center", maxWidth: "600px", padding: "0 24px" }}
        >
          <span className="mono" style={{ color: "#00e5c8", fontSize: "0.9rem" }}>
            STEP {i + 1} / {STEPS.length}
          </span>
          <h2 style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", margin: "12px 0" }}>{step.title}</h2>
          <p style={{ color: "#999", fontSize: "1.1rem" }}>{step.desc}</p>
        </div>
      ))}
    </section>
  );
}