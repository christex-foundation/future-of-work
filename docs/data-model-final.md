# Final data model for the March 2027 beta

Status: **approved by the CTO with changes** (27 Nov 2026); the changes are applied here. C4 (data-model trims) is **closed**.
Implements: ADR-0005 (MariaDB, migrations only, real foreign keys). Relations are drawn in [data-flow](architecture/data-flow.md).
Machine-checked on 27 Nov 2026:
- `data/schema.prisma` (the same schema as §4) passes `prisma validate` with the fork's Prisma 7.4.2 after the CTO's changes.
- `prisma migrate diff --from-empty` produces **19 `CREATE TABLE` and 31 `FOREIGN KEY`** statements.
- The baseline SQL and `data/inclusion-view.sql` were applied to a scratch **MariaDB 11.8** on the box; 10.11 wasn't packaged there, so CI must repeat this on 10.11. It reported 31 enforced foreign keys. An `Attendance` row for a course that doesn't exist was rejected with error 1452. The view returned the right flags for three test learners, and left out a learner who hadn't consented.
- `data/orphan-check.mjs` ran against both schemas loaded into that database: today's schema has 0 foreign keys and 60 relations checked. An orphan row planted in `UserSponsors` was reported on both of its relations.

## 1. Summary

**19 tables**, against 42 in `prisma/schema.prisma` on integration and about 30 in the CTO's sketch. The earlier "17" counted the boxes in an earlier relation sketch, which left out `Hub` and `CourseSkill`. Both were always in the model.

| Area | Tables | Count |
| --- | --- | --- |
| Identity, profile, inclusion | `Hub`, `User` | 2 |
| Skills taxonomy | `Skill`, `UserSkill` | 2 |
| Learning | `Course`, `CourseSkill`, `Lesson`, `Quiz`, `Question`, `Enrolment`, `LessonProgress`, `QuizAttempt`, `Certificate`, `Attendance` | 10 |
| Jobs | `Employer`, `Opportunity`, `OpportunitySkill`, `Application` | 4 |
| Platform | `AuditLog` | 1 |

Dropped from the CTO's sketch (agreed C4): `Module` (now `Lesson.section`), `Caption` (file convention), `Choice` and `AttemptAnswer` (JSON on `Question` and `QuizAttempt`), `HubMembership` (now `User.hubId`), `HubSession` (now a day in `Attendance`). Also gone: Superteam's `UserSponsors`/`currentSponsorId` (now `User.employerId`), and every session, password and MFA table, because Privy holds the login (ADR-0006).

## 2. Tables and fields

PK = primary key, UK = unique, FK = real foreign key.

