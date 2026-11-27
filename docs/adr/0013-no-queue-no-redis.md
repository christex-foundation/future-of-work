# ADR-0013: No queue and no Redis; mail in the request, rate limits at Nginx

- Status: Accepted.
- Date: 2026-11-27
- Deciders: David Ogoo (Christex), CTO, SLDTP tech lead
- Supersedes / relates to: engineering-plan ADR-012; FND-08; AUT-03

## Context and problem statement

Today the app uses Upstash Redis for rate limits, BullMQ on ioredis as an email/agent producer with no consumer in the repo, `waitUntil` from `@vercel/functions`, and Resend. SLDTP mail is low volume: verification, reset, application status and certificate notices.

## Decision drivers

- Fewest services at the data centre
- Mail failures must be visible
- Public endpoints need abuse protection

## Considered options

1. Keep Redis + BullMQ with a worker
2. DB-backed job table + worker process
3. Send mail synchronously in the request via nodemailer to the MoCTI relay; Nginx `limit_req` for rate limits (chosen)

## Decision outcome

Option 3. `src/sldtp/platform/mail.ts` wraps nodemailer (Mailpit in dev). A send failure is logged and, for user-triggered mail (verify, reset), shown as 'try again'. Status-change mail failures don't fail the status change. Rate limiting: Nginx `limit_req_zone` on `/api/verify/*`, `/api/learn/sync`, `/api/jobs/*/apply` and CSV exports. Login brute-force protection is Privy's (ADR-0006). Logs go to stdout/journald with tslog. If hub broadcasts or bulk alerts are ever needed, add a `MailOutbox` table drained by a systemd timer: still no Redis.

### Consequences

- Good: two fewer services; nothing hidden in an external worker; trivial to operate.
- Bad: a slow SMTP relay slows the request that triggers mail (bounded with a 5-second timeout).

### Confirmation

No `redis`, `ioredis`, `bullmq` or `@upstash/*` in `package.json`; Nginx config in the repo under `ops/nginx/`.
