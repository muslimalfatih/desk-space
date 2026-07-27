# workspace.rent — 3D Workspace Configurator

Build it before you rent it. Design a home-office setup in 3D, IKEA-planner style — pick a desk, a chair, up to three monitors, and accessories from the side rail, watch them drop into a live 3D room, then review weekly/monthly totals and send a rental request.

**[Live Demo](https://desk-space-taupe.vercel.app/)**

<!-- TODO: screenshot or short GIF of the drag-to-snap flow -->

## Contents

- [Quickstart](#quickstart)
- [Stack](#stack)
- [Approach](#approach)
- [Drag & place](#drag--place)
- [Tech tradeoffs](#tech-tradeoffs)
- [Accessibility](#accessibility)
- [Known boundaries](#known-boundaries)
- [With more time](#with-more-time)
- [Docs](#docs)

## Quickstart

```bash
bun install
bun dev   # http://localhost:3000
```

Deploys to Vercel with zero config: `next build` is the whole story. No env vars, no external services at runtime, no backend.

## Stack

Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, three.js with @react-three/fiber 9 + drei 10, zustand, framer-motion.

## Approach

Layout mirrors the IKEA Space Platform reference: a full-height 3D canvas, a vertical icon rail on the right (Desks / Chairs / Monitors / Accessories) opening a flyout product grid, a floating top bar with the running weekly total and a Summary button, and a right-side drawer for checkout.

State lives in one small zustand store (`store/workspace.ts`): desk, chair, and an extras qty map. Monitors share a hard cap of 3 across models, enforced in the store rather than the UI, so no code path — catalog button, drag-and-drop, or in-scene drag — can exceed it.

Pricing shows both cadences. The monthly rate is genuinely cheaper than four weeks, so the summary states the actual dollar saving rather than inventing a discount; items marked `(est)` in `data/products.ts` carry estimated prices.

Checkout is a request, not a fake purchase. No backend exists, so the CTA leads to a 4-field form (name, WhatsApp, delivery area, start date defaulting to +7 days), then an honest "Request sent" state with a reference number. A "send via WhatsApp instead" link genuinely works too — a `wa.me` deep link pre-filled with the itemized setup.

## Drag & place

Placement is slot-based, not free: every item type has curated anchor slots ([slots.ts](components/three/slots.ts)) — monitors on three desk positions, lamps on desk corners, chairs on a front arc, plants on floor spots. Dragging (in-scene, or a catalog card into the room) raycasts onto the item's surface plane, magnetizes to the nearest free slot with ring/ghost/guide-line feedback, and springs back if released with no valid target. The scene stays believable by construction: there is no state in which an item floats somewhere invalid.

## Tech tradeoffs

**Generic low-poly 3D instead of scanned product models.** Every piece is a small parametric primitive component (`components/three/Furniture3D.tsx`) in one consistent style, and each product carries a `modelPath` field so real models can be swapped in without touching scene logic. The payoff: the two adjustable desks share one animated height, so swapping desks (or adding one) raises the desk with the monitors riding the surface, the sit-stand pitch, animated.

**`<Environment>` + `ContactShadows` instead of drei's `<Stage>`.** Stage re-centers and re-frames on bounding-box changes, so adding a monitor would jolt the camera; a fixed camera rig stays stable. The environment map is generated in-scene from three `<Lightformer>` panels rather than drei's `preset="apartment"`: presets fetch an HDR from a third-party CDN at runtime, and when that CDN started returning 403 the failed fetch threw inside `<Suspense>` and took the whole canvas down. Lighting is now a build artifact, not a network call. Swapping a real `.hdr` back in is a one-line change if the reflection detail is ever worth the dependency. Note: an explicit `ToneMapping` pass sits at the end of the postprocessing chain, since `EffectComposer` bypasses the renderer's ACES tone mapping, and without it bright surfaces clip to white.

**@react-spring/three for add/remove pops** (slight overshoot on scale, none on glides), plus Bloom + Vignette postprocessing, capped for mid-range hardware: dpr ≤ 1.75, multisampling 0, and no DepthOfField (it halves frame rate for a subtle effect, marked in the code if profiling justifies it later).

**Plain `<img>` for catalog photos.** Product shots live in `public/assets` and are small and lazy-loaded, so `next/image` earns nothing here.

**Tailwind 4 is CSS-first.** The brand palette and font stack live in an `@theme` block in `app/globals.css`; there is no `tailwind.config.ts`, and no autoprefixer (Tailwind 4 prefixes itself).

**R3F 9 no longer augments the JSX namespace globally**, so `three.d.ts` registers the three.js intrinsics once for the project.

**TypeScript 6 and ESLint 9, not 7 and 10.** Both are deliberate ceilings, not staleness: `typescript-eslint` refuses to load under TS 7, and `eslint-plugin-react` (via `eslint-config-next`) breaks on ESLint 10's rule-context API. Everything else is on latest. Bump both when the plugin chain catches up.

**React Compiler lint rules are warnings in `components/`.** `eslint-plugin-react-hooks` 7 flags the scene's spring-from-effect and per-frame ref reads. They're real patterns worth revisiting, but silencing them beat restructuring working scene internals.

## Accessibility

Cards are keyboard-operable (`role="radio"`, Enter/Space, visible focus rings), the drawer closes on Escape with scroll lock and initial focus, and `MotionConfig reducedMotion="user"` respects `prefers-reduced-motion` for all DOM animation.

## Known boundaries

Marked with `ponytail:` comments in the source: simulated request send, placeholder WhatsApp business number, no full focus trap in the drawer, DepthOfField skipped in the postprocessing chain. Product photography in `public/assets` is placeholder imagery — replace it with your own before any public deployment.

The full list, with why each is a deliberate simplification rather than a gap, is in [docs/PRD.md](docs/PRD.md#explicitly-out-of-scope-known-boundaries-not-gaps).

## With more time

- Photo-to-3D of the real inventory (Meshy / Luma / RealityScan): the `modelPath` seam is already in the data; each primitive component swaps for a `useGLTF` load behind the existing `<Suspense>`.
- Real POST endpoint for the request form (currently a marked `setTimeout`, grep `ponytail:`).
- Drag-to-reposition items on the desk; saved/shareable setups (zustand persist + URL state).
- Room presets (studio corner / villa terrace) and a price-per-workday framing for teams.
- Delivery areas are a hardcoded list in `SummaryDrawer.tsx`; they'd move server-side alongside a real endpoint.

## Docs

- [docs/PRD.md](docs/PRD.md) — retroactive spec: problem, users, in/out-of-scope, success criteria.
- [CLAUDE.md](CLAUDE.md) — project conventions and where things live, for anyone (human or agent) working in this repo.
