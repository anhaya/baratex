# baratex

Frontend for baratex, a marketplace for buying and selling second-hand items near you. It is built from the design in the project and **runs entirely on mock data**. There is no backend yet.

## Stack

- **SvelteKit 2 + Svelte 5 (runes), TypeScript strict**, built with Vite.
- **Server-side rendering** with `@sveltejs/adapter-node`. Pages load without JavaScript and hydrate only what is interactive.
- **Zod** schemas for every payload crossing the API boundary.
- **Self-hosted fonts** (Manrope, Unbounded) and inline SVG icons. There are no third-party requests at runtime.
- **Vitest** for unit tests and **Playwright** for end-to-end tests (desktop and mobile).

## Getting started

```sh
npm ci
npm run dev          # http://localhost:5173
npm run check        # svelte-check + TypeScript
npm test             # unit tests
npm run test:e2e     # builds, starts the server and runs Playwright
npm run build && node build   # production server on :3000
```

## Screens

| Route | Screen |
| --- | --- |
| `/` | Feed with categories, sorting, distance filter, comments and offers |
| `/chat` | AI chat search, with editable filters, saved searches and alerts |
| `/anuncio/[id]` | Listing page with gallery, fair price range, delivery or pickup, buy, offer and comments |
| `/favoritos` | Favorites with filters (price drop, my offer, available, sold) |
| `/mensagens`, `/mensagens/[id]` | Conversations with offer, counter-offer and accept |
| `/descobrir` | Discover mode with swipe cards (right saves, left passes, arrow keys work too) |
| `/vender` | Three-step listing flow with photo previews |
| `/sacola`, `/vendas`, `/perfil` | Cart, my listings and profile |

Distance ("Até onde você vai buscar?") is stored in an `httpOnly` cookie, so the server renders the right feed.

## How the mock works and how to swap in a backend

```
src/lib/api/schemas.ts      Zod contracts (money is always integer centavos)
src/lib/api/types.ts        BaratexApi interface used by every route
src/lib/server/api/index.ts the single place that picks the implementation
src/lib/server/api/mock.ts  in-memory implementation (resets on restart)
src/lib/server/mock/data.ts seed data
```

Routes only call `api` from `$lib/server/api`, and only inside `load` functions and form actions. Moving to a real backend means writing an HTTP client that implements `BaratexApi` and parses responses with the same schemas. No page changes.

Mock state is shared by everyone hitting the same server process. That is fine for demos, but it is not per-user.

## Security

- **Strict Content Security Policy** with per-request nonces: `default-src 'self'`, no `unsafe-inline` for scripts or styles, `object-src 'none'` and `frame-ancestors 'none'`. The only inline style allowed is SvelteKit's route announcer, pinned by hash. Assets are never inlined as `data:` URIs.
- **Security headers** in `src/hooks.server.ts`: `nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`, COOP/CORP, HSTS in production, and `Cache-Control: private, no-store` on HTML.
- **CSRF**: SvelteKit's origin check is on. Cross-site form posts get a 403, and an e2e test covers this.
- **All input is validated on the server** with Zod (offers, comments, messages, listings, query strings). Errors shown to the user never include internals (`handleError`).
- **Open-redirect guard** (`safeBack`) for post-action redirects.
- **No `{@html}` and no inline `style` attributes.** A unit test fails the build if either appears.
- Image URLs must be same-origin paths, enforced by the schema.
- Dependencies are pinned exactly, with `ignore-scripts=true`, `npm audit` in CI and Dependabot enabled.

Not done yet, because it needs the backend: authentication and sessions, rate limiting, real payment and escrow, and photo upload. Prices and fees shown in the UI are for display only, and the backend must recompute every total.

## Deploying

`node build` serves the app. Set `ORIGIN` to the public URL (see `.env.example`). Put it behind HTTPS, because the radius cookie is `Secure` and HSTS is on in production.
