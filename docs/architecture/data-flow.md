# Data flow

Checked against `integration` at `b6c208cf6`. **Planned** sections describe the beta. The field list is [data-model-final.md](../data-model-final.md).

## Current login

```mermaid
sequenceDiagram
  participant Browser
  participant Privy
  participant API as API route
  participant Token as getPrivyToken
  participant DB as Database
  Browser->>Privy: Email code or Google
  Privy-->>Browser: Access token and privy-token cookie
  Browser->>API: Bearer token via src/lib/api.ts
  API->>Token: withAuth or getUserSession
  Token->>Token: verifyAuthToken
  Token-->>API: privyDid
  API->>DB: User lookup by privyDid
  API-->>Browser: 401, 403, or the handler result
```

`getPrivyToken` reads `Authorization` first and the `privy-token` cookie second, then calls `privy.utils().auth().verifyAuthToken`. The client is the module-level `PrivyClient` in `src/lib/privy.ts`. First login today is `POST /api/user/create`, which creates the `User` row from `privyDid`.

`User.role` is a free string. The super-admin check is `role === 'GOD'`. Employer membership is `UserSponsors` plus `User.currentSponsorId`. The next-auth `Account` and `Session` models hang off `People`, not `User`.

## Current data

`prisma/schema.prisma` has 42 models. `relationMode = "prisma"`, so MariaDB does not enforce foreign keys. There is no migrations directory. The root README still documents `prisma db push` for this inherited schema. [ADR-0005](../adr/0005-mariadb-prisma-migrations-only.md) replaces that with a fresh baseline and migrations only.

`User.privyDid` is required and unique. `Bounties` and `Submission` are the listing and application tables this product will not adapt ([ADR-0010](../adr/0010-build-jobs-module-fresh.md)).

## Planned login

[ADR-0006](../adr/0006-identity-with-privy-roles-in-sldtp.md). Email one-time code for every role. Google comes out of `loginMethods`. Admin and hub manager then pass a TOTP step-up through Privy's server-side MFA API, after a week-1 spike. The spike stops if enrolment needs an embedded wallet.

```mermaid
sequenceDiagram
  participant Browser
  participant Privy
  participant API as API route
  participant Session as getSessionUser
  participant DB as MariaDB
  Browser->>Privy: Email address
  Privy-->>Browser: 6-digit code
  Browser->>Privy: Code
  Privy-->>Browser: Access token
  Browser->>API: Bearer token
  API->>Session: requireRole
  Session->>Session: Verify with PRIVY_VERIFICATION_KEY
  Session->>DB: User by privyDid
  Session-->>API: User or 401 or 403
  alt Admin or hub manager, no step-up cookie
    API-->>Browser: 403 step_up_required
    Browser->>API: POST /api/me/step-up
    API->>Privy: Verify TOTP
    Privy-->>API: MFA token
    API-->>Browser: Step-up cookie
  end
```

The step-up cookie is `HttpOnly`, bound to `privyDid` and the Privy session id. Hub CSV import pre-creates the Privy user by email, then the `User` row.

## Planned offline learning

[ADR-0011](../adr/0011-offline-learning-service-worker.md). Apply, employer, hub, and admin screens stay online.

```mermaid
sequenceDiagram
  participant Page as Learn page
  participant SW as Serwist worker
  participant Cache as Cache API
  participant Outbox as idb-keyval
  participant API as Learn API
  participant CDN as CDN
  Page->>API: Lesson bundle, questions without answers
  Page->>SW: Download lesson
  SW->>CDN: 360p video and captions
  SW->>Cache: Store lesson-slug-vN
  Page->>Outbox: Completion or quiz answers
  Page->>API: POST /api/learn/sync
  API->>API: Score, maxAttempts, certificate
  API-->>Page: Results
```

Progress keeps the earliest `completedAt`. Attempts past `maxAttempts` are stored as `overLimit`. If the Privy session expired offline, the outbox waits until the next sign-in.

Course completion is every lesson complete and the quiz passed. The learner signs in with the Privy email code.

## Planned domain model

19 tables, real foreign keys. Fields, delete rules, and the inclusion view are in [data-model-final.md](../data-model-final.md). The schema draft is [docs/data/schema.prisma](../data/schema.prisma).

```mermaid
erDiagram
  Hub ||--o{ User : "home hub"
  Hub ||--o{ Enrolment : "cohort"
  Hub ||--o{ Attendance : "records"
  Employer ||--o{ User : "staff"
  User ||--o{ UserSkill : "has"
  Skill ||--o{ UserSkill : "named"
  Skill ||--o{ CourseSkill : "taught"
  Skill ||--o{ OpportunitySkill : "required"
  Course ||--o{ CourseSkill : "teaches"
  Course ||--o{ Lesson : "contains"
  Course ||--o| Quiz : "final quiz"
  Quiz ||--o{ Question : "has"
  User ||--o{ Enrolment : "enrols"
  Course ||--o{ Enrolment : "offered"
  User ||--o{ LessonProgress : "progress"
  Lesson ||--o{ LessonProgress : "tracked"
  User ||--o{ QuizAttempt : "attempts"
  Quiz ||--o{ QuizAttempt : "scored"
  User ||--o{ Certificate : "earns"
  Course ||--o{ Certificate : "issued"
  User ||--o{ Attendance : "attends"
  Course ||--o{ Attendance : "session day"
  Employer ||--o{ Opportunity : "posts"
  Opportunity ||--o{ OpportunitySkill : "needs"
  Opportunity ||--o{ Application : "receives"
  User ||--o{ Application : "submits"
  User ||--o{ AuditLog : "actor"
```

Application status on the approved model is `SUBMITTED`, `IN_REVIEW`, `INTERVIEW`, `HIRED`, `REJECTED`, `WITHDRAWN`.

## Planned API

All under `src/pages/api/`.

| Prefix | Who | Role |
| --- | --- | --- |
| `/api/me` | signed in | Current user. First login provisions the row. Step-up routes are for admin and hub manager. |
| `/api/learn/*` | learner | Catalogue, enrol, lesson, progress, quiz, sync, certificate PDF |
| `/api/verify/[serial]` | public | Certificate check |
| `/api/jobs/*` | public read, learner apply | Opportunities and applications |
| `/api/employer/*` | employer | Profile, opportunity CRUD, review queue |
| `/api/hub/*` | hub manager | Roster, CSV import, attendance, CSV reports |
| `/api/admin/*` | admin | Users, approvals, skills, audit |
| `/api/health` | proxy and deploy | Database ping |
