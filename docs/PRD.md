# PRD — workspace.rent 3D Workspace Configurator

Status: **retroactive** — this documents the app as built, not a forward plan. It exists so a reader can understand what shipped and why without reverse-engineering it from the diff. For what's next, see the README's "With more time" section; for implementation tradeoffs, see "Tech tradeoffs" in the same file.

Live: https://desk-space-taupe.vercel.app/

## Problem

Renting office furniture sight-unseen is a leap of faith — will a 34" monitor actually fit next to a lamp on this desk? Will three monitors even fit? workspace.rent lets a customer build their setup in 3D before committing, IKEA-planner style, then send a rental request for what they configured.

## Users

Remote workers and small teams in Bali (delivery is scoped to Bali-wide, per the drawer's area list) renting a home-office setup by the week or month, who want to see the setup before paying for delivery and assembly.

## Scope

### In scope (shipped)

**Catalog & selection**
- Four categories: desks, chairs, monitors, accessories (`data/products.ts`).
- Desk and chair are single-select (picking a new one replaces the old). Monitors and accessories are qty-select, each with a per-product `maxQty`.
- Monitors share one hard cap of 3 across all monitor models combined, enforced in the store (`MONITOR_CAP` in `store/workspace.ts`), not just the UI — no code path can exceed it.
- Every catalog card shows both weekly and monthly price; estimated prices are marked `(est)` in the data rather than presented as confirmed.

**3D placement**
- Every category has curated anchor slots (`components/three/slots.ts`) — monitors on 3 desk positions, lamp/coffee machine on desk corners, chairs on a front floor arc, plants and the whiteboard on floor spots. There is no free placement; an item can only ever occupy a valid slot for its type.
- Adding an item from the catalog drops it into the first free valid slot. Dragging an item already in the scene, or dragging a catalog card onto the 3D stage, raycasts to the nearest free slot within a snap radius, with ring/ghost/guide-line feedback while dragging, and springs back to its last valid slot if released with no target.
- Desks are the scene anchor (not draggable, single active desk); everything on the desk surface rides the desk's animated height, so swapping a sit-stand desk for a fixed one animates the whole desktop layer.

**Pricing & checkout**
- A persistent top bar shows the running weekly total and item count.
- A summary drawer lists every selected item with per-line pricing, and shows both weekly and monthly totals — the monthly rate is genuinely cheaper than 4× weekly, and the drawer states the actual dollar saving rather than inventing a discount.
- Checkout is a **request**, not a purchase: a 4-field form (name, WhatsApp number, delivery area, start date defaulting to 7 days out) submits to a simulated backend (`ponytail:`-marked `setTimeout`) and shows a "Request sent" confirmation with a generated reference number.
- A "send via WhatsApp instead" link is a real `wa.me` deep link pre-filled with the itemized setup — functional today, no backend required.

**Accessibility**
- Catalog cards are keyboard-operable (`role="radio"` for single-select categories, Enter/Space to activate, visible focus rings).
- The summary drawer closes on Escape, locks body scroll while open, and moves initial focus to the close button.
- `MotionConfig reducedMotion="user"` respects `prefers-reduced-motion` for all Framer Motion DOM animation.

### Explicitly out of scope (known boundaries, not gaps)

These are deliberate simplifications marked `ponytail:` in the source, not things that were missed:

- **No real backend.** The request form and its `setTimeout` are the entire "send" flow; there is no POST endpoint. The WhatsApp link is the only channel that reaches an actual person.
- **No real WhatsApp business number.** `SummaryDrawer.tsx`'s `BUSINESS_WA` is a placeholder value.
- **No full focus trap in the drawer.** Escape and initial focus are handled; a wraparound focus trap is not.
- **No DepthOfField in postprocessing.** Skipped — it halves frame rate for a subtle effect on mid-range hardware.
- **No scanned 3D models.** Every piece is a hand-authored parametric primitive (`components/three/Furniture3D.tsx`), not a photo-scanned `.glb`. Each product carries a `modelPath` field as the swap-in seam for real models later.
- **Product photography is placeholder imagery** (`public/assets`) — not the real rental inventory.
- **Delivery areas are a hardcoded list** in `SummaryDrawer.tsx`, not server-driven.

### Non-goals

- This is not an e-commerce checkout — no payment is ever collected in this flow, by design (the drawer's copy says as much: "We'll confirm availability by WhatsApp before any payment").
- Not a general room-design tool — placement is constrained to curated slots per item type; there is no free-form furniture arrangement.
- Not multi-room or multi-desk — one desk anchors one workspace per session.

## Success criteria

Since this shipped as a single build rather than iterating against usage data, "success" here is functional correctness against the scope above:
- A user can go from empty scene to a sent request without a dead end (verified: the "Rent Your Setup!" CTA is disabled with 0 items, so the form can't be reached empty).
- No placement state is reachable where an item overlaps another or floats outside a slot (structural guarantee of the slot system, not a runtime check).
- The monitor cap cannot be bypassed from any entry point (catalog qty button, drag-and-drop from catalog, or in-scene drag) — enforced once in the store's `addExtra`, not per call site.

## Reference

Full technical rationale for the choices above (why primitives over scanned models, why slot-based over free placement, dependency and lint decisions) lives in the README's "Tech tradeoffs" section — this PRD covers *what* shipped, the README covers *why* it was built that way.
