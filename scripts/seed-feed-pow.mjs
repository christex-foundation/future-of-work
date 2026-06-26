import { randomUUID } from 'node:crypto';
import { writeFileSync } from 'node:fs';

import mysql from 'mysql2/promise';

// Seeds a handful of PoW ("proof of work") feed posts attached to real existing
// users, so the activity feed (/earn/feed) shows populated cards.
// Reversible: writes the inserted ids to scripts/.seeded-pow-ids.json — run
// scripts/unseed-feed-pow.mjs to remove exactly these rows.

const POSTS = [
  {
    title: 'Onchain analytics dashboard',
    description:
      'A lightweight dashboard for tracking onchain activity, built with Next.js and a Solana RPC. Open source.',
    link: 'https://github.com/solana-labs',
    likeCount: 34,
    hoursAgo: 2,
  },
  {
    title: 'Krio language pack for the Earn app',
    description:
      'Translated the full onboarding flow into Krio so first-time users feel at home.',
    link: 'https://github.com/christex-foundation',
    likeCount: 12,
    hoursAgo: 5,
  },
  {
    title: 'USSD menu prototype for rural payments',
    description:
      'A working USSD flow for sending mobile money without a smartphone — demo and test plan included.',
    link: 'https://www.figma.com/community',
    likeCount: 21,
    hoursAgo: 9,
  },
  {
    title: 'Solar startup brand identity',
    description:
      'Logo, colour system and a one-page brand sheet for a Freetown solar company.',
    link: 'https://www.behance.net',
    likeCount: 7,
    hoursAgo: 20,
  },
  {
    title: 'Mobile money explainer series',
    description:
      'Three short, plain-language posts explaining how mobile money keeps your cash safe.',
    link: 'https://www.notion.so',
    likeCount: 18,
    hoursAgo: 28,
  },
  {
    title: 'Vendor onboarding field research',
    description:
      'Interviewed 8 market vendors and mapped where they drop off during onboarding.',
    link: 'https://docs.google.com',
    likeCount: 41,
    hoursAgo: 50,
  },
  {
    title: 'WhatsApp support chatbot',
    description:
      'A menu-driven WhatsApp bot covering the 10 most common support questions, with a clean agent handoff.',
    link: 'https://github.com',
    likeCount: 9,
    hoursAgo: 74,
  },
  {
    title: 'Market launch poster',
    description:
      'Print-ready A2 poster and a 1080×1080 social cut for a community market launch.',
    link: 'https://dribbble.com',
    likeCount: 26,
    hoursAgo: 100,
  },
];

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

const [users] = await conn.execute(
  `SELECT id, firstName, lastName, username FROM User
   WHERE firstName IS NOT NULL AND firstName <> '' AND username IS NOT NULL
   ORDER BY createdAt DESC LIMIT 12`,
);

if (!users.length) {
  console.error('No eligible users found — nothing seeded.');
  await conn.end();
  process.exit(1);
}

const ids = [];
let i = 0;
for (const post of POSTS) {
  const user = users[i % users.length];
  const id = randomUUID();
  const createdAt = new Date(Date.now() - post.hoursAgo * 3600 * 1000);
  await conn.execute(
    `INSERT INTO PoW (id, userId, title, description, link, likeCount, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      user.id,
      post.title,
      post.description,
      post.link,
      post.likeCount,
      createdAt,
      new Date(),
    ],
  );
  ids.push(id);
  console.log(`  ✓ "${post.title}" → ${user.firstName} ${user.lastName} (@${user.username})`);
  i += 1;
}

writeFileSync(
  new URL('./.seeded-pow-ids.json', import.meta.url),
  JSON.stringify(ids, null, 2),
);

console.log(`\nDone on ${target}: seeded ${ids.length} PoW posts.`);
console.log('Ids saved to scripts/.seeded-pow-ids.json — run scripts/unseed-feed-pow.mjs to remove them.');
await conn.end();
