'use client';

/**
 * Parametric low-poly furniture built from primitives (box/cylinder/icosahedron).
 * TODO: every component here is a stand-in for a real .glb — swap via the
 * `modelPath` field in data/products.ts once real products are scanned
 * (Meshy/Luma photo-to-3D). Keeping primitives means: zero asset downloads,
 * consistent style, and the desk-height animation stays a simple prop.
 *
 * All pieces: origin at floor center, +Z faces the camera.
 */

const WOOD = '#c9a97c';
const BAMBOO = '#d9bd8d';
const METAL = '#4b5563';
const DARK = '#23272f';
const WHITE = '#f4f4f2';
const MESH_GREEN = '#41544c';
const RED = '#b83232';
const SCREEN = '#0b1220';
const SCREEN_GLOW = '#93c5fd';

function Mat({
  color,
  flat = false,
  roughness = 0.75,
  metalness = 0.08,
}: {
  color: string;
  flat?: boolean;
  roughness?: number;
  metalness?: number;
}) {
  return (
    <meshStandardMaterial color={color} roughness={roughness} metalness={metalness} flatShading={flat} />
  );
}

// Material presets tuned for HDR environment lighting
const WOOD_MAT = { roughness: 0.85, metalness: 0.02 }; // matte wood, no specular ping
const METAL_MAT = { roughness: 0.35, metalness: 0.7 }; // legs/frames pick up reflections
const FABRIC_MAT = { roughness: 0.95, metalness: 0 }; // mesh/upholstery eats light
const PLASTIC_MAT = { roughness: 0.5, metalness: 0.1 };
const BEZEL_MAT = { roughness: 0.2, metalness: 0.5 }; // subtle screen-frame reflection

// ── Desks ──────────────────────────────────────────────────────────
// `height` is the animated desk-surface height — the parent drives it so
// monitors/lamp/coffee (in the desktop group) ride along in lockstep.

export function DeskElectric({ height }: { height: number }) {
  return (
    <group>
      {/* top */}
      <mesh position={[0, height - 0.02, 0]} castShadow>
        <boxGeometry args={[1.6, 0.04, 0.72]} />
        <Mat color={WHITE} {...PLASTIC_MAT} />
      </mesh>
      {/* T-legs */}
      {[-0.65, 0.65].map((x) => (
        <group key={x} position={[x, 0, 0]}>
          <mesh position={[0, (height - 0.06) / 2, 0]} castShadow>
            <boxGeometry args={[0.07, height - 0.06, 0.07]} />
            <Mat color={METAL} {...METAL_MAT} />
          </mesh>
          <mesh position={[0, 0.02, 0]}>
            <boxGeometry args={[0.1, 0.04, 0.6]} />
            <Mat color={DARK} {...PLASTIC_MAT} />
          </mesh>
        </group>
      ))}
      {/* crossbar + control pad */}
      <mesh position={[0, height - 0.12, -0.28]}>
        <boxGeometry args={[1.25, 0.05, 0.05]} />
        <Mat color={METAL} {...METAL_MAT} />
      </mesh>
      <mesh position={[0.55, height - 0.07, 0.3]}>
        <boxGeometry args={[0.14, 0.03, 0.08]} />
        <Mat color={DARK} {...PLASTIC_MAT} />
      </mesh>
    </group>
  );
}

export function DeskMechanical({ height }: { height: number }) {
  return (
    <group>
      <mesh position={[0, height - 0.02, 0]} castShadow>
        <boxGeometry args={[1.5, 0.05, 0.7]} />
        <Mat color={BAMBOO} {...WOOD_MAT} />
      </mesh>
      {[-0.62, 0.62].map((x) => (
        <group key={x} position={[x, 0, 0]}>
          <mesh position={[0, (height - 0.06) / 2, 0]} castShadow>
            <boxGeometry args={[0.08, height - 0.06, 0.08]} />
            <Mat color={DARK} {...PLASTIC_MAT} />
          </mesh>
          <mesh position={[0, 0.02, 0]}>
            <boxGeometry args={[0.1, 0.04, 0.56]} />
            <Mat color={DARK} {...PLASTIC_MAT} />
          </mesh>
        </group>
      ))}
      {/* crank handle — the visual tell vs the electric desk */}
      <mesh position={[0.78, height - 0.14, 0.1]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.02, 0.02, 0.1, 8]} />
        <Mat color={METAL} {...METAL_MAT} />
      </mesh>
      <mesh position={[0.84, height - 0.2, 0.1]}>
        <cylinderGeometry args={[0.015, 0.015, 0.12, 8]} />
        <Mat color={DARK} {...PLASTIC_MAT} />
      </mesh>
    </group>
  );
}

