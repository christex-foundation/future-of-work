# ADR 0002: Fork code rules

**Amended by [ADR 0018](0018-amend-0002-lighter-fork-tooling-advisories-always-checked.md)** (CTO, 27 Nov 2026).

- Status: Accepted
- Date: 2026-11-27
- Approved by: David Ogoo, November 2026
- Related: [Fork and upstream-sync strategy](../fork-and-upstream-sync.md) (decision D6)

Numbered 0002 to match decision D6 in the fork strategy. How decisions are recorded is [ADR-0001](0001-record-architecture-decisions.md).

## Context

`christex-foundation/future-of-work` is a public fork of `SuperteamDAO/earn` (GNU AGPL-3.0). We do not merge upstream. Upstream is an advisory feed: weekly triage, hand-ported security fixes, cherry-picked features. Product code will diverge quickly in the same modules upstream keeps editing (listings, sponsor dashboard, API routes, auth).

Divergence stays cheap only if new code is isolated, edits to upstream files are marked, and every deletion is recorded where the triage script can see it.

## Decision

### New code lives in `src/sldtp/`

All new product code goes in `src/sldtp/`: `courses/`, `quiz/`, `cohorts/`, `certificates/`, `opportunities/`, `employer/`, `auth/`, `hubs/`, `i18n/`, `offline/`, `admin/`. Upstream does not touch this tree, so it does not conflict.

Routes use the Pages Router only (ADR-0014, accepted by the CTO on 27 Nov 2026). All routes go in `src/pages/` and `src/pages/api/`. The strip deletes `src/app/`.

### Adapt by moving, not by editing in place

If we would change more than about a third of an upstream module (for example `features/listings` into opportunities), `git mv` it into `src/sldtp/`, rewrite it there, and add an `old/** -> src/sldtp/new/` line to [`.sldtp/deleted-paths`](../../.sldtp/deleted-paths). A small edit (a field or a guard) stays in place and follows the marker rule.

### Mark every edit to an upstream file

Every edit to a file that came from upstream is wrapped so it can be grepped:

```ts
// SLDTP-BEGIN(ADR-0002): employer guard over the Privy session
...
// SLDTP-END
```

A one-line change uses a trailing comment: `// SLDTP(ADR-0002): reason`.

The number inside the marker is the ADR for that edit. This ADR is the standing rule.

### Fixed hook points

Use a small, fixed set of seams instead of scattered edits:

| Seam | One upstream file touched | Everything else in |
| --- | --- | --- |
| Auth/session | `withAuth` and related helpers wrap `getPrivyToken` | `src/sldtp/auth/` (roles and guards over Privy) |
| Navigation | navbar imports `src/sldtp/nav.ts` | `src/sldtp/nav.ts` |
| Providers (i18n, offline registration, theme) | `src/components/providers.tsx` wraps `SldtpProviders` | `src/sldtp/providers.tsx` |
| Database client | `src/prisma.ts` (already ours since `3da3094d2`) | — |
| Config and headers | `next.config.ts` spreads `sldtpConfig` | `src/sldtp/next.config.part.ts` |
| Branding | theme tokens file | `src/sldtp/theme/` |

ADR-0018 drops the touch-budget report. A reviewer still greps `SLDTP-BEGIN` when a PR edits a kept upstream file. Markers are for those in-place edits, not for files moved into `src/sldtp/`.

### Deletion ledger

[`.sldtp/deleted-paths`](../../.sldtp/deleted-paths) is the ledger.

- One glob per line. `#` starts a comment.
- A move is `old/glob/** -> src/sldtp/new/`.
- The commit that deletes or moves a path updates the ledger in that same commit.
- The file lists the paths the Daybreak line removed that nothing on `main` still imports. Planned strip globs are not listed while that code is still live. `src/features/stfun/**` is not an entry.
- `upstream-triage.py --check-imported` fails when a ledger entry still exists and is imported. CI runs it after `pnpm install --frozen-lockfile`.
- Removed env vars go in `.sldtp/deleted-env`. Removed Prisma models are listed in the baseline migration's README. Upstream's `.github/workflows/lockfile.yml` and `schema-sync-notify.yml` go in the ledger too. `schema-sync-notify` posts outside our control, so delete it during FND-02.
- Delete, don't flag. The ledger is what makes deletion cheap at triage time.

`scripts/sldtp/upstream-triage.py` reads the ledger. A commented line is not an entry.

## Consequences

- New product work does not collide with upstream fetches.
- A reviewer can find every local edit to an upstream file with a search for `SLDTP-BEGIN` and `SLDTP(`.
- After a module moves, upstream fixes to the old path show up as `MOVED` instead of disappearing or coming back as a delete/modify conflict.
- The ledger matches the Daybreak deletions: every entry is a file that is gone, and none of those paths are imported.

## Licence

These rules do not relicense the fork. The program stays under the GNU AGPL-3.0 in [`LICENSE`](../../LICENSE). New files under `src/sldtp/` carry `SPDX-License-Identifier: AGPL-3.0-only` and `Copyright (c) 2026 Christex Foundation`. See the strategy's licence section for why the identifier is `AGPL-3.0-only`.
