import { useRef, useState, useMemo, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Float, Html, Line, Points, PointMaterial } from "@react-three/drei";
import * as THREE from "three";
import * as random from "maath/random";

// Floating cyber particle dust
function CyberDust({ count = 1200, isLight = false }) {
  const ref = useRef();
  const [positions] = useState(() => random.inSphere(new Float32Array(count * 3), { radius: 5.5 }));
  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.rotation.x -= delta / 35;
      ref.current.rotation.y -= delta / 40;
    }
  });
  return (
    <Points ref={ref} positions={positions} stride={3} frustumCulled>
      <PointMaterial transparent color={isLight ? "#0284c7" : "#00f3ff"} size={0.015} sizeAttenuation depthWrite={false} opacity={isLight ? 0.2 : 0.35} />
    </Points>
  );
}

// Central Cryptographic Email Core
function CentralEmailCore({ isDeconstructed, isThreat, isLight }) {
  const meshRef = useRef();
  const wireRef = useRef();

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.5;
      meshRef.current.rotation.x += delta * 0.25;
      const t = state.clock.elapsedTime;
      const scale = 1 + Math.sin(t * 2) * 0.04;
      meshRef.current.scale.set(scale, scale, scale);
    }
    if (wireRef.current) {
      wireRef.current.rotation.y -= delta * 0.3;
      wireRef.current.rotation.z += delta * 0.2;
    }
  });

  const coreColor = isThreat ? (isLight ? "#dc2626" : "#ff2e4d") : (isLight ? "#0284c7" : "#00f3ff");

  return (
    <group>
      <mesh ref={meshRef}>
        <octahedronGeometry args={[0.7, 0]} />
        <meshStandardMaterial
          color={coreColor}
          emissive={coreColor}
          emissiveIntensity={isDeconstructed ? 1.4 : 0.75}
          roughness={0.15}
          metalness={0.8}
          wireframe={isDeconstructed}
        />
      </mesh>

      <mesh ref={wireRef}>
        <icosahedronGeometry args={[1.05, 1]} />
        <meshBasicMaterial
          color={coreColor}
          wireframe
          transparent
          opacity={isDeconstructed ? 0.55 : 0.25}
        />
      </mesh>
    </group>
  );
}

