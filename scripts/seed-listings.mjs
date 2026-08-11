import { randomUUID } from 'node:crypto';
import { writeFileSync } from 'node:fs';

import mysql from 'mysql2/promise';

// Seeds 15 listings (10 bounties + 5 projects) to the live database.
// Reversible: saves all inserted IDs to scripts/.seeded-listings-ids.json
// Run scripts/unseed-listings.mjs to remove exactly these rows.
//
// Usage:
//   DATABASE_URL='mysql://...' node scripts/seed-listings.mjs
//   node --env-file=.env scripts/seed-listings.mjs

const NOW = new Date();
const daysOut = (n) => new Date(NOW.getTime() + n * 24 * 3600 * 1000);
const hoursAgo = (n) => new Date(NOW.getTime() - n * 3600 * 1000);

// ---------------------------------------------------------------------------
// Sponsor
// ---------------------------------------------------------------------------
const SPONSOR = {
  id: randomUUID(),
  name: 'Christex Foundation',
  slug: 'christex-foundation',
  logo: 'https://future-of-work-lovat.vercel.app/assets/logos/christex-foundation.png',
  url: 'https://christex.foundation',
  industry: 'Web3',
  twitter: 'christex_fdn',
  bio: 'Christex Foundation builds digital infrastructure for the future of work in West Africa, helping freelancers and organisations connect, collaborate, and earn.',
};

// ---------------------------------------------------------------------------
// PoC user (admin)
// ---------------------------------------------------------------------------
const POC = {
  id: randomUUID(),
  email: 'admin@christex.foundation',
  username: 'christex_admin',
  firstName: 'Christex',
  lastName: 'Foundation',
  photo: 'https://res.cloudinary.com/dgvnuwspr/image/upload/v1683779989/company-logos/christex.jpg',
  bio: 'Official account for the Christex Foundation.',
  twitter: 'christex_fdn',
};

