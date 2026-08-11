import { readFileSync } from 'node:fs';

import mysql from 'mysql2/promise';

// Removes exactly the rows inserted by seed-listings.mjs.
// Reads scripts/.seeded-listings-ids.json written by that script.
//
// Usage:
//   DATABASE_URL='mysql://...' node scripts/unseed-listings.mjs
//   node --env-file=.env scripts/unseed-listings.mjs

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('DATABASE_URL is not set.');
  process.exit(1);
}

let saved;
try {
  saved = JSON.parse(readFileSync(new URL('./.seeded-listings-ids.json', import.meta.url), 'utf8'));
} catch {
  console.error('scripts/.seeded-listings-ids.json not found — nothing to unseed.');
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

const listingIds = saved.listings.map((l) => l.id);

if (listingIds.length) {
  const placeholders = listingIds.map(() => '?').join(', ');
  await conn.execute(`DELETE FROM Submission WHERE listingId IN (${placeholders})`, listingIds);
  await conn.execute(`DELETE FROM SubscribeBounty WHERE listingId IN (${placeholders})`, listingIds);
  const [res] = await conn.execute(`DELETE FROM Bounties WHERE id IN (${placeholders})`, listingIds);
  console.log(`✓ Removed ${res.affectedRows} listing(s)`);
}

if (saved.poc) {
  await conn.execute('DELETE FROM UserSponsors WHERE userId = ?', [saved.poc]);
  await conn.execute('DELETE FROM User WHERE id = ?', [saved.poc]);
  console.log(`✓ Removed PoC user`);
}

if (saved.sponsor) {
  await conn.execute('DELETE FROM Sponsors WHERE id = ?', [saved.sponsor]);
  console.log(`✓ Removed sponsor`);
}

console.log('\nDone — all seeded rows removed.');
await conn.end();
