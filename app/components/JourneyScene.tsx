"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { MutableRefObject, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

type SceneProps = { progress: MutableRefObject<number>; onReady: () => void };
const cameraPoints = [new THREE.Vector3(0, 13, 18), new THREE.Vector3(-1, 6, 4), new THREE.Vector3(3, 5, -11), new THREE.Vector3(-3, 4.5, -25), new THREE.Vector3(0, 8, -39)];

function CameraRig({ progress }: Pick<SceneProps, "progress">) {
  const { camera } = useThree();
  const target = useMemo(() => new THREE.Vector3(), []);
  useFrame((_, delta) => {
    const scaled = progress.current * (cameraPoints.length - 1);
    const index = Math.min(cameraPoints.length - 2, Math.floor(scaled));
    const local = scaled - index;
    target.lerpVectors(cameraPoints[index], cameraPoints[index + 1], THREE.MathUtils.smootherstep(local, 0, 1));
    camera.position.lerp(target, 1 - Math.exp(-delta * 2.7));
    camera.lookAt(0, 1.4, camera.position.z - 8);
  });
  return null;
}

function OpeningWorld() {
  const group = useRef<THREE.Group>(null);
  useFrame((_, delta) => { if (group.current) group.current.rotation.y += delta * .025; });
  return <group ref={group} position={[0, -2.5, 4]}>
    <mesh receiveShadow scale={[1, .24, 1]}><sphereGeometry args={[8, 48, 32]} /><meshStandardMaterial color="#163c2e" roughness={.9} metalness={.05} /></mesh>
    {Array.from({ length: 24 }).map((_, index) => { const angle = (index / 24) * Math.PI * 2; const radius = 4 + (index % 5) * .42; return <mesh key={index} position={[Math.cos(angle) * radius, .15 + (index % 3) * .18, Math.sin(angle) * radius]} scale={[.28, .8 + (index % 4) * .15, .28]}><coneGeometry args={[1, 2, 7]} /><meshStandardMaterial color={index % 3 ? "#3d7956" : "#85c983"} roughness={1} /></mesh>; })}
    <mesh position={[-2, .5, -1]}><boxGeometry args={[2.4, .8, 1.8]} /><meshStandardMaterial color="#d7dfd2" roughness={.45} /></mesh>
    <mesh position={[2.4, .8, .6]}><boxGeometry args={[.8, 2.4, .8]} /><meshStandardMaterial color="#477f76" metalness={.25} /></mesh>
  </group>;
}

function Laboratory() {
  return <group position={[0, 0, -5]}>
    <mesh position={[0, -.6, 0]}><cylinderGeometry args={[4.7, 5.2, .7, 48]} /><meshStandardMaterial color="#d8e3dc" roughness={.55} /></mesh>
    <mesh position={[0, 1, 0]}><sphereGeometry args={[1.25, 32, 32]} /><meshPhysicalMaterial color="#9df7c5" emissive="#235c43" emissiveIntensity={1.8} transmission={.35} roughness={.12} /></mesh>
    {[0, 1, 2].map((ring) => <mesh key={ring} position={[0, 1, 0]} rotation={[ring * .7, ring * .9, .3]}><torusGeometry args={[2 + ring * .45, .025, 8, 80]} /><meshBasicMaterial color="#9df7c5" transparent opacity={.5 - ring * .1} /></mesh>)}
    {Array.from({ length: 12 }).map((_, i) => <mesh key={i} position={[Math.cos(i) * 3.7, .25 + (i % 4) * .45, Math.sin(i) * 2.5]}><sphereGeometry args={[.08, 12, 12]} /><meshBasicMaterial color="#b9ffe0" /></mesh>)}
  </group>;
}

function City() {
  return <group position={[0, -.3, -19]}>
    {Array.from({ length: 22 }).map((_, i) => { const x = (i % 6 - 2.5) * 1.25; const z = (Math.floor(i / 6) - 1.5) * 1.4; const height = 1.4 + ((i * 7) % 5) * .72; return <mesh key={i} position={[x, height / 2, z]}><boxGeometry args={[.72, height, .72]} /><meshStandardMaterial color={i % 4 === 0 ? "#76c7ff" : "#172f38"} emissive={i % 4 === 0 ? "#1b5d83" : "#061216"} emissiveIntensity={1.2} metalness={.5} roughness={.35} /></mesh>; })}
    <gridHelper args={[15, 15, "#76c7ff", "#163541"]} position={[0, -.02, 0]} />
  </group>;
}

function BambooForest() {
  return <group position={[0, -1, -33]}>
    {Array.from({ length: 34 }).map((_, i) => { const x = ((i * 47) % 19 - 9) * .55; const z = ((i * 29) % 17 - 8) * .5; const height = 3.5 + (i % 7) * .55; return <mesh key={i} position={[x, height / 2, z]} rotation={[0, 0, ((i % 5) - 2) * .018]}><cylinderGeometry args={[.08, .12, height, 8]} /><meshStandardMaterial color={i % 3 ? "#87a94f" : "#d7ee7d"} roughness={.85} /></mesh>; })}
    <pointLight color="#d7ee7d" intensity={22} distance={14} position={[0, 4, 1]} />
  </group>;
}

function SkyNetwork() {
  const nodes = useMemo(() => Array.from({ length: 28 }, (_, i) => new THREE.Vector3(((i * 37) % 17 - 8) * .65, ((i * 19) % 11 - 3) * .42, ((i * 23) % 13 - 6) * .45)), []);
  return <group position={[0, 2, -47]}>
    {nodes.map((position, i) => <mesh key={i} position={position}><sphereGeometry args={[i % 6 === 0 ? .17 : .07, 12, 12]} /><meshBasicMaterial color={i % 4 === 0 ? "#ffffff" : "#b8b4ff"} /></mesh>)}
    {nodes.slice(0, 18).map((point, i) => { const next = nodes[(i * 5 + 7) % nodes.length]; const geometry = new THREE.BufferGeometry().setFromPoints([point, next]); return <line key={`line-${i}`} geometry={geometry}><lineBasicMaterial color="#aaa7ef" transparent opacity={.28} /></line>; })}
    <pointLight color="#b8b4ff" intensity={35} distance={18} position={[0, 3, 2]} />
  </group>;
}

function SceneContents({ progress, onReady }: SceneProps) {
  useEffect(() => onReady(), [onReady]);
  return <><color attach="background" args={["#07100d"]} /><fog attach="fog" args={["#07100d", 9, 30]} /><ambientLight intensity={.72} color="#b8ddc7" /><directionalLight position={[7, 14, 8]} intensity={2.3} color="#e8fff0" castShadow /><CameraRig progress={progress} /><OpeningWorld /><Laboratory /><City /><BambooForest /><SkyNetwork /></>;
}

export function JourneyScene(props: SceneProps) {
  return <div className="scene-canvas" aria-hidden="true"><Canvas camera={{ position: cameraPoints[0].toArray(), fov: 42, near: .1, far: 100 }} dpr={[1, 1.5]} gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}><SceneContents {...props} /></Canvas></div>;
}
