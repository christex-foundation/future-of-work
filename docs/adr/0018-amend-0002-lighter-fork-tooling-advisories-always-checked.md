# ADR-0018: Amend ADR-0002: lighter fork tooling, an allowlist-generated ledger with a reachability check, and dependency advisories always checked

- Status: Accepted (CTO, 27 Nov 2026).
- Date: 2026-11-27
- Deciders: David Ogoo (Christex), CTO, SLDTP tech lead
- Amends: [ADR-0002 Fork code rules](0002-fork-code-rules.md); `docs/fork-and-upstream-sync.md` §7, §8, §9
- Relates to: ADR-0006 (Privy kept), ADR-0007 (allowlist strip), ADR-0008 (no merge, weekly triage), ADR-0014 (Pages Router only, accepted by the CTO on 27 Nov 2026)

## Context and problem statement

ADR-0002 was written for a fork that adapts upstream modules in place and strips subsystem by subsystem. Since then four decisions changed its premises:

1. no merge, only weekly triage (ADR-0008);
2. an allowlist strip that deletes about 93% of `src/` in one PR (ADR-0007);
3. Privy kept (ADR-0006);
4. Pages Router only (ADR-0014, accepted).

Some ADR-0002 machinery now costs more than it protects, and two rules contradict later ADRs. Separately, an upstream change that only touches a path we deleted is auto-skipped as IRRELEVANT. That is right for code, and wrong for **dependency advisories**, because a vulnerable package can still be in our lockfile through code we kept or wrote.

## Decision drivers

- Keep the fork's only free security review (upstream) without paying for machinery the allowlist makes redundant
- One list of what we keep, checked by a machine
- Never skip a vulnerability in something we ship

## Considered options

1. Keep ADR-0002 and the strategy §7 to §8 as written
2. **Amend ADR-0002 as below (chosen)**
3. Drop upstream watching (rejected by ADR-0008; it is option E in the strategy)

## Decision outcome

Option 2. The ADR-0002 text changes as follows. Each rule not mentioned here stays as written, including `src/sldtp/`, the SPDX header, adapt-by-move and delete-don't-flag.

**A1. Dependency advisories are always checked, even when the upstream path was deleted.**

- The `audit` CI job (`pnpm audit --prod --audit-level=high` plus `osv-scanner --lockfile pnpm-lock.yaml`) runs on every PR. It runs against **our** lockfile, independently of upstream. It is **non-blocking** until the existing advisories below are cleared. A high or critical advisory in a shipped dependency still gets a patch PR within 48 hours once the job is required (strategy D8).
- The weekly triage evaluates the security regex **before** the "only deleted paths" rule, and adds two classes. Neither is ever auto-skipped, and both are listed first:
  - **SECURITY-DEPS**: the commit changes `package.json` or `pnpm-lock.yaml` and matches the security regex, or it bumps a package named in an advisory. The triage owner records, for each package named: (1) whether we ship it (`pnpm why <pkg>`); (2) if we do, whether our version is affected. The outcome is `port` (bump or patch) or `not-affected: <reason>`.
  - **SECURITY-DELETED**: the commit matches the security regex but the change is **not in our tree**. That is a path we deleted, or a new upstream path we never shipped. It is read once for **pattern**, not code. For example, an IDOR fix in upstream's listings means checking the same rule in our rebuilt `src/sldtp/jobs` (ADR-0010). The log records `pattern-checked: <our file or test>`.
- Dependabot or Renovate security updates stay on for the whole lockfile.
- Evidence, re-run 27 Nov 2026 on this branch, range `4b9492b9d..6544345c2`, 95 first-parent commits, ledger = the Daybreak deletions in `.sldtp/deleted-paths`. All **6** security commits surface, and none is IRRELEVANT. They classify as **SECURITY** (the paths still exist on `main`): `#1408`, `#1410`, `#1416`, `#1446`, `af39bd178`, and `#1465`. Sample: [triage-4b9492b-6544345.md](../triage-4b9492b-6544345.md). After the allowlist strip deletes those paths, the same commits classify as SECURITY-DELETED and still appear. There is no SECURITY-DEPS row in this range.

**A2. The deletion ledger is generated from the allowlist and checked for reachability.**

