#!/usr/bin/env node
// Orphan-row check before declaring real foreign keys (ADR-0005).
// Reads a Prisma schema written with relationMode = "prisma" and prints one SQL query per relation.
// Every query must return 0 before data is loaded into the foreign-key baseline.
//
//   node orphan-check.mjs prisma/schema.prisma > orphans.sql
//   mariadb --batch db < orphans.sql | awk '$2 > 0'   # any line printed = orphans to fix or drop
import fs from 'node:fs';

const src = fs.readFileSync(process.argv[2] ?? 'prisma/schema.prisma', 'utf8');
const models = {};
for (const m of src.matchAll(/^model\s+(\w+)\s*\{([\s\S]*?)^\}/gm)) {
  const [, name, body] = m;
  const table = body.match(/@@map\("([^"]+)"\)/)?.[1] ?? name;
  const cols = {};
  for (const line of body.split('\n')) {
    const f = line.trim().match(/^(\w+)\s+\S+/);
    if (f) cols[f[1]] = line.match(/@map\("([^"]+)"\)/)?.[1] ?? f[1];
  }
  models[name] = { table, cols, body };
}
let n = 0;
for (const [name, { table, cols, body }] of Object.entries(models)) {
  for (const line of body.split('\n')) {
    const rel = line.match(/^\s*\w+\s+(\w+)\??\s+@relation\([^)]*fields:\s*\[([^\]]+)\][^)]*references:\s*\[([^\]]+)\]/);
    if (!rel) continue;
    const [, target, fields, refs] = rel;
    const parent = models[target];
    if (!parent) continue;
    const fs_ = fields.split(',').map(s => cols[s.trim()] ?? s.trim());
    const rs = refs.split(',').map(s => parent.cols[s.trim()] ?? s.trim());
    const on = fs_.map((f, i) => `c.\`${f}\` = p.\`${rs[i]}\``).join(' AND ');
    const notNull = fs_.map(f => `c.\`${f}\` IS NOT NULL`).join(' AND ');
    console.log(`SELECT '${table}.${fs_.join('+')} -> ${parent.table}' AS relation, COUNT(*) AS orphans FROM \`${table}\` c LEFT JOIN \`${parent.table}\` p ON ${on} WHERE ${notNull} AND p.\`${rs[0]}\` IS NULL;`);
    n++;
  }
}
console.error(`${n} relations`);
