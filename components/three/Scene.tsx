'use client';

import {
  createContext,
  ReactNode,
  Suspense,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Canvas, ThreeEvent, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, ContactShadows, Environment, Float, Line } from '@react-three/drei';
import { animated, useSpring } from '@react-spring/three';
import { EffectComposer, Bloom, ToneMapping, Vignette } from '@react-three/postprocessing';
import { ToneMappingMode } from 'postprocessing';
import { Group, MathUtils, Plane, Raycaster, Vector3 } from 'three';
import { useWorkspaceStore } from '@/store/workspace';
import { Product, PRODUCTS } from '@/data/products';
import { nearestFreeSlot, Slot, slotById, slotsFor } from './slots';
import {
  ChairFantech,
  ChairFurradec,
  Coffee3D,
  DeskElectric,
  DeskMechanical,
  Lamp3D,
  Monitor3D,
  Plant3D,
  Whiteboard3D,
} from './Furniture3D';

/** Desk surface height per model — the one variable the desktop rig follows. */
const SURFACE: Record<string, number> = {
  'desk-electric': 0.98, // shown raised: it's the sit-stand pitch
  'desk-mechanical': 0.74,
};
const DEFAULT_SURFACE = 0.74;

const POP_CONFIG = { tension: 280, friction: 16 }; // slight overshoot on add — earned micro-feedback
const GLIDE_CONFIG = { tension: 170, friction: 26 };

const MONITOR_SIZE: Record<string, { width: number; height: number }> = {
  'mon-24': { width: 0.5, height: 0.3 },
  'mon-27': { width: 0.58, height: 0.34 },
  'mon-34': { width: 0.78, height: 0.34 },
};

// ── Drag context — one active drag at a time, scene-wide ────────────

interface ActiveDrag {
  unitKey: string;
  product: Product;
  point: [number, number]; // world x/z under the pointer
  snap: Slot | null;
}

const DragCtx = createContext<{
  drag: ActiveDrag | null;
  setDrag: (d: ActiveDrag | null) => void;
}>({ drag: null, setDrag: () => {} });

const useDrag = () => useContext(DragCtx);

/** Mesh for a product unit — shared by placed items and drag previews. */
function UnitMesh({ product }: { product: Product }) {
  if (product.category === 'monitor') {
    const size = MONITOR_SIZE[product.id] ?? MONITOR_SIZE['mon-27'];
    return <Monitor3D width={size.width} height={size.height} />;
  }
  switch (product.id) {
    case 'chair-furradec':
      return <ChairFurradec />;
    case 'chair-fantech':
      return <ChairFantech />;
    case 'lamp-mi':
      return (
        <Float speed={1.4} floatIntensity={0.12} rotationIntensity={0.08} floatingRange={[0, 0.04]}>
          <Lamp3D />
        </Float>
      );
    case 'coffee-nespresso':
      return <Coffee3D />;
    case 'plant-monstera':
      return (
        <Float speed={1.2} floatIntensity={0.25} rotationIntensity={0.15} floatingRange={[0, 0.08]}>
          <Plant3D />
        </Float>
      );
    case 'whiteboard':
      return (
        <Float speed={1} floatIntensity={0.15} rotationIntensity={0.06} floatingRange={[0, 0.05]}>
          <Whiteboard3D />
        </Float>
      );
    default:
      return null;
  }
}

/** Scale-in/out on mount/unmount (position is handled by DraggableUnit). */
function ScaleIn({ visible, children }: { visible: boolean; children: ReactNode }) {
  const [render, setRender] = useState(visible);
  const visRef = useRef(visible);
  visRef.current = visible;
  useEffect(() => {
    if (visible) setRender(true);
  }, [visible]);
  const { scale } = useSpring({
    scale: visible ? 1 : 0,
    config: POP_CONFIG,
    onRest: () => {
      if (!visRef.current) setRender(false);
    },
  });
  if (!render) return null;
  return <animated.group scale={scale}>{children}</animated.group>;
}

