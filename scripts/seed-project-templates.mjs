import { randomUUID } from 'crypto';
import { readFileSync } from 'fs';

import mysql from 'mysql2/promise';

// Seeds the `BountiesTemplates` table with `type: 'project'` templates so the
// "Browse Templates" picker in the listing builder has project content too.
//
// A project is an ad for HIRING a freelancer (people apply, the sponsor picks
// one) — not a competition. So each brief is written as a job ad + scope of work:
// Overview / Scope of Work (+ out of scope) / Requirements / Selection Criteria.
//
// Usage:
//   node --env-file=.env scripts/seed-project-templates.mjs            # insert
//   node --env-file=.env scripts/seed-project-templates.mjs --dry-run  # preview only
//
// Notes:
//   - Idempotent: skips any template whose `slug` already exists.
//   - BountiesTemplates requires a real sponsorId + pocId (foreign keys). The
//     script attaches every template to one existing sponsor + one POC user.
//     These do NOT show in the picker (it only shows sponsors of listings that
//     were CREATED from a template), so any valid pair works. Override with
//     SEED_SPONSOR_ID / SEED_POC_ID env vars if you want a specific owner.
//   - Projects use applicationType 'rolling' and a per-template compensationType:
//       'range'    → minRewardAsk/maxRewardAsk set, rewardAmount/rewards null
//       'variable' → all reward fields null (applicant proposes their own price)
//   - The template table has no `eligibility` column, so suggested application
//     questions live inside the brief body under "How to apply".

const DRY_RUN = process.argv.includes('--dry-run');
const REGION = process.env.SEED_REGION || 'Global';

// ---------------------------------------------------------------------------
// Template content
// ---------------------------------------------------------------------------

const li = (items) => items.map((t) => `<li>${t}</li>`).join('');

const buildDescription = ({
  overview,
  scopeLead,
  deliverables,
  outOfScope,
  mustHave,
  niceHave,
  selectionLead,
  selection,
  applyLead,
  applyQuestions,
}) =>
  `<h2>Overview</h2>${overview.map((p) => `<p>${p}</p>`).join('')}` +
  `<h2>Scope of Work</h2><p>${scopeLead}</p><ul>${li(deliverables)}</ul>` +
  `<p>${outOfScope}</p>` +
  `<h2>Requirements</h2><p>Must have:</p><ul>${li(mustHave)}</ul>` +
  `<p>Nice to have:</p><ul>${li(niceHave)}</ul>` +
  `<h2>Selection Criteria</h2><p>${selectionLead}</p><ul>${li(selection)}</ul>` +
  `<p><strong>How to apply</strong></p><p>${applyLead}</p><ul>${li(applyQuestions)}</ul>`;