// ── Chairs ─────────────────────────────────────────────────────────

function ChairBase({ color }: { color: string }) {
  return (
    <group>
      {[0, 1, 2, 3, 4].map((i) => (
        <mesh key={i} rotation={[0, (i * Math.PI * 2) / 5, 0]} position={[0, 0.04, 0]}>
          <boxGeometry args={[0.06, 0.04, 0.5]} />
          <Mat color={color} />
        </mesh>
      ))}
      <mesh position={[0, 0.25, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 0.35, 10]} />
        <Mat color={METAL} {...METAL_MAT} />
      </mesh>
    </group>
  );
}

export function ChairFurradec() {
  return (
    <group>
      <ChairBase color={DARK} />
      <mesh position={[0, 0.47, 0]} castShadow>
        <boxGeometry args={[0.48, 0.07, 0.46]} />
        <Mat color={DARK} {...PLASTIC_MAT} />
      </mesh>
      {/* mesh back, slight recline */}
      <mesh position={[0, 0.82, -0.21]} rotation={[-0.12, 0, 0]} castShadow>
        <boxGeometry args={[0.46, 0.6, 0.05]} />
        <Mat color={MESH_GREEN} {...FABRIC_MAT} />
      </mesh>
      {/* headrest */}
      <mesh position={[0, 1.18, -0.25]} rotation={[-0.18, 0, 0]}>
        <boxGeometry args={[0.3, 0.14, 0.05]} />
        <Mat color={MESH_GREEN} {...FABRIC_MAT} />
      </mesh>
      {/* armrests */}
      {[-0.27, 0.27].map((x) => (
        <mesh key={x} position={[x, 0.62, 0]}>
          <boxGeometry args={[0.05, 0.04, 0.3]} />
          <Mat color={DARK} {...PLASTIC_MAT} />
        </mesh>
      ))}
    </group>
  );
}

export function ChairFantech() {
  return (
    <group>
      <ChairBase color={DARK} />
      <mesh position={[0, 0.47, 0]} castShadow>
        <boxGeometry args={[0.5, 0.08, 0.48]} />
        <Mat color={DARK} {...PLASTIC_MAT} />
      </mesh>
      <mesh position={[0, 0.8, -0.22]} rotation={[-0.1, 0, 0]} castShadow>
        <boxGeometry args={[0.48, 0.56, 0.06]} />
        <Mat color={DARK} {...PLASTIC_MAT} />
      </mesh>
      {/* red trim — the Fantech look */}
      <mesh position={[0, 0.8, -0.245]} rotation={[-0.1, 0, 0]}>
        <boxGeometry args={[0.5, 0.1, 0.05]} />
        <Mat color={RED} {...FABRIC_MAT} />
      </mesh>
      {[-0.29, 0.29].map((x) => (
        <mesh key={x} position={[x, 0.63, 0]}>
          <boxGeometry args={[0.06, 0.05, 0.32]} />
          <Mat color={RED} {...FABRIC_MAT} />
        </mesh>
      ))}
    </group>
  );
}

// ── Desktop items (origin at their own base; parent sets desk height) ──

export function Monitor3D({ width = 0.56, height = 0.33 }: { width?: number; height?: number }) {
  return (
    <group>
      <mesh position={[0, 0.01, 0]}>
        <boxGeometry args={[0.24, 0.02, 0.16]} />
        <Mat color={DARK} {...PLASTIC_MAT} />
      </mesh>
      <mesh position={[0, 0.12, -0.02]}>
        <boxGeometry args={[0.05, 0.22, 0.03]} />
        <Mat color={DARK} {...PLASTIC_MAT} />
      </mesh>
      <mesh position={[0, 0.22 + height / 2, 0]} castShadow>
        <boxGeometry args={[width, height, 0.035]} />
        <Mat color={DARK} {...BEZEL_MAT} />
      </mesh>
      {/* glowing panel — intensity >1 so only screens cross the bloom threshold */}
      <mesh position={[0, 0.22 + height / 2, 0.019]}>
        <planeGeometry args={[width - 0.03, height - 0.03]} />
        <meshStandardMaterial color={SCREEN} emissive={SCREEN_GLOW} emissiveIntensity={1.3} />
      </mesh>
    </group>
  );
}

