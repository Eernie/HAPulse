# Contributing to HAPulse

## Dev setup

Requirements: Node >= 20, npm >= 10.

```bash
git clone https://github.com/jlnbln/HAPulse.git
cd HAPulse
npm install
```

## npm scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the dashboard dev server at localhost:5173 |
| `npm run build` | Build `@hapulse/core` then `@hapulse/dashboard` (outputs to `apps/dashboard/dist`) |
| `npm run typecheck` | Type-check both packages |
| `npm test -w @hapulse/core` | Run core smoke tests |

## Code style

- **TypeScript strict** throughout. Avoid `any`; where HA payloads are untyped, add a local type rather than casting.
- **Design tokens** — all colors, spacing, and typography come from CSS custom properties defined in `docs/DESIGN.md`. Do not introduce hardcoded hex values.
- **`@hapulse/core` stays React-free** — no DOM, no JSX. This package is reused by the future mobile app. All HA logic (connection, registries, rooms, demo data) lives here; components are thin consumers.
- **Zustand selectors** — never subscribe a component to the whole entity map. Use `useEntity(id)` / `useEntities(ids)` or a scoped selector.
- **Responsive** — every page must work at 375px and 1440px.
- **Graceful degradation** — missing domains (no cameras, no weather entity) must hide the section, not crash.

## Pull requests

- One concern per PR where possible.
- Include a short description of the change and any manual testing you did.
- For visual changes, a screenshot or short screen recording is appreciated.
- The CI workflow runs `npm run typecheck`, `npm run build`, and `npm test -w @hapulse/core` on every PR.