| Table | Fields |
| --- | --- |
| **Hub** | `id` PK, `slug` UK, `name`, `district`, `createdAt` |
| **User** | Identity: `id` PK, `privyDid` UK, `email` UK, `role` (LEARNER / EMPLOYER / HUB_MANAGER / ADMIN), `hubId` FK→Hub, `employerId` FK→Employer, `blockedAt`. **Profile and CV:** `name`, `phone` (plain; §2.2), `district`, `locale` (en / kri), `skillLevel` (BASIC / INTERMEDIATE / ADVANCED), `bio`, `cv` JSON (education, experience and links sections), `cvFilePath`, `profilePublic` (privacy toggle), `nationalIdHmac` UK and `nationalIdLast4`, both optional, never cleartext (§2.1). **Inclusion, consent-gated:** `demographicsConsentAt`, `gender` (FEMALE / MALE / OTHER / PREFER_NOT_TO_SAY), `disabilityWgss` JSON (Washington Group Short Set, 6 domains), read only through the `InclusionReport` view (§2.4). `createdAt`, `updatedAt` |
| **Skill** | `id` PK, `slug` UK, `name`, `archivedAt` |
| **UserSkill** | PK (`userId`, `skillId`), `source` (SELF / COURSE / HUB_ENDORSED), `courseId` FK, `endorsedById` FK→User, `verifiedAt`, `createdAt` |
| **Course** | `id` PK, `slug` UK, `version` (bumping it invalidates offline copies), `title`, `summary`, `stage` (3 ToR stages), `level`, `locale`, `minAttendanceDays`, `published`, `createdAt`, `updatedAt` |
| **CourseSkill** | PK (`courseId`, `skillId`) |
| **Lesson** | `id` PK, `courseId` FK, `position` (UK with course), `section`, `title`, `kind` (TEXT / VIDEO / PDF), `bodyMd`, `mediaPath` (CDN key; captions found by convention), `durationSec` |
| **Quiz** | `id` PK, `courseId` FK UK, `passMark`, `maxAttempts` |
| **Question** | `id` PK, `quizId` FK, `position`, `prompt`, `choices` JSON (id and label), `correctChoiceId`, which is never selected for clients |
| **Enrolment** | PK (`userId`, `courseId`), `hubId` FK (cohort), `enrolledAt`, `completedAt`, `completionSource` (ONLINE / HUB_CSV) |
| **LessonProgress** | PK (`userId`, `lessonId`), `completedAt` (earliest wins), `clientId` UK (offline idempotency), `syncedAt` |
| **QuizAttempt** | `id` PK, `clientId` UK, `userId` FK, `quizId` FK, `answers` JSON, `score`, `passed`, `overLimit`, `answeredAt` (device time), `scoredAt` |
| **Certificate** | `id` PK, `serial` UK (QR and public verification), `userId` FK, `courseId` FK, UK (`userId`, `courseId`), `issuedAt`, `revokedAt`, `revokedReason`. Reissue reuses the row (§2.3) |
| **Attendance** | PK (`userId`, `courseId`, `day`), `courseId` FK (required), `hubId` FK, `present`, `recordedById` FK→User, `recordedAt`. A learner can attend two courses on the same day |
| **Employer** | `id` PK, `slug` UK, `name`, `logoPath`, `website`, `descriptionMd`, `district`, `approvedAt`, `approvedById` FK→User, `createdAt` |
| **Opportunity** | `id` PK, `employerId` FK, `slug` UK, `title`, `descriptionMd`, `kind` (JOB / INTERNSHIP / APPRENTICESHIP / PAID_TASK / TRAINING), `entryLevel`, `district`, `remote`, `deadline`, `expiresAt` (60-day default), `status` (DRAFT / PENDING / OPEN / CLOSED / REJECTED), `publishedAt`, `createdAt`, `updatedAt` |
| **OpportunitySkill** | PK (`opportunityId`, `skillId`) |
| **Application** | `id` PK, `opportunityId` FK, `userId` FK, UK (`opportunityId`, `userId`), `coverLetter`, `cvPath`, `profileSnapshot` JSON, `status` (SUBMITTED / IN_REVIEW / INTERVIEW / HIRED / REJECTED / WITHDRAWN), `statusChangedAt`, `employerNotes`, `createdAt` |
| **AuditLog** | `id` BIGINT PK, `actorId` FK→User, `action`, `entity`, `entityId`, `meta` JSON, `ip`, `at`. Append-only: the app's DB user has no UPDATE or DELETE on it (ADR-0016). `meta` never contains phone, national-ID, gender or WG-SS values (§2.2) |

Delete rules: join and progress rows cascade from their parent (`UserSkill`, `CourseSkill`, `OpportunitySkill`, `Lesson`, `Question`, `LessonProgress`, `QuizAttempt` and `Enrolment` from their user). Everything that is evidence restricts deletion: `Certificate`, `Application`, `AuditLog`, `Employer` → `Opportunity`. Learner erasure anonymises the `User` row; it never hard-deletes it, so certificates and audit history keep their keys.

### 2.1 National ID: keyed HMAC for uniqueness, last 4 for display

