"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { MutableRefObject, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

type SceneProps = { progress: MutableRefObject<number>; onReady: () => void };

const cameraPoints = [
  new THREE.Vector3(0, 9, 17),
  new THREE.Vector3(1.5, 4.8, 2),
  new THREE.Vector3(-2.8, 4.4, -12),
  new THREE.Vector3(2.7, 4.1, -27),
  new THREE.Vector3(-1.8, 7, -41),
];

const sceneColors = ["#07100d", "#071b18", "#071522", "#152016", "#0d1027"].map(
  (color) => new THREE.Color(color),
);

const BIRD_FADE_START = 0.18;
const BIRD_HIDDEN_AT = 0.245;

function CameraRig({ progress }: Pick<SceneProps, "progress">) {
  const { camera, scene } = useThree();
  const position = useMemo(() => new THREE.Vector3(), []);
  const lookAt = useMemo(() => new THREE.Vector3(), []);
  const color = useMemo(() => new THREE.Color(), []);

  useFrame((_, delta) => {
    const scaled = progress.current * (cameraPoints.length - 1);
    const index = Math.min(cameraPoints.length - 2, Math.floor(scaled));
    const local = THREE.MathUtils.smootherstep(scaled - index, 0, 1);
    position.lerpVectors(cameraPoints[index], cameraPoints[index + 1], local);
    camera.position.lerp(position, 1 - Math.exp(-delta * 2.8));
    lookAt.set(0, 1.5, camera.position.z - 7.5);
    camera.lookAt(lookAt);
    color.lerpColors(sceneColors[index], sceneColors[index + 1], local);
    scene.background?.copy(color);
    if (scene.fog instanceof THREE.Fog) scene.fog.color.copy(color);
  });
  return null;
}

