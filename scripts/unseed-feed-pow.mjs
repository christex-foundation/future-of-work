import { existsSync, readFileSync, unlinkSync } from 'node:fs';

import mysql from 'mysql2/promise';

// Removes exactly the PoW posts created by scripts/seed-feed-pow.mjs.

const idsPath = new URL('./.seeded-pow-ids.json', import.meta.url);
if (!existsSync(idsPath)) {
  console.error('No scripts/.seeded-pow-ids.json found — nothing to remove.');
  process.exit(1);
}

const ids = JSON.parse(readFileSync(idsPath, 'utf8'));
if (!Array.isArray(ids) || !ids.length) {
  console.error('No ids recorded — nothing to remove.');
  process.exit(1);
}

const url = new URL(process.env.DATABASE_URL);
const target = `${url.hostname}:${url.port || 3306}`;
const conn = await mysql.createConnection({
  host: url.hostname,
  port: parseInt(url.port) || 3306,
  user: url.username || 'root',
  password: url.password ? decodeURIComponent(url.password) : undefined,
  database: url.pathname.slice(1),
});

const placeholders = ids.map(() => '?').join(', ');
const [res] = await conn.execute(
  `DELETE FROM PoW WHERE id IN (${placeholders})`,
  ids,
);

console.log(`Removed ${res.affectedRows} seeded PoW posts from ${target}.`);
unlinkSync(idsPath);
await conn.end();
