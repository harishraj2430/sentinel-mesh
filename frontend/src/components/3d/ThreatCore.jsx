import { useRef, useState, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Html, Line, Points, PointMaterial } from "@react-three/drei";
import * as THREE from "three";
import * as random from "maath/random";

// Floating cyber particle dust
function CyberDust({ count = 1200 }) {
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
      <PointMaterial transparent color="#00f3ff" size={0.015} sizeAttenuation depthWrite={false} opacity={0.35} />
    </Points>
  );
}

// Central Cryptographic Email Core
function CentralEmailCore({ isDeconstructed, isThreat }) {
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

  const coreColor = isThreat ? "#ff2e4d" : "#00f3ff";

  return (
    <group>
      {/* Central Solid Geometric Crystal (Email Payload Core) */}
      <mesh ref={meshRef}>
        <octahedronGeometry args={[0.7, 0]} />
        <meshStandardMaterial
          color={coreColor}
          emissive={coreColor}
          emissiveIntensity={isDeconstructed ? 1.5 : 0.8}
          roughness={0.15}
          metalness={0.8}
          wireframe={isDeconstructed}
        />
      </mesh>

      {/* Outer Wireframe Gyro Rings */}
      <mesh ref={wireRef}>
        <icosahedronGeometry args={[1.05, 1]} />
        <meshBasicMaterial
          color={coreColor}
          wireframe
          transparent
          opacity={isDeconstructed ? 0.6 : 0.25}
        />
      </mesh>
    </group>
  );
}

