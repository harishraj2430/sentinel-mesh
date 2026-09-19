import { memo, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { MeshTransmissionMaterial, Line } from "@react-three/drei";
import * as THREE from "three";

// Tunable constants
const ROTATION_SPEED = 0.2;
const BREATHE_SPEED = 1.2;
const BREATHE_AMPLITUDE = 0.03;
const ACTIVE_SCALE = 1.08;
const SCALE_LERP_FACTOR = 0.08;

function useEnvelopeShapes() {
  return useMemo(() => {
    const bodyPoints = [
      new THREE.Vector3(-1.2, -0.75, 0),
      new THREE.Vector3(1.2, -0.75, 0),
      new THREE.Vector3(1.2, 0.75, 0),
      new THREE.Vector3(-1.2, 0.75, 0),
      new THREE.Vector3(-1.2, -0.75, 0),
    ];

    const flapPoints = [
      new THREE.Vector3(-1.2, 0.75, 0.01),
      new THREE.Vector3(0, -0.05, 0.01),
      new THREE.Vector3(1.2, 0.75, 0.01),
    ];

    return { bodyPoints, flapPoints };
  }, []);
}

function EnvelopeCore({ active = false }) {
  const groupRef = useRef();
  const scaleTarget = useRef(new THREE.Vector3(1, 1, 1));
  const { bodyPoints, flapPoints } = useEnvelopeShapes();

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    groupRef.current.rotation.y += delta * ROTATION_SPEED;

    const breathe =
      1 + Math.sin(state.clock.elapsedTime * BREATHE_SPEED) * BREATHE_AMPLITUDE;

    const target = (active ? ACTIVE_SCALE : 1) * breathe;

    scaleTarget.current.set(target, target, target);
    groupRef.current.scale.lerp(scaleTarget.current, SCALE_LERP_FACTOR);
  });

  const lineColor = useMemo(
    () => (active ? "#00f3ff" : "#d4af37"),
    [active]
  );

  const bodyMaterialProps = useMemo(
    () => ({
      color: active ? "#00f3ff" : "#3a2f10",
      emissive: active ? "#00f3ff" : "#d4af37",
      emissiveIntensity: active ? 0.35 : 0.12,
    }),
    [active]
  );

  return (
    <group ref={groupRef}>
      {/* Glass email body */}
      <mesh position={[0, 0, -0.02]}>
        <planeGeometry args={[2.4, 1.5]} />

        <MeshTransmissionMaterial
          backside
          samples={6}
          thickness={0.4}
          roughness={0.1}
          transmission={1}
          ior={1.25}
          chromaticAberration={0.02}
          {...bodyMaterialProps}
        />
      </mesh>

      {/* Envelope outline */}
      <Line
        points={bodyPoints}
        color={lineColor}
        lineWidth={1.5}
        transparent
        opacity={0.9}
      />

      {/* Envelope flap */}
      <Line
        points={flapPoints}
        color={lineColor}
        lineWidth={1.5}
        transparent
        opacity={0.9}
      />

      {/* Threat indicator */}
      <mesh position={[1.05, 0.6, 0.05]}>
        <sphereGeometry args={[0.035, 8, 8]} />

        <meshBasicMaterial
          color="#ff2e4d"
          transparent
          opacity={active ? 1 : 0.6}
        />
      </mesh>
    </group>
  );
}

export default memo(EnvelopeCore);