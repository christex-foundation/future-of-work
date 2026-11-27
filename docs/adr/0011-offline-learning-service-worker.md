# ADR-0011: Offline learning with Serwist (versioned precache + Cache API) and an idb-keyval outbox; quizzes scored at sync; apply online

- Status: Accepted (scope: David, CTO rev 2). Implementation: Serwist + `idb-keyval`, per the CTO's review of the YAGNI list (27 Nov 2026). The tech lead's hand-written worker proposal (cut C3) was rejected.
- Date: 2026-11-27
- Deciders: David Ogoo (Christex), CTO, SLDTP tech lead
- Supersedes / relates to: engineering-plan ADR-010; CTO stack-review rev 2 §5.3 (OFL-01 to OFL-06); ADR-0004 (CDN), ADR-0014 (Pages Router only)

## Context and problem statement

The bid and SRD require offline access to LMS content, with offline quiz attempts and sync (tech.txt §3.1, §3.7). Jobs, employer and admin screens can stay online. Today's `next-pwa` caches only a PostHog proxy path. It is a webpack plugin, so it does nothing under Next 16's Turbopack build: `next build` at `97bfeeb8e` emits no `sw.js`.

## Decision drivers

- Learners at hubs and on poor connections can finish a course
- Quiz integrity: no answer key on the device
- Correct cache versioning. A stale lesson or an app shell from an old deploy is the bug class that hurts most offline.
- No hand-rolled service-worker plumbing: precache manifests, revision hashes, update flow and quota errors are well-trodden library ground

## Considered options

1. **Serwist (versioned precache of the app shell + runtime Cache API for downloaded lessons) and an `idb-keyval` outbox, sync on reconnect (chosen)**
2. Hand-written `learn-sw.js` + localStorage outbox (tech lead's C3, **rejected**). The CTO's reasons, which I accept: localStorage is synchronous and capped at about 5 MB per origin; offline lessons need the Cache API plus a versioned precache that a build step generates; hand-rolled workers breed update and staleness bugs.
3. Serwist + full `idb` with a typed schema (rejected for now: one key-value outbox doesn't need indexes or migrations)
4. No offline (rejected: a bid requirement)

## Decision outcome

Option 1.
- **Build.** `serwist` at runtime; `@serwist/cli` and `@serwist/next` in "config mode" at build time (Serwist 9.6, checked 27 Nov 2026). `next build && serwist build` writes `public/sw.js` with an injected precache manifest of hashed `/_next/static/*` assets, the `/learn` shell and the `/~offline` page. Each manifest entry carries a revision, so a deploy replaces the shell atomically. Config mode works with Turbopack and the Pages Router, so we don't need `@serwist/turbopack`'s App Router route handler (ADR-0014 holds). `next-pwa` is deleted.
- **Scope.** Registered at `/` but routes only `/learn/*`, `/api/learn/bundle/*` and CDN media. Everything else is network-only and falls back to "you need a connection".
- **Downloads.** "Download lesson" fetches the lesson bundle (text, questions without answers) and the 360p rendition and captions from the CDN with CORS (ADR-0004). They go into a runtime cache named `lesson-<courseSlug>-v<Course.version>`. When `Course.version` changes, the old cache is deleted and the learner is offered a re-download. Use `navigator.storage.estimate()` before downloading, show a quota message, and call `navigator.storage.persist()` on the first download.
- **Outbox.** `idb-keyval` (about 600 bytes, async, IndexedDB-backed, no size cap that matters here) holds `{clientId, type, payload, at}` for lesson completions and quiz answers. It is flushed to `POST /api/learn/sync` on the `online` event, on page load and on SW `sync` where supported. Background Sync is an optimisation only, because iOS lacks it.
- **Server.** Idempotent on `clientId`. Progress is a union where the earliest `completedAt` wins. Quizzes are scored at sync. Attempts beyond `maxAttempts` are stored as `overLimit`. Then the completion rule runs again (all lessons, the quiz passed, `minAttendanceDays`), and the certificate and COURSE skills are issued.
- **Auth.** Sync needs a valid Privy session. If it expired while offline, the outbox waits until the learner signs in again; nothing is lost.
- **Not in March.** Resumable partial downloads (OFL-02's "resume" stays a retry of the whole lesson), and offline apply.

### Consequences

- Good: library-managed precache revisions and update flow; async storage with no 5 MB ceiling; the server contract (`/api/learn/sync`) is unchanged from the earlier proposal.
- Bad: two build-time dependencies and a post-build step; the SW build must run in CI and in the release script. iOS may evict caches after weeks of disuse, which is documented for learners.
- Estimate: the CTO's OFL-01 to OFL-03 hours stand (76 h). The C3 saving of 24 h is withdrawn.

### Confirmation

- CI asserts `public/sw.js` exists after the build and that its manifest contains the `/learn` shell.
- OFL-06 Playwright journey: download, go offline, study, answer the quiz, reload while offline, reconnect, see the score and certificate. Then deploy a new version and check that the old shell is replaced and a bumped course invalidates its cache. Tested on a low-end Android over throttled 3G and on iOS Safari.
