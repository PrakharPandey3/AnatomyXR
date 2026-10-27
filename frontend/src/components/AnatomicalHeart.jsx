import React, { Suspense, useMemo, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Html, OrbitControls } from '@react-three/drei';

const PARTS = [
  { id: 'right-atrium', name: 'Right atrium', color: '#d85c75', position: [-0.62, 0.48, 0.12], scale: [0.58, 0.62, 0.42], rotation: [0.05, 0.1, -0.2] },
  { id: 'right-ventricle', name: 'Right ventricle', color: '#bc405e', position: [-0.48, -0.28, 0.18], scale: [0.53, 0.72, 0.42], rotation: [0.02, 0.1, 0.24] },
  { id: 'left-atrium', name: 'Left atrium', color: '#e58a9d', position: [0.42, 0.5, -0.02], scale: [0.48, 0.5, 0.38], rotation: [0.08, -0.15, 0.14] },
  { id: 'left-ventricle', name: 'Left ventricle', color: '#a92f4d', position: [0.38, -0.25, 0.1], scale: [0.55, 0.82, 0.44], rotation: [0.03, -0.12, -0.18] }
];

function Vessel({ position, rotation = [0, 0, 0], radius = 0.16, height = 0.95, color = '#d65b63', id, onSelect, selected }) {
  const active = selected === id;
  return <mesh position={position} rotation={rotation} onClick={(event) => { event.stopPropagation(); onSelect(id); }} castShadow>
    <cylinderGeometry args={[radius * 0.9, radius, height, 24]} />
    <meshStandardMaterial color={active ? '#ffd27a' : color} roughness={0.34} metalness={0.04} emissive={active ? '#754a10' : '#000000'} emissiveIntensity={active ? 0.45 : 0} />
  </mesh>;
}

function HeartModel({ selected, onSelect, layers }) {
  const activeParts = useMemo(() => PARTS.filter((part) => layers.chambers), [layers.chambers]);
  return <group rotation={[0.08, -0.2, 0.02]}>
    {activeParts.map((part) => <mesh key={part.id} position={part.position} scale={part.scale} rotation={part.rotation} castShadow receiveShadow onClick={(event) => { event.stopPropagation(); onSelect(part.id); }}>
      <sphereGeometry args={[1, 40, 32]} />
      <meshStandardMaterial color={selected === part.id ? '#ffd27a' : part.color} roughness={0.38} metalness={0.02} emissive={selected === part.id ? '#754a10' : '#000000'} emissiveIntensity={selected === part.id ? 0.35 : 0} />
    </mesh>)}
    {layers.vessels && <>
      <Vessel id="aorta" selected={selected} onSelect={onSelect} position={[0.16, 1.05, -0.08]} rotation={[0, 0, -0.2]} radius={0.19} height={1.1} color="#d95a4c" />
      <Vessel id="pulmonary-artery" selected={selected} onSelect={onSelect} position={[-0.48, 0.88, 0.22]} rotation={[0, 0, 0.28]} radius={0.15} height={0.82} color="#4c9bc7" />
      <Vessel id="vena-cava" selected={selected} onSelect={onSelect} position={[-0.66, 1.0, -0.12]} rotation={[0, 0, -0.05]} radius={0.13} height={0.85} color="#5089bd" />
      <Vessel id="pulmonary-veins" selected={selected} onSelect={onSelect} position={[0.72, 0.58, -0.24]} rotation={[0, 0, -1.2]} radius={0.09} height={0.65} color="#d97891" />
    </>}
    <mesh position={[0, -0.08, -0.3]} scale={[0.72, 1.1, 0.15]}>
      <sphereGeometry args={[1, 32, 24]} />
      <meshStandardMaterial color="#f1a4a5" transparent opacity={0.18} roughness={0.5} />
    </mesh>
  </group>;
}

export default function AnatomicalHeart({ selectedId, onSelect, layers }) {
  const [error, setError] = useState(false);
  return <div className="heart-canvas">
    {!error ? <Canvas shadows camera={{ position: [0, 0.15, 5.1], fov: 38 }} dpr={[1, 1.7]} onCreated={() => setError(false)}>
      <color attach="background" args={['#111920']} />
      <ambientLight intensity={1.25} />
      <directionalLight position={[4, 5, 5]} intensity={2.3} castShadow />
      <pointLight position={[-3, 1, -3]} intensity={2} color="#517eaa" />
      <Suspense fallback={<Html center><span className="canvas-loading">Loading anatomy…</span></Html>}>
        <HeartModel selected={selectedId} onSelect={onSelect} layers={layers} />
      </Suspense>
      <OrbitControls enablePan enableZoom minDistance={3} maxDistance={8} minPolarAngle={0.25} maxPolarAngle={Math.PI - 0.25} />
    </Canvas> : <div className="canvas-fallback">3D viewer could not be initialized. Try refreshing the page.</div>}
    <div className="canvas-hint"><span className="hint-dot"/> Drag to rotate <span className="hint-divider"/> Scroll to zoom</div>
  </div>;
}
