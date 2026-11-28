# ADR-0006: Keep Privy for identity; map roles and sessions in our code; emailed code, with an emailed-code step-up for admin and hub manager

- Status: Accepted: keep Privy (David, 27 Nov 2026). The TOTP step-up accepted by the CTO on 27 Nov 2026 is superseded. **Amended 28 Nov 2026: admin and hub-manager step-up is a Privy emailed one-time code only** (David Ogoo, relayed by the CTO). No authenticator-app TOTP, no SMS. Proposed: the remaining mapping details.
- Date: 2026-11-27
- Deciders: David Ogoo (Christex), CTO, SLDTP tech lead
- Relates to: engineering-plan ADR-003; AUT-01 to AUT-10, FND-10; ADR-0017

## Amendment (2026-11-28)

David Ogoo (Founder/CEO), relayed by the CTO. This supersedes the TOTP step-up in the 27 Nov status, in Decision outcome, and in the research answer below. That research stays as the record of what was considered.

Every role signs in with Privy's emailed code. An admin or hub manager who attempts a privileged action then receives a second Privy emailed code, enters it, and the action proceeds. A missing or wrong code is blocked. There is no authenticator-app TOTP and no SMS.

The server records the step-up itself, as a signed `HttpOnly` cookie bound to `privyDid` and the Privy session id. The access token still has no auth-time claim, so token age is not the check.

This departs from the bid's TOTP wording (tech.txt §2.4, §3.3) and may need a change notice to the client. In this repository §4.3 is cited for the password policy and lockout, not for TOTP, so it does not apply to this amendment. The password rows (§3.3, §4.3) stay a disclosed deviation. The week-1 wallet spike, TOTP enrolment, and authenticator reset are not part of this decision.

## Context and problem statement

Privy is already wired in: the browser signs in through `@privy-io/react-auth`, and every server check runs through `src/features/auth/utils/getPrivyToken.ts`, which verifies the token with `PRIVY_VERIFICATION_KEY` and returns `privyDid`. Four wrappers sit on top (`withAuth`, `withSponsorAuth`, `getUserSession`, `getSponsorSession`). Roles today are a free string (`USER`/`GOD`) plus Superteam's many-to-many sponsor membership. SLDTP needs four roles: learner, employer, hub manager, admin. David decided admin and hub-manager two-step login uses Privy's emailed one-time code, with no self-hosted auth and no SMS. The research below shows how to add an authenticator-app (TOTP) step through Privy itself, which David may prefer because it meets the bid's TOTP row.

## Decision drivers

- Reuse what works; build no credential code
- One clear role model
- Bid rows on accounts and security, where they can be met

## Considered options

