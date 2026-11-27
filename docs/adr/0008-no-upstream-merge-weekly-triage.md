# ADR-0008: No upstream merge; weekly triage ports security fixes and selected features

- Status: Accepted (David, 27 Nov 2026). Mechanics in ADR-0002 (CTO, fork code rules).
- Date: 2026-11-27
- Deciders: David Ogoo (Christex), CTO, SLDTP tech lead
- Relates to: ADR-0002 (CTO); CTO fork-sync-strategy; engineering-plan ADR-002 and ADR-013; FND-04 (removed), FND-11, FND-12

## Context and problem statement

`main` is the Daybreak redesign at `97bfeeb8e`. Merging upstream `6544345c2` produces 36 conflicting paths (schema `Sponsors.socials` vs `location`, listings, sponsor dashboard, navbar, earn pages), most of which SLDTP deletes. Upstream still has fixes and occasional features worth having, especially in code we keep: the Privy auth funnel (`getPrivyToken.ts` is identical upstream), `components/ui`, `prisma.ts`. Upstream's own Next.js (16.3.8) is still inside two image-optimiser advisories; our pin is 16.4.5 or later. Integration pins `next` at 16.4.6.

## Decision drivers

- Don't resolve conflicts in code we then delete
- Still receive fixes for code we kept
- AGPL obligations

## Considered options

1. One-time full merge, then cherry-picks (CTO's first recommendation)
2. **No merge; weekly triage; port security fixes and selected features by hand (chosen)**
3. Hard fork with no upstream watching

## Decision outcome

Option 2.
- No merge. Record the fork point (`97bfeeb8e`, upstream merge-base `4b9492b9d`) in `docs/fork-and-upstream-sync.md` (CTO).
- Weekly triage per ADR-0002 and the CTO's triage script: security fixes that touch kept files are ported in a reviewed PR the same week; useful features are ported selectively when they serve an SLDTP backlog item; everything else is recorded as skipped.
- Our own dependency feed is the other half: Dependabot security updates plus an OSV/`pnpm audit` CI gate on critical or high in shipped packages; Next.js pinned at 16.4.5 or later.
- Remote `upstream` is fetch-only (push URL disabled); `gh repo set-default christex-foundation/future-of-work` everywhere.
- AGPL-3.0: keep `LICENSE`; SPDX header on new files; footer 'Source' link to the running tag; the handover keeps the source offer.

The KISS simplifications (C2), and the rule that dependency advisories are always checked even when the upstream path was deleted, are recorded as an amendment to ADR-0002 in **ADR-0018**.

### Consequences

- Good: no merge conflicts in dead code; fixes in kept code still arrive.
- Bad: triage costs time every week (proposed 1 hour a week after the strip) for few relevant changes.

### Confirmation

Weekly triage PR with its decisions; OSV job green on `main`.