const TEMPLATES = [
  {
    title: 'Website / web app build',
    slug: 'template-project-website-build',
    emoji: '💻',
    color: '#D2DCE6',
    skills: [
      { skills: 'Frontend', subskills: ['React', 'Other'] },
      { skills: 'Backend', subskills: ['Node.js', 'Typescript'] },
    ],
    compensationType: 'range',
    minRewardAsk: 2000,
    maxRewardAsk: 4000,
    timeToComplete: '4 to 6 Weeks',
    description: buildDescription({
      overview: [
        'We&rsquo;re hiring a developer to build [the website / web app] for [company]. Tell applicants what it&rsquo;s for, who uses it, and what success looks like once it&rsquo;s live. Say whether this is greenfield or building on something existing, link any designs, brand assets, or reference sites you like, and name the stack or hosting you need to work within.',
      ],
      scopeLead: 'What we expect delivered:',
      deliverables: [
        'A working, deployed [site / app] that covers the core features listed above.',
        'Responsive layouts that hold up on mobile, tablet, and desktop.',
        'The source in a repo we own, with setup/deploy instructions so we can run it.',
        'A short handoff &mdash; how it&rsquo;s structured and how to make basic edits.',
        'Two rounds of revisions on the agreed scope.',
      ],
      outOfScope:
        'Out of scope (unless we agree otherwise in writing): ongoing maintenance after handoff, content/copywriting, logo or brand design, and a third revision round.',
      mustHave: [
        'A portfolio of shipped sites/apps similar to this one (links, not just a CV).',
        'Solid command of [the stack, e.g. React / Next.js + a backend].',
        'Able to work to the milestones and timeline you propose.',
      ],
      niceHave: [
        'Experience with [our CMS / payments / auth / integration].',
        'An eye for design and accessibility, not just the code.',
      ],
      selectionLead: 'We&rsquo;ll choose based on:',
      selection: [
        '<strong>Relevant work</strong> &mdash; past projects close to this one, and whether they&rsquo;re actually live.',
        '<strong>Proposed approach</strong> &mdash; a clear, sensible plan and milestone breakdown for this brief, not a generic pitch.',
        '<strong>Fit &amp; communication</strong> &mdash; how well the proposal reads the brief and how clearly they communicate.',
        '<strong>Value</strong> &mdash; a realistic quote and timeline for the scope, not just the cheapest.',
      ],
      applyLead: 'Suggested application questions:',
      applyQuestions: [
        'Share 2&ndash;3 links to similar sites/apps you&rsquo;ve built.',
        'How would you approach this build, and what milestones would you set?',
        'What&rsquo;s your quote and realistic timeline for the scope above?',
      ],
    }),
  },
  {
    title: 'Brand identity & design system',
    slug: 'template-project-brand-identity',
    emoji: '🎨',
    color: '#E7DFC9',
    skills: [{ skills: 'Design', subskills: ['Graphic Design', 'Illustration'] }],
    compensationType: 'range',
    minRewardAsk: 800,
    maxRewardAsk: 2500,
    timeToComplete: '3 to 4 Weeks',
    description: buildDescription({
      overview: [
        'We&rsquo;re hiring a designer to create the brand identity for [company/product]. Tell applicants who we are, the feeling the brand should carry, and where it shows up most (app, signage, social, print). Share any colours, references, or existing assets to work from, and say how open you are on direction.',
      ],
      scopeLead: 'What we expect delivered:',
      deliverables: [
        'A primary logo plus a simplified/secondary mark that reads at small sizes.',
        'A colour palette and typography system.',
        'A short brand guidelines sheet (how to use the logo, colours, and type).',
        'The logo shown in context (e.g. app icon + one real-world mockup).',
        'Final files in SVG and PNG, light and dark, packaged for handoff.',
        'Two rounds of revisions on the chosen direction.',
      ],
      outOfScope:
        'Out of scope (unless agreed in writing): a full website or marketing collateral, motion/animation, packaging design, and a third revision round.',
      mustHave: [
        'A portfolio showing brand/identity work with a clear point of view.',
        'Proficiency in [Figma / Illustrator] and clean, dev-ready handoff.',
        'Original work &mdash; no AI-generated or recycled logos.',
      ],
      niceHave: [
        'Experience designing for [our industry / web3 / early-stage products].',
        'Comfort presenting and defending creative choices.',
      ],
      selectionLead: 'We&rsquo;ll choose based on:',
      selection: [
        '<strong>Portfolio fit</strong> &mdash; does their aesthetic and range suit what we&rsquo;re after?',
        '<strong>Originality</strong> &mdash; distinctive thinking, not template work.',
        '<strong>Process</strong> &mdash; a clear sense of how they&rsquo;ll get from brief to final system.',
        '<strong>Communication &amp; value</strong> &mdash; how well they read the brief and a fair quote.',
      ],
      applyLead: 'Suggested application questions:',
      applyQuestions: [
        'Share your portfolio, with 2&ndash;3 identity projects most like this one.',
        'How would you approach our brand, given the direction above?',
        'What&rsquo;s your quote and timeline for the deliverables listed?',
      ],
    }),
  },
  {
    title: 'Content & social media management',
    slug: 'template-project-content-social',
    emoji: '📣',
    color: '#D9E2D0',
    skills: [
      { skills: 'Content', subskills: ['Writing', 'Social Media'] },
      { skills: 'Community', subskills: ['Community Manager'] },
    ],
    compensationType: 'variable',
    minRewardAsk: null,
    maxRewardAsk: null,
    timeToComplete: 'Ongoing',
    description: buildDescription({
      overview: [
        'We&rsquo;re hiring someone to run [company]&rsquo;s content and social channels. Tell applicants what we do, who we&rsquo;re trying to reach, which platforms matter most (e.g. X, LinkedIn, Discord, Telegram), and what we want more of &mdash; reach, signups, community activity. Link our existing channels so they can see where we are today.',
      ],
      scopeLead: 'What we expect each month:',
      deliverables: [
        'A simple content calendar agreed with us ahead of time.',
        '[N] posts per week across [the platforms], written and scheduled.',
        'Light community management &mdash; replying, moderating, and flagging what needs us.',
        'A short monthly report on what went out and how it performed.',
      ],
      outOfScope:
        'Out of scope (unless agreed in writing): paid ad budget and spend management, long-form articles or video production, and brand/visual design beyond simple post graphics.',
      mustHave: [
        'A track record running social or community accounts, with examples we can see.',
        'Strong, clear writing in [language] and a feel for our audience&rsquo;s tone.',
        'Hands-on familiarity with [the platforms we use].',
      ],
      niceHave: [
        'Experience growing a [web3 / startup] community.',
        'Comfort reading basic analytics and adjusting from them.',
      ],
      selectionLead: 'We&rsquo;ll choose based on:',
      selection: [
        '<strong>Relevant experience</strong> &mdash; accounts or communities they&rsquo;ve actually grown.',
        '<strong>Voice</strong> &mdash; does their writing fit how we want to sound?',
        '<strong>Plan</strong> &mdash; a sensible first-month plan for our channels.',
        '<strong>Value</strong> &mdash; a monthly rate that matches the scope.',
      ],
      applyLead: 'Suggested application questions:',
      applyQuestions: [
        'Share 2&ndash;3 accounts or communities you&rsquo;ve managed or grown.',
        'What would your first month with our channels look like?',
        'What&rsquo;s your proposed monthly rate?',
      ],
    }),
  },
  {
    title: 'Growth / marketing campaign',
    slug: 'template-project-growth-campaign',
    emoji: '🚀',
    color: '#F2D9C4',
    skills: [
      { skills: 'Growth', subskills: ['Other'] },
      { skills: 'Content', subskills: ['Social Media'] },
    ],
    compensationType: 'range',
    minRewardAsk: 1000,
    maxRewardAsk: 3000,
    timeToComplete: '6 to 8 Weeks',
    description: buildDescription({
      overview: [
        'We&rsquo;re hiring a marketer to plan and run a campaign for [product/launch]. Tell applicants the one goal that matters most (signups, waitlist, downloads, awareness), who we&rsquo;re targeting, the channels open to us, and any budget or brand guardrails. Link anything that shows where we are today.',
      ],
      scopeLead: 'What we expect delivered:',
      deliverables: [
        'A short audit of where we stand and the gaps worth chasing.',
        'A campaign plan with channels, a timeline, and clear targets.',
        'Execution of the plan over the engagement &mdash; running the channels and assets agreed.',
        'A wrap-up report against the targets, with what to do next.',
      ],
      outOfScope:
        'Out of scope (unless agreed in writing): ad spend/media budget (separate from the fee), long-term retainer work beyond the campaign, and producing major creative assets (video, full site) unless scoped in.',
      mustHave: [
        'A track record of campaigns with results you can point to.',
        'Specialisation in [the channel that matters most &mdash; e.g. SEO, paid social, growth].',
        'Able to work to the timeline and targets you set.',
      ],
      niceHave: [
        'Experience marketing [our kind of product / to our audience].',
        'Comfort with analytics and reporting on what worked.',
      ],
      selectionLead: 'We&rsquo;ll choose based on:',
      selection: [
        '<strong>Results</strong> &mdash; past campaigns and the outcomes they drove.',
        '<strong>Plan</strong> &mdash; a focused approach to our goal, not a generic deck.',
        '<strong>Fit</strong> &mdash; relevance to our product, audience, and channels.',
        '<strong>Value</strong> &mdash; a realistic quote and timeline for the scope.',
      ],
      applyLead: 'Suggested application questions:',
      applyQuestions: [
        'Share 2&ndash;3 campaigns you&rsquo;ve run and the results.',
        'How would you approach our goal over the engagement?',
        'What&rsquo;s your quote and timeline for the scope above?',
      ],
    }),
  },
];