- **Never stored in cleartext.** On entry the ID is normalised (upper-case, spaces and dashes removed), then stored as `nationalIdHmac = "k1:" + hex(HMAC-SHA256(NATIONAL_ID_HMAC_KEY, normalised))` with a unique index. That gives the bid's "uniqueness check" (§3.3). `nationalIdLast4` holds the last four characters for display ("••••1234"). Plain SHA-256 is not enough: national IDs have little entropy and could be brute-forced from a dump. A keyed HMAC holds only while the key stays secret.
- **Key management.**
  - `NATIONAL_ID_HMAC_KEY` is 32 random bytes in a server secret: the env file on the app VM, owned by root, mode 0600, and in the standby's secret store.
  - It is not in the repo, the database, or the database dumps. It is escrowed with MoCTI alongside the backup key (ADR-0004).
  - Losing it means new entries can no longer be checked against old rows.
- **No rotation without a re-hash plan.** We don't keep the cleartext, so rotating means re-collecting IDs. The `k1:` prefix allows a future `k2` key: look up with both keys and write with `k2` as learners re-enter their ID. That plan needs its own ADR before any rotation. A suspected key leak triggers it.
- Only `src/sldtp/profile/national-id.ts` computes the HMAC. The value never appears in logs, `AuditLog.meta`, exports or API responses; only `nationalIdLast4` leaves the server.

### 2.2 Phone: plain, but kept out of audit and exports

- `phone` is stored in plain text, because hubs call learners.
- `src/sldtp/platform/audit.ts` drops `phone`, `nationalIdHmac`, `nationalIdLast4`, `gender` and `disabilityWgss` keys from `meta` before writing. An audit entry for a phone change records `{ field: "phone", changed: true }`, never the value. A unit test asserts the redaction.
- Exports include phone only where the role needs it: a hub manager's roster CSV for their own hub, and the admin user export. Employer views and the opportunity applicant CSV never include it (contact goes through the platform). Every CSV route declares its column list in one place, and a test checks that phone is absent for the other roles.

### 2.3 Certificate reissue: same row, `revokedAt` cleared, audited

KISS decision (CTO, 27 Nov 2026): keep UK (`userId`, `courseId`), so there is exactly one certificate row per learner and course.
- **Revoke:** set `revokedAt` and `revokedReason`; write `AuditLog(action: "certificate.revoke", entity: "Certificate", entityId, meta: { reason })`.
- **Reissue:** clear `revokedAt` and `revokedReason` on the **same row**, keep the same `serial` (so printed QR codes keep working) and `issuedAt`; write `AuditLog(action: "certificate.reissue", meta: { previousRevokedAt, previousReason })`. The PDF is regenerated from the row, which also covers a corrected learner name.
- `/verify/[serial]` shows the current state (valid or revoked). The history of revocations and reissues lives only in `AuditLog`, not in extra certificate rows.
- If MoCTI later needs a new serial on reissue, that is an additive change (`Certificate.previousSerial`). It is not built now.

### 2.4 One reporting view for inclusion data

- `data/inclusion-view.sql` creates the `InclusionReport` view in migration `0001_inclusion_report_view`. It exposes `userId`, `hubId`, `district`, `gender`, six domain flags (`seeingFlag`, `hearingFlag`, `mobilityFlag`, `cognitionFlag`, `selfCareFlag`, `communicationFlag`) and the derived `pwd` flag, for **consented learners only**.
- A domain flag means "a lot of difficulty" or worse (WG-SS answer ≥ 3). `pwd` means any domain flag is set. `NULL` means not answered and is never counted as "no".
- The view is the **only** reader of `disabilityWgss` for reporting. `src/sldtp/reports/inclusion.ts` is the only module that queries it (`$queryRaw`, typed). Hub, MoCTI and admin reports call that module and return **counts**, never rows. A CI grep (`rg -l disabilityWgss src/`) must list only two files, the profile writer and that module, plus the generated Prisma client.
- `pwd` is not stored on `User`. The view is the single place it is derived, so a change to the WG cut-off is one migration.

## 3. Requirement check: what the CTO asked to survive

