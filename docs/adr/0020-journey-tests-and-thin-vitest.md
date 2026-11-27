# ADR-0020: Journey tests and a thin Vitest layer

- Status: Accepted
- Date: 2026-11-27
- Deciders: CTO hard conditions for the W2 test slice, from the signed-off journey proposal
- Relates to: [ADR-0005](0005-mariadb-prisma-migrations-only.md), [ADR-0006](0006-identity-with-privy-roles-in-sldtp.md), [ADR-0019](0019-future-of-work-project-stack.md)

## Context and problem statement

The fork had no test runner. The product tests are a short list of user journeys, and the session guards need a fast check that does not boot Next or MariaDB. The suite has to stay under 3 minutes, and it must not grow a way around Privy.

## Decision drivers

- Journeys exercise the real email-code sign-in
- A missing secret must fail the job, not skip it
- No auth bypass in the application
- The Playwright run, not install or build, is what the 3-minute cap covers

## Considered options

1. Stub Privy and skip a database
2. Playwright against a dedicated Privy test app and a MariaDB 10.11 service, plus a thin Vitest layer (chosen)
3. A test-only auth hook behind an env flag

## Decision outcome

Option 2. Two layers, both at the repo root so the allowlist strip does not take them.

**Playwright** (Chromium only, 2 workers) runs journeys 1–4 on today's `/earn` routes:

1. Talent signs in with the email code. This is the only journey that walks that UI. It writes `storageState` for the talent and the employer.
2. Talent filters listings and submits to a seeded open listing.
3. Employer publishes a project listing.
4. Employer marks a seeded submission and the talent sees the result. There is no `HIRED` status on this tree, so the journey uses Select Winner. The submission is seeded, so the journey does not wait on 2 or 3.

Journeys 5–8 are not in this slice.

The run is capped at 3 minutes by `timeout-minutes: 3` on the `Playwright journeys` step and by Playwright `globalTimeout`. `pnpm install` and `pnpm build` are outside the cap. Traces, screenshots, and video are kept on failure only.

**Vitest** (Node) runs three tests: ledger paths are absent (plus `src/app/api/dev-tool/`), `getPrivyToken`, and `withAuth` including the wrapped `src/pages/api/user/update.ts` handler. Prisma and Privy are mocked. There is no database.

**Privy.** The suite uses a dedicated Privy test app. The static OTP, app id, app secret, verification key, test emails, and test user ids are read only from environment variables (`PRIVY_TEST_*`, mapped onto the app's existing `NEXT_PUBLIC_PRIVY_APP_ID`, `PRIVY_APP_SECRET`, and `PRIVY_VERIFICATION_KEY` for the e2e process). They are not committed. The `e2e` CI job fails with a missing-secrets message when any of them is absent. There is no auth bypass and no test hook in the app.

**Database.** CI starts MariaDB 10.11 and seeds it once in Playwright `globalSetup`. This tree has no committed `prisma/migrations` (the baseline is after the strip, and that directory is gitignored), so the harness applies the current schema with `prisma migrate diff --from-empty` piped to `prisma db execute`. When a migration directory exists, it switches to `prisma migrate deploy`. Tests do not migrate again. Vitest does not connect.

The current submission and publish routes enqueue on BullMQ and do not return if Redis is down, so the e2e job also starts Redis. That is an inherited Earn queue, not a product dependency. [ADR-0013](0013-no-queue-no-redis.md) still stands for the platform.

`email/validate` returns in non-production instead of falling through to ZeroBounce, so journey 1 does not need a ZeroBounce key. CI does not set `VERCEL_ENV=production`.

### Consequences

- Good: the four journeys hit the live routes, the guards are checked without a server, and a fork PR cannot go green by skipping Privy.
- Bad: the e2e job stays red until the Privy test app secrets exist. The 3-minute cap does not include `next build`, which is large on this monolith.

### Confirmation

- `pnpm test` passes with Prisma and Privy mocked.
- `pnpm test:e2e` reaches the sign-in screen and then fails closed when `PRIVY_TEST_*` is unset.
- The production build has no auth test hook, because none was added.
