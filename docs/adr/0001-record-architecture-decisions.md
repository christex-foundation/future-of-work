# ADR-0001: Record architecture decisions

- Status: Accepted
- Date: 2026-11-27
- Deciders: David Ogoo (Christex), CTO, SLDTP tech lead
- Supersedes / relates to: engineering-plan.md §10 (the 15 planned ADRs are reconciled in `docs/README.md`)

## Context and problem statement

SLDTP is built by four or five engineers plus agents over ten weeks, then handed to MoCTI. Decisions made in chat (which upstream to sync, how auth works, what offline means) get lost and re-argued.

## Decision drivers

- MoCTI must be able to maintain the platform after handover
- Agents and new engineers need the 'why' without the chat history
- Keep the process light (KISS)

## Considered options

1. No formal record (decisions live in chat and plans)
2. MADR files in `docs/adr/`, numbered, one decision per file
3. A wiki

## Decision outcome

Option 2. MADR, minimal template (status, context, options, outcome, consequences, confirmation). Rules:
- One file per real decision; anything a code reviewer would not argue about does not need an ADR.
- Statuses: Proposed, Accepted, Superseded by ADR-xxxx, Rejected. Never edit an accepted ADR's decision; supersede it.
- The tech lead owns the log. ADR-0002 (fork code rules) and its amendment ADR-0018 are in this repository. ADR-0003 through ADR-0017 are the reviewed product decisions. ADR-0019 records the project stack.
- A PR that changes architecture links or adds an ADR, and updates the diagrams in [`docs/architecture/`](../architecture/README.md) in the same PR.

### Consequences

- Good: decisions are reviewable in PRs and travel with the code to MoCTI.
- Bad: a small writing cost per decision.

### Confirmation

PR template has a 'ADR / diagram updated?' checkbox; `docs/README.md` index lists every ADR.
