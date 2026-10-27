
import React, { Suspense, useEffect, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";

// Connect the structure IDs in App.jsx to likely GLB mesh names.
// These aliases may need adjusting after inspecting your actual model.
const STRUCTURE_ALIASES = {
  "right-atrium": ["rightatrium", "atriumright", "atrium_r"],
  "right-ventricle": ["rightventricle", "ventricleright", "ventricle_r"],
  "left-atrium": ["leftatrium", "atriumleft", "atrium_l"],
  "left-ventricle": ["leftventricle", "ventricleleft", "ventricle_l"],
  aorta: ["aorta", "aorticarch"],
  "pulmonary-artery": ["pulmonarytrunk", "pulmonaryartery"],
  "vena-cava": ["venacava", "superiorvenacava", "inferiorvenacava", "ivc", "svc"],
  "pulmonary-veins": ["pulmonaryvein"],
};

function normalizeName(value = "") {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function matchesAlias(meshName, aliases = []) {
  const name = normalizeName(meshName);
  return aliases.some((alias) => name.includes(normalizeName(alias)));
}

function getStructureId(meshName) {
  for (const [id, aliases] of Object.entries(STRUCTURE_ALIASES)) {
    if (matchesAlias(meshName, aliases)) return id;
  }
  return null;
}

function isChamber(meshName) {
  return /atrium|ventricle|chamber|myocardium/i.test(meshName);
}

function isVessel(meshName) {
  return /aorta|artery|arteries|vein|veins|vena|cava|vessel|trunk/i.test(meshName);
}

function HeartModel({ selectedId, onSelect, layers }) {
  const { scene } = useGLTF("/models/heart.glb");

  useEffect(() => {
    console.log("=== HEART MODEL HIERARCHY ===");

    scene.traverse((object) => {
      console.log({
        name: object.name,
        type: object.type,
        isMesh: object.isMesh,
        children: object.children.length,
        geometryGroups: object.isMesh
          ? object.geometry.groups.length
          : undefined,
        materialCount: object.isMesh
          ? (Array.isArray(object.material)
            ? object.material.length
            : 1)
          : undefined,
      });
    });
  }, [scene]);

  // Clone the scene and materials before changing highlight colors.
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

      foundMeshes.push({
        name: object.name || "(unnamed mesh)",
        structureId: getStructureId(object.name || ""),
      });

      const chamber = isChamber(object.name || "");
      const vessel = isVessel(object.name || "");

      // Only hide meshes that can be identified confidently by name.
      if (chamber && !layers.chambers) object.visible = false;
      else if (vessel && !layers.vessels) object.visible = false;
      else object.visible = true;

      const materials = Array.isArray(object.material)
        ? object.material
        : [object.material];

      const selected = getStructureId(object.name || "") === selectedId;

      materials.forEach((material) => {
        if (!material) return;

        if ("emissive" in material) {
          material.emissive.set(selected ? "#32e6c0" : "#000000");
          material.emissiveIntensity = selected ? 0.7 : 0;
        }

        material.needsUpdate = true;
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
      scale={1.5}
      position={[0, -0.5, 0]}
      onClick={handleMeshClick}
    />
  );
}

export default function RealisticHeart({
  selectedId = "left-ventricle",
  onSelect = () => { },
  layers = { chambers: true, vessels: true },
}) {
  return (
    <div style={{ width: "100%", height: "100%", minHeight: 420 }}>
      <Canvas camera={{ position: [0, 0, 4], fov: 45 }}>
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