/**
 * A placed unit the user can pick up and drag between its valid slots.
 * Position follows the pointer (damped, slightly lifted) during a drag and
 * glides to its slot otherwise. Release: snap commits, no snap springs back.
 */
function DraggableUnit({
  unitKey,
  product,
  slot,
  planeY,
  localY = 0,
  children,
}: {
  unitKey: string;
  product: Product;
  slot: Slot;
  /** world height of the drag plane (desk surface or floor) */
  planeY: number;
  /** y offset inside the parent group (0 in the rig, 0 on the floor) */
  localY?: number;
  children: ReactNode;
}) {
  const { drag, setDrag } = useDrag();
  const placements = useWorkspaceStore((s) => s.placements);
  const placeUnit = useWorkspaceStore((s) => s.placeUnit);
  const markDragged = useWorkspaceStore((s) => s.markDragged);
  const dragging = drag?.unitKey === unitKey;
  const [hovered, setHovered] = useState(false);
  const ref = useRef<Group>(null);
  const gl = useThree((s) => s.gl);
  const plane = useMemo(() => new Plane(new Vector3(0, 1, 0), -planeY), [planeY]);
  const hit = useMemo(() => new Vector3(), []);

  useEffect(() => {
    gl.domElement.style.cursor = dragging ? 'grabbing' : hovered ? 'grab' : '';
    return () => {
      gl.domElement.style.cursor = '';
    };
  }, [dragging, hovered, gl]);

  useFrame((_, rawDt) => {
    const g = ref.current;
    if (!g) return;
    const dt = Math.min(rawDt, 0.05);
    const target = dragging && drag ? drag.point : [slot.x, slot.z];
    const ty = dragging ? localY + 0.07 : localY; // gentle lift while held
    const ts = dragging ? 1.04 : hovered ? 1.02 : 1;
    const tr = dragging ? drag?.snap?.rotY ?? slot.rotY : slot.rotY;
    // λ12 while held = taut, near 1:1; λ8 on release = calm glide home
    const l = dragging ? 12 : 8;
    g.position.x = MathUtils.damp(g.position.x, target[0], l, dt);
    g.position.z = MathUtils.damp(g.position.z, target[1], l, dt);
    g.position.y = MathUtils.damp(g.position.y, ty, 10, dt);
    g.rotation.y = MathUtils.damp(g.rotation.y, tr, 8, dt);
    const s = MathUtils.damp(g.scale.x, ts, 12, dt);
    g.scale.setScalar(s);
  });

  const onDown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    (e.target as Element).setPointerCapture(e.pointerId);
    setDrag({ unitKey, product, point: [slot.x, slot.z], snap: slot });
  };
  const onMove = (e: ThreeEvent<PointerEvent>) => {
    if (!dragging) return;
    e.stopPropagation();
    if (!e.ray.intersectPlane(plane, hit)) return;
    const snap = nearestFreeSlot(product, hit.x, hit.z, placements, unitKey);
    setDrag({ unitKey, product, point: [hit.x, hit.z], snap });
  };
  const onUp = (e: ThreeEvent<PointerEvent>) => {
    if (!dragging) return;
    e.stopPropagation();
    if (drag?.snap) placeUnit(unitKey, drag.snap.id);
    markDragged();
    setDrag(null);
  };

  return (
    <group
      ref={ref}
      position={[slot.x, localY, slot.z]}
      rotation-y={slot.rotY}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={() => setHovered(false)}
    >
      {children}
    </group>
  );
}

