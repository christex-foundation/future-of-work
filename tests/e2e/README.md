# End-to-end journeys

Playwright runs journeys 1–4 against the current `/earn` routes. Chromium only, two workers. Journey 1 is the only test that walks the email-code UI. It saves `storageState` for the talent and the employer. Journeys 2–4 reuse those sessions.

The run is capped at 3 minutes (`timeout-minutes: 3` on the CI step, and `globalTimeout` in `playwright.config.ts`). `pnpm install` and `pnpm build` sit outside that cap.

## What a human must provide

Create a **dedicated Privy app** used only by this suite. Do not point it at production, and do not add a bypass in the app. The suite signs in through Privy's own test accounts.

In the Privy dashboard for that app:

1. Turn on email login.
2. Add two test accounts, one talent and one employer, and set **both** to the same static OTP.
3. Allow `http://127.0.0.1:3000` as an origin. CI serves the app there.
4. Copy the app id, app secret, and verification key (the PEM, including the begin and end lines).
5. Open each test user and copy the user id (`did:privy:...`). If the id appears only after a first login, sign in once and copy it before storing the secrets. The seed writes that id onto the `User` row, and a mismatch makes `/api/user/create` return 409.

Store these as GitHub Actions secrets (Settings → Secrets and variables → Actions). Do not commit them, and do not print them.

| Secret | Used as |
| --- | --- |
| `PRIVY_TEST_APP_ID` | `NEXT_PUBLIC_PRIVY_APP_ID` for the e2e build and server |
| `PRIVY_TEST_APP_SECRET` | `PRIVY_APP_SECRET` |
| `PRIVY_TEST_VERIFICATION_KEY` | `PRIVY_VERIFICATION_KEY` |
| `PRIVY_TEST_OTP` | the static email code typed by journey 1 |
| `PRIVY_TEST_TALENT_EMAIL` | talent test account |
| `PRIVY_TEST_EMPLOYER_EMAIL` | employer test account |
| `PRIVY_TEST_TALENT_DID` | talent `privyDid` |
| `PRIVY_TEST_EMPLOYER_DID` | employer `privyDid` |

There is no TOTP secret in this slice. Journey 5 is not in this suite.

If any of these are absent, the `e2e` job fails and says the secrets are missing. It does not skip.

## Local run

MariaDB 10.11 and Redis must be listening. Redis is only here because the current submission and publish routes enqueue on BullMQ and wait when it is down. It is not a product dependency.

```bash
export DATABASE_URL='mysql://e2e:e2e@127.0.0.1:3306/e2e'
export REDIS_URL='redis://127.0.0.1:6379'
export AGENT_REDIS_URL='redis://127.0.0.1:6379'
# Plus the PRIVY_TEST_* variables, and the same app id / secret / key
# exported as NEXT_PUBLIC_PRIVY_APP_ID, PRIVY_APP_SECRET, PRIVY_VERIFICATION_KEY.
pnpm exec playwright install chromium
pnpm build
pnpm test:e2e
```

`NEXT_PUBLIC_PRIVY_APP_ID` is inlined at build time, so rebuild after changing the test app id.

The e2e job and the Playwright server both set `SKIP_EMAIL_VALIDATION=true`. Journey 1 posts to `/api/email/validate` before the email code is sent. With that flag the route returns `{ isValid: true }` and does not call ZeroBounce. The harness still keeps the early `return` on the non-production branch in `src/pages/api/email/validate.ts`.

The schema step uses `prisma migrate diff --from-empty` until `prisma/migrations` exists, then `prisma migrate deploy`. Tests do not migrate again. There is no `db push`.

Privy app ids are 25 characters. The workflow also sets unused placeholders for `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, and `NEXTAUTH_SECRET`, because those Earn modules throw or log errors in production when they are missing. The journeys do not call Upstash or next-auth.

Vitest does not use this database: `pnpm test`.
