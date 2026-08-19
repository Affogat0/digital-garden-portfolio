"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { MutableRefObject, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

type SceneProps = { progress: MutableRefObject<number>; onReady: () => void };

const flightCurve = new THREE.CatmullRomCurve3([
  new THREE.Vector3(0, 2.2, 6),
  new THREE.Vector3(1.8, 3.6, -4),
  new THREE.Vector3(-2.6, 4.4, -16),
  new THREE.Vector3(2.2, 4.1, -30),
  new THREE.Vector3(-1.8, 5.8, -44),
  new THREE.Vector3(0, 8.5, -58),
]);

const skyColors = ["#07100d", "#0a1b20", "#10202b", "#17231c", "#11152d"].map((color) => new THREE.Color(color));

function Bird({ root, leftWing, rightWing }: { root: React.RefObject<THREE.Group | null>; leftWing: React.RefObject<THREE.Group | null>; rightWing: React.RefObject<THREE.Group | null> }) {
  return <group ref={root}>
    <mesh scale={[0.24, 0.16, 0.72]}><sphereGeometry args={[1, 18, 12]} /><meshStandardMaterial color="#ffffff" emissive="#dcecff" emissiveIntensity={0.65} roughness={0.28} /></mesh>
    <mesh position={[0, 0.06, -0.67]}><sphereGeometry args={[0.17, 14, 10]} /><meshStandardMaterial color="#ffffff" emissive="#eaf3ff" emissiveIntensity={0.5} /></mesh>
    <mesh position={[0, 0.04, -0.89]} rotation={[-Math.PI / 2, 0, 0]}><coneGeometry args={[0.055, 0.28, 6]} /><meshStandardMaterial color="#e8d6a8" /></mesh>
    <group ref={leftWing} position={[-0.16, 0.04, -0.02]} rotation={[0, 0.08, 0.16]}>
      <mesh position={[-0.56, 0, 0.08]} rotation={[0, 0, Math.PI / 2]} scale={[0.24, 0.82, 0.1]}><coneGeometry args={[1, 1.4, 3]} /><meshStandardMaterial color="#ffffff" emissive="#dbe8ff" emissiveIntensity={0.42} side={THREE.DoubleSide} /></mesh>
    </group>
    <group ref={rightWing} position={[0.16, 0.04, -0.02]} rotation={[0, -0.08, -0.16]}>
      <mesh position={[0.56, 0, 0.08]} rotation={[0, 0, -Math.PI / 2]} scale={[0.24, 0.82, 0.1]}><coneGeometry args={[1, 1.4, 3]} /><meshStandardMaterial color="#ffffff" emissive="#dbe8ff" emissiveIntensity={0.42} side={THREE.DoubleSide} /></mesh>
    </group>
    <mesh position={[-0.12, 0, 0.64]} rotation={[Math.PI / 2, 0, 0.24]} scale={[0.13, 0.38, 0.08]}><coneGeometry args={[1, 1.3, 3]} /><meshStandardMaterial color="#f3f6ff" /></mesh>
    <mesh position={[0.12, 0, 0.64]} rotation={[Math.PI / 2, 0, -0.24]} scale={[0.13, 0.38, 0.08]}><coneGeometry args={[1, 1.3, 3]} /><meshStandardMaterial color="#f3f6ff" /></mesh>
  </group>;
}

