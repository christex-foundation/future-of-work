# ADR-0005: MariaDB 10.11, Prisma migrations only, real foreign keys after an orphan-row check, one schema file

- Status: Accepted (David: MariaDB and migrations only; CTO, 27 Nov 2026: real foreign keys in the fresh baseline, no `db push`). Proposed: a single schema file instead of the CTO's split folder.
- Date: 2026-11-27
- Deciders: David Ogoo (Christex), CTO, SLDTP tech lead
- Supersedes / relates to: engineering-plan ADR-005 (data-model part), FND-09; CTO fork-sync-strategy §7.4; `docs/data-model-final.md`

## Context and problem statement

Upstream used PlanetScale with `db push` and no migration history. The schema has `relationMode = "prisma"`, so **MariaDB has no foreign-key constraints today**: Prisma emulates relations in application code, and nothing stops orphan rows. Fork commit `3da3094d2` added the MariaDB driver adapter. Government records (certificates, applications, audit) need integrity that the database enforces.

## Decision drivers

- Reviewable, repeatable schema changes at MoCTI
- Referential integrity enforced by the database
- No surprise when constraints are switched on over existing data
- Simplicity

## Considered options

1. Keep `db push` (rejected)
2. Migrations with `relationMode = "prisma"` (rejected: integrity stays in app code)
3. **Fresh baseline with real foreign keys, an orphan-row check before any data is carried over, and migrations only from then on (chosen)**
4. Split schema folder (`upstream.prisma` vs `sldtp/*.prisma`)

## Decision outcome

Option 3.
- **Baseline.** After the strip, write a fresh `schema.prisma` with the target model (`docs/data-model-final.md`: 19 tables, 31 foreign keys) and **remove `relationMode = "prisma"`**. Prisma's default, `foreignKeys`, is written out explicitly so nobody puts the old line back. Generate `prisma/migrations/0000_baseline`. Lookup paths get explicit `@@index`es; InnoDB adds an index for any other foreign key. Delete rules: cascade only for join and progress rows; restrict for evidence (certificates, applications, audit).
- **Orphan-row check before carrying any data over.** FND-01 decides whether any rows move from the existing database; today none are planned. If any do, run `docs/data/orphan-check.mjs` over the **old** schema. It emits one `LEFT JOIN … WHERE child.fk IS NOT NULL AND parent.id IS NULL` count per relation (60 relations on today's schema). Every count must be 0, or the copy script must fix or drop the rows, with the decision logged. Run it again over the new schema (31 relations) after loading. The `migrate deploy` that adds the constraints is the final gate: MariaDB refuses a foreign key over orphan rows.
- **Migrations only, from the baseline on.** `prisma migrate dev` locally, `prisma migrate deploy` in releases. `db push` is banned everywhere except a developer's throwaway database: a CI grep over `package.json` scripts, `scripts/` and docs. Migrations are additive within a release (expand, then contract in the next one), so a rollback is a symlink switch.
- `src/prisma.ts` drops the PlanetScale branch and the KYC `omit`.
- **One schema file, no split folder.** After the strip there is no upstream schema left to keep apart.

### Consequences

- Good: the database enforces integrity; one file to read; CI checks schema-vs-migrations drift; the orphan check makes carried-over data an explicit, logged decision.
- Bad: the baseline is a reset, so nothing in an existing Railway or PlanetScale database comes across without the copy script. Foreign keys make bulk deletes order-sensitive, which hub CSV re-imports must respect: upsert, never delete and re-insert.

### Confirmation

- `prisma validate` and `prisma migrate diff --from-empty --to-schema` on `docs/data/schema.prisma` give 19 tables and 31 `FOREIGN KEY` clauses (checked 27 Nov 2026 with the fork's Prisma 7.4.2).
- CI job: apply all migrations to an empty MariaDB 10.11, then `prisma migrate diff --from-migrations prisma/migrations --to-schema prisma/schema.prisma --exit-code`. Grep fails on `db push` and on `relationMode = "prisma"`.
- Data migration, if any: the orphan-check output is attached to the PR with every count at 0.