// ---------------------------------------------------------------------------
// Listing data
// ---------------------------------------------------------------------------
const BOUNTIES = [
  {
    title: 'Design the Future of Work Brand Kit',
    slug: 'design-fow-brand-kit',
    type: 'bounty',
    token: 'USDC',
    rewardAmount: 300,
    usdValue: 300,
    rewards: { 1: { value: 150, token: 'USDC' }, 2: { value: 100, token: 'USDC' }, 3: { value: 50, token: 'USDC' } },
    skills: [{ skills: 'Design', subskills: ['UI/UX Design', 'Graphic Design'] }],
    deadline: daysOut(21),
    isFeatured: true,
    description: `<p>We need a complete brand identity system for the Future of Work platform — the digital earning hub for West Africa's next generation of freelancers.</p>

<p><strong>Deliverables:</strong></p>
<ul>
  <li>Primary logo + lockup variations (light / dark)</li>
  <li>Colour palette with hex values and usage guidelines</li>
  <li>Typography scale (headings, body, captions)</li>
  <li>Icon set (20+ icons relevant to freelancing and digital work)</li>
  <li>Brand guidelines PDF covering voice, tone, and do/don't examples</li>
  <li>Social media templates (Twitter/X banner, profile image, post frame)</li>
</ul>

<p>The aesthetic should feel modern and confident — not corporate. Think Figma meets Notion, but rooted in West African visual culture. Submit a Figma file with all assets on editable layers.</p>`,
    requirements: 'Submit a shareable Figma link. Include a short (max 200 words) rationale explaining the core design decisions. Source files must be fully editable.',
    createdAt: hoursAgo(72),
  },
  {
    title: 'Write Web3 & Digital Earning Explainer Articles',
    slug: 'web3-explainer-articles-sl',
    type: 'bounty',
    token: 'USDC',
    rewardAmount: 200,
    usdValue: 200,
    rewards: { 1: { value: 100, token: 'USDC' }, 2: { value: 70, token: 'USDC' }, 3: { value: 30, token: 'USDC' } },
    skills: [{ skills: 'Content', subskills: ['Writing'] }],
    deadline: daysOut(16),
    isFeatured: false,
    description: `<p>Help us explain digital earning, crypto, and Web3 to a Sierra Leone audience that may be hearing about these topics for the first time. The articles will be published on the Future of Work blog.</p>

<p><strong>Write 3 articles, each 800–1,200 words:</strong></p>
<ol>
  <li>"What is a bounty and how do I get paid?" — demystify the earning model for first-timers.</li>
  <li>"Crypto wallets explained in plain Krio-friendly English" — no jargon, lots of analogies.</li>
  <li>"Five real freelancers earning online from Freetown" — narrative profiles (can be fictionalised composites, clearly labelled).</li>
</ol>

<p>Tone: warm, practical, and encouraging. Avoid crypto hype language. Write as if explaining to a smart friend, not a conference audience.</p>`,
    requirements: 'Submit as a Google Doc (comment access enabled) or a Notion page. Include a one-line summary of each article\'s key takeaway.',
    createdAt: hoursAgo(60),
  },
  {
    title: 'Social Media Motion Graphics Pack',
    slug: 'social-media-motion-graphics',
    type: 'bounty',
    token: 'USDC',
    rewardAmount: 250,
    usdValue: 250,
    rewards: { 1: { value: 130, token: 'USDC' }, 2: { value: 80, token: 'USDC' }, 3: { value: 40, token: 'USDC' } },
    skills: [{ skills: 'Design', subskills: ['Graphic Design'] }],
    deadline: daysOut(28),
    isFeatured: true,
    description: `<p>Create a set of animated social media graphics that we can use to promote the Future of Work platform across Instagram, TikTok, and Twitter/X.</p>

<p><strong>Pack contents:</strong></p>
<ul>
  <li>5 × animated post templates (1080×1080, MP4 or GIF, ≤15 s each)</li>
  <li>3 × animated story templates (1080×1920)</li>
  <li>2 × short-form video intros/outros (≤5 s bumper style)</li>
</ul>

<p><strong>Visual direction:</strong> Bold typography, smooth motion, confident colour palette. The animations should feel premium but not corporate — energetic without being chaotic. Brand colours: we'll provide a hex palette in the brief thread after you join.</p>

<p>Editable source files (After Effects, Rive, or equivalent) are required alongside the exported renders.</p>`,
    requirements: 'Upload exports to a shared Google Drive or WeTransfer link. Include source files. Note the software used.',
    createdAt: hoursAgo(48),
  },
  {
    title: 'Research: Digital Gig Economy in West Africa',
    slug: 'digital-gig-economy-west-africa-research',
    type: 'bounty',
    token: 'USDC',
    rewardAmount: 200,
    usdValue: 200,
    rewards: { 1: { value: 120, token: 'USDC' }, 2: { value: 80, token: 'USDC' } },
    skills: [{ skills: 'Content', subskills: ['Research', 'Writing'] }],
    deadline: daysOut(25),
    isFeatured: false,
    description: `<p>We need a rigorous research report on the state of the digital gig economy across West Africa — with a specific lens on Sierra Leone, Ghana, Nigeria, and Senegal.</p>

<p><strong>The report should cover:</strong></p>
<ul>
  <li>Market size estimates and growth trajectory (2022–2026)</li>
  <li>Most common skill categories and earning ranges for remote freelancers</li>
  <li>Barriers to entry: connectivity, payment infrastructure, trust, skills gaps</li>
  <li>Platform usage: which global platforms (Upwork, Fiverr, Toptal) have traction and why</li>
  <li>Opportunities specific to the region that larger platforms underserve</li>
  <li>3–5 concrete recommendations for the Future of Work platform</li>
</ul>

<p>Minimum 2,500 words. All claims must be sourced — cite reports, surveys, or interviews. Primary research (even 3–5 short interviews) is a significant advantage.</p>`,
    requirements: 'Submit as a PDF with a table of contents and bibliography. Include methodology notes if you conducted primary research.',
    createdAt: hoursAgo(36),
  },
  {
    title: 'Translate Platform UI Strings to Krio',
    slug: 'translate-ui-to-krio',
    type: 'bounty',
    token: 'USDC',
    rewardAmount: 150,
    usdValue: 150,
    rewards: { 1: { value: 80, token: 'USDC' }, 2: { value: 45, token: 'USDC' }, 3: { value: 25, token: 'USDC' } },
    skills: [{ skills: 'Content', subskills: ['Writing'] }],
    deadline: daysOut(14),
    isFeatured: false,
    description: `<p>Sierra Leone Krio is the lingua franca of Freetown. We want first-time users to feel at home the moment they land on Future of Work — and that means speaking their language.</p>

<p>You will receive a spreadsheet of ~400 UI strings (buttons, labels, error messages, onboarding copy, email subjects). Your job is to translate each string into natural, idiomatic Krio — not a word-for-word conversion, but something a Freetown resident would actually say.</p>

<p><strong>Key principles:</strong></p>
<ul>
  <li>Clarity over literalism — if a direct translation is awkward, adapt it.</li>
  <li>Preserve technical terms (e.g. "USDC", "wallet", "submission") where there's no natural equivalent.</li>
  <li>Flag any strings that don't translate well and suggest an English alternative.</li>
</ul>

<p>Native or near-native Krio speakers only. We'll do a quality review with a second native speaker before publishing.</p>`,
    requirements: 'Return the completed spreadsheet (same format, new column added). Include a short note on any strings you flagged.',
    createdAt: hoursAgo(24),
  },
  {
    title: 'Freelancer Success Story Video Series (3 Episodes)',
    slug: 'freelancer-success-story-videos',
    type: 'bounty',
    token: 'USDC',
    rewardAmount: 280,
    usdValue: 280,
    rewards: { 1: { value: 150, token: 'USDC' }, 2: { value: 90, token: 'USDC' }, 3: { value: 40, token: 'USDC' } },
    skills: [{ skills: 'Content', subskills: ['Video', 'Video Editing'] }],
    deadline: daysOut(32),
    isFeatured: false,
    description: `<p>Create a 3-episode mini-documentary series profiling real freelancers who earn online from West Africa. Each episode should be 3–5 minutes, optimised for YouTube and Instagram Reels (vertical cut).</p>

<p><strong>Episode brief:</strong></p>
<ul>
  <li>Ep 1: A designer who landed their first international client</li>
  <li>Ep 2: A developer who left a 9-to-5 for full-time remote work</li>
  <li>Ep 3: A content creator monetising a local language audience globally</li>
</ul>

<p>You're responsible for sourcing, interviewing, and editing. If you cannot film in West Africa, high-quality Zoom interviews + B-roll cutaways are acceptable. Each episode must include: an intro hook (≤10 s), the subject's story, at least one concrete "earning moment", and a CTA to sign up on Future of Work.</p>`,
    requirements: 'Submit YouTube links (unlisted OK) + a vertical Instagram cut for each episode. Include raw interview files in a Drive folder.',
    createdAt: hoursAgo(18),
  },
  {
    title: 'Onboarding Illustration Set',
    slug: 'onboarding-illustration-set',
    type: 'bounty',
    token: 'USDC',
    rewardAmount: 220,
    usdValue: 220,
    rewards: { 1: { value: 120, token: 'USDC' }, 2: { value: 70, token: 'USDC' }, 3: { value: 30, token: 'USDC' } },
    skills: [{ skills: 'Design', subskills: ['Illustration', 'UI/UX Design'] }],
    deadline: daysOut(23),
    isFeatured: false,
    description: `<p>We need a set of original illustrations for the Future of Work onboarding flow — the screens new users see when they first sign up. The illustrations should make the experience feel welcoming, human, and distinctly West African.</p>

<p><strong>Deliverables (8 illustrations):</strong></p>
<ol>
  <li>Welcome screen hero — person at a laptop, city skyline background (Freetown-inspired)</li>
  <li>Profile setup — person filling in skills, looking confident</li>
  <li>Browse bounties — person exploring a digital marketplace</li>
  <li>Submit work — person clicking "submit", sense of accomplishment</li>
  <li>Get paid — phone showing a payment notification, celebratory energy</li>
  <li>Empty state: no listings yet — friendly, not discouraging</li>
  <li>Empty state: no submissions yet</li>
  <li>Success / winner announced — confetti, podium, or equivalent</li>
</ol>

<p>Style: flat or semi-flat, bold outlines, warm palette. Characters should reflect West African diversity. Vector format (SVG or Figma).</p>`,
    requirements: 'Submit a Figma file with all 8 illustrations on named frames. Export SVG + PNG (2×) for each. Include a style guide page.',
    createdAt: hoursAgo(12),
  },
  {
    title: 'Community Newsletter — Launch Edition (3 Issues)',
    slug: 'community-newsletter-launch-edition',
    type: 'bounty',
    token: 'USDC',
    rewardAmount: 180,
    usdValue: 180,
    rewards: { 1: { value: 100, token: 'USDC' }, 2: { value: 50, token: 'USDC' }, 3: { value: 30, token: 'USDC' } },
    skills: [{ skills: 'Content', subskills: ['Writing', 'Social Media'] }],
    deadline: daysOut(19),
    isFeatured: false,
    description: `<p>Write the first three issues of the Future of Work community newsletter. Each issue will be sent to our subscriber list and republished on the platform blog.</p>

<p><strong>Each issue should be ~600–800 words and include:</strong></p>
<ul>
  <li>An opening editorial (3–4 paragraphs) on a theme relevant to West African freelancers</li>
  <li>A "Spotlight" section highlighting a recent bounty winner or community member</li>
  <li>3 curated links (tools, resources, or opportunities relevant to the audience)</li>
  <li>A short sign-off that builds anticipation for the next issue</li>
</ul>

<p><strong>Suggested themes:</strong> Issue 1 — "Why now is the best time to start earning online from SL." Issue 2 — "The skills West African freelancers should double down on in 2026." Issue 3 — "From zero to first client: a practical starter guide."</p>

<p>Voice: direct, warm, motivating. No corporate speak. Write like you'd talk to a smart friend who's curious about freelancing.</p>`,
    requirements: 'Submit each issue as a Google Doc (editor access). Include a proposed email subject line for each issue.',
    createdAt: hoursAgo(8),
  },
  {
    title: 'Figma UI Component Library',
    slug: 'figma-ui-component-library',
    type: 'bounty',
    token: 'USDC',
    rewardAmount: 350,
    usdValue: 350,
    rewards: { 1: { value: 200, token: 'USDC' }, 2: { value: 100, token: 'USDC' }, 3: { value: 50, token: 'USDC' } },
    skills: [{ skills: 'Design', subskills: ['UI/UX Design'] }],
    deadline: daysOut(35),
    isFeatured: true,
    description: `<p>Build a production-ready Figma component library for the Future of Work design system. This will become the single source of truth for all future UI work on the platform.</p>

<p><strong>Required components (minimum):</strong></p>
<ul>
  <li><strong>Foundations:</strong> colour tokens, typography scale, spacing grid, shadow styles, border radii</li>
  <li><strong>Atoms:</strong> buttons (all variants + states), inputs, checkboxes, radio buttons, toggles, badges, avatars, tags</li>
  <li><strong>Molecules:</strong> form fields with labels + error states, dropdowns, modals, tooltips, toast notifications</li>
  <li><strong>Organisms:</strong> navigation bar, sidebar, bounty card, submission card, user profile card, pagination</li>
  <li><strong>Templates:</strong> listing detail page, dashboard overview, empty states</li>
</ul>

<p>All components must be built with auto-layout, use variables for colour and type tokens, and include interactive prototypes for key flows (hover, focus, error). Components must be documented with a "usage" annotation on each frame.</p>`,
    requirements: 'Submit a shareable Figma Community file or a team file link (view access). All components must pass a basic accessibility check (contrast ratios, focus rings).',
    createdAt: hoursAgo(4),
  },
  {
    title: 'Freelancer Pitch Deck Template',
    slug: 'freelancer-pitch-deck-template',
    type: 'bounty',
    token: 'USDC',
    rewardAmount: 160,
    usdValue: 160,
    rewards: { 1: { value: 90, token: 'USDC' }, 2: { value: 70, token: 'USDC' } },
    skills: [{ skills: 'Design', subskills: ['Presentation Design', 'Graphic Design'] }],
    deadline: daysOut(20),
    isFeatured: false,
    description: `<p>Design a professional pitch deck template that West African freelancers can use to win clients. This will be available as a free download on the Future of Work platform.</p>

<p><strong>The template should include 12–15 slides:</strong></p>
<ol>
  <li>Cover — name, title, tagline</li>
  <li>About me — bio + photo placeholder</li>
  <li>Skills & tools</li>
  <li>How I work (process overview)</li>
  <li>Portfolio — 3-project showcase layout</li>
  <li>Case study (single project deep-dive)</li>
  <li>Testimonials / social proof</li>
  <li>Pricing tiers or engagement models</li>
  <li>Why work with me (differentiator slide)</li>
  <li>FAQs</li>
  <li>CTA / next steps</li>
  <li>Contact + socials</li>
</ol>

<p>Deliver in Canva (editable template link) and PowerPoint (.pptx). The design should be polished and professional, with clear placeholders and placeholder copy that guides the user.</p>`,
    requirements: 'Provide a Canva template link + a .pptx download link. Include a 1-page PDF preview.',
    createdAt: hoursAgo(2),
  },
];