1. Replace Privy with self-hosted email/password (earlier proposal; withdrawn by David's decision)
2. **Keep Privy; adapt the funnel to SLDTP roles (chosen)**
3. Keep Privy and keep Superteam's role/sponsor model

## Decision outcome

Option 2. The step-up for admin and hub manager is the amendment of 28 Nov 2026. TOTP sentences in this section, and the research answer below, are the 27 Nov record.
- Keep `src/lib/privy.ts` (created lazily, so builds need no secrets) and `getPrivyToken.ts`, moved to `src/sldtp/auth/`. Replace the four wrappers with `requireUser`, `requireRole(req, ...roles)` for API routes and `withPageRole` for `getServerSideProps`.
- `User` keeps `privyDid` (unique) and gets `role` as an enum `LEARNER | EMPLOYER | HUB_MANAGER | ADMIN`, plus `hubId` and `employerId`. `GOD`, `UserSponsors` and `currentSponsorId` go.
- Privy login methods: **email only** (remove Google). Every role signs in with Privy's emailed 6-digit code. For admin and hub manager, see "Privy MFA research" below. The earlier idea of a "recent authentication" check on the token's age doesn't work: Privy access tokens are refreshed about hourly with a new `iat` and carry no auth-time claim, so token age doesn't prove the user just logged in. Every login and role change is written to the audit log.
- First login creates a `LEARNER`. Employer accounts need admin approval of their `Employer`. Hub CSV import pre-creates Privy users by email through Privy's server API and links them.
- `src/lib/api.ts` keeps its bearer-token interceptor; `src/store/user.ts` is rewritten slim.
- Next-auth (Twitter linking) is deleted.

Open point for the change notice: the bid promised argon2id passwords, a password policy and brute-force lockout (tech.txt §3.3, §4.3). Privy login is passwordless, so those rows are a disclosed deviation. The **TOTP MFA for admin and hub manager** row (§2.4, §3.3) can be met with the step-up below. Privy rate-limits its own login, and limits MFA attempts to four per flow.

## Privy MFA research (27 Nov 2026)

**Question.** Does Privy's built-in MFA (authenticator app/TOTP, passkeys) work for admin accounts on a normal plan? Can it be enforced per role? How does it interact with email-OTP login? Does it meet the bid's admin TOTP row?

**Findings, from Privy's docs:**
1. **Privy's MFA is wallet MFA, not login MFA.** "Privy enables users to set up multi-factor authentication (MFA) for embedded wallets … requiring additional identity verification for wallet actions": signing, exporting, recovering a wallet. The methods are passkeys (recommended), TOTP and SMS ([MFA overview](https://docs.privy.io/authentication/user-authentication/mfa/overview), [verification overview](https://docs.privy.io/authentication/user-authentication/mfa/verify/overview)). It is switched on under "User management > Authentication > MFA > **Enable MFA for transactions**" ([setup](https://docs.privy.io/authentication/user-authentication/mfa/setup)). Privy does **not** add a second step to login itself. The only login-time MFA Privy documents is for its own developer dashboard ([Dashboard MFA](https://docs.privy.io/basics/get-started/dashboard/multi-factor)).
2. **No per-role enforcement.** Privy has no concept of our roles. Its "granular MFA" decides which **wallet actions** need MFA through wallet policies (`ALLOW_WITH_MFA`), not which users or pages ([granular MFA](https://docs.privy.io/authentication/user-authentication/mfa/granular/overview)). Per-role enforcement has to be our code.
3. **But the building block exists: server-side TOTP.** Our server can enroll a user in TOTP (`POST /v1/users/{id}/mfa/totp/enrollment/init` → `otpauth://` URI for a QR code; `…/enrollment/verify`) and verify a code (`…/mfa/totp/verification/verify`). It returns a signed **MFA token** with `expires_at`, plus the user's `mfa_methods`. Node: `privy.users().mfa.totp.verification.verify(userId, { user_jwt, code })` ([server-side MFA](https://docs.privy.io/authentication/user-authentication/mfa/server-side)). Wrong codes are limited to **four attempts** per flow ([MFA errors](https://docs.privy.io/authentication/user-authentication/mfa/errors)). The user object exposes `mfaMethods` ([user object](https://docs.privy.io/user-management/users/the-user-object)), so the server can see whether an admin has enrolled.
4. **Plans.** The pricing page lists authentication (email, SMS, socials, passkeys) and "all of Privy's core features" on the **Developer** tiers. MFA is not listed as Enterprise-only. Tiers are by monthly active users: free up to 499, **Core $299/month for 500–2,499**, Scale $499/month for 2,500–9,999, and pay-as-you-go above 10,000 ($2,000 base + $0.05/MAU). With 1,500 learners plus staff, SLDTP is on **Core, about $299/month**. If the subscription is cancelled, sign-ups stop beyond 500 MAU ([pricing](https://www.privy.io/pricing)). This cost needs to go into ADR-0017 and the budget.
5. **Interaction with email OTP.** Login stays Privy's emailed code (factor 1: control of the mailbox). The TOTP step is a separate call after login, made by our server with the user's Privy JWT (factor 2: the authenticator app). Privy's access token carries `sid`, `sub`, `iat` and `exp`, but no MFA or auth-time claim ([access tokens](https://docs.privy.io/authentication/user-authentication/access-tokens)). So we record the step-up ourselves: a signed, `HttpOnly` cookie bound to `privyDid` + `sid`, with our own lifetime (proposed 8 h, and 15 min for role changes and exports).
6. **Passkeys.** Privy supports passkey **login** ([passkey](https://docs.privy.io/authentication/user-authentication/login-methods/passkey)) and passkeys as an MFA method. A passkey would be the stronger second step (phishing-resistant), but the bid's wording is TOTP, so TOTP is the default and passkey is an optional extra.

**Answer (step-up agreed by the CTO, 27 Nov 2026). Superseded by the amendment of 28 Nov 2026.**
- **Not out of the box.** Privy's MFA protects wallets. It can't be enforced at login or per role, and we don't use wallets.
- **Yes, if we build a thin step-up on Privy's server-side TOTP API.** `requireRole('ADMIN' | 'HUB_MANAGER')` also requires a valid step-up cookie. If the user has no `totp` in `mfaMethods`, they are sent to enrolment (QR code from Privy's `otpauth://` URI). Otherwise they enter a 6-digit code, our API calls Privy's verify, and we set the cookie. Privy stores the TOTP secret and enforces the attempt limit, so we still write no credential code.
- That meets the bid's **"TOTP MFA enforced for admin/hub-manager"** wording (tech.txt §2.4, §3.3) in substance: email code plus authenticator code, enforced by role on the server. It does **not** meet the password rows (argon2id, password policy, lockout), because Privy login is passwordless. Those rows stay a disclosed deviation.
- **Week-1 spike (3 h), with a stop rule.** Privy documents this API for wallet actions and JWT-auth apps, and doesn't say whether TOTP enrolment works for a user with **no embedded wallet**. The spike enrols and verifies one admin test user through `privy.users().mfa.totp` on our plan, with embedded wallets switched off.
  - **If enrolment or verification needs an embedded wallet, STOP and escalate to the CTO.** Do not work around it: no creating wallets for admins, no turning on wallet features, and no substitute second factor (passkey step-up, a second email code, or our own TOTP) without a new decision.
  - The spike result, pass or stop, is recorded in this ADR before AUT-10 starts.
- **Estimate:** AUT-10 becomes about **20 h**: spike 3, enrolment page 5, step-up page + `/api/me/step-up` + signed cookie 6, admin reset of a lost authenticator (audited) 3, tests in the AUT-07 matrix 3. That is 14 h more than the 6 h assumed when the step-up was a token-age check.

### Consequences

- Good: no credential, reset, verification or lockout code to write or secure; auth work shrinks to role mapping and guards.
- Bad: identity depends on a hosted SaaS at about $299/month (ADR-0017); the bid's password rows are not met as written, and the TOTP row is met only through our step-up; logins need internet access to Privy from the learner's device, including at hubs.

### Confirmation

AUT-07 role-by-route matrix test using a stubbed `getPrivyToken`; admin and hub-manager routes return 403 without a valid step-up cookie, and with a cookie bound to another `sid`; `loginMethods` is `['email']` in config; the week-1 spike result is recorded in this ADR.
