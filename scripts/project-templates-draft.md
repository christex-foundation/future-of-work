# Project template drafts — for review

These are draft templates for the empty `BountiesTemplates` table, this time with
`type: 'project'`. A **project** is different from a bounty: instead of everyone
submitting finished work and the best winning, a project is **an ad for hiring a
freelancer** — people *apply* with a proposal/portfolio and the sponsor picks one
person to do the work.

That changes the brief. Real Superteam Earn projects read like a job ad + scope of
work, not a contest spec. So instead of *Overview → Requirements → Judging
Criteria*, these use:

**Overview → Scope of Work (+ what's out of scope) → Requirements
(must-have / nice-to-have) → Selection Criteria (how we choose) + suggested
application questions.**

Other project-specific fields (grounded in how Earn's real projects are stored):

- `type: 'project'`, `applicationType: 'rolling'` (applications come in over time,
  no single submission deadline).
- `timeToComplete` set (e.g. "4 to 6 Weeks", "Ongoing").
- `compensationType` varies per template — `range` (min/max, applicant quotes into
  the bracket) or `variable` (applicant proposes their own price). Reward bands are
  grounded in Superteam's own sponsor rate hints (~$500–$3,000) and a real project
  example (RZLT, $1,000–$3,000 USDC range).
- The `BountiesTemplates` table has **no** column for application questions
  (`eligibility` lives on real listings, not the template), so the suggested
  questions below are written into the brief body under "How to apply" — they carry
  into the editor and the sponsor turns them into real application questions.

Review the content here first. Once you approve, I'll write a seed script (a
sibling to `seed-bounty-templates.mjs`) that inserts these rows, and you run it
against the right database. Nothing is in the DB yet.

---

## 1. Website / web app build 💻  (`compensationType: range`, color `#D2DCE6`)

- **Skills:** Frontend, Backend
- **Suggested compensation:** range **2,000 – 4,000 USDC** (applicant quotes inside it)
- **Time to complete:** 4 to 6 Weeks

### Overview
We're hiring a developer to build [the website / web app] for [company]. Tell
applicants what it's for, who uses it, and what success looks like once it's live.
Say whether this is greenfield or building on something existing, link any designs,
brand assets, or reference sites you like, and name the stack or hosting you need to
work within.

### Scope of Work
What we expect delivered:
- A working, deployed [site / app] that covers the core features listed above.
- Responsive layouts that hold up on mobile, tablet, and desktop.
- The source in a repo we own, with setup/deploy instructions so we can run it.
- A short handoff — how it's structured and how to make basic edits.
- Two rounds of revisions on the agreed scope.

Out of scope (unless we agree otherwise in writing): ongoing maintenance after
handoff, content/copywriting, logo or brand design, and a third revision round.

### Requirements
Must have:
- A portfolio of shipped sites/apps similar to this one (links, not just a CV).
- Solid command of [the stack, e.g. React / Next.js + a backend].
- Able to work to the milestones and timeline you propose.

Nice to have:
- Experience with [our CMS / payments / auth / integration].
- An eye for design and accessibility, not just the code.

### Selection Criteria
We'll choose based on:
- **Relevant work** — past projects close to this one, and whether they're actually
  live.
- **Proposed approach** — a clear, sensible plan and milestone breakdown for *this*
  brief, not a generic pitch.
- **Fit & communication** — how well the proposal reads the brief and how clearly
  they communicate.
- **Value** — a realistic quote and timeline for the scope, not just the cheapest.

**How to apply** (suggested questions — turn these into application questions):
- Share 2–3 links to similar sites/apps you've built.
- How would you approach this build, and what milestones would you set?
- What's your quote and realistic timeline for the scope above?

---

## 2. Brand identity & design system 🎨  (`compensationType: range`, color `#E7DFC9`)

- **Skills:** Design
- **Suggested compensation:** range **800 – 2,500 USDC**
- **Time to complete:** 3 to 4 Weeks

### Overview
We're hiring a designer to create the brand identity for [company/product]. Tell
applicants who we are, the feeling the brand should carry, and where it shows up
most (app, signage, social, print). Share any colours, references, or existing
assets to work from, and say how open you are on direction.

### Scope of Work
What we expect delivered:
- A primary logo plus a simplified/secondary mark that reads at small sizes.
- A colour palette and typography system.
- A short brand guidelines sheet (how to use the logo, colours, and type).
- The logo shown in context (e.g. app icon + one real-world mockup).
- Final files in SVG and PNG, light and dark, packaged for handoff.
- Two rounds of revisions on the chosen direction.

Out of scope (unless agreed in writing): a full website or marketing collateral,
motion/animation, packaging design, and a third revision round.

### Requirements
Must have:
- A portfolio showing brand/identity work with a clear point of view.
- Proficiency in [Figma / Illustrator] and clean, dev-ready handoff.
- Original work — no AI-generated or recycled logos.

Nice to have:
- Experience designing for [our industry / web3 / early-stage products].
- Comfort presenting and defending creative choices.

### Selection Criteria
We'll choose based on:
- **Portfolio fit** — does their aesthetic and range suit what we're after?
- **Originality** — distinctive thinking, not template work.
- **Process** — a clear sense of how they'll get from brief to final system.
- **Communication & value** — how well they read the brief and a fair quote.

**How to apply** (suggested questions):
- Share your portfolio, with 2–3 identity projects most like this one.
- How would you approach our brand, given the direction above?
- What's your quote and timeline for the deliverables listed?

---

## 3. Content & social media management 📣  (`compensationType: variable`, color `#D9E2D0`)

- **Skills:** Content, Community
- **Suggested compensation:** variable — applicant proposes a monthly rate
- **Time to complete:** Ongoing

### Overview
We're hiring someone to run [company]'s content and social channels. Tell
applicants what we do, who we're trying to reach, which platforms matter most (e.g.
X, LinkedIn, Discord, Telegram), and what we want more of — reach, signups,
community activity. Link our existing channels so they can see where we are today.

