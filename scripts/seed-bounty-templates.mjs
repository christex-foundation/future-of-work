import { randomUUID } from 'crypto';
import { readFileSync } from 'fs';

import mysql from 'mysql2/promise';

// Seeds the `BountiesTemplates` table so the "Browse Templates" picker in the
// listing builder has content. Each template is written in the three-section
// structure the builder guides toward: Overview / Requirements / Judging Criteria.
//
// Usage:
//   node --env-file=.env scripts/seed-bounty-templates.mjs            # insert
//   node --env-file=.env scripts/seed-bounty-templates.mjs --dry-run  # preview only
//
// Notes:
//   - Idempotent: skips any template whose `slug` already exists.
//   - BountiesTemplates requires a real sponsorId + pocId (foreign keys). The
//     script attaches every template to one existing sponsor + one POC user.
//     These do NOT show in the picker (it only shows sponsors of listings that
//     were CREATED from a template), so any valid pair works. Override with
//     SEED_SPONSOR_ID / SEED_POC_ID env vars if you want a specific owner.

const DRY_RUN = process.argv.includes('--dry-run');

// ---------------------------------------------------------------------------
// Template content
// ---------------------------------------------------------------------------

const li = (items) => items.map((t) => `<li>${t}</li>`).join('');

const buildDescription = ({ overview, requirementsLead, requirements, judging }) =>
  `<h2>Overview</h2>${overview.map((p) => `<p>${p}</p>`).join('')}` +
  `<h2>Requirements</h2><p>${requirementsLead}</p><ul>${li(requirements)}</ul>` +
  `<h2>Judging Criteria</h2><p>Entries are scored on:</p><ul>${li(judging)}</ul>`;