| Must survive | Where | Bid / fit-gap row |
| --- | --- | --- |
| **Learner profile** | `User`: name, phone, district, hub, locale, skillLevel, bio, structured `cv`, `cvFilePath`, `profilePublic`, optional national ID (HMAC plus last 4); skills in `UserSkill` | §3.2 youth profile / online CV with privacy controls; §3.3 self-service profile with audit (`AuditLog` action `profile.update`); §3.3 optional ID linkage; §3.8.1 skill level; fit/gap AUT-09 |
| **PWD and gender reporting** | `User.gender`, `User.disabilityWgss`, `User.demographicsConsentAt`; derived `pwd` and domain flags in the `InclusionReport` view (§2.4). Reports count only consented rows, grouped by hub, course and district | §3.5 demographic breakdown where consented; the bid's Washington Group Short Set proposal; the ToR's 40% women and 15% PWD targets |
| **Course progress** | `Enrolment` (enrolled, completed, source ONLINE or HUB_CSV), `LessonProgress`, `QuizAttempt` (scores, attempts, over-limit), `Attendance` (in-person days per course towards `Course.minAttendanceDays`) | §3.1 per-learner progress, resumable courses, progress bars; §3.1 blended attendance tied to completion; §3.8.5 hub CSV completion upload; offline quiz attempts |
| **Certificates** | `Certificate` with `serial` for QR and `/verify/[serial]`, revocation fields, reissue on the same row (§2.3); course skills written to `UserSkill` (source COURSE, `verifiedAt`) on issue | §3.1 certificates with verifiable IDs |
| **Job-match inputs** | Learner side: `UserSkill` (source weights: COURSE > HUB_ENDORSED > SELF), `Certificate`, `User.skillLevel`, `User.district`. Opportunity side: `OpportunitySkill`, `entryLevel`, `district`, `remote`, `kind`. Indexes: `User(district, skillLevel)`, `UserSkill(skillId)`, `OpportunitySkill(skillId)` | §3.2 matching in both directions on skills, level, location and endorsements; §3.8.3 search by skill level and location; OPP-06 |
| 24-month training history | Derived from `Enrolment` and `Certificate` dates; no extra table | §3.8.1 |
| Employer approval, moderation, expiry | `Employer.approvedAt/approvedById`; `Opportunity.status` PENDING, `expiresAt` | §3.3 admin approval for employers; §3.2 draft, moderation, expiry |
| Skills taxonomy managed by admin | `Skill` (archive, never delete) | §2.4 |
| Baseline diagnostic | A published course (stage FOUNDATIONS, slug `baseline`) with a `Quiz`; the pathway (A or B) is read from its `QuizAttempt.score`. No extra table | Bid §2 two-pathway entry |

## 4. Schema (`data/schema.prisma`)

