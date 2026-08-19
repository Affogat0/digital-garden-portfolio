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
const framingXPoints = [0, -1.15, 1.25, -1.2, 1.25];
const framingYPoints = [2.1, 2, 2.1, 2.4, 5];
const framingLookAhead = [12.5, 14, 15, 16, 18];

const LANDING_TIMELINE_END = 0.25;
const BIRD_FLIGHT_START = LANDING_TIMELINE_END * 0.35;
const BIRD_APPROACH_START = LANDING_TIMELINE_END * 0.5;
const BIRD_WHITEOUT_START = LANDING_TIMELINE_END * 0.62;
const BIRD_FADE_START = LANDING_TIMELINE_END * 0.68;
const BIRD_HIDDEN_AT = LANDING_TIMELINE_END * 0.72;
const CAMERA_SETBACK = 4.5;

const journeyPathPoints = [
  new THREE.Vector3(0, -1.02, 6),
  new THREE.Vector3(0.7, -0.96, 3.5),
  new THREE.Vector3(1.7, -0.78, 1.1),
  new THREE.Vector3(6.6, -0.98, -1.5),
  new THREE.Vector3(7.7, -1.04, -6),
  new THREE.Vector3(6.1, -1.02, -10.5),
  new THREE.Vector3(2.8, -0.92, -14.5),
  new THREE.Vector3(2.7, -0.95, -22.8),
  new THREE.Vector3(4.7, -1.02, -24),
  new THREE.Vector3(5.4, -1.08, -25.2),
  new THREE.Vector3(3.4, -1.12, -26.5),
  new THREE.Vector3(2.5, -1.16, -31),
  new THREE.Vector3(2.1, -1.17, -36),
  new THREE.Vector3(1, -1.14, -41),
  new THREE.Vector3(0, -1.08, -46),
  new THREE.Vector3(-0.8, -1, -51),
  new THREE.Vector3(-1.2, -0.86, -55),
];

const journeyPathColors = [
  { at: 0, color: new THREE.Color("#4fd3aa") },
  { at: 0.34, color: new THREE.Color("#47758a") },
  { at: 0.56, color: new THREE.Color("#4f5d63") },
  { at: 0.74, color: new THREE.Color("#806345") },
  { at: 1, color: new THREE.Color("#5d6873") },
];