- `strip/allowlist.txt` is the only hand-maintained list. At the strip commit, `strip/check-strip.mjs --emit-ledger` writes `.sldtp/deleted-paths`. Later deletions re-run it. Move lines (`old -> new`) are still written by hand.
- `check-strip.mjs` lands with the strip PR, not this one. Until then, CI runs `python3 scripts/sldtp/upstream-triage.py --check-imported`. That interim check fails when a ledger path still exists and another `.ts` or `.tsx` file imports it through an `@/` specifier. It does not see relative imports, `require`, CSS `@import`, or `public/` assets.
- The strip PR replaces that command with `check-strip.mjs --strict --ledger .sldtp/deleted-paths`. It fails if a kept file imports a non-kept or ledger path (static, dynamic, `require`, CSS `@import`), if an import doesn't resolve, if a kept file references a non-kept `public/` asset, or if a ledger glob matches a kept file.
- An upstream port that would recreate a deleted path fails the same check. The conflict rule "take ours (stay deleted)" is then enforced, not just written down.

**A3. Triage is scoped to the paths we keep.** The triage table shows SECURITY-DEPS, SECURITY-DELETED, SECURITY, DEPS, BUGFIX-KEPT and MOVED rows. FEATURE-KEPT rows are batched into a monthly skim instead of a weekly decision, and IRRELEVANT rows stay hidden.

**A4. No touch-budget report.** After the allowlist strip, almost no upstream file is edited in place: the kept set is the UI kit, the Privy funnel, `prisma.ts`, a few utils and config. Counting markers adds a report nobody acts on. The reviewer still greps `SLDTP-BEGIN` when a PR edits a kept upstream file.

**A5. Markers only where an upstream file is edited in place.** About 20 files, listed in `strip/allowlist.txt`, minus the ones moved into `src/sldtp/`. Files moved into `src/sldtp/` need no markers, because adapt-by-move is the rule.

**A6. Corrections to ADR-0002 that follow from later ADRs:**

- Routes are the Pages Router only. The CTO accepted ADR-0014 on 27 Nov 2026. All routes go in `src/pages/` and `src/pages/api/`, and `src/app/` is deleted in the strip. ADR-0002's App Router line is amended to say that.
- The seam table's `src/sldtp/auth/` (roles, TOTP, guards) becomes "roles and guards over Privy" (ADR-0006). The auth seam wraps `getPrivyToken`, not a replacement session. The same correction is in the strategy §7.2 and §9.
- The strategy line that removed Privy with the deleted SaaS packages is struck. `@privy-io/react-auth` and `@privy-io/node` stay.
- ADR-0002 no longer says this repository has no ADR 0001. ADR-0001 is not added to this repository in this change.

### Consequences

- Good: one list (the allowlist), one checker, and one CI job instead of a hand-kept ledger, a two-way rule, a grep-based import check and a touch-budget report, once the strip PR lands. Advisories can't fall through the IRRELEVANT class.
- Bad: `check-strip.mjs` is ours to maintain (about 150 lines, no dependencies beyond `typescript`). SECURITY-DEPS adds a few minutes to some weekly triages. Until the strip PR, the import check is the narrower `--check-imported` command.

### Confirmation

- This PR's CI runs typecheck and `--check-imported` as required steps, and runs `audit` without failing the workflow while the advisories below are open.
- `check-strip.mjs --strict` becomes a required job in the strip PR, not here.
- The triage log has a SECURITY-DEPS or DEPS row for every upstream lockfile change, and a SECURITY-DELETED row for every security-matching commit whose paths are not in our tree.
- A test PR that bumps a package to a version with a known high or critical advisory fails `audit` once that job is required. A test PR that re-imports a deleted path fails the import check.

### Audit findings on this lockfile (27 Nov 2026)

`pnpm audit --prod --audit-level=high` exits 1. It reports 8 critical and 113 high advisory rows. Critical packages: `next` (five advisories, including GHSA-p293-qw3h-jr36, GHSA-2xp9-vwfh-vxw4, GHSA-vcvr-r3jv-pc5j, and a further critical through 16.4.0), `next-auth` (GHSA-7rqj-j65f-68wh), `protobufjs`, and `shell-quote` (GHSA-w7jw-789q-3m8p, reached through `@privy-io/react-auth`). High rows include `next` again, `axios` (13), `brace-expansion` (10), `minimatch` (9), `fast-uri` (8), `protobufjs` (5), `mariadb` (4), and `sharp` (3).

`osv-scanner --lockfile pnpm-lock.yaml` (v2.7.1) exits 1. It reports 87 packages affected by 395 known vulnerabilities: 10 critical, 145 high, 205 medium, 29 low, 6 unknown. It says 393 can be fixed.

These are existing advisories on `main`'s lockfile. The `audit` job records them and does not block this pull request. Clearing them is the Next >= 16.4.5 work and the 48-hour patch rule, not a silent skip.
