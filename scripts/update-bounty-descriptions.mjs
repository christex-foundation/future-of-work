import mysql from 'mysql2/promise';

// Proper, realistic descriptions for the FOW-seeded bounties, keyed by slug.
// Rendered as HTML on the listing detail page (html-react-parser).
const DESCRIPTIONS = {
  'fow-test-3-build-a-ussd-menu-flow': `
<h2>About the work</h2>
<p>Most of our users reach us from basic feature phones, so USSD is their main way in. We need a clean, fast USSD menu flow that lets a customer check their balance, send money, and buy airtime without ever leaving the *123# style menu.</p>
<h2>What you'll do</h2>
<ul>
<li><p>Map the full menu tree, from the root menu down to confirmation screens.</p></li>
<li><p>Handle session timeouts, invalid input, and "go back" gracefully.</p></li>
<li><p>Keep every prompt under 160 characters and written in plain English.</p></li>
</ul>
<h2>Deliverables</h2>
<ul>
<li><p>A working USSD flow (code or a documented prototype) plus the menu tree diagram.</p></li>
<li><p>A short test plan covering the happy path and three failure cases.</p></li>
</ul>
<p>Submit a link to your repo or prototype along with a 2–3 line note on how you tested it.</p>`,

  'fow-test-10-build-a-landing-page-for-a-fintech': `
<h2>About the work</h2>
<p>We're launching a mobile-money product and need a high-converting landing page that explains it in seconds and pushes visitors to sign up. It should feel trustworthy, load fast on slow connections, and work well on a small phone screen first.</p>
<h2>What you'll do</h2>
<ul>
<li><p>Build a responsive, single-page site (hero, how-it-works, trust/FAQ, sign-up CTA).</p></li>
<li><p>Optimise for mobile and for 3G load speeds — keep it light.</p></li>
<li><p>Wire the sign-up form to capture name, phone number, and email.</p></li>
</ul>
<h2>Deliverables</h2>
<ul>
<li><p>A deployed preview link and the source code.</p></li>
<li><p>Basic on-page SEO and a working contact/sign-up form.</p></li>
</ul>
<p>Submit your live link plus the repo. Bonus points for a Lighthouse score above 90 on mobile.</p>`,

  'fow-test-7-develop-a-whatsapp-support-chatbot': `
<h2>About the work</h2>
<p>Our support team is getting the same questions over and over on WhatsApp. We want a chatbot that answers the top FAQs automatically and hands off to a human when it can't help.</p>
<h2>What you'll do</h2>
<ul>
<li><p>Integrate with the WhatsApp Business API (or a documented sandbox).</p></li>
<li><p>Build a menu-driven flow for the 8–10 most common questions.</p></li>
<li><p>Add a clean "talk to an agent" handoff and log every conversation.</p></li>
</ul>
<h2>Deliverables</h2>
<ul>
<li><p>Working bot code with setup instructions.</p></li>
<li><p>The FAQ flow content and a short demo video.</p></li>
</ul>
<p>Submit your repo link and the demo video showing the bot answering and handing off.</p>`,

  'fow-test-1-design-a-market-launch-poster': `
<h2>About the work</h2>
<p>We're hosting a launch event at a local market and need a bold, eye-catching poster that gets people to show up. It should read clearly from a few metres away and work in both print and as a shareable image.</p>
<h2>What you'll do</h2>
<ul>
<li><p>Design an A2 poster featuring the event name, date, venue, and a clear call to action.</p></li>
<li><p>Use our brand colours and keep the layout uncluttered.</p></li>
<li><p>Deliver both a print-ready and a social-media-sized version.</p></li>
</ul>
<h2>Deliverables</h2>
<ul>
<li><p>Print-ready PDF (with bleed) and a 1080×1080 PNG.</p></li>
<li><p>Editable source file (Figma, Illustrator, or similar).</p></li>
</ul>
<p>Submit a preview image plus a link to the source and export files.</p>`,

  'fow-test-6-design-a-logo-for-a-solar-startup': `
<h2>About the work</h2>
<p>A new solar-energy startup needs a memorable logo and a simple identity to launch with. We want something modern, warm, and clearly tied to clean energy — usable on an app icon, a signboard, and a letterhead.</p>
<h2>What you'll do</h2>
<ul>
<li><p>Design a primary logo plus a simplified mark for small sizes.</p></li>
<li><p>Propose a colour palette and one or two type choices.</p></li>
<li><p>Show the logo in context (app icon, signboard mockup).</p></li>
</ul>
<h2>Deliverables</h2>
<ul>
<li><p>Logo in SVG and PNG (light and dark versions).</p></li>
<li><p>A one-page mini brand sheet with colours and usage notes.</p></li>
</ul>
<p>Submit a preview image and a link to the full file pack.</p>`,

  'fow-test-8-create-a-social-media-graphics-pack': `
<h2>About the work</h2>
<p>We need a set of on-brand social media graphics we can reuse for announcements, tips, and promotions across the next quarter. Consistency and easy editing matter more than one-off art.</p>
<h2>What you'll do</h2>
<ul>
<li><p>Design 6–8 templates covering posts, stories, and a profile/banner set.</p></li>
<li><p>Keep them on-brand and easy for a non-designer to edit.</p></li>
<li><p>Include a couple of filled-in examples.</p></li>
</ul>
<h2>Deliverables</h2>
<ul>
<li><p>Editable templates (Figma or Canva) plus exported samples.</p></li>
<li><p>A short note on how to swap text and images.</p></li>
</ul>
<p>Submit a preview grid and a link to the editable templates.</p>`,

  'fow-test-2-write-3-blog-posts-on-mobile-money': `
<h2>About the work</h2>
<p>We want to grow trust and search traffic with three helpful, beginner-friendly blog posts about mobile money. The goal is to explain, not to sell — clear language that a first-time user can follow.</p>
<h2>What you'll do</h2>
<ul>
<li><p>Write three posts of 600–800 words each on agreed topics (e.g. staying safe, sending money, going cashless).</p></li>
<li><p>Use a warm, plain tone with short paragraphs and subheadings.</p></li>
<li><p>Include a title, meta description, and a suggested image idea per post.</p></li>
</ul>
<h2>Deliverables</h2>
<ul>
<li><p>Three edited posts in a shared doc, ready to publish.</p></li>
</ul>
<p>Submit a link to the doc with all three posts. Original work only — no AI filler or plagiarism.</p>`,

  'fow-test-5-translate-the-app-into-krio': `
<h2>About the work</h2>
<p>We want the app to feel local, so we're translating the full interface into Krio. The translation should be natural and easy to understand for everyday users — not a word-for-word swap.</p>
<h2>What you'll do</h2>
<ul>
<li><p>Translate the supplied string list (roughly 200–300 short phrases) into Krio.</p></li>
<li><p>Keep buttons and labels short so they fit the UI.</p></li>
<li><p>Flag any phrases that don't translate cleanly and suggest alternatives.</p></li>
</ul>
<h2>Deliverables</h2>
<ul>
<li><p>The completed translation file (same keys, Krio values).</p></li>
<li><p>A short notes section on tricky terms.</p></li>
</ul>
<p>Submit the completed file. Native or fluent Krio strongly preferred.</p>`,

  'fow-test-4-run-a-community-survey-50-responses': `
<h2>About the work</h2>
<p>We need honest feedback from real users to shape what we build next. The task is to run a short survey and collect at least 50 quality responses from our target community.</p>
<h2>What you'll do</h2>
<ul>
<li><p>Use our question set (about 10 questions) — or refine it with us first.</p></li>
<li><p>Reach a genuine mix of respondents, not just friends and family.</p></li>
<li><p>Collect at least 50 complete, good-faith responses.</p></li>
</ul>
<h2>Deliverables</h2>
<ul>
<li><p>The raw responses (spreadsheet or export).</p></li>
<li><p>A one-page summary of the top three things you learned.</p></li>
</ul>
<p>Submit the data export plus your summary. We may spot-check responses for quality.</p>`,

  'fow-test-9-field-research-vendor-onboarding': `
<h2>About the work</h2>
<p>We want to understand why some vendors stall during onboarding. This is hands-on field research: talk to real vendors, watch them try to sign up, and tell us where they get stuck.</p>
<h2>What you'll do</h2>
<ul>
<li><p>Interview at least 8 vendors and observe a few onboarding attempts.</p></li>
<li><p>Note the friction points, drop-off moments, and any workarounds they use.</p></li>
<li><p>Capture quotes and, where allowed, photos or screen recordings.</p></li>
</ul>
<h2>Deliverables</h2>
<ul>
<li><p>A short report with the top friction points, ranked.</p></li>
<li><p>Three concrete recommendations to improve onboarding.</p></li>
</ul>
<p>Submit your report plus your raw interview notes.</p>`,

  'fow-test-expired-bounty': `
<h2>About the work</h2>
<p>This listing showcases how a completed bounty looks once the deadline has passed and winners are being chosen. The brief was to produce a short marketing asset for a product launch.</p>
<h2>What was asked</h2>
<ul>
<li><p>Deliver one polished asset that fit the brand and the launch message.</p></li>
<li><p>Keep it ready to publish with no further edits.</p></li>
</ul>
<p>Submissions are now closed and under review for winner selection.</p>`,
};

const url = new URL(process.env.DATABASE_URL);
const target = `${url.hostname}:${url.port || 3306}`;
const conn = await mysql.createConnection({
  host: url.hostname,
  port: parseInt(url.port) || 3306,
  user: url.username || 'root',
  password: url.password ? decodeURIComponent(url.password) : undefined,
  database: url.pathname.slice(1),
});

console.log(`Connected to ${target}`);
let updated = 0;
let missing = 0;
for (const [slug, html] of Object.entries(DESCRIPTIONS)) {
  const desc = html.trim();
  const [res] = await conn.execute(
    'UPDATE Bounties SET description = ? WHERE slug = ?',
    [desc, slug],
  );
  if (res.affectedRows > 0) {
    updated += 1;
    console.log(`  ✓ ${slug} (${desc.length} chars)`);
  } else {
    missing += 1;
    console.log(`  – ${slug} (no matching row)`);
  }
}
console.log(`\nDone on ${target}: ${updated} updated, ${missing} not found.`);
await conn.end();
