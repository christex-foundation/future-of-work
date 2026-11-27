# ADR-0014: Pages Router only, for pages and API routes

- Status: **Accepted** (CTO, 27 Nov 2026). ADR-0002's App Router routing line is amended by ADR-0018 A6. Offline doesn't need the App Router: Serwist's config mode builds `public/sw.js` after `next build` (ADR-0011).
- Date: 2026-11-27
- Deciders: David Ogoo (Christex), CTO, SLDTP tech lead
- Supersedes / relates to: CTO stack-review Q15; ADR-0002 (routes rule); ADR-0018 A6

## Context and problem statement

At `97bfeeb8e`, all 91 UI pages used the Pages Router, and API code was split between `src/pages/api` (117 files) and App Router handlers in `src/app/api` (71 files), with two helper families for the same auth check. On integration `b6c208cf6` the unauthenticated `dummy-submissions` route is gone, so `src/app/api` has 70 route handlers. Page files are still 91 and `src/pages/api` is still 117. There are still no App Router pages. `src/app` also has `robots.txt/route.ts`, `.well-known/agent.json/route.ts` and `sitemap.ts`. The allowlist strip (ADR-0007) deletes `src/app`.

## Decision drivers

- One way to do things
- Reuse `_app` providers and existing team knowledge for the beta
- next-intl and the service worker work with either

## Considered options

1. Pages Router for pages + App Router for new route handlers (CTO Q15)
2. Pages Router for everything (chosen)
3. App Router for everything (RSC, layouts)

## Decision outcome

Option 2 for the beta: pages in `src/pages/**`, API routes in `src/pages/api/**`, auth via `requireRole(req, ...)` and `withPageRole` in `getServerSideProps`. Delete `src/app/` entirely (re-create `robots.txt` as a static file).

Revisit after the beta: App Router with server components could cut client JavaScript on low-end phones. Measure page weight first (OFL-06 records it); move only if the numbers say so.

Migration: the five `src/app/api` handlers that survive (image sign and delete; OG share cards for opportunity, employer and profile) are rewritten as `src/pages/api` handlers in the strip PR. Upstream security ports #1450 and #1520 land on the new paths (strip-map §2.2). `next/og` `ImageResponse` works in Pages API routes.

### Consequences

- Good: one request type, one auth helper, one mental model.
- Bad: Pages Router gets fewer new Next.js features; a later move to the App Router is a real migration.

### Confirmation

No files under `src/app/` (CI check); OFL-06 records page weight for the revisit.
