# Upstream leverage review

**Decision:** D1 option (b). No merge of upstream. Approved by David Ogoo, 27 November 2026. See [the fork strategy](fork-and-upstream-sync.md).
**Range:** `SuperteamDAO/earn` `4b9492b9d` (8 Jun 2026) .. `6544345c2` (25 Nov 2026). **267 commits**, which roll up to **95 first-parent changes** (PR merges and direct pushes). This review uses the 95 as the unit. Each merge was checked down to the files it touches on our `main` (`97bfeeb8e`, the Daybreak line).
**Classifier run the same day**, with the committed ledger (nothing deleted yet): 6 SECURITY, 41 BUGFIX-KEPT, 37 FEATURE-KEPT, 11 IRRELEVANT.

Hours below are a rough port for someone who already knows the file: read the upstream diff, re-apply it on our tree, and add a test for a security port. They are not a schedule. "Daybreak" means the change touches a path in the 36-file conflict set in the strategy, section 1.1. Those cherry-picks will not apply cleanly. Re-implement them.

The tech lead decides every feature and every bugfix. A SECURITY row on code we still ship is must-do: port it, or record `not-affected` with a reason, the same week.

## (a) Security fixes to port now

These are the six classifier hits, plus nearby fixes the regex called a bugfix that are the same kind of work (ownership, field exposure, request validation). None of the must-do rows sit on a Daybreak conflict path except where the table says so.