function GuideBird({ progress }: Pick<SceneProps, "progress">) {
  const { camera } = useThree();
  const bird = useRef<THREE.Group>(null);
  const leftWing = useRef<THREE.Group>(null);
  const rightWing = useRef<THREE.Group>(null);
  const mainMaterial = useRef<THREE.MeshBasicMaterial>(null);
  const rightMainMaterial = useRef<THREE.MeshBasicMaterial>(null);
  const leftFacetMaterial = useRef<THREE.MeshBasicMaterial>(null);
  const rightFacetMaterial = useRef<THREE.MeshBasicMaterial>(null);
  const bodyMaterial = useRef<THREE.MeshBasicMaterial>(null);
  const tailMaterial = useRef<THREE.MeshBasicMaterial>(null);
  const glow = useRef<THREE.PointLight>(null);
  const position = useRef(new THREE.Vector3());
  const forward = useRef(new THREE.Vector3());
  const right = useRef(new THREE.Vector3());
  const up = useRef(new THREE.Vector3());
  const elapsed = useRef(0);
  const wingGeometry = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0.02);
    shape.lineTo(-0.58, 0.32);
    shape.lineTo(-1.72, 0.56);
    shape.lineTo(-1.18, 0.02);
    shape.lineTo(-0.62, -0.34);
    shape.lineTo(-0.2, -0.1);
    shape.closePath();
    return new THREE.ShapeGeometry(shape);
  }, []);
  const wingFacetGeometry = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(-0.58, 0.32);
    shape.lineTo(-1.72, 0.56);
    shape.lineTo(-1.18, 0.02);
    shape.closePath();
    return new THREE.ShapeGeometry(shape);
  }, []);
  const bodyGeometry = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0.38);
    shape.lineTo(0.24, 0.02);
    shape.lineTo(0.09, -0.5);
    shape.lineTo(0, -0.88);
    shape.lineTo(-0.09, -0.5);
    shape.lineTo(-0.24, 0.02);
    shape.closePath();
    return new THREE.ShapeGeometry(shape);
  }, []);
  const tailGeometry = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.lineTo(0.3, -0.68);
    shape.lineTo(0, -0.48);
    shape.lineTo(-0.3, -0.68);
    shape.closePath();
    return new THREE.ShapeGeometry(shape);
  }, []);

  useEffect(() => () => {
    wingGeometry.dispose();
    wingFacetGeometry.dispose();
    bodyGeometry.dispose();
    tailGeometry.dispose();
  }, [bodyGeometry, tailGeometry, wingFacetGeometry, wingGeometry]);

  useFrame((_, delta) => {
    elapsed.current += delta;
    const journey = THREE.MathUtils.clamp(progress.current, 0, 1);
    const intro = THREE.MathUtils.clamp(journey / BIRD_HIDDEN_AT, 0, 1);
    const easedIntro = THREE.MathUtils.smootherstep(intro, 0, 1);
    const opacity = 1 - THREE.MathUtils.smoothstep(journey, BIRD_FADE_START, BIRD_HIDDEN_AT);

    if (bird.current && journey >= BIRD_HIDDEN_AT) {
      bird.current.visible = false;
      return;
    }

    camera.getWorldDirection(forward.current);
    right.current.set(1, 0, 0).applyQuaternion(camera.quaternion);
    up.current.set(0, 1, 0).applyQuaternion(camera.quaternion);

    const distance = THREE.MathUtils.lerp(8, 1.5, easedIntro);
    const lateral = THREE.MathUtils.lerp(-0.7, 0, easedIntro) + Math.sin(easedIntro * Math.PI) * 0.35;
    const vertical = THREE.MathUtils.lerp(-0.65, -0.08, easedIntro) + Math.sin(easedIntro * Math.PI) * 0.12;
    position.current.copy(camera.position)
      .addScaledVector(forward.current, distance)
      .addScaledVector(right.current, lateral)
      .addScaledVector(up.current, vertical);
    position.current.addScaledVector(up.current, Math.sin(elapsed.current * 1.55) * 0.06);

    if (bird.current) {
      bird.current.visible = true;
      bird.current.position.lerp(position.current, 1 - Math.exp(-delta * 4.2));
      bird.current.quaternion.copy(camera.quaternion);
      const bank = Math.sin(easedIntro * Math.PI) * -0.08 + Math.sin(elapsed.current * 0.8) * 0.018;
      bird.current.rotateZ(bank);
      const breath = 1 + Math.sin(elapsed.current * 1.35) * 0.018;
      bird.current.scale.setScalar(THREE.MathUtils.lerp(0.64, 0.24, easedIntro) * breath);
    }

    const flap = Math.sin(elapsed.current * (2.7 + intro * 1.2)) * (0.09 + intro * 0.055);
    if (leftWing.current) leftWing.current.rotation.z = 0.025 + flap;
    if (rightWing.current) rightWing.current.rotation.z = -0.025 - flap;
    if (mainMaterial.current) mainMaterial.current.opacity = opacity;
    if (rightMainMaterial.current) rightMainMaterial.current.opacity = opacity;
    if (leftFacetMaterial.current) leftFacetMaterial.current.opacity = opacity * 0.62;
    if (rightFacetMaterial.current) rightFacetMaterial.current.opacity = opacity * 0.5;
    if (bodyMaterial.current) bodyMaterial.current.opacity = opacity;
    if (tailMaterial.current) tailMaterial.current.opacity = opacity;
    if (glow.current) glow.current.intensity = opacity * 1.8;
  });

  return <group ref={bird} scale={0.64}>
    <group ref={leftWing}>
      <mesh geometry={wingGeometry}><meshBasicMaterial ref={mainMaterial} color="#ffffff" transparent side={THREE.DoubleSide} toneMapped={false} /></mesh>
      <mesh geometry={wingFacetGeometry} position={[0, 0, 0.012]}><meshBasicMaterial ref={leftFacetMaterial} color="#dce5ed" transparent opacity={0.62} side={THREE.DoubleSide} toneMapped={false} /></mesh>
    </group>
    <group ref={rightWing} scale={[-1, 1, 1]}>
      <mesh geometry={wingGeometry}><meshBasicMaterial ref={rightMainMaterial} color="#ffffff" transparent side={THREE.DoubleSide} toneMapped={false} /></mesh>
      <mesh geometry={wingFacetGeometry} position={[0, 0, 0.012]}><meshBasicMaterial ref={rightFacetMaterial} color="#eef3f6" transparent opacity={0.5} side={THREE.DoubleSide} toneMapped={false} /></mesh>
    </group>
    <mesh geometry={bodyGeometry} position={[0, 0.01, 0.024]}><meshBasicMaterial ref={bodyMaterial} color="#ffffff" transparent side={THREE.DoubleSide} toneMapped={false} /></mesh>
    <mesh geometry={tailGeometry} position={[0, -0.48, 0.018]}><meshBasicMaterial ref={tailMaterial} color="#edf2f6" transparent side={THREE.DoubleSide} toneMapped={false} /></mesh>
    <pointLight ref={glow} color="#e7f4ff" intensity={1.8} distance={2.4} position={[0, 0, 0.4]} />
  </group>;
}

