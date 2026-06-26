import mysql from 'mysql2/promise';

const url = new URL(process.env.DATABASE_URL);
const conn = await mysql.createConnection({
  host: url.hostname,
  port: parseInt(url.port) || 3306,
  user: url.username || 'root',
  password: url.password ? decodeURIComponent(url.password) : undefined,
  database: url.pathname.slice(1),
});

const [rows] = await conn.query(
  `SELECT b.id, b.title, b.slug, b.type, b.isPublished, b.isActive,
          b.description, b.skills, s.name AS sponsorName, b.createdAt
   FROM Bounties b
   LEFT JOIN Sponsors s ON s.id = b.sponsorId
   ORDER BY b.createdAt DESC`,
);

console.log('TOTAL:', rows.length);
for (const r of rows) {
  const len = r.description ? r.description.length : 0;
  console.log(`\n--- ${r.title}`);
  console.log(`   slug=${r.slug} type=${r.type} pub=${r.isPublished} active=${r.isActive} sponsor=${r.sponsorName}`);
  console.log(`   skills=${r.skills ? JSON.stringify(r.skills).slice(0, 140) : '-'}`);
  console.log(`   descLen=${len}`);
  console.log(`   descPreview=${(r.description || '').replace(/\s+/g, ' ').slice(0, 220)}`);
}
await conn.end();