| Fix | Upstream | Paths on our `main` | Daybreak | Hours | Recommendation |
| --- | --- | --- | --- | --- | --- |
| Scout listing query | [#1408](https://github.com/SuperteamDAO/earn/pull/1408) [`e6fe9aad3`](https://github.com/SuperteamDAO/earn/commit/e6fe9aad3) | `src/app/api/sponsor-dashboard/listing/[id]/scout/route.ts` | No | 2 | **Port now.** The file exists and our copy does not contain the fix. |
| Rich-text checks, region check, rate limits on submissions and reports | [#1410](https://github.com/SuperteamDAO/earn/pull/1410) [`5582208bd`](https://github.com/SuperteamDAO/earn/commit/5582208bd) | Keep: `src/pages/api/submission/create.ts`, `src/pages/api/submission/update.ts`, `src/app/api/report-listing/route.ts`, `src/features/listing-builder/utils/listingValidator.ts`, `src/lib/ratelimit.ts`. Grant routes and `sanitizeGrantApplicationHtml.ts` are new on their side | No | 6 | **Port the kept files now.** Skip the grant-only files if strip B is about to delete them. Do not cherry-pick the whole merge. |
| Rate limit on user creation | [#1416](https://github.com/SuperteamDAO/earn/pull/1416) [`7afe54e56`](https://github.com/SuperteamDAO/earn/commit/7afe54e56) | `src/lib/ratelimit.ts`, `src/pages/api/user/create.ts` | No | 2 | **Port now.** Our `user/create` has no rate limit. Do this in the same PR as #1544. |
| Token-icon fetch hardening in the same PR | same | `src/pages/api/token-icon.ts` (274 lines on our side; their version shrinks it) | No | 2 | **Port only while the route still ships.** Strip A deletes it. If the strip lands first, skip. |
| Payment replay check | [#1446](https://github.com/SuperteamDAO/earn/pull/1446) [`7c6d87789`](https://github.com/SuperteamDAO/earn/commit/7c6d87789) | `src/pages/api/sponsor-dashboard/grants/add-tranche.ts`, `src/pages/api/sponsor-dashboard/listings/verify-external-payment.ts`, `src/pages/api/sponsor-dashboard/submission/add-payment.ts`. `paymentReplayCheck.ts` is not in our tree. `verify-external-payment.ts` has a comment about replay and not the helper | No | 4 | **Port now if those payment routes are still live.** Strip A removes them. Do not delay the strip in order to keep the routes. |
| Email-validator rate limit | [`af39bd178`](https://github.com/SuperteamDAO/earn/commit/af39bd178) | `src/lib/ratelimit.ts`, `src/pages/api/email/validate.ts`, `src/pages/api/email/webhook/index.ts`. `src/lib/zerobounce.ts` would be new. We have no ZeroBounce dependency | No | 3 | **Port the rate limit now.** Skip the ZeroBounce client unless we already have that vendor. Do not add an account or a secret in the port. |
| `nosniff` and `Referrer-Policy` | [#1465](https://github.com/SuperteamDAO/earn/pull/1465) [`7faae4948`](https://github.com/SuperteamDAO/earn/commit/7faae4948) | `next.config.ts` | No. The file is a seam, and it is not one of the 36 | 2 | **Port the net patch:** those two headers. The PR added HSTS and `Permissions-Policy`, then the last commit on the branch removed both. Upstream dropped HSTS because Vercel already sends it. MoCTI is not Vercel, so add HSTS in our header work rather than copying that removal. Do not set `camera=()` while Sumsub is still embedded (strip C). |
| Image-delete ownership | [#1450](https://github.com/SuperteamDAO/earn/pull/1450) [`d8c1806e9`](https://github.com/SuperteamDAO/earn/commit/d8c1806e9) | `src/app/api/image/delete/route.ts` and the upload helpers beside it. Daybreak did not edit this file. Upstream's version is about 150 lines different | No | 4 | **Port now.** Our pre-fork checks are not their fix. |
| Cloudinary URL allowlist | [#1520](https://github.com/SuperteamDAO/earn/pull/1520) [`082cb9a58`](https://github.com/SuperteamDAO/earn/commit/082cb9a58) | `src/utils/cloudinary.ts` | No | 2 | **Port now.** Rejects delivery URLs that are not `https://res.cloudinary.com/...`. |
| Gated passive OG update, plus a rate limit | [#1461](https://github.com/SuperteamDAO/earn/pull/1461) [`1eb8d298c`](https://github.com/SuperteamDAO/earn/commit/1eb8d298c) | `src/app/api/og/update/route.ts`, `src/lib/ratelimit.ts`, `src/queries/og.ts` | No | 3 | **Port now.** |
| Comment body validation, and set `authorId` | [#1469](https://github.com/SuperteamDAO/earn/pull/1469) [`145e78afe`](https://github.com/SuperteamDAO/earn/commit/145e78afe), [`17f6839dc`](https://github.com/SuperteamDAO/earn/commit/17f6839dc) | `src/pages/api/comment/create.ts` | No | 2 | **Port now,** both commits, one PR. |
| Block disposable emails on signup | [#1544](https://github.com/SuperteamDAO/earn/pull/1544) [`6544345c2`](https://github.com/SuperteamDAO/earn/commit/6544345c2) | New `src/features/auth/utils/disposableEmail.ts`. Also `getUserSession.ts`, `withAuth.ts`, `src/pages/api/user/create.ts`, `src/pages/api/email/validate.ts` | Auth seam, not in the 36 | 3 | **Port now,** with the #1416 rate limit. |
| Cap search and list queries | [#1447](https://github.com/SuperteamDAO/earn/pull/1447) [`496fc917a`](https://github.com/SuperteamDAO/earn/commit/496fc917a) | 14 of 15 files still exist, including listing and sponsor-dashboard queries | No | 3 | **Port now.** Stops unbounded list endpoints. |
| Restrict fields on the public listing read | [#1455](https://github.com/SuperteamDAO/earn/pull/1455) [`b6c9b2b0a`](https://github.com/SuperteamDAO/earn/commit/b6c9b2b0a) | `src/pages/api/listings/details/[slug].ts`, `src/features/listings/types/index.ts`, listing layout | No | 4 | **Port now.** A jobs board should not return the full row. |
| Generic API error strings | [#1489](https://github.com/SuperteamDAO/earn/pull/1489) [`ac53397a5`](https://github.com/SuperteamDAO/earn/commit/ac53397a5) | 96 files. The only Daybreak conflict path is `src/pages/api/sponsors/create.ts` | That one file | 6 | **Port the pattern on routes we keep.** Hand-edit `sponsors/create.ts`. Skip grant, wallet, and hackathon routes if the strip deletes them first. Do not cherry-pick all 96. |
| Restricted sponsor and template responses | [#1486](https://github.com/SuperteamDAO/earn/pull/1486) [`6293af206`](https://github.com/SuperteamDAO/earn/commit/6293af206), [#1487](https://github.com/SuperteamDAO/earn/pull/1487) [`34cbbf5ef`](https://github.com/SuperteamDAO/earn/commit/34cbbf5ef), [#1488](https://github.com/SuperteamDAO/earn/pull/1488) [`93664e649`](https://github.com/SuperteamDAO/earn/commit/93664e649) | Template route, sponsor grant routes, submission create/update, `src/pages/earn/new/index.tsx` | `src/pages/earn/new/index.tsx` is in the 36 | 6 | **Port submission and template selects now.** Grant selects wait on strip B. Hand-port anything in `earn/new`. |

Rough total if we port every row that still ships: about **45 hours**. The strip-bound rows (token icon, payment replay, grant selects, grant HTML) are about **12 hours** of that and should be dropped when the strip deletes the file.

## (b) Features and bugfixes worth leveraging

For an LMS and a jobs platform. Hackathons, world-cup and crypto-fair banners, agents, token whitelists, credit months, and wallet CSV export are not in this list. They are irrelevant or they die in the strip.

| Item | Upstream | Why it might serve SLDTP | Daybreak | Hours | Recommendation |
| --- | --- | --- | --- | --- | --- |
| Listing slugs: false "already exists" check, slugify, strip pipe characters | [#1418](https://github.com/SuperteamDAO/earn/pull/1418) [`bb1f24205`](https://github.com/SuperteamDAO/earn/commit/bb1f24205), [`78e1bb677`](https://github.com/SuperteamDAO/earn/commit/78e1bb677), [`cb8c5b76c`](https://github.com/SuperteamDAO/earn/commit/cb8c5b76c) | Job and course URLs. The pipe and slugify edits are in `TitleAndType.tsx` | **Yes.** `src/features/listing-builder/components/Form/TitleAndType.tsx` | 3 | **Tech lead: port by hand.** Do not cherry-pick. The #1418 slug component is not in the 36. |
| Rich-editor click target | [#1407](https://github.com/SuperteamDAO/earn/pull/1407) [`3d93374af`](https://github.com/SuperteamDAO/earn/commit/3d93374af) | One file. Descriptions for jobs and courses use this editor | No | 1 | **Tech lead: port.** Small, and we keep the editor. |
| Listing preview renders | [#1473](https://github.com/SuperteamDAO/earn/pull/1473) [`145486ca2`](https://github.com/SuperteamDAO/earn/commit/145486ca2) | Preview before publish. Useful for employers | **Yes** for `ListingTable.tsx`, which Daybreak deleted. The page and `details/[slug]` API are not in the 36 | 3 | **Port the API and the listing page.** Do not restore `ListingTable.tsx`. |
| Preview Open Graph image | [#1485](https://github.com/SuperteamDAO/earn/pull/1485) [`7e787329b`](https://github.com/SuperteamDAO/earn/commit/7e787329b) | Share cards for a job or course | No | 2 | **Tech lead: port** if public sharing is in the first release. |
| Cache headers on public pages | [#1346](https://github.com/SuperteamDAO/earn/pull/1346) [`eea1a88e8`](https://github.com/SuperteamDAO/earn/commit/eea1a88e8) | Perf on listing and search pages. 21 files. The subject is perf, not a security fix, even though the classifier can over-call it | **Yes:** `src/pages/index.tsx`, `src/pages/member-perks.tsx` | 4 | **Hand-port headers onto job and listing pages we keep.** Skip hackathon pages. Do not cherry-pick. |
| Home feed no longer collapses non-chapter locations to Global | [#1477](https://github.com/SuperteamDAO/earn/pull/1477) [`ce0baa797`](https://github.com/SuperteamDAO/earn/commit/ce0baa797) | `src/utils/chapterRegion.ts`, six lines. Matters if hubs reuse regions | No | 1 | **Tech lead: port only if hubs use this helper.** Skip if strip B deletes chapters and nothing replaces the helper. |
| OFAC / sanctioned-country block on sponsor location | [`b7968643a`](https://github.com/SuperteamDAO/earn/commit/b7968643a) | Employer signup. Relevant if we take a country at all | **Yes.** Schema, `sponsorFormSchema.ts`, `sponsors/create.ts`, and three earn pages. This is the `Sponsors.location` field fighting our `Sponsors.socials` | 6 | **Do not cherry-pick.** Tech lead can later take the country blocklist only, without taking their `location` column. Not this week. |
| Application preview before submit | [#1426](https://github.com/SuperteamDAO/earn/pull/1426) [`960c84ded`](https://github.com/SuperteamDAO/earn/commit/960c84ded) | The behaviour is right for job applications. The code is a 300-line grant modal | No, and the file is grant UI | 0 | **Skip the patch.** Copy the idea when applications are built in `src/sldtp/`. |
| AI review of grant applications | [`dff0ec88f`](https://github.com/SuperteamDAO/earn/commit/dff0ec88f), [`4b1524072`](https://github.com/SuperteamDAO/earn/commit/4b1524072) | Employer review might want this later. The UI is grant-specific | **Yes.** `AiReview.tsx`, `ApplicationDetails.tsx`, `Notes.tsx` | 0 | **Skip.** Daybreak already rewrote those screens. Rebuild the idea inside `src/sldtp/employer/` if the tech lead wants it. |
| Email campaign models | [`b9e27db3a`](https://github.com/SuperteamDAO/earn/commit/b9e27db3a) | Schema only, 52 lines. It is a Superteam campaign, not learner notifications | **Yes,** `prisma/schema.prisma` | 0 | **Skip.** Notifications for an LMS should be our models. |
| Activity-feed layout | [`226f0fe34`](https://github.com/SuperteamDAO/earn/commit/226f0fe34), [`8b25fd71f`](https://github.com/SuperteamDAO/earn/commit/8b25fd71f) | Cosmetic | **Yes.** `Feed.tsx`, `src/layouts/Feed.tsx`, and the lockfile | 0 | **Skip.** |
| `cn` package instead of `clsx` + `tailwind-merge` | [`f48e297a8`](https://github.com/SuperteamDAO/earn/commit/f48e297a8) | Upstream called it perf. Our `src/utils/cn.ts` already wraps the two libraries, and about 240 files import it | Lockfile | 3 | **Not now.** Optional after the Next upgrade, and only by editing `cn.ts` and `package.json`. Do not cherry-pick. |
| Lockfile pin and a CI check that the lockfile matches pnpm | [`d8a21757a`](https://github.com/SuperteamDAO/earn/commit/d8a21757a) | Stops a bad lockfile. Their workflow also posts nothing external, unlike `schema-sync-notify` | Lockfile, and they edit `README.md` | 2 | **Tech lead: adapt the check.** Do not take their README or their lockfile. `schema-sync-notify.yml` stays on the deletion list. |

## (c) Dependencies we will move ourselves

Current `main` versus upstream `6544345c2`:

| Package | Our `main` | Upstream | Target | Hours | Recommendation |
| --- | --- | --- | --- | --- | --- |
| `next` | 16.2.1 | 16.3.8, inside [`6ce3fa6fc`](https://github.com/SuperteamDAO/earn/commit/6ce3fa6fc) | **>= 16.4.5.** 16.4.6 was current when the strategy was checked the same day. Pin the current 16.4.x when the PR opens | 8 | **Our PR.** 16.3.8 is still inside GHSA-2464-fhr4-w9xw and GHSA-7qx7-33qx-rqx2. Do not cherry-pick `6ce3fa6fc`: 45 files, including `src/pages/_app.tsx`, `src/pages/index.tsx`, `src/pages/earn/index.tsx`, `ListingsSection.tsx`, and a deleted home banner. Smoke the home page, a listing, and sign-in. |
| `react`, `react-dom` | 19.2.4 | 19.3.0, same commit | Stay on 19.2.4 unless 16.4.x requires 19.3 | 2, inside the Next PR | **Not worth a separate upgrade.** Take 19.3.0 only as a peer of the Next PR. |
| `typescript` | 5.8.3 | 7.0.2, same commit | Stay on 5.8.3 | 8–16 later, not now | **Not now.** It is a major, bundled into a Daybreak-conflicting commit. Revisit after Next 16.4.x is green. |
| `sharp` | not a direct dependency | `^0.34.5` | **>= 0.35.5**, from the strategy | 1 | **Our pin.** Upstream's version is below the target. Do not take theirs. |
| `prisma`, `@prisma/client` | 7.4.2 | 7.4.2 | No change | 0 | **Nothing to port.** |
| `clsx`, `tailwind-merge` | present | removed, replaced by `cn` ^0.4.0 | Keep ours until a deliberate `cn.ts` change | 0 now | **Skip.** See section (b). |
| `mariadb` adapter | already on `main` since `3da3094d2` | not how upstream runs | Keep | 0 | **Already ours.** |

## What not to port

Of the 95 first-parent changes, leave these alone:

- Hackathon launches and hide-hackathon toggles (#1412, #1413, #1414, #1417, #1433, #1451, #1497, #1500, #1504, #1509, #1512, and the button hover).
- Agents, skill docs, and agent banners (`f8aabab17`, #1501, #1543).
- Tokens, mints, and whitelists (#1406, #1452, #1466, #1521).
- Credits (#1475), winner endpoints tied to payouts (#1453), and wallet CSV export (`7ebcdb7e7`).
- Schema-only Superteam fields (several `update schema` commits, email-campaign models) unless a specific port needs one column. We write our own migrations.
- Terms of use and privacy copy (`a0c60918c`). That text is Superteam's.
- The framework commit `6ce3fa6fc`, as a commit. Take a newer Next ourselves.

## Daybreak, in one paragraph

A merge of `6544345c2` into this `main` conflicts in 36 paths. D1 refuses that merge. The security ports in section (a) were checked against that list: they do not land on those paths, except generic errors on `sponsors/create.ts` and the sponsor-endpoint series on `earn/new`. The ports that do fight Daybreak are the ones section (b) tells the tech lead to skip or to rewrite: sanctioned-country location versus `Sponsors.socials`, the home listing filter's neighbours, AI review, the activity feed, cache headers on `src/pages/index.tsx` and `member-perks.tsx`, and the Next 16.3.8 commit.
