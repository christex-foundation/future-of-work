#!/usr/bin/env node
// Strip reachability check (ADR-0018). No dependencies beyond the repo's own `typescript`.
//
// Docs tooling only. Not wired into CI. Run from the repo root:
//   node docs/strip/check-strip.mjs --root . --allowlist docs/strip/allowlist.txt [--ledger .sldtp/deleted-paths] [--strict]
//   node docs/strip/check-strip.mjs --root . --allowlist docs/strip/allowlist.txt --emit-ledger > .sldtp/deleted-paths
//
// Fails (exit 1) when:
//   1. a kept file imports a file that is not kept           ("kept imports deleted")
//   2. a kept file imports something that does not resolve    ("unresolved")
//   3. a kept file references a public/ asset that is not kept ("asset not kept")
//   4. a ledger glob matches a kept file, or a file outside the ledger imports a ledger path
//                                                             ("ledger deletes imported code")
// Run before the strip PR (plan check). The strip PR is what adds the CI job.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const root = path.resolve(arg('--root', '.'));
const allowlistPath = arg('--allowlist', 'docs/strip/allowlist.txt');
const ledgerPath = arg('--ledger');
const ts = createRequire(path.join(root, 'package.json'))('typescript');

const SCAN = ['src', 'public', 'prisma'];
const ROOT_IMPORTERS = ['next.config.ts', 'next.config.js', 'prisma.config.ts', 'postcss.config.js', 'middleware.ts', 'src/middleware.ts'];
const CODE = /\.(tsx?|jsx?|mjs|cjs)$/;

function globToRe(g) {
  let re = '';
  for (let i = 0; i < g.length; i++) {
    const c = g[i];
    if (c === '*' && g[i + 1] === '*') { re += '.*'; i++; if (g[i + 1] === '/') i++; }
    else if (c === '*') re += '[^/]*';
    else if (c === '?') re += '[^/]';
    else if (c === '{') { const j = g.indexOf('}', i); re += '(' + g.slice(i + 1, j).split(',').map(s => s.replace(/[.+^$()|[\]\\]/g, '\\$&')).join('|') + ')'; i = j; }
    else re += c.replace(/[.+^$()|[\]\\]/g, '\\$&');
  }
  return new RegExp('^' + re + '$');
}
function readGlobs(p) {
  const lines = fs.readFileSync(path.resolve(p), 'utf8').split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#'));
  const strip = l => l.replace(/^~/, '');
  return {
    inc: lines.filter(l => !l.startsWith('!')).map(l => globToRe(strip(l))),
    exc: lines.filter(l => l.startsWith('!')).map(l => globToRe(l.slice(1))),
    rewritten: lines.filter(l => l.startsWith('~')).map(l => globToRe(l.slice(1))),
  };
}
const matches = (g, f) => g.inc.some(r => r.test(f)) && !g.exc.some(r => r.test(f));

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.name === 'node_modules' || e.name === 'generated') continue;
    e.isDirectory() ? walk(p, out) : out.push(path.relative(root, p).split(path.sep).join('/'));
  }
  return out;
}

const all = SCAN.flatMap(d => walk(path.join(root, d)));
const allow = readGlobs(allowlistPath);
const kept = new Set(all.filter(f => matches(allow, f)));
const ledger = ledgerPath ? readGlobs(ledgerPath) : null;

const tsconfig = ts.parseJsonConfigFileContent(ts.readConfigFile(path.join(root, 'tsconfig.json'), ts.sys.readFile).config, ts.sys, root);
const host = ts.createCompilerHost(tsconfig.options);

