
import React, { Suspense, useEffect, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";

// Map actual GLB mesh names to the structure IDs used by App.jsx.
const STRUCTURE_ALIASES = {
  "right-atrium": ["right-atrium"],
  "left-atrium": ["left-atrium"],
  "right-ventricle": ["right-ventricle"],
  "left-ventricle": ["left-ventricle"],
  aorta: ["ascending-aorta", "aortic-arch", "aorta"],
  "pulmonary-artery": ["pulmonary-trunk", "pulmonary-artery"],
  "vena-cava": [
    "superior-vena-cava",
    "inferior-vena-cava",
    "vena-cava",
  ],
  "pulmonary-veins": ["pulmonary-veins", "pulmonary-vein"],

  // Additional model meshes.
  "left-coronary": ["left-coronary"],
  "right-coronary": ["right-coronary"],
  "ventricular-wall": ["ventricular-wall"],
};

function normalizeName(value = "") {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function getStructureId(meshName) {
  const name = normalizeName(meshName);

  for (const [structureId, aliases] of Object.entries(STRUCTURE_ALIASES)) {
    if (aliases.some((alias) => name === normalizeName(alias))) {
      return structureId;
    }
  }

  return null;
}

function isChamber(meshName) {
  return /atrium|ventricle|chamber|myocardium/i.test(meshName);
}

function isVessel(meshName) {
  return /aorta|artery|coronary|vein|vena|cava|vessel|trunk/i.test(
    meshName
  );
}

function HeartModel({ selectedId, onSelect, layers }) {
  const { scene } = useGLTF("/models/heart.glb");

  // Clone materials so highlighting doesn't modify cached GLTF materials.
  const model = useMemo(() => {
    const cloned = scene.clone(true);

    cloned.traverse((object) => {
      if (!object.isMesh) return;

      if (Array.isArray(object.material)) {
        object.material = object.material.map((material) =>
          material.clone()
        );
      } else if (object.material) {
        object.material = object.material.clone();
      }
    });

    return cloned;
  }, [scene]);

  useEffect(() => {
    const foundMeshes = [];

    model.traverse((object) => {
      if (!object.isMesh) return;

      const name = object.name || "";
      const structureId = getStructureId(name);

      foundMeshes.push({
        name: name || "(unnamed mesh)",
        structureId,
      });

      // Respect the visibility toggles.
      const chamber = isChamber(name);
      const vessel = isVessel(name);

      object.visible =
        !(chamber && !layers.chambers) &&
        !(vessel && !layers.vessels);

      const materials = Array.isArray(object.material)
        ? object.material
        : [object.material];

      const selected =
        structureId !== null &&
        (structureId === selectedId ||
          (structureId === "aorta" &&
            ["ascending-aorta", "aortic-arch"].includes(selectedId)));

      materials.forEach((material) => {
        if (!material) return;

        if (material.emissive) {
          material.emissive.set(selected ? "#32e6c0" : "#000000");
          material.emissiveIntensity = selected ? 0.7 : 0;
          material.needsUpdate = true;
        }
      });
    });

    console.info("[AnatomyXR] GLB meshes:", foundMeshes);
  }, [model, selectedId, layers]);

  function handleMeshClick(event) {
    event.stopPropagation();

    const structureId = getStructureId(event.object.name || "");

    if (structureId) {
      onSelect(structureId);
    } else {
      console.info(
        "[AnatomyXR] Clicked mesh has no anatomy mapping:",
        event.object.name || "(unnamed mesh)"
      );
    }
  }

  return (
    <primitive
      object={model}
      scale={0.9}
      position={[0, -0.2, 0]}
      onClick={handleMeshClick}
    />
  );
}

export default function RealisticHeart({
  selectedId = "left-ventricle",
  onSelect = () => {},
  layers = { chambers: true, vessels: true },
}) {
  return (
    <div style={{ width: "100%", height: "100%", minHeight: 420 }}>
      <Canvas camera={{ position: [0, 0, 7], fov: 45 }}>
        <color attach="background" args={["#101920"]} />
        <ambientLight intensity={1.5} />
        <directionalLight position={[3, 4, 5]} intensity={2} />
        <directionalLight position={[-3, 1, -2]} intensity={0.8} />

        <Suspense fallback={null}>
          <HeartModel
            selectedId={selectedId}
            onSelect={onSelect}
            layers={layers}
          />
        </Suspense>

        <OrbitControls
          enableDamping
          minDistance={2}
          maxDistance={8}
        />
      </Canvas>
    </div>
  );
}

useGLTF.preload("/models/heart.glb");