function FlightRig({ progress }: Pick<SceneProps, "progress">) {
  const { camera, scene } = useThree();
  const bird = useRef<THREE.Group>(null);
  const leftWing = useRef<THREE.Group>(null);
  const rightWing = useRef<THREE.Group>(null);
  const birdPosition = useMemo(() => new THREE.Vector3(), []);
  const ahead = useMemo(() => new THREE.Vector3(), []);
  const thirdPerson = useMemo(() => new THREE.Vector3(), []);
  const firstPerson = useMemo(() => new THREE.Vector3(), []);
  const cameraTarget = useMemo(() => new THREE.Vector3(), []);
  const color = useMemo(() => new THREE.Color(), []);
  const elapsed = useRef(0);

  useFrame((_, delta) => {
    elapsed.current += delta;
    const journey = THREE.MathUtils.clamp(progress.current, 0, 1);
    const eased = THREE.MathUtils.smootherstep(journey, 0, 1);
    const viewpoint = THREE.MathUtils.smoothstep(journey, 0.045, 0.17);

    flightCurve.getPointAt(eased, birdPosition);
    flightCurve.getPointAt(Math.min(1, eased + 0.025), ahead);

    if (bird.current) {
      bird.current.position.copy(birdPosition);
      bird.current.lookAt(ahead);
      bird.current.rotateY(Math.PI);
      bird.current.rotation.z += Math.sin(journey * Math.PI * 5) * 0.002;
      bird.current.visible = viewpoint < 0.985;
      const birdScale = 0.9 - viewpoint * 0.48;
      bird.current.scale.setScalar(birdScale);
    }

    const flap = Math.sin(elapsed.current * (3.4 + journey * 5.5)) * (0.18 + Math.min(1, journey * 14) * 0.48);
    if (leftWing.current) leftWing.current.rotation.z = 0.16 + flap;
    if (rightWing.current) rightWing.current.rotation.z = -0.16 - flap;

    thirdPerson.copy(birdPosition).add(new THREE.Vector3(0, 1.8, 6.4));
    firstPerson.copy(birdPosition).add(new THREE.Vector3(0, 0.2, 0.48));
    thirdPerson.lerp(firstPerson, viewpoint);
    camera.position.lerp(thirdPerson, 1 - Math.exp(-delta * 3.1));
    cameraTarget.lerpVectors(birdPosition, ahead, viewpoint);
    camera.lookAt(cameraTarget);

    const palettePosition = journey * (skyColors.length - 1);
    const paletteIndex = Math.min(skyColors.length - 2, Math.floor(palettePosition));
    color.lerpColors(skyColors[paletteIndex], skyColors[paletteIndex + 1], palettePosition - paletteIndex);
    scene.background?.copy(color);
    if (scene.fog instanceof THREE.Fog) scene.fog.color.copy(color);
  });

  return <Bird root={bird} leftWing={leftWing} rightWing={rightWing} />;
}

function WindParticles() {
  const points = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const values = new Float32Array(80 * 3);
    for (let i = 0; i < 80; i += 1) {
      values[i * 3] = ((i * 37) % 31 - 15) * 0.42;
      values[i * 3 + 1] = ((i * 19) % 23 - 5) * 0.35;
      values[i * 3 + 2] = 10 - ((i * 29) % 73);
    }
    return values;
  }, []);
  useFrame((_, delta) => {
    const attribute = points.current?.geometry.getAttribute("position") as THREE.BufferAttribute | undefined;
    if (!attribute) return;
    for (let i = 0; i < attribute.count; i += 1) {
      const z = attribute.getZ(i) + delta * (0.8 + (i % 5) * 0.18);
      attribute.setZ(i, z > 12 ? -62 : z);
    }
    attribute.needsUpdate = true;
  });
  return <points ref={points}><bufferGeometry><bufferAttribute attach="attributes-position" args={[positions, 3]} /></bufferGeometry><pointsMaterial color="#e8f4ff" size={0.035} transparent opacity={0.46} sizeAttenuation /></points>;
}