/** Rings on every free valid slot while a drag is live; the snap target glows. */
function SlotIndicators({
  product,
  exceptKey,
  activeSlotId,
  surface,
}: {
  product: Product;
  exceptKey?: string;
  activeSlotId?: string | null;
  surface: number;
}) {
  const placements = useWorkspaceStore((s) => s.placements);
  const occupied = new Set(
    Object.entries(placements)
      .filter(([k]) => k !== exceptKey)
      .map(([, v]) => v)
  );
  return (
    <>
      {slotsFor(product)
        .filter((s) => !occupied.has(s.id))
        .map((s) => {
          const active = s.id === activeSlotId;
          const y = (s.kind === 'desk' ? surface : 0) + 0.012;
          return (
            <group key={s.id} position={[s.x, y, s.z]}>
              <mesh rotation-x={-Math.PI / 2}>
                <ringGeometry args={[0.14, active ? 0.2 : 0.17, 40]} />
                <meshBasicMaterial
                  color={active ? '#34d399' : '#ffffff'}
                  transparent
                  opacity={active ? 0.9 : 0.35}
                />
              </mesh>
              {active && (
                <mesh position-y={0.25}>
                  <cylinderGeometry args={[0.015, 0.015, 0.5, 8]} />
                  <meshBasicMaterial color="#34d399" transparent opacity={0.35} />
                </mesh>
              )}
            </group>
          );
        })}
    </>
  );
}

/** Guide line from the held item to its snap target. */
function SnapGuide({ drag, surface }: { drag: ActiveDrag; surface: number }) {
  if (!drag.snap) return null;
  const y = (drag.snap.kind === 'desk' ? surface : 0) + 0.05;
  const from: [number, number, number] = [drag.point[0], y, drag.point[1]];
  const to: [number, number, number] = [drag.snap.x, y, drag.snap.z];
  if (Math.hypot(from[0] - to[0], from[2] - to[2]) < 0.05) return null;
  return (
    <Line points={[from, to]} color="#34d399" lineWidth={1.5} dashed dashSize={0.05} gapSize={0.04} transparent opacity={0.6} />
  );
}

/**
 * Bridge for drag-from-catalog: the DOM layer writes pointer NDC into the
 * store; this raycasts it every frame, resolves the snap slot, writes it back
 * for the drop handler, and renders a live placement preview.
 */
function PanelDragBridge({ surface }: { surface: number }) {
  const panelDrag = useWorkspaceStore((s) => s.panelDrag);
  const placements = useWorkspaceStore((s) => s.placements);
  const setPanelSnap = useWorkspaceStore((s) => s.setPanelSnap);
  const camera = useThree((s) => s.camera);
  const raycaster = useMemo(() => new Raycaster(), []);
  const hit = useMemo(() => new Vector3(), []);
  const [preview, setPreview] = useState<Slot | null>(null);
  const lastSnap = useRef<string | null>(null);

  const product = panelDrag ? PRODUCTS.find((p) => p.id === panelDrag.productId) : undefined;

  useFrame(() => {
    if (!panelDrag || !product || slotsFor(product).length === 0) {
      if (preview) setPreview(null);
      return;
    }
    const planeY = slotsFor(product)[0].kind === 'desk' ? surface : 0;
    const plane = new Plane(new Vector3(0, 1, 0), -planeY);
    raycaster.setFromCamera({ x: panelDrag.ndc[0], y: panelDrag.ndc[1] } as never, camera);
    const snap = raycaster.ray.intersectPlane(plane, hit)
      ? nearestFreeSlot(product, hit.x, hit.z, placements, panelDrag.productId === 'chair' ? 'chair' : undefined)
      : null;
    if ((snap?.id ?? null) !== lastSnap.current) {
      lastSnap.current = snap?.id ?? null;
      setPanelSnap(snap?.id ?? null);
      setPreview(snap);
    }
  });

  useEffect(() => {
    if (!panelDrag) {
      lastSnap.current = null;
      setPreview(null);
    }
  }, [panelDrag]);

  if (!panelDrag || !product || slotsFor(product).length === 0) return null;
  const y = preview ? (preview.kind === 'desk' ? surface : 0) : 0;
  return (
    <>
      <SlotIndicators product={product} activeSlotId={preview?.id} surface={surface} />
      {preview && (
        <group position={[preview.x, y + 0.04, preview.z]} rotation-y={preview.rotY}>
          <UnitMesh product={product} />
        </group>
      )}
    </>
  );
}

