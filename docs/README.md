# SLDTP platform documentation

Skills-to-jobs platform for MoCTI Sierra Leone, on the `christex-foundation/future-of-work` Next.js fork (AGPL-3.0). Checked against `integration` at `b6c208cf6` on 27 Nov 2026.

## Start here

| Document | What it answers |
| --- | --- |
| [architecture/README.md](architecture/README.md) | Diagrams. Update them in the same PR as any architectural change. |
| [architecture/system-context.md](architecture/system-context.md) | People and external systems, current and planned |
| [architecture/components.md](architecture/components.md) | Processes and `src/sldtp/` modules |
| [architecture/data-flow.md](architecture/data-flow.md) | Login, offline sync, domain model, API |
| [architecture/deployment.md](architecture/deployment.md) | Where it runs today, and the on-prem plan |
| [strip-map.md](strip-map.md) | Allowlist strip from Superteam Earn to the SLDTP base |
| [strip/](strip/) | `allowlist.txt`, `check-strip.mjs`, and the checker output from `97bfeeb8e`. Docs tooling only. Not a CI job. |
| [data-model-final.md](data-model-final.md) | The 19-table model |
| [data/](data/) | `schema.prisma`, `inclusion-view.sql`, `orphan-check.mjs` |
| [yagni-cuts.md](yagni-cuts.md) | Agreed hour cuts. ToR and bid requirements stay. |
| [adr/](adr/) | Architecture decision records |
| [fork-and-upstream-sync.md](fork-and-upstream-sync.md) | Fork strategy from ADR-0002 |

## Architecture decision records

| ADR | Title | Status |
| --- | --- | --- |
| [0001](adr/0001-record-architecture-decisions.md) | Record architecture decisions | Accepted |
| [0002](adr/0002-fork-code-rules.md) | Fork code rules | Accepted. Amended by ADR-0018 |
| [0003](adr/0003-nextjs-fork-is-the-whole-platform.md) | The Next.js fork is the whole platform | Accepted. G1 pending |
| [0004](adr/0004-hosting-on-prem-primary-cloud-standby-cdn.md) | On-prem primary, cloud standby, CDN for lesson media | Accepted |
| [0005](adr/0005-mariadb-prisma-migrations-only.md) | MariaDB 10.11, migrations only, real foreign keys | Accepted |
| [0006](adr/0006-identity-with-privy-roles-in-sldtp.md) | Privy for identity, roles in our code | Accepted. Step-up depends on the week-1 spike |
| [0007](adr/0007-delete-not-flag-allowlist-strip.md) | Delete, don't flag. Allowlist plus a reachability check | Accepted |
| [0008](adr/0008-no-upstream-merge-weekly-triage.md) | No upstream merge. Weekly triage | Accepted |
| [0009](adr/0009-src-sldtp-module-boundary.md) | Product code in `src/sldtp/` | Accepted. Module list proposed |
| [0010](adr/0010-build-jobs-module-fresh.md) | Build jobs fresh. Rules-based matching | Proposed |
| [0011](adr/0011-offline-learning-service-worker.md) | Offline learning with Serwist and an idb-keyval outbox | Accepted |
| [0012](adr/0012-i18n-next-intl.md) | next-intl, English and Krio, no locale in the URL | Accepted. Locale routing proposed off |
| [0013](adr/0013-no-queue-no-redis.md) | No queue, no Redis | Accepted |
| [0014](adr/0014-pages-router-only.md) | Pages Router only | Accepted |
| [0015](adr/0015-content-and-text-as-markdown.md) | Markdown and textareas | Proposed |
| [0016](adr/0016-privacy-audit-and-data-residency.md) | Consent, audit log, named exceptions | Proposed |
| [0017](adr/0017-privy-saas-identity-and-data-residency.md) | Privy holds learner identity outside the data centre | Proposed |
| [0018](adr/0018-amend-0002-lighter-fork-tooling-advisories-always-checked.md) | Amend ADR-0002. Advisories always checked | Accepted |
| [0019](adr/0019-future-of-work-project-stack.md) | Future of Work project stack | Accepted |
| [0020](adr/0020-journey-tests-and-thin-vitest.md) | Journey tests and a thin Vitest layer | Accepted |

The draft ADR-0018 was not copied. The copy already in this repository is the one that applies. Numbers are unique: 0001 through 0020, with no gap and no duplicate.

### Reconciliation with the 15 ADRs planned in `engineering-plan.md` §10

| Plan ADR | Now |
| --- | --- |
| 001 Single Next.js platform, Moodle as contingency | ADR-0003 |
| 002 Fork policy | ADR-0002 for code rules, ADR-0008 for no-merge |
| 003 Session and auth | ADR-0006 and ADR-0017 |
| 004 Hosting | ADR-0004 |
| 005 Data model and `src/sldtp/` | ADR-0005 and ADR-0009 |
| 006 Content and video | Media in ADR-0004, content format in ADR-0015 |
| 007 Assessment | Dropped as its own ADR. Scoring is in ADR-0011 and [data-flow](architecture/data-flow.md) |
| 008 Certificates | Dropped as its own ADR. A library choice, recorded with the data model |
| 009 Languages | ADR-0012 |
| 010 Offline | ADR-0011 |
| 011 Accessibility | Process, not an ADR |
| 012 Mail, no queue | ADR-0013 |
| 013 Licensing | Merged into ADR-0008 |
| 014 Matching | Merged into ADR-0010 |
| 015 Privacy | ADR-0016 |
| (new) | ADR-0007, ADR-0014, ADR-0018, ADR-0019 |

## Diagrams

Diagrams are Mermaid in the architecture documents, so GitHub renders them in the pull request that changes them. The rule is in [architecture/README.md](architecture/README.md).
