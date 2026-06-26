import mysql from 'mysql2/promise';

// Seeds the `requirements` field for the FOW test bounties, keyed by slug.
// This populates the "What we expect" section on the listing detail page
// (it renders one card per non-empty line, splitting on newlines).
const REQUIREMENTS = {
  'fow-test-5-translate-the-app-into-krio': `Native or fluent Krio — translations must read naturally, not word-for-word.
Keep button and label text short so it fits the existing UI.
Flag any phrases that don't translate cleanly and suggest an alternative.
Submit the completed file with the same keys and a short notes section.`,

  'fow-test-3-build-a-ussd-menu-flow': `Map the full menu tree, from the root menu to confirmation screens.
Handle session timeouts, invalid input, and "go back" gracefully.
Keep every prompt under 160 characters and in plain English.
Include a test plan covering the happy path and three failure cases.`,

  'fow-test-10-build-a-landing-page-for-a-fintech': `Responsive, single-page build that works mobile-first.
Optimise for 3G load speeds — keep the page light.
Wire the sign-up form to capture name, phone number, and email.
Submit a deployed preview link plus the source code.`,

  'fow-test-7-develop-a-whatsapp-support-chatbot': `Integrate with the WhatsApp Business API (or a documented sandbox).
Cover the 8–10 most common questions in a menu-driven flow.
Add a clean "talk to an agent" handoff and log every conversation.
Submit working bot code with setup instructions and a demo video.`,

  'fow-test-1-design-a-market-launch-poster': `Original work only — no templates or stock layouts.
Must read clearly from a few metres away and use our brand colours.
Deliver both a print-ready (A2, with bleed) and a 1080×1080 social version.
Include the editable source file (Figma, Illustrator, or similar).`,

  'fow-test-6-design-a-logo-for-a-solar-startup': `Original, ownable mark — no AI-generated or recycled logos.
Provide a primary logo plus a simplified mark for small sizes.
Show it in context (app icon and a signboard mockup).
Deliver SVG and PNG (light and dark) plus a one-page brand sheet.`,

  'fow-test-8-create-a-social-media-graphics-pack': `Design 6–8 on-brand, easily editable templates.
Cover posts, stories, and a profile/banner set.
Include a couple of filled-in examples.
Submit editable templates (Figma or Canva) plus exported samples.`,

  'fow-test-2-write-3-blog-posts-on-mobile-money': `Original work only — no AI filler or plagiarism.
Three posts of 600–800 words each in a warm, plain tone.
Include a title, meta description, and an image idea per post.
Submit all three edited and ready to publish in a shared doc.`,

  'fow-test-4-run-a-community-survey-50-responses': `At least 50 complete, good-faith responses from the target community.
A genuine mix of respondents — not just friends and family.
Use the supplied question set (or refine it with us first).
Submit the raw export plus a one-page summary of the top findings.`,

  'fow-test-9-field-research-vendor-onboarding': `Interview at least 8 vendors and observe a few onboarding attempts.
Note friction points, drop-off moments, and any workarounds.
Capture quotes and, where allowed, photos or screen recordings.
Submit a ranked report plus your raw interview notes.`,
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
for (const [slug, text] of Object.entries(REQUIREMENTS)) {
  const requirements = text.trim();
  const [res] = await conn.execute(
    'UPDATE Bounties SET requirements = ? WHERE slug = ?',
    [requirements, slug],
  );
  if (res.affectedRows > 0) {
    updated += 1;
    console.log(`  ✓ ${slug}`);
  } else {
    missing += 1;
    console.log(`  – ${slug} (no matching row)`);
  }
}
console.log(`\nDone on ${target}: ${updated} updated, ${missing} not found.`);
await conn.end();