// ── The workspace itself ────────────────────────────────────────────

function Workspace() {
  const { desk, chair, extras, extraProducts, placements } = useWorkspaceStore();
  const { drag } = useDrag();

  const surface = desk ? SURFACE[desk.id] ?? DEFAULT_SURFACE : DEFAULT_SURFACE;
  const chairSlot = chair ? slotById(chair, placements['chair']) : undefined;

  // every potential unit is mounted; visibility derives from qty → removals animate out
  const unitsOf = (product: Product) =>
    Array.from({ length: product.maxQty }, (_, i) => {
      const unitKey = `${product.id}-${i}`;
      return { unitKey, slot: slotById(product, placements[unitKey]), visible: i < (extras[product.id] ?? 0) };
    });

  const extraUnits = Object.values(extraProducts).flatMap((p) =>
    unitsOf(p).map((u) => ({ ...u, product: p }))
  );
  const deskUnits = extraUnits.filter((u) => u.slot?.kind === 'desk');
  const floorUnits = extraUnits.filter((u) => u.slot?.kind === 'floor');

  return (
    <>
      {/* Desks anchor the scene — swappable, not draggable */}
      <DeskSwap id="desk-electric" active={desk?.id === 'desk-electric'} surface={surface} />
      <DeskSwap id="desk-mechanical" active={desk?.id === 'desk-mechanical'} surface={surface} />

      {/* Chair — draggable across its floor slots; variant crossfades in place */}
      {chair && chairSlot && (
        <ScaleIn visible>
          <DraggableUnit unitKey="chair" product={chair} slot={chairSlot} planeY={0}>
            <UnitMesh product={chair} />
          </DraggableUnit>
        </ScaleIn>
      )}

      {/* Desktop rig — desk-surface items ride the animated surface height */}
      <DesktopRig surface={surface}>
        {deskUnits.map(({ unitKey, product, slot, visible }) => (
          <ScaleIn key={unitKey} visible={visible}>
            {slot && (
              <DraggableUnit unitKey={unitKey} product={product} slot={slot} planeY={surface}>
                <UnitMesh product={product} />
              </DraggableUnit>
            )}
          </ScaleIn>
        ))}
      </DesktopRig>

      {/* Floor items */}
      {floorUnits.map(({ unitKey, product, slot, visible }) => (
        <ScaleIn key={unitKey} visible={visible}>
          {slot && (
            <DraggableUnit unitKey={unitKey} product={product} slot={slot} planeY={0}>
              <UnitMesh product={product} />
            </DraggableUnit>
          )}
        </ScaleIn>
      ))}

      {/* Placement feedback for the active in-scene drag */}
      {drag && (
        <>
          <SlotIndicators
            product={drag.product}
            exceptKey={drag.unitKey}
            activeSlotId={drag.snap?.id}
            surface={surface}
          />
          <SnapGuide drag={drag} surface={surface} />
        </>
      )}
      <PanelDragBridge surface={surface} />
    </>
  );
}

function DeskSwap({ id, active, surface }: { id: string; active: boolean; surface: number }) {
  return (
    <ScaleIn visible={active}>
      {id === 'desk-electric' ? (
        <DeskElectric height={surface} />
      ) : (
        <DeskMechanical height={surface} />
      )}
    </ScaleIn>
  );
}

/** The desktop layer: everything on the desk rides this group's sprung Y. */
function DesktopRig({ surface, children }: { surface: number; children: ReactNode }) {
  const { y } = useSpring({ y: surface, config: GLIDE_CONFIG });
  return <animated.group position-y={y}>{children}</animated.group>;
}