// Orbiting Forensic Node with interactive click-to-inspect
function ForensicSatellite({ name, basePos, expandedPos, isDeconstructed, color = "#00f3ff", status = "VERIFIED", info = "", selectedNode, onSelect, isLight = false }) {
  const groupRef = useRef();
  const isSelected = selectedNode === name;
  const currentPos = useRef(new THREE.Vector3(...basePos));
  const targetPos = useMemo(() => {
    if (isSelected) {
      const p = isDeconstructed ? expandedPos : basePos;
      return new THREE.Vector3(p[0] * 1.05, p[1] * 1.05, p[2] + 0.6);
    }
    return new THREE.Vector3(...(isDeconstructed ? expandedPos : basePos));
  }, [isDeconstructed, expandedPos, basePos, isSelected]);

  useFrame((_, delta) => {
    if (groupRef.current) {
      currentPos.current.lerp(targetPos, delta * 3.8);
      groupRef.current.position.copy(currentPos.current);
    }
  });

  const themeColor = isLight ? (color === "#00f3ff" ? "#0284c7" : color === "#ff2e4d" ? "#dc2626" : color) : color;

  return (
    <group ref={groupRef} position={basePos}>
      {/* Laser line to origin (0,0,0) */}
      <Line
        points={[[0, 0, 0], [-currentPos.current.x, -currentPos.current.y, -currentPos.current.z]]}
        color={isSelected ? (isLight ? "#0284c7" : "#00f3ff") : themeColor}
        lineWidth={isSelected ? 2 : isDeconstructed ? 1.2 : 0.6}
        transparent
        opacity={isSelected ? 0.9 : isDeconstructed ? 0.65 : 0.25}
      />

      {/* Satellite Node Sphere */}
      <mesh onClick={(e) => { e.stopPropagation(); onSelect(isSelected ? null : name); }}>
        <sphereGeometry args={[isSelected ? 0.15 : 0.1, 16, 16]} />
        <meshStandardMaterial
          color={isSelected ? "#ffffff" : themeColor}
          emissive={themeColor}
          emissiveIntensity={isSelected ? 2 : 1.2}
          roughness={0.1}
        />
      </mesh>

      {/* Pulse Beacon Ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.13, 0.17, 24]} />
        <meshBasicMaterial color={themeColor} side={THREE.DoubleSide} transparent opacity={isSelected ? 0.9 : 0.5} />
      </mesh>

      {/* Forensic Node HUD Label */}
      <Html distanceFactor={7.5} center position={[0, 0.28, 0]} zIndexRange={[10, 50]}>
        <div
          onClick={(e) => { e.stopPropagation(); onSelect(isSelected ? null : name); }}
          style={{
            background: isLight 
              ? (isSelected ? "rgba(255, 255, 255, 0.98)" : "rgba(248, 250, 252, 0.92)")
              : (isSelected ? "rgba(10, 20, 38, 0.98)" : "rgba(5, 7, 14, 0.92)"),
            border: `1.5px solid ${isSelected ? (isLight ? "#0284c7" : "#00f3ff") : themeColor}`,
            boxShadow: isLight
              ? `0 2px 10px rgba(0,0,0,0.12)`
              : `0 0 ${isSelected ? 20 : 10}px ${themeColor}${isSelected ? "90" : "40"}`,
            padding: isSelected ? "5px 10px" : "3px 7px",
            borderRadius: "5px",
            whiteSpace: "nowrap",
            cursor: "pointer",
            backdropFilter: "blur(8px)",
            transition: "all 0.2s ease",
            userSelect: "none"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            <span style={{
              fontFamily: "var(--font-node)",
              fontSize: isSelected ? "11px" : "9.5px",
              fontWeight: 700,
              color: isLight ? "#0f172a" : "#fff",
              letterSpacing: "0.8px"
            }}>
              {name}
            </span>
            <span style={{
              fontFamily: "var(--font-node)",
              fontSize: "8px",
              color: themeColor,
              fontWeight: 600
            }}>
              [{status}]
            </span>
          </div>
          {isSelected && info && (
            <div style={{
              marginTop: "3px",
              paddingTop: "3px",
              borderTop: `1px solid ${themeColor}40`,
              fontFamily: "var(--font-node)",
              fontSize: "8px",
              color: isLight ? "#475569" : "#cbd5e1"
            }}>
              {info}
            </div>
          )}
        </div>
      </Html>
    </group>
  );
}

// Scene Rig for Mouse Parallax
function SceneRig({ children, mouse }) {
  const group = useRef();
  useFrame(() => {
    if (group.current) {
      group.current.rotation.y += (mouse.current.x * 0.4 - group.current.rotation.y) * 0.05;
      group.current.rotation.x += (mouse.current.y * 0.25 - group.current.rotation.x) * 0.05;
    }
  });
  return <group ref={group}>{children}</group>;
}

// Dynamic Camera Controller to Fit All Nodes (Fix 4: fitCameraToNodes)
function DynamicCameraController({ isDeconstructed, fitKey }) {
  const { camera } = useThree();
  const targetZ = useRef(isDeconstructed ? 6.8 : 5.4);
  const targetY = useRef(isDeconstructed ? 0.05 : 0);

  useEffect(() => {
    // When deconstructed, top node (MTA-STS) is at Y=1.5 and label at Y=1.78.
    // At FOV 40, distance Z=6.8 gives vertical span of 2 * 6.8 * tan(20°) ≈ 4.95 (Y = -2.47 to +2.47),
    // which easily contains all 7 nodes with > 25% margin top/bottom and zero clipping under HUD.
    targetZ.current = isDeconstructed ? 6.8 : 5.4;
    targetY.current = isDeconstructed ? 0.05 : 0;
  }, [isDeconstructed, fitKey]);

  useFrame((_, delta) => {
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetZ.current, delta * 3.5);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetY.current, delta * 3.5);
  });

  return null;
}

