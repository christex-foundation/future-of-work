# ADR-0010: Build opportunities, applications and employer review fresh; rules-based, explainable matching

- Status: Proposed (changes the 'Adapt' rating in the CTO's fit/gap for job list, apply and employer review).
- Date: 2026-11-27
- Deciders: David Ogoo (Christex), CTO, SLDTP tech lead
- Supersedes / relates to: engineering-plan ADR-014 (matching folded in); OPP-01 to OPP-07, SKL-01

## Context and problem statement

The plan adapts `Bounties` into Opportunity, `Submission` into Application, and the listing builder and sponsor dashboard into employer screens (OPP-01 to OPP-07, 160 hours). Those three features are 44,000 lines with about 2,700 references to tokens, rewards, winners, payments, hackathons, credits or agents, and `Bounties` has 62 columns and 30 indexes. The bid needs: searchable job directory with entry-level tag; employer post with draft/preview, moderation and expiry; company pages; apply with cover letter and optional CV; ATS with status flow, notes and skill badges; contact details masked until interview; explainable recommendations.

## Decision drivers

- Meet the bid rows exactly, nothing more
- Same 160-hour budget
- Code a MoCTI developer can read

## Considered options

1. Adapt in place / move-and-rewrite (plan)
2. Fresh slim module `src/sldtp/jobs` on new tables, reusing the UI kit and copying individual components where they fit (chosen)

## Decision outcome

Option 2. Tables: `Employer`, `Opportunity`, `OpportunitySkill`, `Application` ([data model](../data-model-final.md)). Status flow `SUBMITTED → IN_REVIEW → INTERVIEW → HIRED | REJECTED`, plus `WITHDRAWN`. The approved model uses `HIRED`, not `ACCEPTED`. Matching (OPP-06, SKL-01) is a pure function: overlap between opportunity skills and user skills, COURSE-verified skills weighted above SELF, filter by district and entry level; it returns the matched skills as the reason. No earnings weight, no staff flags, no ML.

### Consequences

- Good: no crypto semantics to unpick; the schema says what the product does; matching is testable in isolation.
- Bad: we give up Earn's polished listing builder UX; risk of the 160 hours growing by about 16 if the employer UI is gold-plated.

### Confirmation

OPP-07 tests: status transitions, contact masking, match ranking with a fixed fixture.