function CameraRig({ progress }: Pick<SceneProps, "progress">) {
  const { camera, scene } = useThree();
  const position = useMemo(() => new THREE.Vector3(), []);
  const framedPosition = useMemo(() => new THREE.Vector3(), []);
  const framingOffset = useMemo(() => new THREE.Vector3(0, 0, CAMERA_SETBACK), []);
  const lookAt = useMemo(() => new THREE.Vector3(), []);
  const color = useMemo(() => new THREE.Color(), []);

  useFrame((_, delta) => {
    const scaled = progress.current * (cameraPoints.length - 1);
    const index = Math.min(cameraPoints.length - 2, Math.floor(scaled));
    const local = THREE.MathUtils.smootherstep(scaled - index, 0, 1);
    position.lerpVectors(cameraPoints[index], cameraPoints[index + 1], local);
    framedPosition.copy(position).add(framingOffset);
    camera.position.lerp(framedPosition, 1 - Math.exp(-delta * 2.8));
    lookAt.set(
      THREE.MathUtils.lerp(framingXPoints[index], framingXPoints[index + 1], local),
      THREE.MathUtils.lerp(framingYPoints[index], framingYPoints[index + 1], local),
      camera.position.z - THREE.MathUtils.lerp(framingLookAhead[index], framingLookAhead[index + 1], local),
    );
    camera.lookAt(lookAt);
    color.lerpColors(sceneColors[index], sceneColors[index + 1], local);
    scene.background?.copy(color);
    if (scene.fog instanceof THREE.Fog) {
      scene.fog.color.copy(color);
    }
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
  const transitionWashMaterial = useRef<THREE.MeshBasicMaterial>(null);
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
    const flight = THREE.MathUtils.smootherstep(journey, BIRD_FLIGHT_START, BIRD_APPROACH_START);
    const approachEase = THREE.MathUtils.smootherstep(journey, BIRD_APPROACH_START, BIRD_FADE_START);
    const approach = approachEase * approachEase;
    const opacity = 1 - THREE.MathUtils.smoothstep(journey, BIRD_FADE_START, BIRD_HIDDEN_AT);
    const whiteoutIn = THREE.MathUtils.smootherstep(journey, BIRD_WHITEOUT_START, BIRD_FADE_START);
    const whiteoutOut = 1 - THREE.MathUtils.smootherstep(journey, BIRD_FADE_START, BIRD_HIDDEN_AT);
    const whiteout = whiteoutIn * whiteoutOut;

    if (bird.current && journey >= BIRD_HIDDEN_AT) {
      bird.current.visible = false;
      return;
    }

    camera.getWorldDirection(forward.current);
    right.current.set(1, 0, 0).applyQuaternion(camera.quaternion);
    up.current.set(0, 1, 0).applyQuaternion(camera.quaternion);

    const flightDistance = THREE.MathUtils.lerp(8, 5.2, flight);
    const distance = THREE.MathUtils.lerp(flightDistance, 0.55, approach);
    const lateral = THREE.MathUtils.lerp(-0.7, -0.25, flight) * (1 - approach);
    const vertical = THREE.MathUtils.lerp(-0.65, -0.32, flight) * (1 - approach);
    position.current.copy(camera.position)
      .addScaledVector(forward.current, distance)
      .addScaledVector(right.current, lateral)
      .addScaledVector(up.current, vertical);
    position.current.addScaledVector(up.current, Math.sin(elapsed.current * 1.55) * 0.06);

    if (bird.current) {
      bird.current.visible = true;
      const followSpeed = THREE.MathUtils.lerp(5, 18, approach);
      bird.current.position.lerp(position.current, 1 - Math.exp(-delta * followSpeed));
      bird.current.quaternion.copy(camera.quaternion);
      const bank = Math.sin(flight * Math.PI) * -0.07 * (1 - approach) + Math.sin(elapsed.current * 0.8) * 0.018;
      bird.current.rotateZ(bank);
      const breath = 1 + Math.sin(elapsed.current * 1.35) * 0.018;
      const flightScale = THREE.MathUtils.lerp(0.54, 0.68, flight);
      bird.current.scale.setScalar(THREE.MathUtils.lerp(flightScale, 1.75, approach) * breath);
    }

    const flap = Math.sin(elapsed.current * (2.7 + intro * 1.2)) * (0.09 + flight * 0.06) * (1 - approach * 0.72);
    const wingExpansion = THREE.MathUtils.lerp(1, 1.48, approach);
    if (leftWing.current) {
      leftWing.current.rotation.z = 0.025 + flap;
      leftWing.current.scale.set(1, wingExpansion, 1);
    }
    if (rightWing.current) {
      rightWing.current.rotation.z = -0.025 - flap;
      rightWing.current.scale.set(-1, wingExpansion, 1);
    }
    if (mainMaterial.current) mainMaterial.current.opacity = opacity;
    if (rightMainMaterial.current) rightMainMaterial.current.opacity = opacity;
    if (leftFacetMaterial.current) leftFacetMaterial.current.opacity = opacity * 0.62;
    if (rightFacetMaterial.current) rightFacetMaterial.current.opacity = opacity * 0.5;
    if (bodyMaterial.current) bodyMaterial.current.opacity = opacity;
    if (tailMaterial.current) tailMaterial.current.opacity = opacity;
    if (transitionWashMaterial.current) transitionWashMaterial.current.opacity = whiteout * 0.96;
    if (glow.current) glow.current.intensity = opacity * 1.8 + whiteout * 8;
  });

  return <group ref={bird} scale={0.64}>
    <group ref={leftWing}>
      <mesh geometry={wingGeometry} renderOrder={2}><meshBasicMaterial ref={mainMaterial} color="#ffffff" transparent depthTest={false} side={THREE.DoubleSide} toneMapped={false} /></mesh>
      <mesh geometry={wingFacetGeometry} position={[0, 0, 0.012]} renderOrder={3}><meshBasicMaterial ref={leftFacetMaterial} color="#dce5ed" transparent opacity={0.62} depthTest={false} side={THREE.DoubleSide} toneMapped={false} /></mesh>
    </group>
    <group ref={rightWing} scale={[-1, 1, 1]}>
      <mesh geometry={wingGeometry} renderOrder={2}><meshBasicMaterial ref={rightMainMaterial} color="#ffffff" transparent depthTest={false} side={THREE.DoubleSide} toneMapped={false} /></mesh>
      <mesh geometry={wingFacetGeometry} position={[0, 0, 0.012]} renderOrder={3}><meshBasicMaterial ref={rightFacetMaterial} color="#eef3f6" transparent opacity={0.5} depthTest={false} side={THREE.DoubleSide} toneMapped={false} /></mesh>
    </group>
    <mesh geometry={bodyGeometry} position={[0, 0.01, 0.024]} renderOrder={4}><meshBasicMaterial ref={bodyMaterial} color="#ffffff" transparent depthTest={false} side={THREE.DoubleSide} toneMapped={false} /></mesh>
    <mesh geometry={tailGeometry} position={[0, -0.48, 0.018]} renderOrder={3}><meshBasicMaterial ref={tailMaterial} color="#edf2f6" transparent depthTest={false} side={THREE.DoubleSide} toneMapped={false} /></mesh>
    <mesh position={[0, 0, -0.08]} renderOrder={1}>
      <planeGeometry args={[8, 8]} />
      <meshBasicMaterial ref={transitionWashMaterial} color="#ffffff" transparent opacity={0} depthTest={false} depthWrite={false} toneMapped={false} />
    </mesh>
    <pointLight ref={glow} color="#e7f4ff" intensity={1.8} distance={2.4} position={[0, 0, 0.4]} />
  </group>;
}