const PROJECTS = [
  {
    title: 'Community Onboarding Chatbot (WhatsApp + Telegram)',
    slug: 'community-onboarding-chatbot',
    type: 'project',
    token: 'USDC',
    rewardAmount: 1500,
    usdValue: 1500,
    rewards: { 1: { value: 1500, token: 'USDC' } },
    skills: [{ skills: 'Backend', subskills: ['Node.js', 'Javascript'] }],
    deadline: daysOut(56),
    isFeatured: true,
    description: `<p>Build a conversational onboarding bot that helps new Future of Work users complete their profile and browse their first bounties — all without opening a browser. The bot should work on both WhatsApp Business API and Telegram.</p>

<p><strong>Core flows:</strong></p>
<ul>
  <li>Welcome + account creation (email + username capture)</li>
  <li>Skills survey (multi-choice, maps to our skills taxonomy)</li>
  <li>"Here are 3 bounties matching your skills" (live API call)</li>
  <li>Submission reminder 24 h before a bounty closes</li>
  <li>Winner notification (triggered by platform webhook)</li>
</ul>

<p><strong>Technical requirements:</strong></p>
<ul>
  <li>Node.js (Express or Fastify) backend deployed on Railway or Render</li>
  <li>WhatsApp Cloud API + Telegram Bot API</li>
  <li>Webhook integration with the Future of Work REST API</li>
  <li>Persistent session state (Redis or similar)</li>
  <li>Full test coverage for all conversation flows</li>
  <li>README with setup, environment variables, and deployment instructions</li>
</ul>`,
    requirements: 'Deliver a GitHub repo (public or access-granted) with CI passing. Include a 5-minute Loom demo of both WhatsApp and Telegram flows.',
    createdAt: hoursAgo(80),
  },
  {
    title: 'Mobile Money Payment Integration',
    slug: 'mobile-money-payment-integration',
    type: 'project',
    token: 'USDC',
    rewardAmount: 2000,
    usdValue: 2000,
    rewards: { 1: { value: 2000, token: 'USDC' } },
    skills: [{ skills: 'Mobile', subskills: ['Flutter', 'React Native'] }],
    deadline: daysOut(70),
    isFeatured: true,
    description: `<p>Integrate Orange Money and Afrimoney (the two dominant mobile money networks in Sierra Leone) as withdrawal options on the Future of Work platform, so winners can cash out their USDC earnings to their local mobile wallet.</p>

<p><strong>Scope:</strong></p>
<ul>
  <li>Backend: payment initiation and webhook handling for Orange Money SL API and Afrimoney API</li>
  <li>Currency conversion: USDC → SLE at live rates (source a reliable oracle or exchange rate API)</li>
  <li>Frontend: withdrawal flow in the platform dashboard (React, TypeScript) — amount input, wallet number, confirmation, status polling</li>
  <li>Error handling: failed transactions, number not registered, insufficient balance</li>
  <li>Admin view: transaction log with status filters</li>
  <li>Unit + integration tests; staging environment tested end-to-end before handover</li>
</ul>

<p>If the live APIs require business onboarding that isn't complete yet, deliver with sandbox/mock APIs and document the production switch-over steps clearly.</p>`,
    requirements: 'GitHub repo + deployed staging environment. Loom walkthrough (≤10 min) covering happy path + at least 2 error cases. API credentials handled via environment variables only — no hardcoded secrets.',
    createdAt: hoursAgo(96),
  },
  {
    title: 'Freelancer Portfolio Website Template',
    slug: 'freelancer-portfolio-website-template',
    type: 'project',
    token: 'USDC',
    rewardAmount: 1200,
    usdValue: 1200,
    rewards: { 1: { value: 1200, token: 'USDC' } },
    skills: [{ skills: 'Frontend', subskills: ['React', 'Typescript'] }],
    deadline: daysOut(49),
    isFeatured: false,
    description: `<p>Build a free, open-source portfolio website template tailored for West African freelancers. It should be deployable to Vercel in under 5 minutes — no coding experience required for the end user once it's set up.</p>

<p><strong>Features:</strong></p>
<ul>
  <li>Hero section with name, role, and a single strong CTA</li>
  <li>About section with bio, photo, and location</li>
  <li>Skills & tools section (pulls from a simple config file)</li>
  <li>Portfolio grid — thumbnail, title, description, link; loaded from a local JSON file or Notion database (user's choice)</li>
  <li>Testimonials carousel</li>
  <li>Contact form (Resend or Formspree integration)</li>
  <li>SEO meta tags, Open Graph images (auto-generated from name + role)</li>
  <li>Dark / light mode toggle</li>
</ul>

<p><strong>Tech stack:</strong> Next.js 15, TypeScript, Tailwind CSS. No CMS required — all content is driven by a single <code>config.ts</code> file that any user can edit.</p>

<p>Include a one-click "Deploy to Vercel" button in the README.</p>`,
    requirements: 'Public GitHub repo with MIT licence. Live demo deployed on Vercel. README covers: local setup, config guide, deployment steps. Passes Lighthouse performance ≥90.',
    createdAt: hoursAgo(64),
  },
  {
    title: 'Platform Analytics Dashboard',
    slug: 'platform-analytics-dashboard',
    type: 'project',
    token: 'USDC',
    rewardAmount: 1800,
    usdValue: 1800,
    rewards: { 1: { value: 1800, token: 'USDC' } },
    skills: [{ skills: 'Frontend', subskills: ['React', 'Typescript'] }, { skills: 'Other', subskills: ['Data Analytics'] }],
    deadline: daysOut(63),
    isFeatured: false,
    description: `<p>Build an internal analytics dashboard that gives the Christex Foundation team visibility into how the platform is performing — without needing to run raw SQL queries.</p>

<p><strong>Metrics to display:</strong></p>
<ul>
  <li>Listings: total, open, closed, by type (bounty / project), by skill category</li>
  <li>Submissions: total, per listing (average, min, max), conversion rate (submissions → winners)</li>
  <li>Users: signups over time, profile completion rate, skill distribution map</li>
  <li>Earnings: total USDC distributed, average per listing, top earners (anonymised)</li>
  <li>Activity feed: recent submissions, new users, newly published listings</li>
</ul>

<p><strong>Tech:</strong> Next.js (or standalone React), Recharts or Tremor for charts, Prisma for data access (read-only). Deploy behind a simple password or magic-link auth. Mobile-responsive.</p>

<p>Data should be cached (ISR or similar) — the dashboard doesn't need real-time updates, hourly is fine.</p>`,
    requirements: 'GitHub repo + deployed URL. Include a short README explaining the auth setup and how to add new metrics. All chart components must have accessible labels.',
    createdAt: hoursAgo(52),
  },
  {
    title: 'USSD Payment Interface Prototype',
    slug: 'ussd-payment-interface-prototype',
    type: 'project',
    token: 'USDC',
    rewardAmount: 900,
    usdValue: 900,
    rewards: { 1: { value: 900, token: 'USDC' } },
    skills: [{ skills: 'Backend', subskills: ['Python', 'Javascript'] }],
    deadline: daysOut(42),
    isFeatured: false,
    description: `<p>Build a working USSD prototype that lets users check their Future of Work earnings and request a withdrawal — no smartphone or internet required. USSD is still the most accessible interface for many Sierra Leone users.</p>

<p><strong>Required USSD flows:</strong></p>
<ul>
  <li><code>*384#</code> → Main menu (Check balance / Request withdrawal / Active bounties)</li>
  <li>Check balance: displays current USDC earnings and SLE equivalent</li>
  <li>Request withdrawal: enter amount → confirm → receive SMS confirmation</li>
  <li>Active bounties: lists 3 open bounties the user's skills match (title + reward, truncated to USSD character limit)</li>
</ul>

<p><strong>Technical requirements:</strong></p>
<ul>
  <li>Africa's Talking USSD API (they have Sierra Leone coverage)</li>
  <li>Python (FastAPI) or Node.js backend</li>
  <li>Connects to the Future of Work REST API for user data and withdrawal requests</li>
  <li>Session management (USSD sessions time out after 180 s — handle gracefully)</li>
  <li>Deployed and testable via Africa's Talking sandbox</li>
</ul>`,
    requirements: 'GitHub repo + Africa\'s Talking sandbox demo (screen recording). README with setup, Africa\'s Talking configuration, and how to switch from sandbox to production.',
    createdAt: hoursAgo(40),
  },
];