// Orbiting Forensic Node with interactive click-to-inspect
function ForensicSatellite({ name, basePos, expandedPos, isDeconstructed, color = "#00f3ff", status = "VERIFIED", info = "", selectedNode, onSelect }) {
  const groupRef = useRef();
  const isSelected = selectedNode === name;
  const currentPos = useRef(new THREE.Vector3(...basePos));
  const targetPos = useMemo(() => {
    if (isSelected) {
      const p = isDeconstructed ? expandedPos : basePos;
      return new THREE.Vector3(p[0] * 1.05, p[1] * 1.05, p[2] + 0.7);
    }
    return new THREE.Vector3(...(isDeconstructed ? expandedPos : basePos));
  }, [isDeconstructed, expandedPos, basePos, isSelected]);

  useFrame((_, delta) => {
    if (groupRef.current) {
      currentPos.current.lerp(targetPos, delta * 3.8);
      groupRef.current.position.copy(currentPos.current);
    }
  });

  return (
    <group ref={groupRef} position={basePos}>
      {/* Laser line to origin (0,0,0) */}
      <Line
        points={[[0, 0, 0], [-currentPos.current.x, -currentPos.current.y, -currentPos.current.z]]}
        color={isSelected ? "#00f3ff" : color}
        lineWidth={isSelected ? 2 : isDeconstructed ? 1.2 : 0.6}
        transparent
        opacity={isSelected ? 0.9 : isDeconstructed ? 0.65 : 0.2}
      />

      {/* Satellite Node Sphere with pointer events */}
      <mesh onClick={(e) => { e.stopPropagation(); onSelect(isSelected ? null : name); }}>
        <sphereGeometry args={[isSelected ? 0.16 : 0.11, 16, 16]} />
        <meshStandardMaterial
          color={isSelected ? "#ffffff" : color}
          emissive={color}
          emissiveIntensity={isSelected ? 2 : 1.2}
          roughness={0.1}
        />
      </mesh>

      {/* Pulse Beacon Ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.15, 0.19, 24]} />
        <meshBasicMaterial color={color} side={THREE.DoubleSide} transparent opacity={isSelected ? 0.9 : 0.5} />
      </mesh>

      {/* Forensic Node HUD Label */}
      <Html distanceFactor={6.8} center position={[0, 0.32, 0]}>
        <div
          onClick={(e) => { e.stopPropagation(); onSelect(isSelected ? null : name); }}
          style={{
            background: isSelected ? "rgba(10, 20, 38, 0.98)" : "rgba(5, 7, 14, 0.9)",
            border: `1.5px solid ${isSelected ? "#00f3ff" : color}`,
            boxShadow: `0 0 ${isSelected ? 20 : 10}px ${color}${isSelected ? "90" : "40"}`,
            padding: isSelected ? "6px 12px" : "3px 8px",
            borderRadius: "5px",
            whiteSpace: "nowrap",
            cursor: "pointer",
            backdropFilter: "blur(8px)",
            transition: "all 0.2s ease"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{
              fontFamily: "'Rajdhani', sans-serif",
              fontSize: isSelected ? "12px" : "10px",
              fontWeight: 700,
              color: "#fff",
              letterSpacing: "1px"
            }}>
              {name}
            </span>
            <span style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "8.5px",
              color: color,
              fontWeight: 600
            }}>
              [{status}]
            </span>
          </div>
          {isSelected && info && (
            <div style={{
              marginTop: "4px",
              paddingTop: "4px",
              borderTop: `1px solid ${color}40`,
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "8.5px",
              color: "#cbd5e1"
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
      group.current.rotation.y += (mouse.current.x * 0.45 - group.current.rotation.y) * 0.05;
      group.current.rotation.x += (mouse.current.y * 0.3 - group.current.rotation.x) * 0.05;
    }
  });
  return <group ref={group}>{children}</group>;
}

export default function ThreatCore({ isDeconstructed = false, isThreat = false, onToggleDeconstruct }) {
  const [localDeconstruct, setLocalDeconstruct] = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);
  const mouse = useRef({ x: 0, y: 0 });

  const activeDeconstruct = isDeconstructed || localDeconstruct;

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
      style={{ width: "100%", height: "350px", position: "relative", minHeight: "350px" }}
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
            fontFamily: "'Rajdhani', sans-serif",
            fontSize: "12px",
            letterSpacing: "2px",
            color: isThreat ? "#ff2e4d" : "#00f3ff",
            fontWeight: 700
          }}>
            FORENSIC EMAIL CORE // 3D TOPOLOGY
          </span>
        </div>
        <p style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: "9.5px",
          color: "#94a3b8"
        }}>
          {activeDeconstruct ? "MODE: DECONSTRUCTED FORENSIC NODES (CLICK NODE TO INSPECT)" : "MODE: ENCRYPTED CORE (IDLE)"}
        </p>
      </div>

      {/* Deconstruct Mode Toggle Button */}
      <div style={{
        position: "absolute",
        bottom: 14,
        right: 18,
        zIndex: 10
      }}>
        <button
          onClick={(e) => { e.stopPropagation(); handleToggle(); }}
          style={{
            background: activeDeconstruct ? "rgba(0, 243, 255, 0.15)" : "rgba(12, 17, 30, 0.85)",
            border: `1px solid ${activeDeconstruct ? "#00f3ff" : "rgba(0, 243, 255, 0.3)"}`,
            color: activeDeconstruct ? "#00f3ff" : "#eaeaea",
            padding: "6px 14px",
            borderRadius: "4px",
            fontFamily: "'Rajdhani', sans-serif",
            fontSize: "12px",
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

      <Canvas camera={{ position: [0, 0, 5.5], fov: 40 }}>
        <ambientLight intensity={0.45} />
        <pointLight position={[6, 6, 6]} intensity={1.5} color={isThreat ? "#ff2e4d" : "#00f3ff"} />
        <pointLight position={[-6, -4, -6]} intensity={0.6} color="#2563eb" />

        <Float speed={1.5} rotationIntensity={0.25} floatIntensity={0.35}>
          <SceneRig mouse={mouse}>
            {/* Central Crypto Core */}
            <CentralEmailCore isDeconstructed={activeDeconstruct} isThreat={isThreat} />

            {/* Orbiting Satellite Nodes: SPF, DKIM, DMARC, ARC, MTA-STS, IP/GEO, HEADERS, ATTACHMENTS */}
            <ForensicSatellite
              name="SPF GATE"
              basePos={[-0.85, 0.55, 0.3]}
              expandedPos={[-1.9, 1.2, 0.5]}
              isDeconstructed={activeDeconstruct}
              color="#00f3ff"
              status="ALIGNMENT"
              info="v=spf1 include:_spf.google.com ~all"
              selectedNode={selectedNode}
              onSelect={setSelectedNode}
            />
            <ForensicSatellite
              name="DKIM SIGNATURE"
              basePos={[0.85, 0.55, -0.25]}
              expandedPos={[1.9, 1.2, -0.3]}
              isDeconstructed={activeDeconstruct}
              color="#00f3ff"
              status="RSA-SHA256"
              info="s=20230601 d=domain.com Pass"
              selectedNode={selectedNode}
              onSelect={setSelectedNode}
            />
            <ForensicSatellite
              name="DMARC POLICY"
              basePos={[0.75, -0.65, 0.4]}
              expandedPos={[1.8, -1.2, 0.6]}
              isDeconstructed={activeDeconstruct}
              color="#3b82f6"
              status="STRICT ENFORCE"
              info="p=reject sp=reject aspf=r"
              selectedNode={selectedNode}
              onSelect={setSelectedNode}
            />
            <ForensicSatellite
              name="ARC CHAIN"
              basePos={[-0.75, -0.65, -0.35]}
              expandedPos={[-1.8, -1.2, -0.5]}
              isDeconstructed={activeDeconstruct}
              color="#10b981"
              status="VALID SEAL"
              info="Hop 1: Original -> Hop 2: Forwarder Valid"
              selectedNode={selectedNode}
              onSelect={setSelectedNode}
            />
            <ForensicSatellite
              name="MTA-STS & TLS"
              basePos={[0, 0.95, 0]}
              expandedPos={[0, 1.9, 0]}
              isDeconstructed={activeDeconstruct}
              color="#00f3ff"
              status="ENFORCED"
              info="mode: testing, max_age: 86400"
              selectedNode={selectedNode}
              onSelect={setSelectedNode}
            />
            <ForensicSatellite
              name="IP & GEO ROUTE"
              basePos={[-1.0, 0, 0]}
              expandedPos={[-2.1, 0, 0]}
              isDeconstructed={activeDeconstruct}
              color={isThreat ? "#ff2e4d" : "#00f3ff"}
              status="ASN / TRACE"
              info="Origin IP resolved through public gateway"
              selectedNode={selectedNode}
              onSelect={setSelectedNode}
            />
            <ForensicSatellite
              name="ATTACHMENT / SHA-256"
              basePos={[0, -0.95, 0]}
              expandedPos={[0, -1.9, 0]}
              isDeconstructed={activeDeconstruct}
              color={isThreat ? "#ff2e4d" : "#00f3ff"}
              status="HASH PROOF"
              info="Cryptographic digest verified"
              selectedNode={selectedNode}
              onSelect={setSelectedNode}
            />
          </SceneRig>
        </Float>

        <CyberDust />
      </Canvas>
    </div>
  );
}