function LineSegments({ points, color, opacity = 0.45 }: { points: THREE.Vector3[]; color: string; opacity?: number }) {
  const geometry = useMemo(() => new THREE.BufferGeometry().setFromPoints(points), [points]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <lineSegments geometry={geometry}><lineBasicMaterial color={color} transparent opacity={opacity} /></lineSegments>;
}

function CellField() {
  const group = useRef<THREE.Group>(null);
  const cells = useMemo(() => Array.from({ length: 13 }, (_, i) => ({
    position: [((i * 37) % 17 - 8) * 0.48, 0.8 + ((i * 23) % 11) * 0.34, ((i * 19) % 9 - 4) * 0.45] as [number, number, number],
    scale: 0.08 + (i % 4) * 0.035,
  })), []);
  useFrame(({ clock }) => {
    if (group.current) group.current.rotation.y = Math.sin(clock.elapsedTime * 0.2) * 0.08;
  });
  return <group ref={group}>{cells.map((cell, i) => <mesh key={i} position={cell.position} scale={cell.scale}><icosahedronGeometry args={[1, 1]} /><meshPhysicalMaterial color={i % 3 ? "#8ff3c3" : "#d7fff0"} emissive="#226a4a" emissiveIntensity={1.3} roughness={0.25} transmission={0.22} /></mesh>)}</group>;
}

function Laboratory() {
  const dataLines = useMemo(() => Array.from({ length: 7 }, (_, i) => new THREE.Vector3(2.85 + i * 0.15, 0.35, -1.2 + (i % 3) * 0.22)), []);
  return <group position={[1.7, -0.9, -5]}>
    <mesh position={[0, -0.12, 0]} receiveShadow><cylinderGeometry args={[5.6, 6.1, 0.35, 48]} /><meshStandardMaterial color="#102d28" metalness={0.45} roughness={0.5} /></mesh>
    <gridHelper args={[11, 16, "#69d7b0", "#173d35"]} position={[0, 0.08, 0]} />
    <group position={[0.2, 1.7, 0]}>
      <mesh position={[0, 1.25, 0]}><cylinderGeometry args={[3.25, 3.25, 2.5, 10, 1, true]} /><meshPhysicalMaterial color="#7ce7c3" transparent opacity={0.13} transmission={0.72} roughness={0.12} side={THREE.DoubleSide} depthWrite={false} /></mesh>
      {Array.from({ length: 10 }, (_, i) => { const angle = (i / 10) * Math.PI * 2; return <mesh key={i} position={[Math.cos(angle) * 3.25, 1.25, Math.sin(angle) * 3.25]}><boxGeometry args={[0.055, 2.55, 0.055]} /><meshBasicMaterial color="#94f5d0" transparent opacity={0.65} /></mesh>; })}
      <mesh position={[0, 2.55, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[3.25, 0.055, 8, 48]} /><meshBasicMaterial color="#8ef0ca" transparent opacity={0.7} /></mesh>
    </group>
    <group position={[0, 1.55, 0]}>
      <mesh><cylinderGeometry args={[0.82, 0.82, 2.8, 32]} /><meshPhysicalMaterial color="#baffdf" transparent opacity={0.28} transmission={0.65} roughness={0.08} /></mesh>
      <mesh position={[0, -0.9, 0]}><cylinderGeometry args={[0.68, 0.68, 0.8, 32]} /><meshPhysicalMaterial color="#8cf1c7" emissive="#237854" emissiveIntensity={2.2} transparent opacity={0.72} /></mesh>
      {[0, 1, 2].map((ring) => <mesh key={ring} rotation={[ring * 0.65, ring * 0.9, 0.25]}><torusGeometry args={[1.25 + ring * 0.35, 0.018, 6, 64]} /><meshBasicMaterial color="#abffdf" transparent opacity={0.55 - ring * 0.12} /></mesh>)}
    </group>
    <group position={[-2.65, 1.5, 0.45]} rotation={[0, 0.35, 0]}>
      <mesh><boxGeometry args={[1.75, 1.15, 0.08]} /><meshPhysicalMaterial color="#80e9ca" transparent opacity={0.2} transmission={0.65} /></mesh>
      {[-0.34, 0, 0.34].map((y, i) => <mesh key={i} position={[0, y, 0.055]}><boxGeometry args={[1.35 - i * 0.18, 0.035, 0.02]} /><meshBasicMaterial color={i === 1 ? "#ffffff" : "#8ff2cf"} /></mesh>)}
      <mesh position={[0.48, -0.08, 0.06]}><circleGeometry args={[0.23, 24]} /><meshBasicMaterial color="#9df7c5" transparent opacity={0.5} wireframe /></mesh>
    </group>
    <group position={[3.2, 0, -0.7]}>{dataLines.map((position, i) => <mesh key={i} position={position} scale={[1, 1 + (i % 4) * 0.7, 1]}><cylinderGeometry args={[0.018, 0.018, 0.8, 5]} /><meshBasicMaterial color="#a4ffdb" transparent opacity={0.55} /></mesh>)}</group>
    <CellField />
    <pointLight color="#9df7c5" intensity={22} distance={12} position={[0, 3.5, 1]} />
  </group>;
}

function SoftwareCity() {
  const buildings = useMemo(() => Array.from({ length: 17 }, (_, i) => ({ x: (i % 5 - 2) * 1.35, z: (Math.floor(i / 5) - 1.4) * 1.55, height: 1.6 + ((i * 7) % 6) * 0.62, width: 0.78 + (i % 3) * 0.12 })), []);
  const network = useMemo(() => { const points: THREE.Vector3[] = []; buildings.slice(0, 12).forEach((building, i) => { const next = buildings[(i * 5 + 3) % buildings.length]; points.push(new THREE.Vector3(building.x, building.height + 0.15, building.z), new THREE.Vector3(next.x, next.height + 0.15, next.z)); }); return points; }, [buildings]);
  return <group position={[-2.1, -1, -19]}>
    <mesh position={[0, -0.08, 0]}><boxGeometry args={[9.5, 0.22, 8]} /><meshStandardMaterial color="#091822" metalness={0.65} roughness={0.4} /></mesh>
    <gridHelper args={[10, 20, "#4eb8ed", "#122e3c"]} />
    {buildings.map((building, i) => <group key={i} position={[building.x, 0, building.z]}>
      <mesh position={[0, building.height / 2, 0]} castShadow><boxGeometry args={[building.width, building.height, building.width]} /><meshStandardMaterial color={i % 5 === 0 ? "#163f56" : "#102935"} emissive="#071a24" emissiveIntensity={0.75} metalness={0.6} roughness={0.3} /></mesh>
      {Array.from({ length: Math.min(6, Math.floor(building.height / 0.55)) }, (_, row) => <mesh key={row} position={[0, 0.45 + row * 0.52, building.width / 2 + 0.006]}><boxGeometry args={[building.width * 0.62, 0.075, 0.012]} /><meshBasicMaterial color={(row + i) % 4 === 0 ? "#e4fbff" : "#69cdf8"} transparent opacity={0.8} /></mesh>)}
      <mesh position={[0, building.height + 0.12, 0]}><sphereGeometry args={[0.07, 8, 8]} /><meshBasicMaterial color="#a9e7ff" /></mesh>
    </group>)}
    <LineSegments points={network} color="#75ccff" opacity={0.3} />
    <group position={[3.65, 1.25, 1.3]}><mesh><boxGeometry args={[1.4, 2.5, 1]} /><meshStandardMaterial color="#0b202b" metalness={0.75} roughness={0.25} /></mesh>{Array.from({ length: 7 }, (_, i) => <mesh key={i} position={[0, 0.85 - i * 0.27, 0.51]}><boxGeometry args={[1.08, 0.11, 0.025]} /><meshBasicMaterial color={i % 3 ? "#3e9ec9" : "#d2f5ff"} /></mesh>)}</group>
    {[[-3.5, 0.05, 2.7], [0, 0.055, 2.7], [3.5, 0.05, 2.7]].map((position, i) => <mesh key={i} position={position as [number, number, number]}><boxGeometry args={[2.5, 0.035, 0.08]} /><meshBasicMaterial color="#69cfff" transparent opacity={0.65} /></mesh>)}
    <pointLight color="#76c7ff" intensity={24} distance={13} position={[0, 5, 2]} />
  </group>;
}

function Lantern({ position }: { position: [number, number, number] }) {
  return <group position={position}><mesh position={[0, 1.05, 0]}><cylinderGeometry args={[0.025, 0.025, 2.1, 6]} /><meshStandardMaterial color="#281c12" /></mesh><mesh position={[0, 2.08, 0]}><boxGeometry args={[0.55, 0.5, 0.55]} /><meshStandardMaterial color="#ffbd68" emissive="#ff8a33" emissiveIntensity={3.2} transparent opacity={0.82} /></mesh><mesh position={[0, 2.38, 0]}><boxGeometry args={[0.62, 0.06, 0.62]} /><meshStandardMaterial color="#2b1b11" /></mesh><pointLight color="#ffad5c" intensity={9} distance={5} position={[0, 2, 0]} /></group>;
}

function BambooForest() {
  const bamboo = useMemo(() => Array.from({ length: 30 }, (_, i) => ({ x: (i % 2 ? 1 : -1) * (2.1 + ((i * 31) % 15) * 0.22), z: ((i * 19) % 21 - 10) * 0.38, height: 4.6 + (i % 7) * 0.48, lean: ((i % 5) - 2) * 0.018 })), []);
  return <group position={[2.1, -1.2, -33]}>
    <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[12, 13]} /><meshStandardMaterial color="#172318" roughness={1} /></mesh>
    <mesh position={[0, 0.035, 0.4]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[2.5, 12]} /><meshStandardMaterial color="#6b5133" roughness={0.95} /></mesh>
    {bamboo.map((stem, i) => <group key={i} position={[stem.x, stem.height / 2, stem.z]} rotation={[0, 0, stem.lean]}><mesh castShadow><cylinderGeometry args={[0.09, 0.14, stem.height, 8]} /><meshStandardMaterial color={i % 3 ? "#496b36" : "#759447"} roughness={0.9} /></mesh>{[-0.28, 0.12, 0.48].map((offset, ring) => <mesh key={ring} position={[0, offset * stem.height, 0]}><torusGeometry args={[0.125, 0.018, 4, 8]} /><meshStandardMaterial color="#9bb568" /></mesh>)}{i % 3 === 0 && <mesh position={[stem.x > 0 ? -0.36 : 0.36, stem.height * 0.25, 0]} rotation={[0, 0, stem.x > 0 ? -0.7 : 0.7]}><planeGeometry args={[0.75, 0.22]} /><meshStandardMaterial color="#759a4d" side={THREE.DoubleSide} /></mesh>}</group>)}
    <Lantern position={[-1.55, 0, 1.8]} /><Lantern position={[1.55, 0, -1.1]} /><Lantern position={[-1.55, 0, -3.7]} />
    <pointLight color="#d7ee7d" intensity={10} distance={13} position={[0, 5, 1]} />
  </group>;
}

function RisingParticles() {
  const points = useRef<THREE.Points>(null);
  const positions = useMemo(() => { const values = new Float32Array(42 * 3); for (let i = 0; i < 42; i += 1) { values[i * 3] = ((i * 37) % 23 - 11) * 0.34; values[i * 3 + 1] = ((i * 17) % 31) * 0.24 - 1.5; values[i * 3 + 2] = ((i * 29) % 17 - 8) * 0.3; } return values; }, []);
  useFrame((_, delta) => { const attribute = points.current?.geometry.getAttribute("position") as THREE.BufferAttribute | undefined; if (!attribute) return; for (let i = 0; i < attribute.count; i += 1) { const next = attribute.getY(i) + delta * (0.16 + (i % 5) * 0.025); attribute.setY(i, next > 6 ? -1.5 : next); } attribute.needsUpdate = true; });
  return <points ref={points}><bufferGeometry><bufferAttribute attach="attributes-position" args={[positions, 3]} /></bufferGeometry><pointsMaterial color="#c6c3ff" size={0.075} transparent opacity={0.7} sizeAttenuation /></points>;
}

function AISky() {
  const nodes = useMemo(() => Array.from({ length: 26 }, (_, i) => new THREE.Vector3(((i * 37) % 19 - 9) * 0.48, ((i * 23) % 13 - 4) * 0.38, ((i * 17) % 11 - 5) * 0.42)), []);
  const connections = useMemo(() => { const points: THREE.Vector3[] = []; nodes.slice(0, 20).forEach((node, i) => points.push(node, nodes[(i * 7 + 5) % nodes.length])); return points; }, [nodes]);
  const constellation = useRef<THREE.Group>(null);
  useFrame(({ clock }) => { if (constellation.current) constellation.current.rotation.y = Math.sin(clock.elapsedTime * 0.16) * 0.12; });
  return <group position={[-1.6, 1.5, -47]}>
    <group position={[0, -1.2, 1.5]}>{[[-3.2, 0, 0, 1.7], [-1.7, 0.35, 0.1, 2.1], [0, 0, 0, 2.5], [2, 0.2, 0.15, 2], [3.4, -0.1, 0, 1.45]].map(([x, y, z, scale], i) => <mesh key={i} position={[x, y, z]} scale={[scale, scale * 0.48, scale * 0.65]}><sphereGeometry args={[1, 18, 12]} /><meshPhysicalMaterial color="#a8b3dc" transparent opacity={0.12} transmission={0.6} roughness={0.4} depthWrite={false} /></mesh>)}</group>
    <group ref={constellation}>{nodes.map((position, i) => <mesh key={i} position={position}><sphereGeometry args={[i % 6 === 0 ? 0.16 : 0.065, 10, 10]} /><meshBasicMaterial color={i % 5 === 0 ? "#ffffff" : "#b8b4ff"} /></mesh>)}<LineSegments points={connections} color="#aaa7ef" opacity={0.34} /></group>
    <RisingParticles />
    <mesh position={[0, 0.5, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[3.6, 0.012, 4, 96]} /><meshBasicMaterial color="#7773d8" transparent opacity={0.25} /></mesh>
    <pointLight color="#b8b4ff" intensity={30} distance={16} position={[0, 4, 2]} />
  </group>;
}

function SceneContents({ progress, onReady }: SceneProps) {
  useEffect(() => onReady(), [onReady]);
  return <><color attach="background" args={["#07100d"]} /><fog attach="fog" args={["#07100d", 8, 27]} /><ambientLight intensity={0.62} color="#b8ddc7" /><directionalLight position={[7, 14, 8]} intensity={2.1} color="#e8fff0" /><CameraRig progress={progress} /><GuideBird progress={progress} /><Laboratory /><SoftwareCity /><BambooForest /><AISky /></>;
}

export function JourneyScene(props: SceneProps) {
  return <div className="scene-canvas" aria-hidden="true"><Canvas camera={{ position: cameraPoints[0].toArray(), fov: 42, near: 0.1, far: 100 }} dpr={[1, 1.35]} gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}><SceneContents {...props} /></Canvas></div>;
}