// ---------------------------------------------------------------------------
// DB connection
// ---------------------------------------------------------------------------

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('DATABASE_URL is not set.');
  process.exit(1);
}

const url = new URL(databaseUrl);
const conn = await mysql.createConnection({
  host: url.hostname,
  port: parseInt(url.port) || 3306,
  user: url.username || 'root',
  password: url.password ? decodeURIComponent(url.password) : undefined,
  database: url.pathname.slice(1),
});
console.log(`Connected to ${url.hostname}:${url.port || 3306}`);

// ---------------------------------------------------------------------------
// Insert sponsor (skip if slug already exists)
// ---------------------------------------------------------------------------

const [[existingSponsor]] = await conn.execute(
  'SELECT id FROM Sponsors WHERE slug = ? LIMIT 1',
  [SPONSOR.slug],
);

let sponsorId;
if (existingSponsor) {
  sponsorId = existingSponsor.id;
  console.log(`\nSponsor "${SPONSOR.name}" already exists — reusing id ${sponsorId}`);
} else {
  sponsorId = SPONSOR.id;
  await conn.execute(
    `INSERT INTO Sponsors (id, name, slug, logo, url, industry, twitter, bio, isActive, isArchived, isVerified, isCaution, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 0, 1, 0, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))`,
    [sponsorId, SPONSOR.name, SPONSOR.slug, SPONSOR.logo, SPONSOR.url, SPONSOR.industry, SPONSOR.twitter, SPONSOR.bio],
  );
  console.log(`\n✓ Sponsor "${SPONSOR.name}" created`);
}