const TEMPLATES = [
  {
    title: 'Short-form video',
    slug: 'template-short-form-video',
    emoji: '🎬',
    color: '#F2D9C4',
    skills: [
      { skills: 'Content', subskills: ['Video', 'Video Editing', 'Social Media'] },
      { skills: 'Design', subskills: ['Graphic Design'] },
    ],
    rewards: { 1: 500, 2: 300, 3: 200 },
    rewardAmount: 1000,
    description: buildDescription({
      overview: [
        'We want a short, engaging video that explains what [your product] does and why it matters for everyday users. Give creators the full picture: the problem you solve, how the product works, who it&rsquo;s for, and the one thing you most want people to remember. Drop your brand assets, logos, and product screenshots at the bottom of this brief so creators have what they need.',
        'Keep it practical and easy to follow. The best videos make a stranger understand your product in under a minute.',
      ],
      requirementsLead: 'A submission must:',
      requirements: [
        'Be an original video &mdash; no reused or stock footage passed off as your own.',
        'Be posted publicly. Specify where: e.g. X, Instagram, and TikTok.',
        'Tag [your handle] and any partner accounts on every platform you post to.',
        'If posting across platforms, link the other posts inside one X thread so it&rsquo;s all in one place.',
        'Be in [language, e.g. English].',
        'Be submitted with the public link(s) to the post &mdash; not a private upload.',
      ],
      judging: [
        '<strong>Creativity &amp; originality</strong> &mdash; how fresh and inventive the concept is.',
        '<strong>Clarity</strong> &mdash; is the message easy to understand and memorable?',
        '<strong>Product representation</strong> &mdash; how well it explains or showcases [your product].',
        '<strong>Completeness</strong> &mdash; does it cover the points asked for in the overview?',
        '<strong>Engagement</strong> &mdash; does it hold attention and make people want to share?',
        '<strong>Production quality</strong> &mdash; editing, visuals, and audio.',
      ],
    }),
  },
  {
    title: 'Brand & logo design',
    slug: 'template-brand-logo-design',
    emoji: '🎨',
    color: '#E7DFC9',
    skills: [{ skills: 'Design', subskills: ['Graphic Design', 'Illustration'] }],
    rewards: { 1: 500, 2: 200, 3: 100 },
    rewardAmount: 800,
    description: buildDescription({
      overview: [
        'We need a logo and the basic brand pieces for [company/product]. Tell us who we are, the feeling we want the mark to carry, and where it&rsquo;ll show up most (app icon, signage, social). Share any colours, references, or existing assets you want us to work from. If you&rsquo;re open on direction, say so &mdash; we&rsquo;d rather see a strong point of view than a safe one.',
      ],
      requirementsLead: 'A submission must include:',
      requirements: [
        'An original, ownable mark &mdash; no AI-generated or recycled logos.',
        'A primary logo plus a simplified version that still reads at small sizes.',
        'The logo shown in context (e.g. an app icon and one real-world mockup).',
        'Files in SVG and PNG, in both light and dark versions.',
        'A short one-page sheet showing the colours and fonts used.',
      ],
      judging: [
        '<strong>Originality</strong> &mdash; a distinctive mark, not a template.',
        '<strong>Fit</strong> &mdash; how well it matches who we are and how we want to come across.',
        '<strong>Versatility</strong> &mdash; does it hold up small, large, light, and dark?',
        '<strong>Craft</strong> &mdash; quality of the execution and the supporting files.',
        '<strong>Clarity of system</strong> &mdash; is it easy for us to actually use day to day?',
      ],
    }),
  },
  {
    title: 'Written content / article',
    slug: 'template-written-content-article',
    emoji: '✍️',
    color: '#D9E2D0',
    skills: [{ skills: 'Content', subskills: ['Writing', 'Research'] }],
    rewards: { 1: 400, 2: 250, 3: 100 },
    rewardAmount: 750,
    description: buildDescription({
      overview: [
        'Write an article on [topic] for our audience. We want an original take backed by real examples, not a generic explainer. Tell creators who the reader is, what they should walk away understanding, and any angle or sources you want included. Point to anything they should read first so the piece builds on what we&rsquo;ve already said.',
      ],
      requirementsLead: 'A submission must:',
      requirements: [
        'Be original work &mdash; no AI filler and no plagiarism (over 15% similarity is disqualified).',
        'Be [length, e.g. 800&ndash;1,200 words] in a clear, plain tone.',
        'Include a title, a one-line summary, and an image idea.',
        'Cite or link any data and examples it references.',
        'Be posted publicly where specified (e.g. a personal blog, Substack, or Medium) and submitted as a public link.',
        'Be in [language, e.g. English].',
      ],
      judging: [
        '<strong>Originality</strong> &mdash; a genuine perspective, not a rehash.',
        '<strong>Accuracy</strong> &mdash; claims are correct and backed up.',
        '<strong>Clarity</strong> &mdash; easy to read and well structured.',
        '<strong>Relevance</strong> &mdash; how well it serves our reader and the topic.',
        '<strong>Completeness</strong> &mdash; does it cover what the overview asked for?',
      ],
    }),
  },
  {
    title: 'Development task',
    slug: 'template-development-task',
    emoji: '💻',
    color: '#D2DCE6',
    skills: [
      { skills: 'Frontend', subskills: ['React', 'Other'] },
      { skills: 'Backend', subskills: ['Node.js', 'Typescript'] },
    ],
    rewards: { 1: 900, 2: 400, 3: 200 },
    rewardAmount: 1500,
    description: buildDescription({
      overview: [
        'Build [the feature/tool] for us. Describe what it should do, who uses it, and what &ldquo;done&rdquo; looks like. List the must-haves versus the nice-to-haves, the stack or constraints to work within, and link any designs, APIs, or docs needed to start. Be specific about the environment it has to run in.',
      ],
      requirementsLead: 'A submission must:',
      requirements: [
        'Meet the must-haves listed above and handle the obvious failure cases gracefully.',
        'Be submitted as a public repo link (and a deployed preview link if it&rsquo;s a UI).',
        'Include setup instructions so we can run it ourselves.',
        'Include a short test plan or tests covering the happy path and a few failures.',
        'Be your own work, with any third-party code clearly credited.',
      ],
      judging: [
        '<strong>Completeness</strong> &mdash; does it do what the overview asked, end to end?',
        '<strong>Reliability</strong> &mdash; does it handle edge cases and bad input without breaking?',
        '<strong>Code quality</strong> &mdash; readable, sensible structure, easy to maintain.',
        '<strong>Usability</strong> &mdash; is it actually pleasant to set up and use?',
        '<strong>Documentation</strong> &mdash; can we run and understand it from what&rsquo;s provided?',
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
  console.error('DATABASE_URL is not set. Run with: node --env-file=.env scripts/seed-bounty-templates.mjs');
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

  if (DRY_RUN) {
    inserted += 1;
    console.log(`  + ${t.slug} (would insert "${t.title}", ${t.rewardAmount} USDC)`);
    continue;
  }

  await conn.execute(
    `INSERT INTO BountiesTemplates
       (id, title, slug, description, color, emoji, skills, type, region,
        token, compensationType, applicationType, status, source,
        rewardAmount, rewards, maxBonusSpots, language,
        isActive, isArchived, isFeatured, isPublished,
        sponsorId, pocId, createdAt, updatedAt)
     VALUES
       (?, ?, ?, ?, ?, ?, ?, 'bounty', 'Global',
        'USDC', 'fixed', 'fixed', 'OPEN', 'NATIVE',
        ?, ?, 0, 'eng',
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
      t.rewardAmount,
      JSON.stringify(t.rewards),
      sponsorId,
      pocId,
    ],
  );
  inserted += 1;
  console.log(`  ✓ ${t.slug} ("${t.title}")`);
}

console.log(
  `\nDone on ${target}: ${inserted} ${DRY_RUN ? 'would be inserted' : 'inserted'}, ${skipped} skipped.`,
);
await conn.end();
