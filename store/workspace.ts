'use client';

import { create } from 'zustand';
import { MONITOR_CAP, Product } from '@/data/products';
import { firstFreeSlot, nearestFreeSlot, slotsFor } from '@/components/three/slots';

/** A placeable unit is 'chair' or `${productId}-${index}` (index within that product's qty). */
export type UnitKey = string;

export interface PanelDrag {
  productId: string;
  /** pointer in canvas NDC (-1..1); the scene raycasts this to a world point */
  ndc: [number, number];
}

export interface WorkspaceState {
  desk: Product | null;
  chair: Product | null;
  /** monitors + accessories: productId -> qty */
  extras: Record<string, number>;
  extraProducts: Record<string, Product>;
  /** unitKey -> slotId. The spatial layout of the scene. */
  placements: Record<UnitKey, string>;

  /** live drag-from-catalog state (DOM side writes, scene reads) */
  panelDrag: PanelDrag | null;
  /** the slot the scene resolved for the current panel drag (scene writes, DOM drop reads) */
  panelSnap: string | null;
  /** first successful drag dismisses the hint chip */
  hasDragged: boolean;

  selectDesk: (desk: Product) => void;
  selectChair: (chair: Product) => void;
  addExtra: (product: Product, at?: { x: number; z: number }) => void;
  removeExtra: (productId: string) => void;
  placeUnit: (unitKey: UnitKey, slotId: string) => void;
  setPanelDrag: (d: PanelDrag | null) => void;
  setPanelSnap: (slotId: string | null) => void;
  markDragged: () => void;
  resetWorkspace: () => void;

  monitorCount: () => number;
  weeklyTotal: () => number;
  monthlyTotal: () => number;
  totalItems: () => number;
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  desk: null,
  chair: null,
  extras: {},
  extraProducts: {},
  placements: {},
  panelDrag: null,
  panelSnap: null,
  hasDragged: false,

  selectDesk: (desk) => set({ desk }),

  selectChair: (chair) => {
    const { placements } = get();
    // keep the chair where the user put it when swapping models
    const slot = placements['chair']
      ? placements['chair']
      : firstFreeSlot(chair, placements)?.id ?? 'chair-front';
    set({ chair, placements: { ...placements, chair: slot } });
  },

  addExtra: (product, at) => {
    const { extras, extraProducts, placements } = get();
    const current = extras[product.id] ?? 0;
    if (current >= product.maxQty) return;
    // monitors share one cap of 3 across all models
    if (product.category === 'monitor' && get().monitorCount() >= MONITOR_CAP) return;
    const slot = at
      ? nearestFreeSlot(product, at.x, at.z, placements) ?? firstFreeSlot(product, placements)
      : firstFreeSlot(product, placements);
    if (slotsFor(product).length > 0 && !slot) return; // every valid anchor is taken
    set({
      extras: { ...extras, [product.id]: current + 1 },
      extraProducts: { ...extraProducts, [product.id]: product },
      placements: slot
        ? { ...placements, [`${product.id}-${current}`]: slot.id }
        : placements,
    });
  },

  removeExtra: (productId) => {
    const { extras, placements } = get();
    const current = extras[productId] ?? 0;
    if (current <= 0) return;
    const updated = { ...extras };
    if (current === 1) delete updated[productId];
    else updated[productId] = current - 1;
    const nextPlacements = { ...placements };
    delete nextPlacements[`${productId}-${current - 1}`];
    set({ extras: updated, placements: nextPlacements });
  },

  placeUnit: (unitKey, slotId) => {
    const { placements } = get();
    // refuse if another unit already holds the slot — drags spring back
    if (Object.entries(placements).some(([k, v]) => k !== unitKey && v === slotId)) return;
    set({ placements: { ...placements, [unitKey]: slotId } });
  },

  setPanelDrag: (panelDrag) => set({ panelDrag, ...(panelDrag ? {} : { panelSnap: null }) }),
  setPanelSnap: (panelSnap) => set({ panelSnap }),
  markDragged: () => set({ hasDragged: true }),

  resetWorkspace: () =>
    set({ desk: null, chair: null, extras: {}, extraProducts: {}, placements: {} }),

  monitorCount: () => {
    const { extras, extraProducts } = get();
    return Object.entries(extras).reduce(
      (n, [id, qty]) => n + (extraProducts[id]?.category === 'monitor' ? qty : 0),
      0
    );
  },

  weeklyTotal: () => sumBy(get(), (p) => p.priceWeek),
  monthlyTotal: () => sumBy(get(), (p) => p.priceMonth),

  totalItems: () => {
    const { desk, chair, extras } = get();
    return (
      (desk ? 1 : 0) +
      (chair ? 1 : 0) +
      Object.values(extras).reduce((a, b) => a + b, 0)
    );
  },
}));

function sumBy(s: WorkspaceState, price: (p: Product) => number) {
  let total = 0;
  if (s.desk) total += price(s.desk);
  if (s.chair) total += price(s.chair);
  Object.entries(s.extras).forEach(([id, qty]) => {
    const p = s.extraProducts[id];
    if (p) total += price(p) * qty;
  });
  return total;
}
