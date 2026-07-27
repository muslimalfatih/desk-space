export type Category = 'desk' | 'chair' | 'monitor' | 'accessory';

export interface Product {
  id: string;
  name: string;
  category: Category;
  /** USD per week */
  priceWeek: number;
  /** USD per month — cheaper than 4× weekly, so the summary shows both */
  priceMonth: number;
  description: string;
  /** Product photo in public/assets; null → placeholder card */
  image: string | null;
  maxQty: number;
  /** TODO: swap for real .glb scans (Meshy/Luma photo-to-3D) — primitives render meanwhile */
  modelPath: string;
}

const IMG = '/assets';

// Items marked (est) are estimated to sit alongside their neighbours.
export const PRODUCTS: Product[] = [
  // ── DESKS ─────────────────────────────────────────────
  {
    id: 'desk-electric',
    name: 'Electrical Adjustable Desk',
    category: 'desk',
    priceWeek: 7,
    priceMonth: 20,
    description: 'Electric sit-stand desk. Go standing when you need energy.',
    image: `${IMG}/desk-electric.jpg`,
    maxQty: 1,
    modelPath: '/models/desk-electric.glb',
  },
  {
    id: 'desk-mechanical',
    name: 'Mechanical Adjustable Desk',
    category: 'desk',
    priceWeek: 5, // (est)
    priceMonth: 15, // (est)
    description: 'Crank-adjustable height. Solid top, no power needed.',
    image: `${IMG}/desk-mechanical.jpg`,
    maxQty: 1,
    modelPath: '/models/desk-mechanical.glb',
  },
  // ── CHAIRS ────────────────────────────────────────────
  {
    id: 'chair-furradec',
    name: 'Ergonomic Task Chair',
    category: 'chair',
    priceWeek: 13,
    priceMonth: 32,
    description: 'Mesh back, lumbar support, 12-hour comfort.',
    image: `${IMG}/chair-ergonomic.jpg`,
    maxQty: 1,
    modelPath: '/models/chair-furradec.glb',
  },
  {
    id: 'chair-fantech',
    name: 'Ergonomic Office Chair',
    category: 'chair',
    priceWeek: 9, // (est)
    priceMonth: 24, // (est)
    description: 'Breathable mesh back, adjustable armrests.',
    image: `${IMG}/chair-mesh.jpg`,
    maxQty: 1,
    modelPath: '/models/chair-fantech.glb',
  },
  // ── MONITORS (max 3 total across models) ──────────────
  {
    id: 'mon-24',
    name: '24" Full HD Monitor',
    category: 'monitor',
    priceWeek: 7,
    priceMonth: 24,
    description: 'Crisp Full HD office panel.',
    image: `${IMG}/monitor-24-fhd.jpg`,
    maxQty: 3,
    modelPath: '/models/monitor-24.glb',
  },
  {
    id: 'mon-27',
    name: '27" 4K Multimedia Monitor',
    category: 'monitor',
    priceWeek: 12, // (est)
    priceMonth: 36, // (est)
    description: '4K IPS, USB-C power delivery.',
    image: `${IMG}/monitor-27-4k.jpg`,
    maxQty: 3,
    modelPath: '/models/monitor-27.glb',
  },
  {
    id: 'mon-34',
    name: '34" 4K Gaming Monitor',
    category: 'monitor',
    priceWeek: 23,
    priceMonth: 76,
    description: 'Ultrawide 4K — one cable, whole cockpit.',
    image: `${IMG}/monitor-34-4k.jpg`,
    maxQty: 3,
    modelPath: '/models/monitor-34.glb',
  },
  // ── ACCESSORIES ───────────────────────────────────────
  {
    id: 'lamp-mi',
    name: 'Smart LED Desk Lamp',
    category: 'accessory',
    priceWeek: 3, // (est)
    priceMonth: 9, // (est)
    description: 'Warm/cool light, app-controlled.',
    image: `${IMG}/desk-lamp.jpg`,
    maxQty: 1,
    modelPath: '/models/lamp.glb',
  },
  {
    id: 'plant-monstera',
    name: 'Monstera Plant',
    category: 'accessory',
    priceWeek: 3, // (est)
    priceMonth: 9, // (est)
    description: 'Tropical vibes, watering service included.',
    image: null, // no photo yet — placeholder card
    maxQty: 2,
    modelPath: '/models/plant.glb',
  },
  {
    id: 'whiteboard',
    name: 'Standing Whiteboard',
    category: 'accessory',
    priceWeek: 10,
    priceMonth: 28,
    description: '120×240 — sketch the architecture, then ship it.',
    image: `${IMG}/whiteboard.jpg`,
    maxQty: 1,
    modelPath: '/models/whiteboard.glb',
  },
  {
    id: 'coffee-nespresso',
    name: 'Capsule Coffee Machine',
    category: 'accessory',
    priceWeek: 12,
    priceMonth: 31,
    description: 'The sprint fuel.',
    image: `${IMG}/coffee-machine.jpg`,
    maxQty: 1,
    modelPath: '/models/coffee.glb',
  },
];

export const byCategory = (c: Category) => PRODUCTS.filter(p => p.category === c);

export const usd = (n: number) => `$${n}`;

/** Total monitors allowed in one workspace */
export const MONITOR_CAP = 3;