function importsOf(file) {
  const abs = path.join(root, file);
  const text = fs.readFileSync(abs, 'utf8');
  const specs = [];
  if (CODE.test(file)) {
    const info = ts.preProcessFile(text, true, true);
    for (const r of info.importedFiles) specs.push(r.fileName);
    for (const m of text.matchAll(/require\(\s*['"]([^'"]+)['"]\s*\)/g)) specs.push(m[1]);
  } else if (file.endsWith('.css')) {
    for (const m of text.matchAll(/@import\s+(?:url\()?['"]([^'"]+)['"]/g)) specs.push(m[1]);
  }
  const assets = [...text.matchAll(/['"(](\/[A-Za-z0-9_\-./]+\.(?:png|jpe?g|svg|webp|gif|ico|woff2?|ttf|otf|webmanifest|mp4|vtt))['")]/g)].map(m => m[1]);
  return { specs, assets };
}

function resolve(spec, fromFile) {
  if (!spec.startsWith('.') && !spec.startsWith('@/')) return { external: true };
  const r = ts.resolveModuleName(spec, path.join(root, fromFile), tsconfig.options, host).resolvedModule;
  if (r && !r.isExternalLibraryImport) return { file: path.relative(root, r.resolvedFileName).split(path.sep).join('/') };
  // non-TS targets (css, json, images, fonts) referenced by relative or @/ paths
  const base = spec.startsWith('@/') ? path.join(root, 'src', spec.slice(2)) : path.resolve(path.dirname(path.join(root, fromFile)), spec);
  if (fs.existsSync(base) && fs.statSync(base).isFile()) return { file: path.relative(root, base).split(path.sep).join('/') };
  return { unresolved: true };
}

if (process.argv.includes('--emit-ledger')) {
  // Collapse deleted files into the shortest globs: a folder with nothing kept becomes "folder/**".
  const dirs = new Set(all.map(f => path.posix.dirname(f)));
  const keptDirs = new Set();
  for (const f of kept) { let d = path.posix.dirname(f); while (d !== '.') { keptDirs.add(d); d = path.posix.dirname(d); } }
  const out = new Set();
  for (const f of all) {
    if (kept.has(f)) continue;
    let d = path.posix.dirname(f), top = null;
    while (d !== '.' && !keptDirs.has(d)) { top = d; d = path.posix.dirname(d); }
    out.add(top ? top + '/**' : f);
  }
  console.log('# Generated by docs/strip/check-strip.mjs --emit-ledger from docs/strip/allowlist.txt. Do not edit by hand.');
  for (const l of [...out].sort()) console.log(l);
  process.exit(0);
}

const problems = [];
const importers = [...kept, ...ROOT_IMPORTERS.filter(f => fs.existsSync(path.join(root, f)))];
const importedBy = new Map(); // target -> importer[] (all files, for the ledger check)

function scan(file, collect) {
  if (!(CODE.test(file) || file.endsWith('.css'))) return;
  const { specs, assets } = importsOf(file);
  for (const s of specs) {
    const r = resolve(s, file);
    if (r.external) continue;
    if (r.unresolved) { if (collect) problems.push(['unresolved', file, s]); continue; }
    if (!importedBy.has(r.file)) importedBy.set(r.file, []);
    importedBy.get(r.file).push(file);
    if (r.file.startsWith('src/generated/')) continue; // prisma client output
    if (collect && SCAN.some(d => r.file.startsWith(d + '/')) && !kept.has(r.file)) problems.push(['kept imports deleted', file, r.file]);
  }
  for (const a of assets) {
    const f = 'public' + a;
    if (collect && fs.existsSync(path.join(root, f)) && !kept.has(f)) problems.push(['asset not kept', file, f]);
  }
}
// "~path" in the allowlist: kept, but rewritten in the strip PR, so today's imports are not checked.
// Pass --strict in the strip PR and in CI, where the rewritten files exist in their new form.
const strict = process.argv.includes('--strict');
for (const f of importers) {
  const rewritten = !strict && allow.rewritten.some(r => r.test(f));
  if (!rewritten) scan(f, true);
}

if (ledger) {
  for (const f of all) if (!kept.has(f)) scan(f, false); // importers outside the allowlist matter for the ledger check
  for (const f of all.filter(f => matches(ledger, f))) {
    if (kept.has(f)) problems.push(['ledger deletes kept file', 'ledger', f]);
    for (const by of importedBy.get(f) ?? []) if (!matches(ledger, by)) problems.push(['ledger deletes imported code', by, f]);
  }
}

const deleted = all.length - kept.size;
console.log(`files scanned: ${all.length}  kept: ${kept.size}  deleted: ${deleted}`);
const uniq = [...new Map(problems.map(p => [p.join('|'), p])).values()];
for (const [kind, from, to] of uniq) console.log(`${kind}: ${from} -> ${to}`);
console.log(uniq.length ? `FAIL: ${uniq.length} problem(s)` : 'OK: the kept set is closed under imports');
process.exit(uniq.length ? 1 : 0);
