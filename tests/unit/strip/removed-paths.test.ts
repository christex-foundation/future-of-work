import { existsSync, globSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const repoRoot = process.cwd();

function ledgerEntries(source: string): readonly string[] {
  return source
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith('#'))
    .map((line) => {
      const arrow = line.indexOf('->');
      return (arrow === -1 ? line : line.slice(0, arrow)).trim();
    });
}

function isAbsent(entry: string): boolean {
  if (/[*?[]/.test(entry)) {
    return globSync(entry, { cwd: repoRoot }).length === 0;
  }

  return !existsSync(path.join(repoRoot, entry));
}

describe('removed paths', () => {
  it('every ledger path and the dev-tool route are absent', () => {
    const ledgerPath = path.join(repoRoot, '.sldtp/deleted-paths');
    const source = readFileSync(ledgerPath, 'utf8');
    const entries = ledgerEntries(source);
    const present = entries.filter((entry) => !isAbsent(entry));

    expect(present).toEqual([]);
    expect(existsSync(path.join(repoRoot, 'src/app/api/dev-tool'))).toBe(false);
  });
});