// ---------------------------------------------------------------------------
// Insert PoC user (skip if email already exists)
// ---------------------------------------------------------------------------

const [[existingUser]] = await conn.execute(
  'SELECT id FROM User WHERE email = ? LIMIT 1',
  [POC.email],
);

let pocId;
if (existingUser) {
  pocId = existingUser.id;
  console.log(`PoC user "${POC.email}" already exists — reusing id ${pocId}`);
} else {
  pocId = POC.id;
  await conn.execute(
    `INSERT INTO User (id, email, username, firstName, lastName, photo, bio, twitter, privyDid, isVerified, isTalentFilled, acceptedTOS, currentSponsorId, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1, 1, ?, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))`,
    [pocId, POC.email, POC.username, POC.firstName, POC.lastName, POC.photo, POC.bio, POC.twitter, `seed:${pocId}`, sponsorId],
  );
  console.log(`✓ PoC user "${POC.email}" created`);

  // Link user ↔ sponsor
  await conn.execute(
    `INSERT INTO UserSponsors (userId, sponsorId, role, createdAt, updatedAt)
     VALUES (?, ?, 'ADMIN', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))`,
    [pocId, sponsorId],
  );
  console.log(`✓ UserSponsors link created`);
}

// ---------------------------------------------------------------------------
// Insert listings
// ---------------------------------------------------------------------------