function LineSegments({ points, color, opacity = 0.45 }: { points: THREE.Vector3[]; color: string; opacity?: number }) {
  const geometry = useMemo(() => new THREE.BufferGeometry().setFromPoints(points), [points]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <lineSegments geometry={geometry}><lineBasicMaterial color={color} transparent opacity={opacity} /></lineSegments>;
}

function getJourneyPathColor(progress: number, target: THREE.Color) {
  const upperIndex = journeyPathColors.findIndex((stop) => stop.at >= progress);
  if (upperIndex === -1) return target.copy(journeyPathColors[journeyPathColors.length - 1].color);
  if (upperIndex <= 0) return target.copy(journeyPathColors[0].color);
  const upper = journeyPathColors[upperIndex];
  const lower = journeyPathColors[upperIndex - 1];
  const local = (progress - lower.at) / (upper.at - lower.at);
  return target.lerpColors(lower.color, upper.color, THREE.MathUtils.smootherstep(local, 0, 1));
}

function createJourneyPathGeometry() {
  const curve = new THREE.CatmullRomCurve3(journeyPathPoints, false, "catmullrom", 0.38);
  const segments = 160;
  const positions = new Float32Array((segments + 1) * 6);
  const colors = new Float32Array((segments + 1) * 6);
  const indices: number[] = [];
  const point = new THREE.Vector3();
  const tangent = new THREE.Vector3();
  const side = new THREE.Vector3();
  const color = new THREE.Color();

  for (let index = 0; index <= segments; index += 1) {
    const progress = index / segments;
    curve.getPointAt(progress, point);
    curve.getTangentAt(progress, tangent);
    const taper = THREE.MathUtils.smootherstep(progress, 0.72, 1);
    const width = THREE.MathUtils.lerp(1.5, 0.06, taper);
    side.set(-tangent.z, 0, tangent.x).normalize().multiplyScalar(width * 0.5);
    const offset = index * 6;
    positions[offset] = point.x + side.x;
    positions[offset + 1] = point.y + 0.025;
    positions[offset + 2] = point.z + side.z;
    positions[offset + 3] = point.x - side.x;
    positions[offset + 4] = point.y + 0.025;
    positions[offset + 5] = point.z - side.z;
    getJourneyPathColor(progress, color);
    colors[offset] = color.r;
    colors[offset + 1] = color.g;
    colors[offset + 2] = color.b;
    colors[offset + 3] = color.r;
    colors[offset + 4] = color.g;
    colors[offset + 5] = color.b;

    if (index < segments) {
      const current = index * 2;
      const next = current + 2;
      indices.push(current, next, current + 1, current + 1, next, next + 1);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function JourneyPath() {
  const geometry = useMemo(() => createJourneyPathGeometry(), []);
  useEffect(() => () => geometry.dispose(), [geometry]);

  return <mesh geometry={geometry} receiveShadow>
    <meshStandardMaterial color="#ffffff" vertexColors emissive="#13221f" emissiveIntensity={0.42} metalness={0.38} roughness={0.58} side={THREE.DoubleSide} />
  </mesh>;
}

function createHorizonGeometry(side: -1 | 1) {
  const steps = 14;
  const positions = new Float32Array((steps + 1) * 6);
  const indices: number[] = [];

  for (let index = 0; index <= steps; index += 1) {
    const progress = index / steps;
    const z = THREE.MathUtils.lerp(12, -48, progress);
    const x = side * (11.5 + Math.sin(index * 1.7) * 1.2 + (index % 3) * 0.55);
    const height = 1.4 + ((index * 7) % 5) * 0.58 + Math.sin(index * 0.8) * 0.35;
    const offset = index * 6;
    positions[offset] = x;
    positions[offset + 1] = -1.5;
    positions[offset + 2] = z;
    positions[offset + 3] = x;
    positions[offset + 4] = height;
    positions[offset + 5] = z;

    if (index < steps) {
      const current = index * 2;
      const next = current + 2;
      indices.push(current, current + 1, next, current + 1, next + 1, next);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function DistantWorld() {
  const horizons = useMemo(() => [createHorizonGeometry(-1), createHorizonGeometry(1)], []);
  useEffect(() => () => horizons.forEach((geometry) => geometry.dispose()), [horizons]);

  return <group>
    <mesh position={[0, -1.48, -20]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[70, 72]} />
      <meshStandardMaterial color="#07110f" roughness={1} metalness={0.05} />
    </mesh>
    {horizons.map((geometry, index) => <mesh key={index} geometry={geometry}>
      <meshStandardMaterial color={index ? "#101b19" : "#0b1716"} roughness={1} side={THREE.DoubleSide} />
    </mesh>)}
  </group>;
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
  return <group position={[-1.6, 3.2, -57]} scale={1.35}>
    <group position={[0, -1.2, 1.5]}>{[[-3.2, 0, 0, 1.7], [-1.7, 0.35, 0.1, 2.1], [0, 0, 0, 2.5], [2, 0.2, 0.15, 2], [3.4, -0.1, 0, 1.45]].map(([x, y, z, scale], i) => <mesh key={i} position={[x, y, z]} scale={[scale, scale * 0.48, scale * 0.65]}><sphereGeometry args={[1, 18, 12]} /><meshPhysicalMaterial color="#a8b3dc" transparent opacity={0.12} transmission={0.6} roughness={0.4} depthWrite={false} /></mesh>)}</group>
    <group ref={constellation}>{nodes.map((position, i) => <mesh key={i} position={position}><sphereGeometry args={[i % 6 === 0 ? 0.16 : 0.065, 10, 10]} /><meshBasicMaterial color={i % 5 === 0 ? "#ffffff" : "#b8b4ff"} /></mesh>)}<LineSegments points={connections} color="#aaa7ef" opacity={0.34} /></group>
    <RisingParticles />
    <mesh position={[0, 0.5, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[3.6, 0.012, 4, 96]} /><meshBasicMaterial color="#7773d8" transparent opacity={0.25} /></mesh>
    <pointLight color="#b8b4ff" intensity={30} distance={16} position={[0, 4, 2]} />
  </group>;
}

function SceneContents({ progress, onReady }: SceneProps) {
  useEffect(() => onReady(), [onReady]);
  return <><color attach="background" args={["#07100d"]} /><fog attach="fog" args={["#07100d", 10, 38]} /><ambientLight intensity={0.56} color="#b8ddc7" /><hemisphereLight intensity={0.42} color="#8ba9ba" groundColor="#152018" /><directionalLight position={[7, 14, 8]} intensity={2.1} color="#e8fff0" /><CameraRig progress={progress} /><GuideBird progress={progress} /><DistantWorld /><JourneyPath /><Laboratory /><SoftwareCity /><BambooForest /><AISky /></>;
}

export function JourneyScene(props: SceneProps) {
  return <div className="scene-canvas" aria-hidden="true"><Canvas camera={{ position: [cameraPoints[0].x, cameraPoints[0].y, cameraPoints[0].z + CAMERA_SETBACK], fov: 48, near: 0.1, far: 140 }} dpr={[1, 1.35]} gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}><SceneContents {...props} /></Canvas></div>;
}
