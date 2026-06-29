import { randomUUID } from 'crypto';
import { readFileSync } from 'fs';

import mysql from 'mysql2/promise';

// Seeds demo submissions onto a published bounty so you can try the grading +
// winner-announcement flow on /earn/dashboard/listings/[slug]/submissions.
//
// Submissions are left UNGRADED (status Pending, label Unreviewed, isWinner
// false) on purpose — you label them and pick winners in the UI, then hit
// "Announce Winners".
//
// Usage:
//   node --env-file=.env scripts/seed-submissions.mjs --dry-run
//   node --env-file=.env scripts/seed-submissions.mjs                 # insert
//   LISTING_SLUG=my-bounty node --env-file=.env scripts/seed-submissions.mjs
//   node --env-file=.env scripts/seed-submissions.mjs --clear         # remove seeded subs + reset announce state
//
// Env:
//   LISTING_SLUG  target a specific bounty by slug (else auto-picks the most
//                 recent OPEN, published, not-yet-announced bounty).
//   COUNT         how many submissions to create (default 6).

const DRY_RUN = process.argv.includes('--dry-run');
const CLEAR = process.argv.includes('--clear');
const SEED_MARKER = '[seed-demo]';
const COUNT = parseInt(process.env.COUNT || '6', 10);
const BONUS_REWARD_POSITION = 99;