// ---------------------------------------------------------------------------
// Connection
// ---------------------------------------------------------------------------

const getDatabaseUrl = () => {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  try {
    const env = readFileSync(new URL('../.env', import.meta.url), 'utf8');
    const m = env.match(/^DATABASE_URL=["']?([^"'\n]+)["']?/m);
    if (m) return m[1];
  } catch {
    /* ignore */
  }
  return undefined;
};

const databaseUrl = getDatabaseUrl();
if (!databaseUrl) {
  console.error('DATABASE_URL is not set. Run with: node --env-file=.env scripts/seed-project-templates.mjs');
  process.exit(1);
}

const url = new URL(databaseUrl);
const target = `${url.hostname}:${url.port || 3306}`;
const conn = await mysql.createConnection({
  host: url.hostname,
  port: parseInt(url.port) || 3306,
  user: url.username || 'root',
  password: url.password ? decodeURIComponent(url.password) : undefined,
  database: url.pathname.slice(1),
});
console.log(`Connected to ${target}${DRY_RUN ? ' (dry run)' : ''}`);

// ---------------------------------------------------------------------------
// Resolve sponsor + poc (required foreign keys)
// ---------------------------------------------------------------------------

let sponsorId = process.env.SEED_SPONSOR_ID;
if (!sponsorId) {
  const [rows] = await conn.query(
    `SELECT id, name FROM Sponsors
     ORDER BY (name REGEXP 'christex|future of work|fow') DESC, createdAt ASC
     LIMIT 1`,
  );
  if (rows.length) {
    sponsorId = rows[0].id;
    console.log(`Using sponsor: ${rows[0].name} (${sponsorId})`);
  }
}
if (!sponsorId) {
  console.error('No sponsor found. Create a sponsor first, or set SEED_SPONSOR_ID.');
  await conn.end();
  process.exit(1);
}