function Cloud({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  return <group position={position} scale={scale}>
    <mesh scale={[1.8, 0.55, 0.8]}><sphereGeometry args={[1, 14, 9]} /><meshPhysicalMaterial color="#dce8ef" transparent opacity={0.1} transmission={0.5} depthWrite={false} /></mesh>
    <mesh position={[1.15, 0.18, 0]} scale={[1.1, 0.68, 0.75]}><sphereGeometry args={[1, 14, 9]} /><meshPhysicalMaterial color="#f0f6f8" transparent opacity={0.09} transmission={0.55} depthWrite={false} /></mesh>
    <mesh position={[-1.05, 0.08, 0.12]} scale={[0.9, 0.5, 0.65]}><sphereGeometry args={[1, 14, 9]} /><meshPhysicalMaterial color="#d9e6ec" transparent opacity={0.08} transmission={0.5} depthWrite={false} /></mesh>
  </group>;
}

function LaboratoryMarker() {
  return <group position={[2.3, -1, -8]}>
    <mesh><cylinderGeometry args={[4.2, 4.8, 0.35, 32]} /><meshStandardMaterial color="#17352f" metalness={0.4} /></mesh>
    <mesh position={[0, 1.5, 0]}><sphereGeometry args={[2.8, 24, 14, 0, Math.PI * 2, 0, Math.PI / 2]} /><meshPhysicalMaterial color="#91e8cf" transparent opacity={0.12} transmission={0.72} wireframe /></mesh>
    <mesh position={[0, 1, 0]}><cylinderGeometry args={[0.55, 0.55, 2, 18]} /><meshStandardMaterial color="#9df7c5" emissive="#2a7c59" emissiveIntensity={1.8} transparent opacity={0.62} /></mesh>
  </group>;
}

function CityMarker() {
  return <group position={[-2.5, -1.1, -22]}>
    {Array.from({ length: 11 }, (_, i) => { const height = 1.5 + (i % 5) * 0.75; return <mesh key={i} position={[(i % 4 - 1.5) * 1.35, height / 2, (Math.floor(i / 4) - 1) * 1.4]}><boxGeometry args={[0.8, height, 0.8]} /><meshStandardMaterial color="#122f40" emissive={i % 3 ? "#09202c" : "#1e709a"} emissiveIntensity={1.2} metalness={0.55} /></mesh>; })}
    <gridHelper args={[9, 12, "#61c5f3", "#173544"]} />
  </group>;
}

function ForestMarker() {
  return <group position={[2.2, -1.2, -36]}>
    <mesh rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[9, 10]} /><meshStandardMaterial color="#1d2b1d" /></mesh>
    {Array.from({ length: 16 }, (_, i) => { const height = 4 + (i % 6) * 0.55; return <mesh key={i} position={[(i % 2 ? 1 : -1) * (1.7 + (i % 5) * 0.58), height / 2, ((i * 17) % 13 - 6) * 0.5]}><cylinderGeometry args={[0.08, 0.12, height, 7]} /><meshStandardMaterial color={i % 3 ? "#567943" : "#88a85a"} /></mesh>; })}
    {[-1.2, 1.2].map((x) => <mesh key={x} position={[x, 1.4, 1]}><boxGeometry args={[0.38, 0.5, 0.38]} /><meshStandardMaterial color="#ffb461" emissive="#ff7d2f" emissiveIntensity={3} /></mesh>)}
  </group>;
}

function SkyMarker() {
  const nodes = useMemo(() => Array.from({ length: 18 }, (_, i) => new THREE.Vector3(((i * 37) % 15 - 7) * 0.52, ((i * 19) % 11 - 3) * 0.42, ((i * 23) % 9 - 4) * 0.38)), []);
  const geometry = useMemo(() => { const pairs: THREE.Vector3[] = []; nodes.slice(0, 13).forEach((node, i) => pairs.push(node, nodes[(i * 5 + 4) % nodes.length])); return new THREE.BufferGeometry().setFromPoints(pairs); }, [nodes]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <group position={[-1.8, 2.5, -51]}>
    {nodes.map((node, i) => <mesh key={i} position={node}><sphereGeometry args={[i % 5 ? 0.06 : 0.15, 9, 9]} /><meshBasicMaterial color={i % 5 ? "#b8b4ff" : "#ffffff"} /></mesh>)}
    <lineSegments geometry={geometry}><lineBasicMaterial color="#aaa7ef" transparent opacity={0.32} /></lineSegments>
  </group>;
}

function SceneContents({ progress, onReady }: SceneProps) {
  useEffect(() => onReady(), [onReady]);
  return <>
    <color attach="background" args={["#07100d"]} />
    <fog attach="fog" args={["#07100d", 8, 25]} />
    <ambientLight intensity={0.72} color="#c5dbe0" />
    <directionalLight position={[-6, 12, 7]} intensity={2.4} color="#fff6df" />
    <pointLight position={[-5, 7, -6]} color="#d9f1ff" intensity={24} distance={24} />
    <mesh position={[-6, 9, -10]}><sphereGeometry args={[0.55, 18, 18]} /><meshBasicMaterial color="#fff8db" /></mesh>
    <FlightRig progress={progress} />
    <WindParticles />
    <Cloud position={[-5, 4, 1]} scale={1.1} /><Cloud position={[5, 6, -8]} scale={1.4} /><Cloud position={[-5, 7, -18]} /><Cloud position={[5, 6, -30]} scale={1.2} /><Cloud position={[-4, 8, -44]} scale={1.35} />
    <LaboratoryMarker /><CityMarker /><ForestMarker /><SkyMarker />
  </>;
}

export function JourneyScene(props: SceneProps) {
  return <div className="scene-canvas" aria-hidden="true"><Canvas camera={{ position: [0, 4, 13], fov: 43, near: 0.1, far: 100 }} dpr={[1, 1.3]} gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}><SceneContents {...props} /></Canvas></div>;
}
