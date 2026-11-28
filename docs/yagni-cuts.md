# YAGNI cuts (in hours)

Status: **reviewed by the CTO, 27 Nov 2026.** C1, C2 and C5 are agreed; C4 is **closed** (table list approved with changes, `data-model-final.md`); C3 is rejected. **Total agreed: 108 hours.**
Purpose: remove over-built internals and nice-to-haves we invented ourselves. This is about YAGNI only, not about capacity or hiring. Engineers work alongside AI coding agents; all figures are hours, converted from the backlog's days at 8 hours a day.
Rule: **nothing below removes a ToR, bid (tech.txt §9 compliance matrix) or agreed fit/gap requirement.** Each cut keeps the user-visible outcome.

## 1. Cuts

| # | Cut | CTO review | Backlog items | Hours before → after | Saves | Why it is not a ToR / bid / fit-gap requirement | What is still delivered |
| --- | --- | --- | --- | --- | --- | --- | --- |
| C1 | **Explicit allowlist strip plus an automated reachability check**, instead of three subsystem strips; a fresh baseline schema instead of pruning it per strip (ADR-0007, `strip-map.md` §2 and §2.1, `strip/`) | **Agreed** | FND-06, 07, 08, FND-09 | 144 → 74 (about 50 for the strip and baseline, plus 24 held back for building the opportunity, employer and profile screens fresh instead of adapting them) | **70 h** | How we remove Superteam code is internal. The bid and fit/gap require the *capabilities* (job list, apply, ATS, profile), not reuse of Earn's files. | Same opportunity, application and employer features; no dead SaaS code; CI fails if kept code imports a deleted path |
| C2 | **Lighter fork tooling** as an amendment to ADR-0002 (ADR-0018): ledger generated from the allowlist; one reachability check instead of two-way ledger rules; triage scoped to kept paths; no touch-budget report; markers only in files edited in place. **Dependency advisories are always checked, even for deleted upstream paths** | **Agreed**, with the advisory rule added | FND-11, FND-12 | 32 → 14 (FND-11 20 → 12; triage about 2 → 1 h a week over the build) | **18 h** | Fork maintenance is our own process. The bid's obligations (patch shipped software, AGPL source) stay. David's decision (weekly triage, security and selected features ported) is kept. | Weekly triage, security ports, `audit` plus OSV on every PR (the job is non-blocking while advisories are open; `.github/workflows/ci.yml` has no daily schedule), AGPL compliance |
| ~~C3~~ | ~~Hand-written service worker and a localStorage outbox~~ | **Rejected.** localStorage is synchronous with a cap of about 5 MB; offline lessons need the Cache API and a versioned precache; hand-rolled workers breed bugs. Serwist stays; `idb-keyval` replaces `idb` (ADR-0011) | OFL-01, 02, 03 | 76 → 76 | **0 h** | | Unchanged from the CTO's plan |
| C4 | **Data-model trims**: `Lesson.section` instead of `Module`; captions by file convention instead of `Caption`; `Question.choices` JSON instead of `Choice`/`AttemptAnswer`; `User.hubId` instead of `HubMembership`; `Attendance(userId, courseId, day)` instead of `HubSession` + `Attendance`. Final list: `data-model-final.md` (19 tables) | **Closed** (CTO, 27 Nov 2026). Approved with changes: Attendance PK includes `courseId`; national ID as HMAC plus last 4; phone kept out of audit and exports; certificate reissue on the same row; one `InclusionReport` view | COU-01, QUZ-01, HUB-01, HUB-04 | 64 → 48 | **16 h** | The bid needs courses with sections, captions, single-choice quizzes scored on the server, hub rosters and in-person attendance. The extra tables are our design choice. `data-model-final.md` §3 maps every surviving requirement. | Same screens and reports; profile, PWD/gender, progress, certificates and match inputs all present |
| C5 | **Image optimiser off** (`images.unoptimized: true`; logos and photos pre-sized at upload) | **Agreed** | FND-05 | 8 → 4 | **4 h** | Internal hardening choice that removes the vulnerable code path. | Integration already pins Next.js 16.4.6. `images.unoptimized` is not set yet |
| | **Total** | | | | **108 h** | | |

Looked at and **not cut**, because they are bid rows: audit log (§2.4, §3.5), attendance (§2.3, §3.1), offline quiz attempts (§3.1), CSV import and reports (§2.3, §3.5), certificate verification page (§2.1, §3.1), axe in CI (§3.7), skills taxonomy tables (§2.2, §2.4), employer approval (§2.2, §3.3), Serwist-based offline (§3.1, §3.7).

## 2. Estimate changes from decisions (not YAGNI; listed so the backlog can be updated)

| Decision | Items | Hours |
| --- | --- | --- |
| Keep Privy (ADR-0006) | FND-10 "remove Privy" dropped (−24); AUT-02 password sign-up, sessions → Privy wiring and first-login provisioning (40 → 8, −32); AUT-03 lockout → proxy limits on our own endpoints (16 → 4, −12); AUT-04 reset and verification → Privy does it (24 → 0, −24); HUB-02 CSV import also creates Privy users (+8) | **−84** |
| ~~Admin and hub-manager TOTP step-up through Privy's server-side MFA API (CTO, 27 Nov 2026; ADR-0006).~~ **Superseded 28 Nov 2026.** That agreement is not the current decision, and its −4 h is not in the net | ~~AUT-10 24 → 20 (spike 3, enrolment 5, step-up and cookie 6, authenticator reset 3, tests 3)~~ | ~~−4~~ |
| Privy emailed-code step-up for admin and hub manager **replaces** TOTP MFA (David Ogoo, 28 Nov 2026; ADR-0006). No authenticator app and no SMS. This departs from TOTP in compliance-matrix rows tech.txt §2.4, §3.3 and §4.3 and may need a change notice | AUT-10 24 → 8 (guard on admin API routes 2, email-MFA verify and cookie 3, step-up prompt 2, one unit test 1) | **−16** |
| No upstream merge (ADR-0008) | FND-04 one-time sync dropped | **−12** |
| Hosting: on-prem primary + cloud warm standby + CDN/object storage (ADR-0004) | CDN and bucket 8, upload in the content pipeline 6, offline download test against the CDN 6, standby 10, restore drill and failover runbook 10 | **+40** |
| **Net** | | **−72** |

## 3. Things the decisions leave open (for the change notice, not for engineering)

- The bid promised argon2id passwords, a password policy and brute-force lockout (compliance-matrix rows tech.txt §3.3 and §4.3). Privy login is passwordless, so these are a disclosed deviation.
- Those rows, and §2.4, also promise TOTP MFA. §2.4: "TOTP MFA plugin enforced for admin/hub-manager". §3.3: "Argon2id… TOTP MFA enforced for admin/hub-manager… brute-force lockout". §4.3: "Argon2id; secure session cookies; TOTP MFA". David Ogoo decided on 28 Nov 2026 to replace that TOTP with a Privy emailed-code step-up (ADR-0006). No authenticator app and no SMS. This departs from the bid and may need a change notice to the client. The 27 Nov note that the CTO had agreed to TOTP is superseded by that decision.
- Privy holds learner email addresses and login metadata outside the MoCTI data centre, and costs about $299/month on Privy Core at 500–2,499 monthly active users (ADR-0017, [pricing](https://www.privy.io/pricing)).
