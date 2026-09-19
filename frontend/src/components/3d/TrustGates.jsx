import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox, Text } from "@react-three/drei";

function Gate({ label, verdict, position }) {
  const ref = useRef();
  const passed = verdict === "present";
  const failed = verdict === "missing" || verdict === "mismatch_detected";
  const color = passed ? "#00e5c8" : failed ? "#ff4d5e" : "#555";

  useFrame((_, delta) => {
    ref.current.rotation.y += delta * 0.1;
  });

  return (
    <group position={position}>
      <RoundedBox ref={ref} args={[0.9, 1.3, 0.08]} radius={0.05}>
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.5}
          transparent
          opacity={0.35}
          roughness={0.2}
        />
      </RoundedBox>
      <Text position={[0, -0.9, 0]} fontSize={0.14} color="#eaeaea" anchorX="center">
        {label}
      </Text>
      <Text position={[0, -1.1, 0]} fontSize={0.1} color={color} anchorX="center">
        {verdict ? verdict.toUpperCase() : "PENDING"}
      </Text>
    </group>
  );
}

// auth = { spf, dkim, dmarc } — pass real backend result, or null for a neutral demo state
export default function TrustGates({ auth }) {
  const spfVerdict = auth?.spf?.verdict;
  const dkimVerdict = auth?.dkim?.verdict;
  const dmarcVerdict = auth?.dmarc?.verdict;

  return (
    <group>
      <Gate label="SPF" verdict={spfVerdict} position={[-1.3, 0, 0]} />
      <Gate label="DKIM" verdict={dkimVerdict} position={[0, 0, 0]} />
      <Gate label="DMARC" verdict={dmarcVerdict} position={[1.3, 0, 0]} />
    </group>
  );
}