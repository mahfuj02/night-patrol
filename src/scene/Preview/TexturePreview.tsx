import { OrbitControls, useTexture } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { useEffect, useMemo } from 'react';
import { NoColorSpace, RepeatWrapping, SRGBColorSpace, type Texture } from 'three';
import { world } from '@/lib/palette';
import type { QualityTier } from '@/lib/quality';
import { repeatFor, textureFiles, type TextureSetId } from '@/lib/textures';

export type PreviewLight = 'cool' | 'sodium';

const LIGHT_COLOR: Record<PreviewLight, string> = {
  cool: world.ledCore,
  sodium: world.sodium,
};

/** Loads a texture set for the tier and tiles it so one tile covers its real-world size. */
function usePbrMaps(id: TextureSetId, tier: QualityTier, metresU: number, metresV: number) {
  const files = textureFiles(id, tier);
  const urls: Record<string, string> = { map: files.color };
  if (files.normal) urls.normalMap = files.normal;
  if (files.rough) urls.roughnessMap = files.rough;
  const loaded = useTexture(urls) as Record<string, Texture>;

  const configured = useMemo(() => {
    const out: Record<string, Texture> = {};
    for (const [key, texture] of Object.entries(loaded)) {
      // Clone so repeat and colour space are set per surface without touching the shared cache.
      const copy = texture.clone();
      copy.wrapS = copy.wrapT = RepeatWrapping;
      copy.repeat.set(repeatFor(id, metresU), repeatFor(id, metresV));
      copy.colorSpace = key === 'map' ? SRGBColorSpace : NoColorSpace;
      copy.anisotropy = 8;
      copy.needsUpdate = true;
      out[key] = copy;
    }
    return out;
  }, [loaded, id, metresU, metresV]);

  useEffect(
    () => () => {
      Object.values(configured).forEach((texture) => texture.dispose());
    },
    [configured],
  );
  return configured;
}

function Road({ tier }: { tier: QualityTier }) {
  const maps = usePbrMaps('road', tier, 14, 14);
  return (
    <mesh rotation-x={-Math.PI / 2}>
      <planeGeometry args={[14, 14]} />
      <meshStandardMaterial {...maps} roughness={tier === 'low' ? 0.9 : 1} />
    </mesh>
  );
}

function Snowbank({ tier }: { tier: QualityTier }) {
  const maps = usePbrMaps('snow', tier, 6, 3);
  return (
    <mesh position={[-3.4, 0.35, 0.6]} scale={[3.2, 0.95, 1.6]}>
      <sphereGeometry args={[1, 48, 24]} />
      <meshStandardMaterial {...maps} roughness={tier === 'low' ? 0.9 : 1} />
    </mesh>
  );
}

function BrickWall({ tier }: { tier: QualityTier }) {
  const maps = usePbrMaps('brick', tier, 10, 5);
  return (
    <mesh position={[0, 2.5, -4.5]}>
      <boxGeometry args={[10, 5, 0.4]} />
      <meshStandardMaterial {...maps} roughness={tier === 'low' ? 0.9 : 1} />
    </mesh>
  );
}

function Lamp({ light }: { light: PreviewLight }) {
  const color = LIGHT_COLOR[light];
  return (
    <group position={[2.8, 0, -1.6]}>
      <mesh position={[0, 3, 0]}>
        <cylinderGeometry args={[0.07, 0.09, 6, 10]} />
        <meshStandardMaterial color="#1b1f26" />
      </mesh>
      <mesh position={[-0.55, 6, 0]}>
        <boxGeometry args={[0.7, 0.12, 0.3]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={3}
          toneMapped={false}
        />
      </mesh>
      <pointLight
        position={[-0.55, 5.8, 0]}
        color={color}
        intensity={260}
        distance={26}
        decay={2}
      />
    </group>
  );
}

/**
 * Dev-only preview of the CC0 texture sets under one light at a time: a road plane, a snowbank
 * and a brick wall. Used to compare against the reference photos before the textures are wired
 * into the real scene.
 */
export function TexturePreview({ light, tier }: { light: PreviewLight; tier: QualityTier }) {
  return (
    <Canvas
      dpr={[1, 1.5]}
      camera={{ fov: 50, near: 0.1, far: 100, position: [1.8, 2.1, 8.2] }}
      gl={{ antialias: true, preserveDrawingBuffer: true }}
    >
      <color attach="background" args={[world.night]} />
      <fog attach="fog" args={[world.night, 14, 42]} />
      <ambientLight intensity={0.35} color="#2a3a60" />
      <Road tier={tier} />
      <Snowbank tier={tier} />
      <BrickWall tier={tier} />
      <Lamp light={light} />
      <OrbitControls target={[0, 1.3, -1]} maxPolarAngle={Math.PI / 2.05} />
    </Canvas>
  );
}
