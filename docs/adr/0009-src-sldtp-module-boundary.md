# ADR-0009: All product code in `src/sldtp/`, split by domain module

- Status: Accepted (the rule). Proposed: the module list and dependency rules.
- Date: 2026-11-27
- Deciders: David Ogoo (Christex), CTO, SLDTP tech lead
- Supersedes / relates to: engineering-plan ADR-005 (namespace part); CTO fork-sync-strategy §7.1

## Context and problem statement

The CTO's rule puts new code in `src/sldtp/` to avoid upstream conflicts. After the allowlist strip, that motive mostly disappears, but a clear home for product code, separate from the kept UI kit, is still useful.

## Decision drivers

- A newcomer finds any feature in one place
- No module reaches into another's tables
- No speculative layers

## Considered options

1. Keep upstream's `src/features/*` layout
2. `src/sldtp/<module>/` with a small public `index.ts` per module (chosen)
3. Hexagonal/clean-architecture layers (ports, adapters, use cases)

## Decision outcome

Option 2. Modules: `auth`, `learning`, `jobs`, `skills`, `hubs`, `admin`, `platform` (db, env, mail, audit, i18n, media paths). Each module holds its own Prisma queries, zod schemas, React components and tests. Pages (`src/pages/**`) and API routes (`src/pages/api/**`) are thin and call module functions. `platform` imports no other module; other modules import each other only through `index.ts`. No repository/service/controller layers: a module function that calls Prisma is the abstraction.

### Consequences

- Good: one obvious place for code; simple dependency rule an oxlint import rule or a 20-line CI script can check.
- Bad: `src/pages` still has to exist (the router requires it), so each feature touches two folders.

### Confirmation

A CI script fails on imports into another module's internals or from `platform` to a domain module.