const insertedIds = { sponsor: sponsorId, poc: pocId, listings: [] };
const ALL = [...BOUNTIES, ...PROJECTS];
console.log(`\nInserting ${ALL.length} listings…\n`);

for (const listing of ALL) {
  const id = randomUUID();
  await conn.execute(
    `INSERT INTO Bounties
       (id, title, slug, description, requirements, deadline, status, token,
        rewardAmount, usdValue, rewards, skills, type, applicationType, compensationType,
        region, isPublished, isFeatured, isActive, isArchived, isWinnersAnnounced,
        source, agentAccess, shouldSendEmail, isFndnPaying,
        sponsorId, pocId, publishedAt, createdAt, updatedAt)
     VALUES
       (?, ?, ?, ?, ?, ?, 'OPEN', ?,
        ?, ?, ?, ?, ?, 'fixed', 'fixed',
        'Global', 1, ?, 1, 0, 0,
        'NATIVE', 'HUMAN_ONLY', 0, 0,
        ?, ?, CURRENT_TIMESTAMP(3), ?, CURRENT_TIMESTAMP(3))`,
    [
      id,
      listing.title,
      listing.slug,
      listing.description,
      listing.requirements,
      listing.deadline,
      listing.token,
      listing.rewardAmount,
      listing.usdValue,
      JSON.stringify(listing.rewards),
      JSON.stringify(listing.skills),
      listing.type,
      listing.isFeatured ? 1 : 0,
      sponsorId,
      pocId,
      listing.createdAt,
    ],
  );
  insertedIds.listings.push({ id, slug: listing.slug, type: listing.type });
  const tag = listing.type === 'project' ? '[project]' : '[bounty] ';
  console.log(`  ✓ ${tag} ${listing.title} — $${listing.rewardAmount} USDC`);
}

// ---------------------------------------------------------------------------
// Save IDs for unseed
// ---------------------------------------------------------------------------

writeFileSync(
  new URL('./.seeded-listings-ids.json', import.meta.url),
  JSON.stringify(insertedIds, null, 2),
);

console.log(`
Done: ${ALL.length} listings seeded.
Sponsor: ${sponsorId}
PoC: ${pocId}

IDs saved to scripts/.seeded-listings-ids.json
Run scripts/unseed-listings.mjs to remove all seeded rows.
`);

await conn.end();
