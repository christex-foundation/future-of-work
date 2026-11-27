# ADR-0007: Delete, don't flag; strip by an explicit allowlist with an automated reachability check

- Status: Accepted. Delete, don't flag (David). Allowlist strip instead of the three subsystem strips (FND-06/07/08), plus the reachability check (CTO, 27 Nov 2026, YAGNI cut C1).
- Date: 2026-11-27
- Deciders: David Ogoo (Christex), CTO, SLDTP tech lead
- Supersedes / relates to: engineering-plan FND-03, FND-06 to FND-08, FND-10; CTO tools/deleted-paths.example

## Context and problem statement

About 85% of `src/` is Superteam product (bounties, grants, hackathons, credits, wallet, agents, chapters). Modules we planned to keep import modules we planned to delete: `sponsor-dashboard` imports `listings` 33 times and `grants` 13 times; `listing-builder` imports `tokenList` and `wallet`; `listings` imports `credits`, `pro`, `hackathon`, `chapters`. Import-time side effects (`src/lib/redis.ts` throws without Upstash env; the Privy client is constructed at import) stop even `next build` without SaaS secrets. Privy itself stays (ADR-0006).

## Decision drivers

- No dead SaaS code in a government deployment
- Keep `main` building at every step
- Least engineer time
- A deletion list must not be able to delete code that kept code still imports. The CTO's draft ledger deletes `src/features/stfun/**`, but `_app.tsx`, `index.tsx` and the Daybreak cards import it.

## Considered options

1. Feature flags (rejected: someone forgets a flag; Privy and the fee-payer code stay shipped)
2. Ordered subsystem deletes A (money), B (product areas), C (SaaS) (plan: 120 hours for FND-06 to 08)
3. Allowlist: keep a short list of files, delete everything else in one PR, then build SLDTP on the clean base (chosen)
4. Allowlist without a check (rejected: hand-maintained lists drift, which is how the `stfun` entry happened)

## Decision outcome

Option 3, with the check. The allowlist is [`docs/strip/allowlist.txt`](../strip/allowlist.txt), a file of globs (`!` excludes, `~` marks files the strip PR rewrites). [`docs/strip/check-strip.mjs`](../strip/check-strip.mjs) uses the repo's own TypeScript resolver and fails if:
1. a kept file imports a non-kept file;
2. a kept import doesn't resolve;
3. a kept file references a non-kept `public/` asset;
4. with `--ledger`, a ledger glob matches a kept file, or anything outside the ledger imports a ledger path.

The script is committed under `docs/strip/` as docs tooling. It is not a CI job in that form. The strip PR makes `node docs/strip/check-strip.mjs --strict --ledger .sldtp/deleted-paths` a required CI job. Until then, the CTO's `upstream-triage.py --check-imported` is the interim check (CTO, 27 Nov 2026). `src/app/api` handlers that survive move to `src/pages/api` (strip-map §2.2). See `docs/strip-map.md` §2.1 for the list, the order and the results at `97bfeeb8e`. In short: extract the Daybreak tokens and components first; keep `components/ui` (minus 3 crypto/Cloudinary files), `styles/globals.css`, fonts, the Privy auth funnel (`lib/privy.ts`, `getPrivyToken.ts`, the provider without Solana, `lib/api.ts`) to adapt, `lib/logger.ts`, `prisma.ts`, about six utils and the tooling config; delete all of `src/pages`, `src/app`, `src/features`, the rest of `lib`, `utils`, `constants`, `store`, `context`, and the schema. Prune `package.json` with knip. `main` builds again the same day, with an empty shell page.

### Consequences

- Good: one deletion PR instead of a dependency untangling exercise across 40,000 lines; no import-time SaaS side effects left; about 70 hours saved against FND-06 to FND-09 (YAGNI cut C1).
- Bad: the opportunity and employer screens are rebuilt rather than adapted (ADR-0010); there is a short window when `main` has no product UI.

### Confirmation

- Before the strip PR: the plan check on `main` lists only the 13 known Privy-file edits (strip-map §2.1).
- In the strip PR and every PR after it, `node docs/strip/check-strip.mjs --strict --ledger .sldtp/deleted-paths` prints `OK`. A deliberate test PR that re-imports a deleted path must fail it.
- After the strip PR: `rg -i 'solana|posthog|upstash|bullmq|cloudinary|airtable|sumsub|openrouter'` over `src/` and `package.json` returns nothing (Privy is allowed only under `src/sldtp/auth/` and `_app`; Cloudinary only in `src/lib/image-upload/`, `src/utils/cloudinary.ts` and the moved `src/pages/api/image` and `og` handlers, until ADR-0004's object storage replaces it); `next build` succeeds with only `DATABASE_URL` set.