```prisma
generator client {
  provider = "prisma-client"
  output   = "../src/generated/prisma"
}

datasource db {
  provider     = "mysql"
  relationMode = "foreignKeys"
}

// ---------- Identity, profile, inclusion ----------

enum Role {
  LEARNER
  EMPLOYER
  HUB_MANAGER
  ADMIN
}

enum SkillLevel {
  BASIC
  INTERMEDIATE
  ADVANCED
}

enum Gender {
  FEMALE
  MALE
  OTHER
  PREFER_NOT_TO_SAY
}

model Hub {
  id        String   @id @default(cuid())
  slug      String   @unique
  name      String
  district  String
  createdAt DateTime @default(now())

  users      User[]
  attendance Attendance[]
  enrolments Enrolment[]
}

model User {
  id         String    @id @default(cuid())
  privyDid   String    @unique // Privy user id; Privy holds the login (ADR-0006)
  email      String    @unique
  role       Role      @default(LEARNER)
  hubId      String? // learner's home hub, or the hub a hub manager runs
  employerId String? // employer staff only
  blockedAt  DateTime?

  // Learner profile and online CV (bid §3.2, §3.8.1)
  name          String
  phone         String? // plain; never copied into AuditLog.meta; in exports only for roles that need it (data-model-final §2.2)
  district      String?
  locale        String      @default("en") // en | kri
  skillLevel    SkillLevel?
  bio           String?     @db.Text
  cv            Json? // structured CV sections: { education: [...], experience: [...], links: [...] }
  cvFilePath    String? // optional uploaded CV (private files)
  profilePublic Boolean     @default(false) // privacy toggle: employers see the profile only when true or when applied
  nationalIdHmac  String?   @unique // "k1:" + HMAC-SHA256(NATIONAL_ID_HMAC_KEY, normalised id); never cleartext (bid §3.3)
  nationalIdLast4 String?   @db.Char(4) // display only

  // Inclusion reporting, consent-gated (bid §3.5; ADR-0016). Null until consent.
  demographicsConsentAt DateTime?
  gender                Gender?
  disabilityWgss        Json? // Washington Group Short Set: six domains, answers 1-4. Read only through the InclusionReport view

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  hub          Hub?             @relation(fields: [hubId], references: [id])
  employer     Employer?        @relation("EmployerStaff", fields: [employerId], references: [id])
  skills       UserSkill[]      @relation("SkillOwner")
  endorsements UserSkill[]      @relation("SkillEndorser")
  enrolments   Enrolment[]
  progress     LessonProgress[]
  attempts     QuizAttempt[]
  certificates Certificate[]
  attendance   Attendance[]     @relation("Attendee")
  recorded     Attendance[]     @relation("AttendanceRecorder")
  applications Application[]
  approvals    Employer[]       @relation("EmployerApprover")
  auditEntries AuditLog[]

  @@index([role])
  @@index([hubId])
  @@index([district, skillLevel])
}

// ---------- Skills taxonomy (bid §2.4; shared by courses, profiles and opportunities) ----------

enum SkillSource {
  SELF
  COURSE
  HUB_ENDORSED
}

model Skill {
  id         String    @id @default(cuid())
  slug       String    @unique
  name       String
  archivedAt DateTime?

  users         UserSkill[]
  courses       CourseSkill[]
  opportunities OpportunitySkill[]
}

model UserSkill {
  userId       String
  skillId      String
  source       SkillSource
  courseId     String? // set when source = COURSE
  endorsedById String? // set when source = HUB_ENDORSED
  verifiedAt   DateTime?
  createdAt    DateTime    @default(now())

  user       User    @relation("SkillOwner", fields: [userId], references: [id], onDelete: Cascade)
  skill      Skill   @relation(fields: [skillId], references: [id])
  course     Course? @relation(fields: [courseId], references: [id])
  endorsedBy User?   @relation("SkillEndorser", fields: [endorsedById], references: [id])

  @@id([userId, skillId])
  @@index([skillId])
}

// ---------- Learning ----------

enum Stage {
  FOUNDATIONS
  PRODUCTIVITY_EMPLOYABILITY
  SPECIALISATION_JOB_LINKAGE
}

enum LessonKind {
  TEXT
  VIDEO
  PDF
}

enum CompletionSource {
  ONLINE
  HUB_CSV
}

model Course {
  id                String     @id @default(cuid())
  slug              String     @unique
  version           Int        @default(1) // bump invalidates offline copies (ADR-0011)
  title             String
  summary           String     @db.Text
  stage             Stage
  level             SkillLevel
  locale            String     @default("en")
  minAttendanceDays Int        @default(0) // blended courses: in-person days needed to complete (bid §3.1)
  published         Boolean    @default(false)
  createdAt         DateTime   @default(now())
  updatedAt         DateTime   @updatedAt

  lessons      Lesson[]
  quiz         Quiz?
  skills       CourseSkill[]
  enrolments   Enrolment[]
  certificates Certificate[]
  userSkills   UserSkill[]
  attendance   Attendance[]
}

model CourseSkill {
  courseId String
  skillId  String

  course Course @relation(fields: [courseId], references: [id], onDelete: Cascade)
  skill  Skill  @relation(fields: [skillId], references: [id])

  @@id([courseId, skillId])
  @@index([skillId])
}

model Lesson {
  id          String     @id @default(cuid())
  courseId    String
  position    Int
  section     String // display grouping; no Module table
  title       String
  kind        LessonKind
  bodyMd      String?    @db.Text
  mediaPath   String? // CDN key; captions by convention media/<lessonId>/captions.<locale>.vtt
  durationSec Int?

  course   Course           @relation(fields: [courseId], references: [id], onDelete: Cascade)
  progress LessonProgress[]

  @@unique([courseId, position])
}

model Quiz {
  id          String @id @default(cuid())
  courseId    String @unique // one final quiz per course
  passMark    Int // percent
  maxAttempts Int    @default(3)

  course    Course        @relation(fields: [courseId], references: [id], onDelete: Cascade)
  questions Question[]
  attempts  QuizAttempt[]
}

model Question {
  id              String @id @default(cuid())
  quizId          String
  position        Int
  prompt          String @db.Text
  choices         Json // [{ id, label }], sent to clients
  correctChoiceId String // never selected for clients

  quiz Quiz @relation(fields: [quizId], references: [id], onDelete: Cascade)

  @@unique([quizId, position])
}

model Enrolment {
  userId           String
  courseId         String
  hubId            String? // hub cohort, for hub-scoped reports
  enrolledAt       DateTime          @default(now())
  completedAt      DateTime?
  completionSource CompletionSource?

  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  course Course @relation(fields: [courseId], references: [id])
  hub    Hub?   @relation(fields: [hubId], references: [id])

  @@id([userId, courseId])
  @@index([courseId, completedAt])
  @@index([hubId])
}

model LessonProgress {
  userId      String
  lessonId    String
  completedAt DateTime // earliest wins on sync
  clientId    String?   @unique // offline idempotency key
  syncedAt    DateTime?

  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  lesson Lesson @relation(fields: [lessonId], references: [id], onDelete: Cascade)

  @@id([userId, lessonId])
  @@index([lessonId])
}

model QuizAttempt {
  id         String   @id @default(cuid())
  clientId   String?  @unique // offline idempotency key
  userId     String
  quizId     String
  answers    Json // { questionId: choiceId }
  score      Int // percent
  passed     Boolean
  overLimit  Boolean  @default(false)
  answeredAt DateTime // device time
  scoredAt   DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  quiz Quiz @relation(fields: [quizId], references: [id])

  @@index([userId, quizId])
}

model Certificate {
  id            String    @id @default(cuid())
  serial        String    @unique // public verification id (QR)
  userId        String
  courseId      String
  issuedAt      DateTime  @default(now())
  revokedAt     DateTime?
  revokedReason String?

  user   User   @relation(fields: [userId], references: [id])
  course Course @relation(fields: [courseId], references: [id])

  @@unique([userId, courseId]) // one row per learner and course; reissue clears revokedAt on this row (data-model-final §2.3)
}

model Attendance {
  userId       String
  courseId     String // counts towards Course.minAttendanceDays
  day          DateTime @db.Date
  hubId        String
  present      Boolean
  recordedById String
  recordedAt   DateTime @default(now())

  user       User    @relation("Attendee", fields: [userId], references: [id], onDelete: Cascade)
  hub        Hub     @relation(fields: [hubId], references: [id])
  course     Course  @relation(fields: [courseId], references: [id])
  recordedBy User    @relation("AttendanceRecorder", fields: [recordedById], references: [id])

  @@id([userId, courseId, day])
  @@index([hubId, day])
  @@index([courseId])
}

// ---------- Jobs ----------

enum OpportunityKind {
  JOB
  INTERNSHIP
  APPRENTICESHIP
  PAID_TASK
  TRAINING
}

enum OpportunityStatus {
  DRAFT
  PENDING // awaiting moderation
  OPEN
  CLOSED
  REJECTED
}

enum ApplicationStatus {
  SUBMITTED
  IN_REVIEW
  INTERVIEW
  HIRED
  REJECTED
  WITHDRAWN
}

model Employer {
  id            String    @id @default(cuid())
  slug          String    @unique
  name          String
  logoPath      String?
  website       String?
  descriptionMd String?   @db.Text
  district      String?
  approvedAt    DateTime?
  approvedById  String?
  createdAt     DateTime  @default(now())

  staff         User[]        @relation("EmployerStaff")
  approvedBy    User?         @relation("EmployerApprover", fields: [approvedById], references: [id])
  opportunities Opportunity[]
}

model Opportunity {
  id            String            @id @default(cuid())
  employerId    String
  slug          String            @unique
  title         String
  descriptionMd String            @db.Text
  kind          OpportunityKind
  entryLevel    Boolean           @default(false)
  district      String?
  remote        Boolean           @default(false)
  deadline      DateTime?
  expiresAt     DateTime // default publishedAt + 60 days (bid §3.2)
  status        OpportunityStatus @default(DRAFT)
  publishedAt   DateTime?
  createdAt     DateTime          @default(now())
  updatedAt     DateTime          @updatedAt

  employer     Employer           @relation(fields: [employerId], references: [id])
  skills       OpportunitySkill[]
  applications Application[]

  @@index([status, expiresAt])
  @@index([district])
  @@index([employerId])
}

model OpportunitySkill {
  opportunityId String
  skillId       String

  opportunity Opportunity @relation(fields: [opportunityId], references: [id], onDelete: Cascade)
  skill       Skill       @relation(fields: [skillId], references: [id])

  @@id([opportunityId, skillId])
  @@index([skillId])
}

model Application {
  id              String            @id @default(cuid())
  opportunityId   String
  userId          String
  coverLetter     String            @db.Text
  cvPath          String? // optional CV file for this application
  profileSnapshot Json // profile, skills and certificates at submit time
  status          ApplicationStatus @default(SUBMITTED)
  statusChangedAt DateTime          @default(now())
  employerNotes   String?           @db.Text
  createdAt       DateTime          @default(now())

  opportunity Opportunity @relation(fields: [opportunityId], references: [id])
  user        User        @relation(fields: [userId], references: [id])

  @@unique([opportunityId, userId])
  @@index([userId])
  @@index([opportunityId, status])
}

// ---------- Platform ----------

model AuditLog {
  id       BigInt   @id @default(autoincrement())
  actorId  String?
  action   String // e.g. login, role.change, employer.approve, profile.update, demographics.read
  entity   String
  entityId String
  meta     Json?
  ip       String?
  at       DateTime @default(now())

  actor User? @relation(fields: [actorId], references: [id])

  @@index([entity, entityId])
  @@index([actorId, at])
}
```

