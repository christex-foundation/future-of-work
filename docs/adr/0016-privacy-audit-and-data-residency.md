# ADR-0016: Consent-gated demographics, an append-only audit log, and named exceptions for data outside the DC

- Status: Proposed (legal basis for gender and disability data is an open question to MoCTI/PCU).
- Date: 2026-11-27
- Deciders: David Ogoo (Christex), CTO, SLDTP tech lead
- Supersedes / relates to: engineering-plan ADR-015 and ADR-011 (accessibility process moves to the definition of done); AUT-08, AUT-09

## Context and problem statement

The bid promises gender/PWD reporting only where users consent, audit logs of important actions (12-month retention), and self-service profile changes logged (tech.txt §3.3, §3.5).

## Decision drivers

- Collect the least personal data that the reports need
- Audit trail without a log platform

## Considered options

1. Central log aggregation stack
2. An `AuditLog` table written by a single `audit()` helper, plus journald for technical logs (chosen)

## Decision outcome

Option 2. `gender` and `disabilityWgss` are nullable and only written when `demographicsConsentAt` is set. Reports read them only through the `InclusionReport` view (derived `pwd` and domain flags; `data-model-final.md` §2.4) and aggregate with a minimum cell size of 5. The national ID is stored only as a keyed HMAC plus its last 4 digits (§2.1). Phone stays plain, but the `audit()` helper redacts phone, national-ID, gender and WG-SS keys from `meta`, and exports include phone only for hub-roster and admin exports (§2.2). `audit(actor, action, entity, id, meta)` is called for logins (first API call of a new Privy session), role changes, employer approvals, application status changes, certificate issue, revoke and reissue, CSV exports and profile changes. The app's DB user has no UPDATE or DELETE grant on `AuditLog`; a monthly job deletes rows older than 12 months using a separate maintenance user. No real learner data on laptops, staging or CI. Data outside MoCTI is limited to the named exceptions in ADR-0004 (encrypted standby copies; public, no-PII media on the CDN) and ADR-0017 (Privy: email and login metadata).

### Consequences

- Good: meets the bid rows with one table and one helper.
- Bad: the audit log lives in the same database it audits (acceptable for the beta; ship it off-box with the nightly backup).

### Confirmation

AUT-08 tests that each listed action writes one row; DB grants checked in the install runbook.