/** Soft circular platform grounding the setup against the blurred environment. */
function Platform() {
  return (
    <mesh position-y={-0.026} receiveShadow>
      <cylinderGeometry args={[2.7, 2.75, 0.05, 48]} />
      <meshStandardMaterial color="#eae3d6" roughness={0.9} metalness={0} />
    </mesh>
  );
}

/**
 * Pointer parallax on the content group (OrbitControls owns the camera, so
 * fighting it per-frame jitters). Frozen while any drag is live so slot
 * geometry doesn't shift under the pointer.
 */
function ParallaxGroup({ children }: { children: ReactNode }) {
  const ref = useRef<Group>(null);
  const { drag } = useDrag();
  const panelDrag = useWorkspaceStore((s) => s.panelDrag);
  const frozen = !!drag || !!panelDrag;
  useFrame((state, rawDt) => {
    const g = ref.current;
    if (!g) return;
    const dt = Math.min(rawDt, 0.05);
    g.rotation.y = MathUtils.damp(g.rotation.y, frozen ? 0 : state.pointer.x * 0.04, 3, dt);
    g.rotation.x = MathUtils.damp(g.rotation.x, frozen ? 0 : -state.pointer.y * 0.02, 3, dt);
  });
  return <group ref={ref}>{children}</group>;
}

/** Auto-rotate that pauses for interaction/drags and resumes after 4s idle. */
function IdleOrbitControls() {
  const [auto, setAuto] = useState(true);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const { drag } = useDrag();
  const panelDrag = useWorkspaceStore((s) => s.panelDrag);
  const busy = !!drag || !!panelDrag;
  useEffect(() => () => clearTimeout(timer.current), []);
  return (
    <OrbitControls
      makeDefault
      enabled={!busy}
      autoRotate={auto && !busy}
      autoRotateSpeed={0.4}
      onStart={() => {
        clearTimeout(timer.current);
        setAuto(false);
      }}
      onEnd={() => {
        timer.current = setTimeout(() => setAuto(true), 4000);
      }}
      target={[0, 0.7, 0]}
      enablePan={false}
      minDistance={2.8}
      maxDistance={7.5}
      minPolarAngle={0.35}
      maxPolarAngle={1.45}
    />
  );
}

export default function Scene() {
  const [drag, setDrag] = useState<ActiveDrag | null>(null);
  return (
    <Canvas
      shadows
      dpr={[1, 1.75]} // capped below 2 — postprocessing at retina DPR is the frame-rate killer
      camera={{ position: [3.2, 2.2, 4.4], fov: 35 }}
      className="!absolute inset-0"
    >
      {/* opaque clear color: the frame is never white, even before the HDR lands */}
      <color attach="background" args={['#d9cfc0']} />
      <DragCtx.Provider value={{ drag, setDrag }}>
        <Suspense fallback={null}>
          {/* HDR ambient light + reflections; blurred as the spatial backdrop */}
          <Environment preset="apartment" background blur={0.8} />
          <directionalLight position={[4, 6, 3]} intensity={0.5} />
          <ParallaxGroup>
            <Platform />
            <Workspace />
            <ContactShadows position={[0, 0.001, 0]} opacity={0.45} scale={7} blur={2.4} far={2.2} />
          </ParallaxGroup>
          <EffectComposer multisampling={0}>
            {/* threshold 1.1: only emissive surfaces (screens, lamp head) bloom */}
            <Bloom mipmapBlur intensity={0.5} luminanceThreshold={1.1} luminanceSmoothing={0.15} />
            <Vignette eskil={false} offset={0.25} darkness={0.5} />
            {/* EffectComposer bypasses the renderer's tone mapping — without this pass,
                mid-HDR surfaces (white board under the apartment window) clip to pure white */}
            <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
            {/* ponytail: DepthOfField skipped — halves frame rate for a subtle effect. */}
          </EffectComposer>
        </Suspense>
        <IdleOrbitControls />
      </DragCtx.Provider>
    </Canvas>
  );
}