## 5. Deferred: fit/gap marks these as after March, and each is an additive migration

| Gap (fit/gap id) | Additive change when it is built |
| --- | --- |
| Mark filled and platform attribution, time-to-hire (GAP-15) | `Opportunity.filledAt`, `Opportunity.filledViaPlatform`; time-to-hire = `Application.statusChangedAt` where HIRED minus `Opportunity.publishedAt` (both columns exist now) |
| Matching on availability and work-route preference (GAP-10) | `User.availability` enum, `User.workRoutes` JSON |
| Portfolio artefacts (bid narrative §3.7) | `PortfolioItem(id, userId, title, url or filePath, skillId?)` |
| Masked employer-applicant messaging (GAP-09) | `Message(id, applicationId, senderId, body, at)` |
| Modules with their own rules, several hub sessions a day, multi-choice questions | `Module`, `HubSession`, `Choice` tables; each a mechanical migration from the JSON or string columns |
| Age-band reporting, if the Inception Report's eligibility rules need it | `User.birthYear`, consent-gated like gender |

## 6. Moving to real foreign keys

1. The baseline is a fresh `schema.prisma` with `relationMode = "foreignKeys"` and `prisma/migrations/0000_baseline` (ADR-0005).
2. If any rows are carried over from the existing database (FND-01 decides; today nothing is planned), first run `data/orphan-check.mjs` over the **old** schema. It emits one `LEFT JOIN … IS NULL` count per relation: 60 relations on today's 42-table schema, and 31 on the new one. Every count must be 0 before the copy, or the rows must be fixed or dropped in the copy script. Run it again on the new schema after loading and before adding the constraints.
3. From then on: `prisma migrate dev` locally and `prisma migrate deploy` in releases. `db push` is banned (a CI grep).
