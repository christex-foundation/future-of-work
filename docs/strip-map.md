# Strip map: from Superteam Earn (Daybreak) to the SLDTP base

Status: **proposed** by the SLDTP tech lead, 27 Nov 2026. The saved checker output is from `main` at `97bfeeb8e`. Checked again against `integration` at `b6c208cf6`. Implements ADR-0007 (delete, don't flag; strip by an explicit allowlist checked by a reachability script). C1 is **agreed** by the CTO.

`docs/strip/check-strip.mjs` and `docs/strip/allowlist.txt` are docs tooling. They are not a CI job. CI still runs `scripts/sldtp/upstream-triage.py --check-imported` (ADR-0018).

Corrections against `b6c208cf6`:

- Next.js is already 16.4.6. Step 5 below is only the remainder (image optimiser, `.nvmrc`, a few exact pins).
- `src/app/api/dev-tool/dummy-submissions` is already deleted. `src/app/api` has 70 route handlers, plus `robots.txt/route.ts`, `.well-known/agent.json/route.ts` and `sitemap.ts` outside that folder.
- CI already installs with `--frozen-lockfile`, typechecks, checks the deletion ledger, and runs a non-blocking `audit` job on pull requests and on pushes to `main` and `integration`. It does not lint, build, or run this checker.
It replaces the plan's subsystem strips FND-06, FND-07 and FND-08 (120 hours) with an allowlist strip of about 50 hours. **Privy is kept and adapted, not stripped** (ADR-0006); FND-10 ("remove Privy") is dropped. Estimates are in hours. §6 keeps the subsystem order, with its import reasoning, as the fallback if David or the CTO prefer to adapt listings and sponsor-dashboard after all.

## 1. Why an allowlist and not subsystem deletes

The import graph (script over `src/`, `@/` imports, 27 Nov 2026) shows the modules we would "keep and adapt" depend on the modules we would delete:

| Kept-looking module | Imports from modules marked for deletion (count of import sites) |
| --- | --- |
| `features/sponsor-dashboard` (19k lines) | `listings` 33, `talent` 15, `grants` 13, `listing-builder` 8, `social` 6, `constants/tokenList` 3, `wallet` 2, `membership` 2, `surveys` 2, `hackathon`, `agents`, `pro`, `sponsor` |
| `features/listing-builder` (14k) | `listings` 10, `auth` 8, `tokenList` 4, `wallet` 3, `navbar` 3, `sponsor-dashboard` 3, `pro` 2, `surveys` 2, `agents`, `emails`, `chapters`, `announcements`, `hackathon` |
| `features/listings` (11k) | `listing-builder` 7, `social` 7, `chapters` 6, `pro` 4, `auth` 4, `credits` 4, `hackathon` 3, `home` 3, `stfun` 2, `grants` 2, `membership`, `surveys` |
| `features/navbar` | `talent` 5, `credits` 4, `wallet` 2, `pro`, `membership`, `search` |
| `pages/api/submission/create.ts` | `credits` (consumeCredit, canUserSubmit), `agents` (queueAgent), `emails` (queueEmail → ioredis at import) |
| Daybreak components in `sponsor-dashboard/components/daybreak/*` | `listings/types`, `listings/utils/*`, `grants/utils/grantAmount`, `listing-builder/utils/isListingEditable`, `ui/token-icon`, `store/user` |

So deleting strip A (money) breaks `listings`, `listing-builder`, `sponsor-dashboard` and `navbar` at compile time. Each strip PR becomes "delete X, then edit 30 files we keep, which we will rewrite anyway in weeks 4 to 8". The allowlist avoids that work entirely.

The kept asset is small and self-contained: `components/ui` imports only `utils/cn` (plus three files we drop).

## 2. Allowlist (everything else under `src/`, `public/` and `prisma/` is deleted)

**The source of truth is [`docs/strip/allowlist.txt`](strip/allowlist.txt)**, a file of globs. The table below explains it; if they disagree, the file wins and the table gets fixed. A line starting with `!` removes files from the kept set, and a line starting with `~` marks a kept file that the strip PR rewrites (§2.1).


| Keep | Notes |
| --- | --- |
| `src/components/ui/*` except `token-icon.tsx`, `token-input.tsx`, `cloudinary-image.tsx`, `form-field-wrapper.tsx` | Daybreak-restyled shadcn kit (`form-field-wrapper` imports the TipTap editor; found by the check) |
| `src/components/shared/{EmptySection,ErrorSection,ErrorInfo,MarkdownRenderer}.tsx` + the 2 icons they import and `icons/helpers/{GenIcon,IconContext}.tsx` | Generic |
| `src/styles/globals.css` | Daybreak tokens (forest primary, Fraunces/Archivo variables) |
| `src/theme/fonts.ts`, `src/theme/fonts-st.ts` (rename to `fonts-daybreak.ts`) | Drop the `animeace2_*.ttf` files |
| Daybreak extracted to `src/sldtp/ui/` before deletion: `SunGauge.tsx`, `DaybreakStats.tsx`, and the visual parts of `DaybreakBountyCard.tsx` and `ListingBoardCard.tsx` (markup and classes only, no listing types) | The `stfun` and `sponsor-dashboard` copies are deleted |
| `src/lib/logger.ts`, `src/lib/domPurify.ts` | |
| **Adapt (Privy):** `src/lib/privy.ts` (make lazy), `src/features/auth/utils/getPrivyToken.ts`, `withAuth.ts`, `withSponsorAuth.ts`, `getUserSession.ts`, `getSponsorSession.ts`, `src/lib/api.ts`, `src/components/providers.tsx` (PrivyProvider only), `src/store/user.ts`, `src/features/auth/components/{Login,EmailSignIn,SignIn}.tsx` | Move to `src/sldtp/auth/`. Wrappers collapse into `requireUser`/`requireRole`/`withPageRole` mapped to the new `User.role`. Provider: remove the Solana RPC config, `loginMethods: ['email']`. `useUser`: drop PostHog, referral and redirect logic. Delete `withAgentAuth.ts`, `getAgentSession.ts`, `checkGrantSponsorAuth.ts`, `handleInvite.ts`, `[...nextauth].ts` |
| `src/prisma.ts` | Simplify: MariaDB adapter only, no PlanetScale, no KYC `omit` |
| `src/utils/{cn,dayjs,timeAgo,truncateString,safeStringify}.ts` | `getURLSanitized` imports `features/social`; re-add only if needed |
| `src/hooks/{use-breakpoint,use-clipboard,use-disclosure,use-media-query,use-timeout}.ts` | |
| `src/constants/country.ts` | Sierra Leone districts will be a new constant |
| `src/pages/_document.tsx` (trimmed), a new minimal `_app.tsx` | `_app` keeps the adapted PrivyProvider; drops Solana, TokenList, GA, GSAP |
| Repo root: `tsconfig.json`, `.oxlintrc.json`, `.oxfmtrc.json`, `.husky/`, `lint-staged.config.js`, `postcss.config.js`, `components.json`, `prisma.config.ts`, `LICENSE`, `.gitignore` | `next.config.ts` rewritten (see §4) |
| `public/` favicons, `site.webmanifest`, fonts | Drop `earn-brand-assets.zip`, `skill.md`, `heartbeat.md`, `assets/` Superteam images |

Deleted: every path the allowlist doesn't match. That includes all of `src/app`, `src/features` (except the Privy files above), `src/layouts`, `src/context`, `src/queries`, `src/server`, `src/services`, `src/svg`, `src/interface`, `src/types`, the rest of `src/lib`, `utils`, `constants`, `hooks`, `store` and `components`, and `src/components/ui/form-field-wrapper.tsx`, which imports the TipTap `RichEditor` and `token-input`. Outside the scanned folders the strip PR also deletes `src/instrumentation-client.ts` (PostHog), `vercel.json`, `.github/workflows/schema-sync-notify.yml` and `.env.example` (replaced).

### 2.1 Reachability check (`strip/check-strip.mjs`)

A list alone is how the CTO's ledger came to delete `src/features/stfun/**` while `_app.tsx`, `index.tsx` and the Daybreak cards still imported it. So the allowlist ships with a check that makes that mistake fail CI:

| Rule | Fails when |
| --- | --- |
| Closed under imports | A kept file imports a file that is not kept (static `import`/`export … from`, dynamic `import()`, `require()`, CSS `@import`) |
| Resolves | A kept file's relative or `@/` import doesn't resolve |
| Assets | A kept file references an image, font or media file under `public/` that is not kept |
| Ledger (with `--ledger`) | A ledger glob matches a kept file, or a file outside the ledger imports a ledger path |

It is about 140 lines with no new dependencies: it uses the repo's own `typescript` (`ts.preProcessFile`, `ts.resolveModuleName` with `tsconfig.json` paths). `src/generated/` (Prisma client output) is skipped.

Where it runs (CTO, 27 Nov 2026: the script **lands with the strip PR**):
1. **Plan check, now**, on `main`, run from this folder. This produces the strip PR's edit list.
2. **Until the strip PR merges**, the interim CI check is the CTO's `upstream-triage.py --check-imported` over `.sldtp/deleted-paths` (ADR-0002).
3. **In the strip PR**, `node docs/strip/check-strip.mjs --root . --strict` must print `OK`, and that command replaces `--check-imported` as the required job. The script itself is already in the repo as docs tooling.
4. **In CI on every PR afterwards** with `--strict --ledger .sldtp/deleted-paths`, so a later PR or an upstream port can't re-import a deleted path, and a ledger entry can't delete code that is still used (ADR-0018).

Results at `97bfeeb8e` (27 Nov 2026). The output files were not regenerated on `b6c208cf6`. Deleting `dummy-submissions` removes one file the plan already treated as deleted, so the kept set should be unchanged.

| Run | Result |
| --- | --- |
| `check-strip.mjs --allowlist strip/allowlist.txt` (plan) | 1,318 files scanned, 110 kept (including the handlers moved by §2.2), 1,208 deleted. **13 problems, all in the Privy files we adapt:** `EmailSignIn`, `Login` and `SignIn` import `auth/atoms`, `handleUserCreation`, `conversion-popups/atoms`, `TERMS_OF_USE`, `svg/google` and an icon; `withAuth` and `withSponsorAuth` import `auth/types`. These are exactly the edits step 3 must make (drop Google login, replace `handleUserCreation` with `/api/me` provisioning, inline the types). The first runs also caught `form-field-wrapper.tsx` (TipTap) and the icon helpers, which are now fixed in the allowlist. File: [docs/strip/plan-check-97bfeeb.txt](strip/plan-check-97bfeeb.txt) |
| `--emit-ledger`, then the check with that generated ledger | 229 ledger globs ([docs/strip/deleted-paths.generated-97bfeeb.txt](strip/deleted-paths.generated-97bfeeb.txt); the §2.2 moves are added by hand as `old -> new` lines); the same 13 Privy-file problems and nothing else. The ledger for ADR-0002's triage is **generated from the allowlist**, not maintained by hand |
| `--strict` with the CTO's `deleted-paths.example` as `--ledger` | **182 ledger problems**: the ledger deletes code still imported outside it. These include 19 `stfun` imports from `_app.tsx` (Header, Footer), `index.tsx` (`DaybreakLanding`), `home`, `listings` (`DaybreakBountyCard`), `branding`, `projects` and `fast-track`, plus `grants` 50, `pro` 17, `credits` 17, `chapters` 12, `conversion-popups` 12 and `wallet` 10. This is the subsystem-strip coupling from §1, now machine-checked. File: [docs/strip/ledger-check-cto-example-97bfeeb.txt](strip/ledger-check-cto-example-97bfeeb.txt) |

### 2.2 `src/app/api` handlers move to `src/pages/api` (ADR-0014, accepted)

The App Router is gone after the strip; only `src/pages/` remains. Of the 71 `src/app/api` handlers at `97bfeeb8e` (70 on integration, because `dummy-submissions` is already gone), these five survive and are **rewritten as Pages Router API handlers** (`export default function handler(req, res)`). All other `src/app/**` is deleted, including `.well-known/agent.json` and `robots.txt` (replaced by `public/robots.txt`). `dev-tool/dummy-submissions` was the open unauthenticated route; it is not in the tree.

| From (`src/app/api/…/route.ts[x]`) | To (`src/pages/api/…`) | Notes |
| --- | --- | --- |
| `image/sign` | `image/sign.ts` | Uses `src/lib/image-upload/**` (kept). Guard becomes `requireUser`. The in-memory `rate-limiter.ts` stays (no Redis, ADR-0013) |
| `image/delete` | `image/delete.ts` | `requireUser`; the owner check maps to SLDTP owners (user avatar, employer logo); grant-tranche branches deleted |
| `dynamic-og/listing` | `og/opportunity.tsx` | Share card for an opportunity. `next/og` `ImageResponse` in a Pages API route; drop `getTokenIcon` and the reward/token block |
| `dynamic-og/sponsor` | `og/employer.tsx` | Share card for an employer page |
| `dynamic-og/talent` | `og/profile.tsx` | Share card for a public learner profile (only when `profilePublic`) |
| (new) | `og/certificate.tsx` | Share card for a verified certificate (CRT items) |

Deleted, not moved: `dynamic-og/{category,grant,pro-talent,pro-x,region,skill,winners}` and every other `app/api` group.

Rules for the moved handlers:
- **Security ports land on the new location.** Both are upstream commits made after our fork point (`4b9492b9d`), so **neither is in `main`**:
  - **#1450** (`d8c1806`, 6 Aug 2026, "fix/delete-image"): validate the `publicId` folder for every source **before** the ownership lookup, and resolve the owner per source (`getImageOwnerId`), plus the `sign` schema changes. Port onto `src/pages/api/image/{sign,delete}.ts` and `src/lib/image-upload/**`, with tests: a wrong-folder `publicId` returns 400, and another user's image returns 403.
  - **#1520** (`082cb9a`, 15 Oct 2026, "fix/cloudinary-util"): `convertToJpegUrl` parses the URL and accepts only `https://res.cloudinary.com` with no port or credentials, instead of `includes('res.cloudinary.com')`. Port onto `src/utils/cloudinary.ts`, which the three kept OG routes import. Test: `https://evil.example/?res.cloudinary.com` returns `null`. The other two `includes('res.cloudinary.com')` checks in that file (lines 41 and 88) get the same treatment.
  - The triage log records both as `port` against the new paths. The ledger gets `src/app/api/image/** -> src/pages/api/image/` and `src/app/api/dynamic-og/** -> src/pages/api/og/` move lines, so later upstream edits show up as MOVED.
- **OG fonts load from disk.** `loadGoogleFont` fetches Google Fonts at runtime; replace it with the Daybreak font files from `public/`, so share cards work on-prem without that outbound call.
- `next/og` stays on Next 16.4.5 or later (the SVG advisory, CTO S1).
- Media storage: these handlers keep their Cloudinary-shaped contract until ADR-0004's object storage replaces the backend. The swap keeps the same folder and owner checks.

## 3. Ordered plan

Every step is one PR to `main`; `main` builds after each one.

| # | Step | Depends on | What breaks, and how we handle it | Hours |
| --- | --- | --- | --- | --- |
| 0 | FND-01 live-deployment check (Railway: fork commit says "Railway deploy"; Vercel), rotate any exposed secrets (including the Privy app secret if it was ever in Railway). FND-02 CI: frozen-lockfile install, lint, typecheck, build | none | nothing | (in FND-01/02) |
| 1 | Tag `sldtp/pre-strip` at `97bfeeb8e`. Delete `.github/workflows/schema-sync-notify.yml` (it posts to an outside dispatcher on schema changes) | 0 | nothing | 1 |
| 2 | Extract Daybreak: copy the visual components listed in §2 into `src/sldtp/ui/`, stripped of listing/grant types and `store/user`; screenshot the landing, board card and gauge for reference in `docs/design/` | 1 | nothing (copies) | 8 |
| 3 | **The strip PR.** Delete everything not on the allowlist; clear the 13 Privy-file problems from §2.1; move the §2.2 handlers; `check-strip.mjs --strict` prints OK and becomes a required CI job. New `_app.tsx` (fonts, `globals.css`, PrivyProvider, React Query, Toaster), new `pages/index.tsx` placeholder, `pages/api/health.ts`. Rewrite `next.config.ts` (§4). Replace `prisma/schema.prisma` with a stub (`User` only) so `prisma generate` works | 2 | Every product page and route disappears; that is the point. The only SaaS left is Privy, created lazily, so `next build` works with only `DATABASE_URL`. The Privy files on the allowlist are moved to `src/sldtp/auth/` unchanged in this PR, to keep it a pure delete. | 16 |
| 4 | Prune dependencies: remove packages for deleted code (Solana ×12, Sumsub, Upstash, ioredis, BullMQ, Resend, svix, PostHog, Axiom, GA, AI SDK, OpenRouter, googleapis, google-auth-library, jsonwebtoken, TipTap ×14, prosemirror ×3, gsap, confetti, next-pwa, next-auth, `@vercel/functions`, airtable helpers). Keep `@privy-io/react-auth`, `@privy-io/node` and `cloudinary` (the §2.2 image handlers, until object storage replaces it); run `pnpm dlx knip`; regenerate lockfile | 3 | Lockfile churn only | 4 |
| 5 | FND-05 remainder. Done on integration: `next` 16.4.6, `react` and `react-dom` 19.2.4, `prisma` 7.4.2, and a non-blocking `pnpm audit` plus `osv-scanner` job. Still open: exact pins for `@prisma/client`, `@prisma/adapter-mariadb` and `mariadb`; `images.unoptimized: true`; `.nvmrc` for the Node 24 runtime in ADR-0004 | 4 | Should be none: the kept kit has no Next-specific APIs beyond `next/font` and `next/link` | 4 (FND-05) |
| 6 | FND-09: target `schema.prisma` ([data model](data-model-final.md)), `relationMode = "foreignKeys"`, `prisma/migrations/0000_baseline`; Compose for MariaDB 10.11 + Mailpit; CI applies migrations to an empty DB and checks drift. `User` keeps `privyDid` | 3 | Nothing runtime yet; feature work starts on real tables | 16 (plan had 24) |
| 7 | Adapt Privy (AUT-01, AUT-05): `requireUser`/`requireRole`/`withPageRole` over `getPrivyToken`, role enum, first-login provisioning, dev stub that fakes `getPrivyToken` | 6 | All new routes use the new helpers from here on | in AUT-01/05 |
| 8 | Re-introduce, deliberately, only what SLDTP needs: `nodemailer`, `next-intl`, `pdf-lib`, `qrcode`, `serwist` + `@serwist/cli` + `@serwist/next` (config mode) and `idb-keyval` (ADR-0011), `rclone` (ops, not npm), `papaparse` (kept), `marked` + `isomorphic-dompurify` (kept) | as features land | none | in feature items |
| | **Total for steps 1 to 4 and 6** | | | **about 45 to 50 hours** vs 144 in the plan (FND-06 to 08 and FND-09); the reachability check is in step 3's 16 h (the script exists) |

## 4. `next.config.ts` after the strip

Keep: `poweredByHeader: false`, `reactStrictMode`, `output: 'standalone'`, security headers (CSP, `X-Frame-Options`, HSTS, `X-Content-Type-Options`, `Referrer-Policy`). Drop: `withAxiom`, `withPWA`, the Turbopack WalletConnect aliases, all `rewrites` (PostHog, CDNs, geojson), the `optimizePackageImports` list, `remotePatterns`, `trailingSlash`/`skipTrailingSlashRedirect` quirks unless needed. Rewrite the CSP to `default-src 'self'` and name only the two outside hosts we use: Privy (the hosts in Privy's CSP guide, starting with `auth.privy.io` in `connect-src` and `frame-src`) and the media CDN (`media-src`, `img-src`, `connect-src`). Add `worker-src 'self'`. `images.unoptimized: true` (C5, agreed).

## 5. What must not be lost

| Item | Where it goes |
| --- | --- |
| Daybreak identity | `globals.css`, fonts, `src/sldtp/ui/*`, screenshots in `docs/design/` |
| MariaDB adapter wiring (`3da3094d2`) | Simplified `src/prisma.ts` |
| Ideas worth reading before rebuilding jobs: listing filters, submission review table, status pill | Look them up at tag `sldtp/pre-strip`; copy individual components into `src/sldtp/jobs/` if they fit |
| Superteam security fixes after the fork | Not needed for deleted code. For kept files see ADR-0008 |
| License | `LICENSE` stays; AGPL Source link added in the footer |

## 6. Fallback: subsystem order, if listings and sponsor-dashboard are adapted

Only if ADR-0010 is rejected. Order is leaves first, by import fan-in:

| Order | Delete | Why this order | Then fix in kept code |
| --- | --- | --- | --- |
| 1 | `dev-tools`, `app/api/dev-tool/**` | No importers except one page. `dummy-submissions` is already deleted on integration. The old guard was `VERCEL_ENV === 'production'` | none |
| 2 | Telemetry: `instrumentation-client.ts`, PostHog calls (108 files), GA, Axiom | Touches everything but mechanically; do it early so later diffs are clean | delete calls |
| 3 | `wallet`, `context/SolanaWallet.tsx`, `app/api/wallet/**`, `tokens`, `token-icon`, `constants/tokenList.ts`, `components/ui/token-*` | Imported by `listing-builder` (4+3), `sponsor-dashboard` (3+2), `navbar` (2), `_app` (TokenListProvider) | reward/token UI in builder and dashboard |
| 4 | `credits`, `store/credit.ts` | Imported by `listings` (4), `navbar` (4), `submission/create.ts` | submission create, navbar |
| 5 | `agents`, `pages/api/agents/**`, `withAgentAuth` | Imported by `listing-builder`, `sponsor-dashboard`, `comments`, `submission/create.ts` | agentAccess fields |
| 6 | `grants`, `pages/api/grant*`, `app/api/grant*`, sponsor-dashboard grant views | Imported by `sponsor-dashboard` (13), `listings` (2), `home` (3) | dashboard tabs |
| 7 | `hackathon`, `pro`, `membership`, `chapters`, `leaderboard`, `feed`, `surveys`, `announcements`, `conversion-popups`, `kyc`, `search`, `stfun` (after Daybreak extraction) | Mid fan-in product areas | many small edits |
| 8 | SaaS clients: Cloudinary, Resend + svix, ZeroBounce, Upstash, BullMQ, Airtable, Sheets, earncognito, OpenRouter | Import-time side effects; after the features that call them | replace with disk, nodemailer, no-ops |
| 9 | next-auth only. **Privy is kept**: adapt `getPrivyToken` and the 4 wrappers to SLDTP roles; strip the Solana config from `providers.tsx`; most of the 47 Privy client call sites disappear with the features above | Last, because every remaining route depends on the wrappers | role mapping in `src/sldtp/auth` |

This is the plan's 120 hours, and it still leaves 44,000 lines of listings, builder and dashboard code to rewrite into opportunities.