### Scope of Work
What we expect each month:
- A simple content calendar agreed with us ahead of time.
- [N] posts per week across [the platforms], written and scheduled.
- Light community management — replying, moderating, and flagging what needs us.
- A short monthly report on what went out and how it performed.

Out of scope (unless agreed in writing): paid ad budget and spend management, long-
form articles or video production, and brand/visual design beyond simple post
graphics.

### Requirements
Must have:
- A track record running social or community accounts, with examples we can see.
- Strong, clear writing in [language] and a feel for our audience's tone.
- Hands-on familiarity with [the platforms we use].

Nice to have:
- Experience growing a [web3 / startup] community.
- Comfort reading basic analytics and adjusting from them.

### Selection Criteria
We'll choose based on:
- **Relevant experience** — accounts or communities they've actually grown.
- **Voice** — does their writing fit how we want to sound?
- **Plan** — a sensible first-month plan for our channels.
- **Value** — a monthly rate that matches the scope.

**How to apply** (suggested questions):
- Share 2–3 accounts or communities you've managed or grown.
- What would your first month with our channels look like?
- What's your proposed monthly rate?

---

## 4. Growth / marketing campaign 🚀  (`compensationType: range`, color `#F2D9C4`)

- **Skills:** Growth, Marketing
- **Suggested compensation:** range **1,000 – 3,000 USDC**
- **Time to complete:** 6 to 8 Weeks

### Overview
We're hiring a marketer to plan and run a campaign for [product/launch]. Tell
applicants the one goal that matters most (signups, waitlist, downloads, awareness),
who we're targeting, the channels open to us, and any budget or brand guardrails.
Link anything that shows where we are today.

### Scope of Work
What we expect delivered:
- A short audit of where we stand and the gaps worth chasing.
- A campaign plan with channels, a timeline, and clear targets.
- Execution of the plan over the engagement — running the channels and assets agreed.
- A wrap-up report against the targets, with what to do next.

Out of scope (unless agreed in writing): ad spend/media budget (separate from the
fee), long-term retainer work beyond the campaign, and producing major creative
assets (video, full site) unless scoped in.

### Requirements
Must have:
- A track record of campaigns with results you can point to.
- Specialisation in [the channel that matters most — e.g. SEO, paid social, growth].
- Able to work to the timeline and targets you set.

Nice to have:
- Experience marketing [our kind of product / to our audience].
- Comfort with analytics and reporting on what worked.

### Selection Criteria
We'll choose based on:
- **Results** — past campaigns and the outcomes they drove.
- **Plan** — a focused approach to *our* goal, not a generic deck.
- **Fit** — relevance to our product, audience, and channels.
- **Value** — a realistic quote and timeline for the scope.

**How to apply** (suggested questions):
- Share 2–3 campaigns you've run and the results.
- How would you approach our goal over the engagement?
- What's your quote and timeline for the scope above?

---

## Notes for the seed script (after approval)

- `type: 'project'`, `applicationType: 'rolling'`, `status: 'OPEN'`, `token: 'USDC'`,
  `language: 'eng'`, `region: 'Global'`, `source: 'NATIVE'`, `isActive: true`.
- `compensationType` per template: `range` → set `minRewardAsk`/`maxRewardAsk`, leave
  `rewardAmount`/`rewards` null; `variable` → all reward fields null.
- `timeToComplete` set per template ("4 to 6 Weeks", "3 to 4 Weeks", "Ongoing",
  "6 to 8 Weeks").
- `description` stored as HTML with four sections:
  `<h2>Overview</h2>…<h2>Scope of Work</h2>…<h2>Requirements</h2>…<h2>Selection Criteria</h2>…`
  (the brief checklist still recognises Overview / Requirements / Criteria).
- Reuse the same sponsor + poc foreign-key resolution as `seed-bounty-templates.mjs`,
  and keep it idempotent on `slug`.
- The `BountiesTemplates` table has no `eligibility` column, so the suggested
  application questions live inside the brief body (under "How to apply"); sponsors
  convert them into real application questions in the builder.
