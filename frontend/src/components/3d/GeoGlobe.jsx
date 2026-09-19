import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Sphere, Line } from "@react-three/drei";
import * as THREE from "three";

function latLonToVec3(lat, lon, radius) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

// geo = { lat, lon } from real backend result, or null → shows globe with no tracer
export default function GeoGlobe({ geo }) {
  const globeRef = useRef();
  useFrame((_, delta) => { globeRef.current.rotation.y += delta * 0.06; });

  const point = useMemo(() => {
    if (!geo?.lat || !geo?.lon) return null;
    return latLonToVec3(geo.lat, geo.lon, 1.5);
  }, [geo]);

  const arcPoints = useMemo(() => {
    if (!point) return null;
    const start = new THREE.Vector3(0, 2.5, 0);
    const mid = point.clone().normalize().multiplyScalar(2.6);
    return [start, mid, point];
  }, [point]);

  return (
    <group>
      <Sphere ref={globeRef} args={[1.5, 48, 48]}>
        <meshBasicMaterial color="#0f5a52" wireframe transparent opacity={0.5} />
      </Sphere>
      {point && (
        <mesh position={point}>
          <sphereGeometry args={[0.04, 8, 8]} />
          <meshBasicMaterial color="#ff4d5e" />
        </mesh>
      )}
      {arcPoints && <Line points={arcPoints} color="#00e5c8" lineWidth={1.5} transparent opacity={0.7} />}
    </group>
  );
}