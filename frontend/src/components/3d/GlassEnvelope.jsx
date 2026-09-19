import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { MeshTransmissionMaterial, RoundedBox } from "@react-three/drei";

export default function GlassEnvelope({ hovered, setHovered }) {
  const ref = useRef();
  useFrame((state, delta) => {
    ref.current.rotation.y += delta * 0.25;
    ref.current.position.y = Math.sin(state.clock.elapsedTime * 0.8) * 0.08;
    const target = hovered ? 1.1 : 1;
    ref.current.scale.lerp({ x: target, y: target, z: target }, 0.08);
  });

  return (
    <group
      ref={ref}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <RoundedBox args={[2.2, 1.5, 0.15]} radius={0.06} smoothness={4}>
        <MeshTransmissionMaterial
          backside
          samples={6}
          thickness={0.6}
          roughness={0.05}
          transmission={1}
          ior={1.3}
          chromaticAberration={0.03}
          color={hovered ? "#00e5c8" : "#0f5a52"}
          emissive="#00e5c8"
          emissiveIntensity={hovered ? 0.4 : 0.1}
        />
      </RoundedBox>
      {/* envelope flap — simple triangular plane */}
      <mesh position={[0, 0.4, 0.08]} rotation={[0.5, 0, 0]}>
        <coneGeometry args={[1.1, 0.7, 3]} />
        <meshBasicMaterial color="#00e5c8" wireframe transparent opacity={0.4} />
      </mesh>
    </group>
  );
}