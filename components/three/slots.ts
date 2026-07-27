import { Product } from '@/data/products';

/**
 * Curated anchor slots — the whole placement system. Items can only live in
 * (or be dragged between) these, so the scene stays believable by construction:
 * no free placement, no floating objects, no monitor in a plant pot.
 */
export interface Slot {
  id: string;
  /** 'desk' slots ride the desk-surface rig; 'floor' slots sit at y=0 */
  kind: 'desk' | 'floor';
  x: number;
  z: number;
  rotY: number;
}

const MONITOR_SLOTS: Slot[] = [
  { id: 'mon-center', kind: 'desk', x: 0, z: -0.12, rotY: 0 },
  { id: 'mon-left', kind: 'desk', x: -0.55, z: -0.08, rotY: 0.28 },
  { id: 'mon-right', kind: 'desk', x: 0.55, z: -0.08, rotY: -0.28 },
];

const LAMP_SLOTS: Slot[] = [
  { id: 'lamp-left', kind: 'desk', x: -0.62, z: -0.18, rotY: 0 },
  { id: 'lamp-right', kind: 'desk', x: 0.66, z: -0.2, rotY: Math.PI },
];

const COFFEE_SLOTS: Slot[] = [
  { id: 'cof-right', kind: 'desk', x: 0.58, z: 0.14, rotY: -0.3 },
  { id: 'cof-left', kind: 'desk', x: -0.58, z: 0.16, rotY: 0.3 },
];

const CHAIR_SLOTS: Slot[] = [
  { id: 'chair-front', kind: 'floor', x: 0.55, z: 0.85, rotY: 2.6 },
  { id: 'chair-center', kind: 'floor', x: 0, z: 0.95, rotY: Math.PI },
  { id: 'chair-left', kind: 'floor', x: -0.7, z: 0.8, rotY: 3.6 },
];

const PLANT_SLOTS: Slot[] = [
  { id: 'plant-fr', kind: 'floor', x: 1.25, z: 0.7, rotY: 0 },
  { id: 'plant-fl', kind: 'floor', x: -1.45, z: 0.85, rotY: 0 },
  { id: 'plant-br', kind: 'floor', x: 1.7, z: -0.7, rotY: 0 },
  { id: 'plant-bl', kind: 'floor', x: -2.15, z: 0.1, rotY: 0 },
];

const WHITEBOARD_SLOTS: Slot[] = [
  { id: 'wb-left', kind: 'floor', x: -1.8, z: -0.7, rotY: 0.5 },
  { id: 'wb-right', kind: 'floor', x: 1.95, z: -0.75, rotY: -0.5 },
  { id: 'wb-side', kind: 'floor', x: 2.3, z: 0.35, rotY: -1.2 },
];

/** Valid slots for a unit. Desks aren't placeable — they anchor the scene. */
export function slotsFor(product: Product): Slot[] {
  if (product.category === 'monitor') return MONITOR_SLOTS;
  if (product.category === 'chair') return CHAIR_SLOTS;
  switch (product.id) {
    case 'lamp-mi':
      return LAMP_SLOTS;
    case 'coffee-nespresso':
      return COFFEE_SLOTS;
    case 'plant-monstera':
      return PLANT_SLOTS;
    case 'whiteboard':
      return WHITEBOARD_SLOTS;
    default:
      return [];
  }
}

export const slotById = (product: Product, id: string | undefined) =>
  slotsFor(product).find((s) => s.id === id);

/** Snap radius in world units — generous enough to feel magnetic, tight enough to feel intentional. */
export const SNAP_RADIUS = 0.9;

/** Nearest slot to a point that isn't occupied (occupied = value in `taken`, excluding `self`). */
export function nearestFreeSlot(
  product: Product,
  x: number,
  z: number,
  taken: Record<string, string>,
  selfKey?: string
): Slot | null {
  const occupied = new Set(
    Object.entries(taken)
      .filter(([k]) => k !== selfKey)
      .map(([, v]) => v)
  );
  let best: Slot | null = null;
  let bestD = SNAP_RADIUS;
  for (const s of slotsFor(product)) {
    if (occupied.has(s.id)) continue;
    const d = Math.hypot(s.x - x, s.z - z);
    if (d < bestD) {
      bestD = d;
      best = s;
    }
  }
  return best;
}

/** First free slot in preference order — used when adding without a drop point. */
export function firstFreeSlot(
  product: Product,
  taken: Record<string, string>
): Slot | null {
  const occupied = new Set(Object.values(taken));
  return slotsFor(product).find((s) => !occupied.has(s.id)) ?? null;
}