let pocId = process.env.SEED_POC_ID;
if (!pocId) {
  const [rows] = await conn.query(
    `SELECT userId FROM UserSponsors WHERE sponsorId = ?
     ORDER BY (role = 'ADMIN') DESC, createdAt ASC LIMIT 1`,
    [sponsorId],
  );
  if (rows.length) pocId = rows[0].userId;
}
if (!pocId) {
  const [rows] = await conn.query(`SELECT id FROM User ORDER BY createdAt ASC LIMIT 1`);
  if (rows.length) pocId = rows[0].id;
}
if (!pocId) {
  console.error('No user found for pocId. Set SEED_POC_ID.');
  await conn.end();
  process.exit(1);
}
console.log(`Using pocId: ${pocId}`);

// ---------------------------------------------------------------------------
// Insert
// ---------------------------------------------------------------------------

let inserted = 0;
let skipped = 0;

for (const t of TEMPLATES) {
  const [existing] = await conn.query(
    'SELECT id FROM BountiesTemplates WHERE slug = ? LIMIT 1',
    [t.slug],
  );
  if (existing.length) {
    skipped += 1;
    console.log(`  – ${t.slug} (already exists, skipped)`);
    continue;
  }

  const comp =
    t.compensationType === 'range'
      ? `${t.minRewardAsk}–${t.maxRewardAsk} USDC range`
      : 'variable (applicant quotes)';

  if (DRY_RUN) {
    inserted += 1;
    console.log(`  + ${t.slug} (would insert "${t.title}", ${comp})`);
    continue;
  }

  await conn.execute(
    `INSERT INTO BountiesTemplates
       (id, title, slug, description, color, emoji, skills, type, region,
        token, compensationType, applicationType, status, source,
        minRewardAsk, maxRewardAsk, maxBonusSpots, timeToComplete, language,
        isActive, isArchived, isFeatured, isPublished,
        sponsorId, pocId, createdAt, updatedAt)
     VALUES
       (?, ?, ?, ?, ?, ?, ?, 'project', ?,
        'USDC', ?, 'rolling', 'OPEN', 'NATIVE',
        ?, ?, 0, ?, 'eng',
        1, 0, 0, 0,
        ?, ?, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))`,
    [
      randomUUID(),
      t.title,
      t.slug,
      t.description,
      t.color,
      t.emoji,
      JSON.stringify(t.skills),
      REGION,
      t.compensationType,
      t.minRewardAsk,
      t.maxRewardAsk,
      t.timeToComplete,
      sponsorId,
      pocId,
    ],
  );
  inserted += 1;
  console.log(`  ✓ ${t.slug} ("${t.title}", ${comp})`);
}

console.log(
  `\nDone on ${target}: ${inserted} ${DRY_RUN ? 'would be inserted' : 'inserted'}, ${skipped} skipped.`,
);
await conn.end();
