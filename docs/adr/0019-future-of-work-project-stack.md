# ADR-0019: Future of Work project stack

- Status: Accepted
- Date: 2026-11-27
- Deciders: recorded from the integration head for the org tech-stack guide
- Relates to: [ADR-0004](0004-hosting-on-prem-primary-cloud-standby-cdn.md), [ADR-0005](0005-mariadb-prisma-migrations-only.md), [ADR-0006](0006-identity-with-privy-roles-in-sldtp.md), [ADR-0014](0014-pages-router-only.md), [ADR-0017](0017-privy-saas-identity-and-data-residency.md), [architecture diagrams](../architecture/README.md)

## Context and problem statement

The org tech-stack guide asks each project for one short ADR of the stack it actually uses. This is that record for `christex-foundation/future-of-work`, checked on `integration` at `b6c208cf6`.

## Decision outcome

| Item | What integration uses |
| --- | --- |
| Languages | TypeScript 5.8.3 (`typescript` in `package.json`). Deviation from the org guide, which prefers JSDoc: this repository follows the upstream fork, and the code is TypeScript. |
| Node | CI pins Node 22 (`.github/workflows/ci.yml`, `actions/setup-node` `node-version: 22`, both jobs). `package.json` has no `engines` field. `@types/node` is `24.9.2` and does not select the runtime. The planned production runtime is Node 24 on the app VM ([ADR-0004](0004-hosting-on-prem-primary-cloud-standby-cdn.md)). On 27 Nov 2026 Node 24 is Maintenance LTS (since 20 Oct 2026). Active LTS is Node 26. The plan stays Node 24 until ADR-0004 is revised. |
| Package manager | pnpm 10, pinned in CI by `pnpm/action-setup` `version: 10`. Install is `pnpm install --frozen-lockfile`. `vercel.json` uses the same install command. `package.json` has no `packageManager` field. |
| Web | Next.js 16.4.6 (`next`, exact) and React 19.2.4. UI pages are the Pages Router: 91 files under `src/pages`, excluding `src/pages/api`. [ADR-0014](0014-pages-router-only.md) accepts Pages Router for pages and API routes. The head still has 70 App Router handlers under `src/app/api`, plus `src/app/robots.txt/route.ts`, `src/app/.well-known/agent.json/route.ts` and `src/app/sitemap.ts`. There are no App Router pages. The strip deletes `src/app`. |
| Backend | Next.js API routes in this one process. There is no separate service. A new standalone service would default to Hono, and that choice needs its own ADR before the service is added. |
| Lint, format, typecheck | `pnpm lint` runs `oxlint . --quiet`. `pnpm format` runs `oxlint . --fix --quiet && oxfmt --write .`. `pnpm check-types` runs `tsc --noEmit --pretty`. CI runs `pnpm check-types`. It does not run lint or format. |
| Database | Prisma 7.4.2 (`prisma` exact; `@prisma/client` is `^7.4.2`). `prisma/schema.prisma` sets `provider = "mysql"` and `relationMode = "prisma"`. There is no `prisma/migrations` directory. `src/prisma.ts` uses the MariaDB adapter, and the PlanetScale adapter when the URL is PlanetScale. [ADR-0005](0005-mariadb-prisma-migrations-only.md) accepts MariaDB 10.11, one schema file, real foreign keys, and migrations only, from the baseline after the strip. |
| Auth | Privy is the login: `@privy-io/react-auth` in `src/components/providers.tsx`, server checks through `src/features/auth/utils/getPrivyToken.ts`. `loginMethods` is still `['email', 'google']`. [ADR-0006](0006-identity-with-privy-roles-in-sldtp.md) plans email only. `next-auth` 4.24.15 is not the login. Its only provider is Twitter, in `src/pages/api/auth/[...nextauth].ts`, which links an X account onto the Privy user. `SessionProvider` is mounted from `src/pages/_app.tsx`. [ADR-0017](0017-privy-saas-identity-and-data-residency.md) records the SaaS residency risk. |
| Hosting | [ADR-0004](0004-hosting-on-prem-primary-cloud-standby-cdn.md): MoCTI on-prem primary, a cloud warm standby, and CDN plus object storage for public lesson media. That layout is planned. The repo today has `vercel.json` rewrites and GitHub Actions CI. See [deployment](../architecture/deployment.md). |
| Tests | None yet. `package.json` has no test script. There is no Vitest, Jest, or Playwright dependency, and there are no `*.test.ts` or `*.spec.ts` files. |

### Consequences

- Good: one page that matches the tree, with planned rows owned by the ADR that decided them.
- Bad: JSDoc, a test runner, and a second service on Hono are org defaults this fork does not use. Node 24 in ADR-0004 is Maintenance LTS on the date of this record, while Active LTS is Node 26.

### Confirmation

A pull request that changes this stack updates this ADR and the diagrams in `docs/architecture/` in the same pull request.