// Sample submission content — varied so grading feels real.
const SAMPLES = [
  { link: 'https://x.com/demo_amina/status/1790000000000000001', tweet: 'https://x.com/demo_amina/status/1790000000000000001', otherInfo: 'Posted across X, IG and TikTok. Kept it under 60s and focused on the core flow.' },
  { link: 'https://www.behance.net/gallery/demo-kofi-submission', tweet: null, otherInfo: 'Full source files included in the link. Open to revisions on the colour palette.' },
  { link: 'https://demo-fatima.substack.com/p/the-piece', tweet: 'https://x.com/demo_fatima/status/1790000000000000003', otherInfo: '1,050 words, all sources linked at the bottom.' },
  { link: 'https://github.com/demo-musa/bounty-build', tweet: null, otherInfo: 'Deployed preview in the README. Tests cover the happy path + 3 failure cases.' },
  { link: 'https://www.youtube.com/watch?v=demoSadia01', tweet: 'https://x.com/demo_sadia/status/1790000000000000005', otherInfo: 'Rough cut — happy to tighten the edit if shortlisted.' },
  { link: 'https://drive.google.com/demo-ibrahim-submission', tweet: null, otherInfo: 'Includes both the print-ready and social versions plus the editable file.' },
  { link: 'https://x.com/demo_grace/status/1790000000000000007', tweet: 'https://x.com/demo_grace/status/1790000000000000007', otherInfo: 'Thread of 7 tweets, visuals attached.' },
  { link: 'https://demo-yusuf.framer.website', tweet: null, otherInfo: 'Mobile-first, optimised for slow connections.' },
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
  console.error('DATABASE_URL is not set. Run with: node --env-file=.env scripts/seed-submissions.mjs');
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
// Resolve target listing
// ---------------------------------------------------------------------------

let listing;
if (process.env.LISTING_SLUG) {
  const [rows] = await conn.query(
    `SELECT b.id, b.title, b.slug, b.type, b.rewards, b.maxBonusSpots, b.pocId,
            b.isWinnersAnnounced, b.isPublished, b.isActive, s.name AS sponsorName
     FROM Bounties b JOIN Sponsors s ON s.id = b.sponsorId
     WHERE b.slug = ? LIMIT 1`,
    [process.env.LISTING_SLUG],
  );
  listing = rows[0];
  if (!listing) {
    console.error(`No bounty found with slug "${process.env.LISTING_SLUG}".`);
    await conn.end();
    process.exit(1);
  }
} else {
  const [rows] = await conn.query(
    `SELECT b.id, b.title, b.slug, b.type, b.rewards, b.maxBonusSpots, b.pocId,
            b.isWinnersAnnounced, b.isPublished, b.isActive, s.name AS sponsorName
     FROM Bounties b JOIN Sponsors s ON s.id = b.sponsorId
     WHERE b.isPublished = 1 AND b.isActive = 1 AND b.isArchived = 0
       AND b.isWinnersAnnounced = 0 AND b.status = 'OPEN' AND b.type = 'bounty'
     ORDER BY b.createdAt DESC LIMIT 1`,
  );
  listing = rows[0];
  if (!listing) {
    console.error(
      'No OPEN, published, not-yet-announced bounty found. Publish one first, or pass LISTING_SLUG.',
    );
    await conn.end();
    process.exit(1);
  }
}

const rewards = listing.rewards
  ? typeof listing.rewards === 'string'
    ? JSON.parse(listing.rewards)
    : listing.rewards
  : {};
const podiumSpots = Object.keys(rewards).filter(
  (k) => Number(k) !== BONUS_REWARD_POSITION,
).length;
const bonusSpots = rewards[BONUS_REWARD_POSITION] ? listing.maxBonusSpots || 0 : 0;
const totalWinners = podiumSpots + bonusSpots;

console.log(
  `\nTarget bounty: "${listing.title}" (${listing.slug})\n` +
    `  Sponsor: ${listing.sponsorName}  —  log in as this sponsor to review\n` +
    `  Winners to select before announcing: ${totalWinners} (${podiumSpots} podium${bonusSpots ? ` + ${bonusSpots} bonus` : ''})\n`,
);

// ---------------------------------------------------------------------------
// Clear mode
// ---------------------------------------------------------------------------

if (CLEAR) {
  if (DRY_RUN) {
    const [[c]] = await conn.query(
      `SELECT COUNT(*) AS n FROM Submission WHERE listingId = ? AND otherInfo LIKE ?`,
      [listing.id, `%${SEED_MARKER}%`],
    );
    console.log(`Would delete ${c.n} seeded submission(s) and reset announce state.`);
  } else {
    const [res] = await conn.execute(
      `DELETE FROM Submission WHERE listingId = ? AND otherInfo LIKE ?`,
      [listing.id, `%${SEED_MARKER}%`],
    );
    await conn.execute(
      `UPDATE Bounties SET isWinnersAnnounced = 0, winnersAnnouncedAt = NULL WHERE id = ?`,
      [listing.id],
    );
    await conn.execute(
      `UPDATE Submission SET isWinner = 0, winnerPosition = NULL, status = 'Pending', label = 'Unreviewed', rewardInUSD = 0 WHERE listingId = ?`,
      [listing.id],
    );
    console.log(`Deleted ${res.affectedRows} seeded submission(s) and reset announce state.`);
  }
  await conn.end();
  process.exit(0);
}

// ---------------------------------------------------------------------------
// Pick submitter users (distinct, not the POC, not already submitted)
// ---------------------------------------------------------------------------

const [users] = await conn.query(
  `SELECT id, username FROM User
   WHERE id != ? AND username IS NOT NULL AND username != ''
     AND id NOT IN (SELECT userId FROM Submission WHERE listingId = ?)
   ORDER BY createdAt ASC LIMIT ?`,
  [listing.pocId, listing.id, COUNT],
);

if (users.length === 0) {
  console.error('No eligible users found to author submissions.');
  await conn.end();
  process.exit(1);
}
if (users.length < COUNT) {
  console.log(`Only ${users.length} eligible user(s) available (wanted ${COUNT}).`);
}

// ---------------------------------------------------------------------------
// Insert submissions
// ---------------------------------------------------------------------------

let inserted = 0;
for (let i = 0; i < users.length; i++) {
  const u = users[i];
  const s = SAMPLES[i % SAMPLES.length];
  const otherInfo = `${s.otherInfo} ${SEED_MARKER}`;

  if (DRY_RUN) {
    inserted += 1;
    console.log(`  + submission by @${u.username} → ${s.link}`);
    continue;
  }

  await conn.execute(
    `INSERT INTO Submission
       (id, link, tweet, otherInfo, status, label, eligibilityAnswers,
        userId, listingId, isWinner, isActive, isArchived, likeCount,
        isPaid, rewardInUSD, paymentSynced, createdAt, updatedAt)
     VALUES
       (?, ?, ?, ?, 'Pending', 'Unreviewed', '[]',
        ?, ?, 0, 1, 0, 0,
        0, 0, 0, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))`,
    [randomUUID(), s.link, s.tweet, otherInfo, u.id, listing.id],
  );
  inserted += 1;
  console.log(`  ✓ submission by @${u.username}`);
}

console.log(
  `\nDone on ${target}: ${inserted} submission(s) ${DRY_RUN ? 'would be created' : 'created'}.\n` +
    `Open /earn/dashboard/listings/${listing.slug}/submissions to grade them, ` +
    `select ${totalWinners} winner(s), then Announce Winners.`,
);
await conn.end();