export function Lamp3D() {
  return (
    <group>
      <mesh position={[0, 0.015, 0]}>
        <cylinderGeometry args={[0.07, 0.08, 0.03, 16]} />
        <Mat color={WHITE} />
      </mesh>
      <mesh position={[0, 0.16, 0]} rotation={[0, 0, 0.25]}>
        <cylinderGeometry args={[0.012, 0.012, 0.3, 8]} />
        <Mat color={WHITE} />
      </mesh>
      <mesh position={[-0.09, 0.31, 0]} rotation={[0, 0, 1.35]}>
        <cylinderGeometry args={[0.012, 0.012, 0.16, 8]} />
        <Mat color={WHITE} />
      </mesh>
      <mesh position={[-0.16, 0.3, 0]}>
        <boxGeometry args={[0.12, 0.03, 0.05]} />
        <meshStandardMaterial color={WHITE} emissive="#fde68a" emissiveIntensity={1.6} />
      </mesh>
    </group>
  );
}

export function Coffee3D() {
  return (
    <group>
      <mesh position={[0, 0.11, 0]} castShadow>
        <boxGeometry args={[0.14, 0.22, 0.18]} />
        <Mat color={DARK} {...PLASTIC_MAT} />
      </mesh>
      <mesh position={[0, 0.2, 0.06]}>
        <boxGeometry args={[0.1, 0.06, 0.1]} />
        <Mat color={METAL} {...METAL_MAT} />
      </mesh>
      <mesh position={[0, 0.035, 0.06]}>
        <cylinderGeometry args={[0.025, 0.02, 0.05, 10]} />
        <Mat color={WHITE} />
      </mesh>
    </group>
  );
}

// ── Floor accessories ──────────────────────────────────────────────

export function Plant3D() {
  return (
    <group>
      <mesh position={[0, 0.09, 0]} castShadow>
        <cylinderGeometry args={[0.11, 0.085, 0.18, 12]} />
        <Mat color="#b45309" />
      </mesh>
      {[
        [0, 0.34, 0, 0.14, '#15803d'],
        [-0.08, 0.28, 0.05, 0.1, '#16a34a'],
        [0.09, 0.3, -0.04, 0.11, '#22c55e'],
      ].map(([x, y, z, r, c], i) => (
        <mesh key={i} position={[x as number, y as number, z as number]} castShadow>
          <icosahedronGeometry args={[r as number, 0]} />
          <Mat color={c as string} flat />
        </mesh>
      ))}
    </group>
  );
}

export function Whiteboard3D() {
  return (
    <group>
      {/* A-frame legs */}
      {[-0.55, 0.55].map((x) => (
        <group key={x} position={[x, 0, 0]}>
          <mesh position={[0, 0.65, 0.1]} rotation={[0.15, 0, 0]}>
            <boxGeometry args={[0.05, 1.35, 0.05]} />
            <Mat color={METAL} {...METAL_MAT} />
          </mesh>
          <mesh position={[0, 0.65, -0.1]} rotation={[-0.15, 0, 0]}>
            <boxGeometry args={[0.05, 1.35, 0.05]} />
            <Mat color={METAL} {...METAL_MAT} />
          </mesh>
        </group>
      ))}
      {/* board */}
      <mesh position={[0, 0.95, 0]} castShadow>
        <boxGeometry args={[1.25, 0.72, 0.04]} />
        {/* envMapIntensity clamped: the HDRI's bright window blows a white board
            past the bloom threshold via specular, whatever the albedo */}
        <meshStandardMaterial color="#d9d9d3" roughness={1} envMapIntensity={0.35} />
      </mesh>
      <mesh position={[0, 0.95, 0.021]}>
        <planeGeometry args={[1.15, 0.62]} />
        <meshStandardMaterial color="#e2e2dc" roughness={1} envMapIntensity={0.35} />
      </mesh>
      {/* marker tray */}
      <mesh position={[0, 0.56, 0.06]}>
        <boxGeometry args={[0.5, 0.03, 0.08]} />
        <Mat color={METAL} {...METAL_MAT} />
      </mesh>
    </group>
  );
}