export default function ThreatCore({ isDeconstructed = false, isThreat = false, onToggleDeconstruct }) {
  const [localDeconstruct, setLocalDeconstruct] = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);
  const [fitKey, setFitKey] = useState(0);
  const mouse = useRef({ x: 0, y: 0 });
  const [isLight, setIsLight] = useState(false);

  const activeDeconstruct = isDeconstructed || localDeconstruct;

  // Listen to live theme attribute changes on documentElement
  useEffect(() => {
    const checkTheme = () => {
      setIsLight(document.documentElement.getAttribute("data-theme") === "light");
    };
    checkTheme();
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);

  // Keyboard shortcut 'F' to fit view
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "f" || e.key === "F") {
        if (!e.target.closest("input, textarea")) {
          setFitKey(k => k + 1);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handlePointerMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mouse.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.current.y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
  };

  const handleToggle = () => {
    setLocalDeconstruct(prev => !prev);
    if (onToggleDeconstruct) {
      onToggleDeconstruct(!activeDeconstruct);
    }
  };

  return (
    <div
      style={{ width: "100%", height: "420px", position: "relative", minHeight: "380px" }}
      onPointerMove={handlePointerMove}
      onClick={() => setSelectedNode(null)}
    >
      {/* Top Telemetry Overlay */}
      <div style={{
        position: "absolute",
        top: 14,
        left: 18,
        zIndex: 10,
        display: "flex",
        flexDirection: "column",
        gap: "3px",
        pointerEvents: "none"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span className={`pulse-dot ${isThreat ? "pulse-dot-red" : ""}`} />
          <span style={{
            fontFamily: "var(--font-tech)",
            fontSize: "12px",
            letterSpacing: "2px",
            color: isThreat ? "var(--danger)" : "var(--accent)",
            fontWeight: 700
          }}>
            FORENSIC EMAIL CORE // 3D TOPOLOGY
          </span>
        </div>
        <p style={{
          fontFamily: "var(--font-mono)",
          fontSize: "9.5px",
          color: "var(--muted)"
        }}>
          {activeDeconstruct ? "MODE: DECONSTRUCTED FORENSIC NODES (ALL 7 VISIBLE)" : "MODE: ENCRYPTED CORE (IDLE)"}
        </p>
      </div>

      {/* Control Actions: Deconstruct Toggle + Fit View (Key: F) */}
      <div style={{
        position: "absolute",
        bottom: 14,
        right: 18,
        zIndex: 10,
        display: "flex",
        gap: "8px",
        alignItems: "center"
      }}>
        <button
          onClick={(e) => { e.stopPropagation(); setFitKey(k => k + 1); }}
          title="Recenter and fit all nodes into view (Shortcut: F)"
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            color: "var(--text)",
            padding: "6px 12px",
            borderRadius: "4px",
            fontFamily: "var(--font-btn)",
            fontSize: "11px",
            fontWeight: 700,
            letterSpacing: "1px",
            cursor: "pointer",
            backdropFilter: "blur(8px)",
            transition: "all 0.2s ease"
          }}
        >
          FIT VIEW (F)
        </button>

        <button
          onClick={(e) => { e.stopPropagation(); handleToggle(); }}
          style={{
            background: activeDeconstruct ? "rgba(0, 243, 255, 0.15)" : "var(--bg-card)",
            border: `1px solid ${activeDeconstruct ? "var(--accent)" : "var(--border)"}`,
            color: activeDeconstruct ? "var(--accent)" : "var(--text)",
            padding: "6px 14px",
            borderRadius: "4px",
            fontFamily: "var(--font-btn)",
            fontSize: "11px",
            fontWeight: 700,
            letterSpacing: "1px",
            cursor: "pointer",
            backdropFilter: "blur(8px)",
            transition: "all 0.2s ease"
          }}
        >
          {activeDeconstruct ? "ASSEMBLE CORE" : "DECONSTRUCT NODES"}
        </button>
      </div>

      <Canvas camera={{ position: [0, 0, activeDeconstruct ? 6.8 : 5.4], fov: 40 }}>
        <DynamicCameraController isDeconstructed={activeDeconstruct} fitKey={fitKey} />
        <ambientLight intensity={isLight ? 0.7 : 0.45} />
        <pointLight position={[6, 6, 6]} intensity={1.5} color={isThreat ? "#ff2e4d" : "#00f3ff"} />
        <pointLight position={[-6, -4, -6]} intensity={0.6} color="#2563eb" />

        <Float speed={1.2} rotationIntensity={0.2} floatIntensity={0.25}>
          <SceneRig mouse={mouse}>
            <CentralEmailCore isDeconstructed={activeDeconstruct} isThreat={isThreat} isLight={isLight} />

            {/* Orbiting Satellite Nodes: SPF, DKIM, DMARC, ARC, MTA-STS, IP/GEO, ATTACHMENTS */}
            <ForensicSatellite
              name="SPF GATE"
              basePos={[-0.8, 0.5, 0.3]}
              expandedPos={[-1.7, 0.95, 0.4]}
              isDeconstructed={activeDeconstruct}
              color="#00f3ff"
              status="ALIGNMENT"
              info="v=spf1 include:_spf.google.com ~all"
              selectedNode={selectedNode}
              onSelect={setSelectedNode}
              isLight={isLight}
            />
            <ForensicSatellite
              name="DKIM SIGNATURE"
              basePos={[0.8, 0.5, -0.25]}
              expandedPos={[1.7, 0.95, -0.3]}
              isDeconstructed={activeDeconstruct}
              color="#00f3ff"
              status="RSA-SHA256"
              info="s=20230601 d=domain.com Pass"
              selectedNode={selectedNode}
              onSelect={setSelectedNode}
              isLight={isLight}
            />
            <ForensicSatellite
              name="DMARC POLICY"
              basePos={[0.7, -0.55, 0.4]}
              expandedPos={[1.6, -0.95, 0.5]}
              isDeconstructed={activeDeconstruct}
              color="#3b82f6"
              status="STRICT ENFORCE"
              info="p=reject sp=reject aspf=r"
              selectedNode={selectedNode}
              onSelect={setSelectedNode}
              isLight={isLight}
            />
            <ForensicSatellite
              name="ARC CHAIN"
              basePos={[-0.7, -0.55, -0.35]}
              expandedPos={[-1.6, -0.95, -0.4]}
              isDeconstructed={activeDeconstruct}
              color="#10b981"
              status="VALID SEAL"
              info="Hop 1: Original -> Hop 2: Forwarder Valid"
              selectedNode={selectedNode}
              onSelect={setSelectedNode}
              isLight={isLight}
            />
            <ForensicSatellite
              name="MTA-STS & TLS"
              basePos={[0, 0.85, 0]}
              expandedPos={[0, 1.5, 0]}
              isDeconstructed={activeDeconstruct}
              color="#00f3ff"
              status="ENFORCED"
              info="mode: testing, max_age: 86400"
              selectedNode={selectedNode}
              onSelect={setSelectedNode}
              isLight={isLight}
            />
            <ForensicSatellite
              name="IP & GEO ROUTE"
              basePos={[-0.95, 0, 0]}
              expandedPos={[-1.85, 0, 0]}
              isDeconstructed={activeDeconstruct}
              color={isThreat ? "#ff2e4d" : "#00f3ff"}
              status="ASN / TRACE"
              info="Origin IP resolved through public gateway"
              selectedNode={selectedNode}
              onSelect={setSelectedNode}
              isLight={isLight}
            />
            <ForensicSatellite
              name="ATTACHMENT / SHA-256"
              basePos={[0, -0.85, 0]}
              expandedPos={[0, -1.5, 0]}
              isDeconstructed={activeDeconstruct}
              color={isThreat ? "#ff2e4d" : "#00f3ff"}
              status="HASH PROOF"
              info="Cryptographic digest verified"
              selectedNode={selectedNode}
              onSelect={setSelectedNode}
              isLight={isLight}
            />
          </SceneRig>
        </Float>

        <CyberDust isLight={isLight} />
      </Canvas>
    </div>
  );
}