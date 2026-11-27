# ADR-0017: Privy is a hosted SaaS holding learner identity data

- Status: Proposed (risk acceptance needed from MoCTI before or at the Inception Report)
- Date: 2026-11-27
- Deciders: David Ogoo (Christex), CTO, SLDTP tech lead
- Relates to: ADR-0004, ADR-0006; ADR-0016

## Context and problem statement

ADR-0006 keeps Privy. Privy is a hosted service run by a US-based company. Every user's email address, Privy user id, login timestamps and device/session metadata live in Privy's systems, outside the MoCTI data centre. The ToR and the bid place the platform and its data in the MoCTI data centre, and the bid's on-prem replacement table explicitly replaced Privy ('no third-party identity provider'). Under ADR-0004 the primary is on-prem, so Privy is the one external dependency that holds PII in normal operation.

## Decision drivers

- Contractual and legal compliance with MoCTI's data rules
- Availability: login fails if Privy or the internet path to it fails
- Exit cost if MoCTI later refuses it

## Considered options

1. Accept Privy, disclose it in the change notice, minimise data sent, get MoCTI's written risk acceptance (recommended)
2. Replace Privy with self-hosted auth now (about 130 hours of auth work plus tests; rejected by David for now)
3. Accept Privy for the beta only, with a committed exit plan before week-30 acceptance

## Decision outcome

Recommend option 1, with option 3's exit plan written down:
- Disclose Privy in the change notice and the Inception Report: what data, where, under which terms (Privy DPA), and why.
- Minimise: email only; no Google login, no wallets, no phone numbers; no profile data or demographics sent to Privy. Our DB stays the system of record for everything except the credential.
- Keep the dependency thin: all Privy calls live in `src/sldtp/auth/` behind `getSessionUser()`, so an exit to self-hosted auth replaces one module and keeps `User.id`.
- Ask MoCTI and the PCU for written acceptance. If refused, schedule option 2 before week 30.

Cost (Privy pricing page, checked 27 Nov 2026): plans are tiered by monthly active users. Free up to 499; **Core, about $299/month for 500–2,499**, which is SLDTP's tier with about 1,500 learners plus staff; Scale $499/month to 9,999. If the subscription lapses, sign-ups stop beyond 500 MAU. This is a recurring cost through handover and a dependency MoCTI inherits; it is listed with the hosting running costs in [deployment](../architecture/deployment.md) ([pricing](https://www.privy.io/pricing)).

### Consequences

- Good: a decision is recorded instead of a silent conflict; exit cost stays bounded to one module.
- Bad: the ToR wording may be read as forbidding this; logins at the hubs depend on Privy and the internet; Privy pricing and terms become a project risk; learner email addresses are held by a US company.

### Confirmation

Change notice lists Privy; MoCTI's written answer is filed; `rg '@privy-io' src` shows imports only under `src/sldtp/auth/` and `_app` providers.
