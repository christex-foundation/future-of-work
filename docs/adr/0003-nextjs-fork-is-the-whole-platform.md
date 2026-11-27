# ADR-0003: The future-of-work Next.js fork is the whole platform; no Moodle

- Status: Accepted (David's decision, 27 Nov 2026). Contract position pending MoCTI's written acceptance (gate G1, end of week 4).
- Date: 2026-11-27
- Deciders: David Ogoo (Christex), CTO, SLDTP tech lead
- Supersedes / relates to: engineering-plan ADR-001; CTO no-moodle-plan.md; stack-review rev 2 §5

## Context and problem statement

The bid offered Moodle 4.5 LTS (the financial proposal says 4.3) plus an S2J Match job module. David decided to deliver one Next.js platform, based on `christex-foundation/future-of-work` `main` at `97bfeeb8e` (the Daybreak redesign), covering learning, certificates, hubs and job matching.

## Decision drivers

- One login, one profile, one UI for learners, employers, hub managers and admins
- Course completion must feed job matching directly
- One stack (TypeScript/Node) for the team and for MoCTI
- 14 Mar 2027 beta date is fixed

## Considered options

1. Moodle 4.5 + fork as matching service over LTI 1.3 (CTO's first plan, about 1,600 hours)
2. Fork as the whole platform, LMS built in (chosen)
3. Second OSS LMS (Frappe LMS, Open edX) beside the fork

## Decision outcome

Option 2. The LMS is built in `src/sldtp/learning`. Moodle stays as the documented contingency if MoCTI refuses at G1.

Be honest in the change notice: after the strip (ADR-0007) we keep the Earn design system, tooling and the Privy auth funnel, not its bounty product. The bid's compliance matrix also says 'no core forking' (SRD §3.6 row); this platform is a fork by definition, so the change notice must say so.

### Consequences

- Good: one codebase, one user table, direct skills-to-jobs link; no PHP stack at the data centre.
- Bad: SCORM, xAPI, H5P, gradebook and forums, which Moodle gives for free, become known gaps or future builds; if MoCTI refuses, about 360 hours of learning work is exposed.

### Confirmation

MoCTI written acceptance filed by end of week 4; known-gap list published with the beta.
