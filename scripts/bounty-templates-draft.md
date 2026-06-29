# Bounty template drafts — for review

These are draft templates for the empty `BountiesTemplates` table. Each is written
in the three-section structure the builder now guides toward: **Overview →
Requirements → Judging Criteria**. Reward shapes are grounded in real Superteam
Earn listings and are starting points — sponsors edit everything after applying.

Review the content here first. Once you approve, I'll write a seed script that
inserts these rows and you run it against the right database. Nothing is in the
DB yet.

Fields per template: `title`, `emoji`, `color`, `type` (all `bounty`), `token`
(`USDC`), suggested `skills`, suggested reward, and the `description` body (the
HTML that fills the editor — shown here as the three sections).

---

## 1. Short-form video 🎬  (color `#F2D9C4`)

- **Skills:** Content, Design, Community
- **Suggested reward:** 1,000 USDC — 1st 500 / 2nd 300 / 3rd 200

### Overview
We want a short, engaging video that explains what [your product] does and why it
matters for everyday users. Give creators the full picture: the problem you solve,
how the product works, who it's for, and the one thing you most want people to
remember. Drop your brand assets, logos, and any product screenshots at the bottom
of this brief so creators have what they need.

Keep it practical and easy to follow. The best videos make a stranger understand
your product in under a minute.

### Requirements
A submission must:
- Be an original video — no reused or stock footage passed off as your own.
- Be posted publicly. Specify where: e.g. X, Instagram, and TikTok.
- Tag [your handle] and any partner accounts on every platform you post to.
- If posting across platforms, link the other posts inside one X thread so it's
  all in one place.
- Be in [language, e.g. English].
- Be submitted with the public link(s) to the post — not a private upload.

### Judging Criteria
Entries are scored on:
- **Creativity & originality** — how fresh and inventive the concept is.
- **Clarity** — is the message easy to understand and memorable?
- **Product representation** — how well it explains or showcases [your product].
- **Completeness** — does it cover the points asked for in the overview?
- **Engagement** — does it hold attention and make people want to share?
- **Production quality** — editing, visuals, and audio.

---

## 2. Brand & logo design 🎨  (color `#E7DFC9`)

- **Skills:** Design
- **Suggested reward:** 800 USDC — 1st 500 / 2nd 200 / 3rd 100

### Overview
We need a logo and the basic brand pieces for [company/product]. Tell us who we
are, the feeling we want the mark to carry, and where it'll show up most (app icon,
signage, social). Share any colours, references, or existing assets you want us to
work from. If you're open on direction, say so — we'd rather see a strong point of
view than a safe one.

### Requirements
A submission must include:
- An original, ownable mark — no AI-generated or recycled logos.
- A primary logo plus a simplified version that still reads at small sizes.
- The logo shown in context (e.g. an app icon and one real-world mockup).
- Files in SVG and PNG, in both light and dark versions.
- A short one-page sheet showing the colours and fonts used.

### Judging Criteria
Entries are scored on:
- **Originality** — a distinctive mark, not a template.
- **Fit** — how well it matches who we are and how we want to come across.
- **Versatility** — does it hold up small, large, light, and dark?
- **Craft** — quality of the execution and the supporting files.
- **Clarity of system** — is it easy for us to actually use day to day?

---

## 3. Written content / article ✍️  (color `#D9E2D0`)

- **Skills:** Content, Writing
- **Suggested reward:** 750 USDC — 1st 400 / 2nd 250 / 3rd 100

### Overview
Write an article on [topic] for our audience. We want an original take backed by
real examples, not a generic explainer. Tell creators who the reader is, what they
should walk away understanding, and any angle or sources you want included. Point to
anything they should read first so the piece builds on what we've already said.

### Requirements
A submission must:
- Be original work — no AI filler and no plagiarism (over 15% similarity is
  disqualified).
- Be [length, e.g. 800–1,200 words] in a clear, plain tone.
- Include a title, a one-line summary, and an image idea.
- Cite or link any data and examples it references.
- Be posted publicly where specified (e.g. a personal blog, Substack, or Medium)
  and submitted as a public link.
- Be in [language, e.g. English].

### Judging Criteria
Entries are scored on:
- **Originality** — a genuine perspective, not a rehash.
- **Accuracy** — claims are correct and backed up.
- **Clarity** — easy to read and well structured.
- **Relevance** — how well it serves our reader and the topic.
- **Completeness** — does it cover what the overview asked for?

---

## 4. Development task 💻  (color `#D2DCE6`)

- **Skills:** Development, Frontend, Backend
- **Suggested reward:** 1,500 USDC — 1st 900 / 2nd 400 / 3rd 200

### Overview
Build [the feature/tool] for us. Describe what it should do, who uses it, and what
"done" looks like. List the must-haves versus the nice-to-haves, the stack or
constraints to work within, and link any designs, APIs, or docs needed to start.
Be specific about the environment it has to run in.

### Requirements
A submission must:
- Meet the must-haves listed above and handle the obvious failure cases gracefully.
- Be submitted as a public repo link (and a deployed preview link if it's a UI).
- Include setup instructions so we can run it ourselves.
- Include a short test plan or tests covering the happy path and a few failures.
- Be your own work, with any third-party code clearly credited.

### Judging Criteria
Entries are scored on:
- **Completeness** — does it do what the overview asked, end to end?
- **Reliability** — does it handle edge cases and bad input without breaking?
- **Code quality** — readable, sensible structure, easy to maintain.
- **Usability** — is it actually pleasant to set up and use?
- **Documentation** — can we run and understand it from what's provided?

---

## Notes for the seed script (after approval)

- `type: 'bounty'`, `compensationType: 'fixed'`, `token: 'USDC'`, `isActive: true`,
  `isArchived: false`, `language: 'en'`, `region: 'Global'` (or `'Sierra Leone'`).
- `rewards` JSON like `{ "1": 500, "2": 300, "3": 200 }`; `rewardAmount` = total.
- `description` stored as HTML: `<h2>Overview</h2>…<h2>Requirements</h2><ul>…</ul><h2>Judging Criteria</h2><ul>…</ul>`.
- Generate a unique `slug` per template; set `emoji` and `color` as above.
- Templates with no linked `Bounties` show the "Pre-fill info with …" fallback
  text in the picker — that's expected until real sponsors use them.
