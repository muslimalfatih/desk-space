# CLAUDE.md

Project context for Claude Code. See [README.md](README.md) for approach/tradeoffs and [docs/PRD.md](docs/PRD.md) for scope.

## Stack

Next.js 16 (App Router) · React 19 · TypeScript 6 · Tailwind CSS 4 · three.js via @react-three/fiber 9 + drei 10 · zustand · framer-motion.

## Commands

```bash
bun install
bun dev            # http://localhost:3000
bun run build      # next build — typechecks as part of the build (no separate tsc step)
bun run lint       # eslint
```

No env vars, no external services at runtime, no backend. Deploys to Vercel with zero config.

## Where things live

- `store/workspace.ts` — the one zustand store: desk, chair, extras qty map, placements, drag state. All cross-cutting rules (e.g. the monitor cap) are enforced here, not in the UI — don't re-check them in a component.
- `data/products.ts` — the catalog. Adding a product means adding a `Product` entry here **and** a slot list in `components/three/slots.ts` **and** a mesh case in `UnitMesh` (`components/three/Scene.tsx`).
- `components/three/slots.ts` — the entire placement system. Items can only occupy a curated `Slot`; there is no free placement. This is why the scene can never have a floating or overlapping item — it's structural, not validated at runtime.
- `components/three/Scene.tsx` — the r3f canvas. Large (500+ lines) but single-purpose; everything in it is canvas-specific and none of it is meant to be reusable outside `<Canvas>`.
- `components/three/Furniture3D.tsx` — hand-authored low-poly primitives standing in for real 3D scans. Each `Product` has a `modelPath` field as the seam for swapping in real `.glb` models later; primitives render meanwhile.

## Conventions specific to this repo

- **`app/globals.css` is the only globals file.** A duplicate once existed at the repo root — deleted, don't recreate it.
- **Tailwind 4 is CSS-first**: theme lives in an `@theme` block in `app/globals.css`. There is no `tailwind.config.ts` — don't add one.
- **R3F 9 doesn't augment the global JSX namespace.** `three.d.ts` registers three.js intrinsics (`<mesh>`, `<group>`, etc.) once for the project — if a new intrinsic errors as unknown JSX, check there, not per-file.
- **TypeScript 6 / ESLint 9 are deliberate ceilings**, not staleness — `typescript-eslint` doesn't load under TS 7 yet, and `eslint-plugin-react` (via `eslint-config-next`) breaks under ESLint 10. Don't bump either without checking the plugin chain first.
- **`eslint.config.mjs` downgrades three `react-hooks` rules to warnings**, scoped to `components/**/*.tsx` only — the scene's spring-from-effect and per-frame ref reads trip the React Compiler rules. Don't silence these elsewhere without the same rationale.
- **Plain `<img>`, not `next/image`**, for catalog photos (`public/assets`) — they're small and already lazy-loaded, so `next/image` buys nothing. Keep it that way unless the images actually grow.
- **`ponytail:` comments mark deliberate, named simplifications** (simulated backend, placeholder WhatsApp number, no focus trap, no DepthOfField) — not TODOs from oversight. Grep `ponytail:` before "fixing" one; check `docs/PRD.md`'s "Explicitly out of scope" section for the full list and why.
