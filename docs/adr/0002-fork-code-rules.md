# ADR 0002: Fork code rules

- Status: Accepted
- Date: 2026-11-27
- Approved by: David Ogoo, November 2026
- Related: [Fork and upstream-sync strategy](../fork-and-upstream-sync.md) (decision D6)

Numbered 0002 to match decision D6 in the fork strategy. This repository has no ADR 0001.

## Context

`christex-foundation/future-of-work` is a public fork of `SuperteamDAO/earn` (GNU AGPL-3.0). After the one-time upstream sync, upstream is an advisory feed, not a branch we merge. Product code will diverge quickly in the same modules upstream keeps editing (listings, sponsor dashboard, API routes, auth).

Divergence stays cheap only if new code is isolated, edits to upstream files are marked, and every deletion is recorded where the triage script can see it.

## Decision

### New code lives in `src/sldtp/`

All new product code goes in `src/sldtp/`: `courses/`, `quiz/`, `cohorts/`, `certificates/`, `opportunities/`, `employer/`, `auth/`, `hubs/`, `i18n/`, `offline/`, `admin/`. Upstream does not touch this tree, so it does not conflict.

Routes use App Router groups `src/app/(sldtp)/…` and `src/app/api/sldtp/…`. Add no new files under `src/pages/` or `src/pages/api/`.

### Adapt by moving, not by editing in place

If we would change more than about a third of an upstream module (for example `features/listings` into opportunities), `git mv` it into `src/sldtp/`, rewrite it there, and add an `old/** -> src/sldtp/new/` line to [`.sldtp/deleted-paths`](../../.sldtp/deleted-paths). A small edit (a field or a guard) stays in place and follows the marker rule.

### Mark every edit to an upstream file

Every edit to a file that came from upstream is wrapped so it can be grepped:

```ts
// SLDTP-BEGIN(ADR-0003): replace Privy session with SLDTP session
...
// SLDTP-END
```

A one-line change uses a trailing comment: `// SLDTP(ADR-0003): reason`.

The number inside the marker is the ADR for that edit. This ADR is the standing rule. A later decision, such as the session replacement, takes the next number. `ADR-0003` in the example is that later number, not this document.

### Fixed hook points

Use a small, fixed set of seams instead of scattered edits:

| Seam | One upstream file touched | Everything else in |
| --- | --- | --- |
| Auth/session | `withAuth` and related helpers call `src/sldtp/auth/session.ts` | `src/sldtp/auth/` (roles, TOTP, guards) |
| Navigation | navbar imports `src/sldtp/nav.ts` | `src/sldtp/nav.ts` |
| Providers (i18n, offline registration, theme) | `src/components/providers.tsx` wraps `SldtpProviders` | `src/sldtp/providers.tsx` |
| Database client | `src/prisma.ts` (already ours since `3da3094d2`) | — |
| Config and headers | `next.config.ts` spreads `sldtpConfig` | `src/sldtp/next.config.part.ts` |
| Branding | theme tokens file | `src/sldtp/theme/` |

The touch-budget report in the strategy counts `SLDTP-BEGIN` markers and changed upstream files. If the count grows faster than these seams explain, the reviewer asks why.

### Deletion ledger

[`.sldtp/deleted-paths`](../../.sldtp/deleted-paths) is the ledger.

- One glob per line. `#` starts a comment.
- A move is `old/glob/** -> src/sldtp/new/`.
- The commit that deletes or moves a path updates the ledger in that same commit.
- Nothing has been deleted yet. The file is a commented template of the planned strips and moves. Those lines are not in force.
- CI will later reject a deletion whose path is not in the ledger, and a ledger glob that still matches files in the tree. That check is not wired in the change that added this ADR.
- Removed env vars go in `.sldtp/deleted-env`. Removed Prisma models are listed in the baseline migration's README. Upstream's `.github/workflows/lockfile.yml` and `schema-sync-notify.yml` go in the ledger too. `schema-sync-notify` posts outside our control, so delete it during FND-02.
- Delete, don't flag. The ledger is what makes deletion cheap at triage time.

`scripts/sldtp/upstream-triage.py` reads the ledger. A commented line is not an entry.

## Consequences

- New product work does not collide with upstream fetches.
- A reviewer can find every local edit to an upstream file with a search for `SLDTP-BEGIN` and `SLDTP(`.
- After a module moves, upstream fixes to the old path show up as `MOVED` instead of disappearing or coming back as a delete/modify conflict.
- Until the first strip commit, the ledger matches the tree: no path is recorded as deleted.

## Licence

These rules do not relicense the fork. The program stays under the GNU AGPL-3.0 in [`LICENSE`](../../LICENSE). New files under `src/sldtp/` carry `SPDX-License-Identifier: AGPL-3.0-only` and `Copyright (c) 2026 Christex Foundation`. See the strategy's licence section for why the identifier is `AGPL-3.0-only`.
