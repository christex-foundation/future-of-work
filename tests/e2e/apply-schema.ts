import { execSync } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';

import { applyE2eEnv } from './env';

function hasCommittedMigrations(): boolean {
  const directory = 'prisma/migrations';
  if (!existsSync(directory)) return false;

  return readdirSync(directory).some(
    (entry) => entry !== 'migration_lock.toml' && !entry.startsWith('.'),
  );
}

/**
 * Applies the current schema once per job.
 * `prisma/migrations` is not committed yet (the baseline lands with the strip),
 * so this uses migrate diff into an empty database. When a migration directory
 * exists, it uses migrate deploy and does not push.
 */
export function applySchema(): void {
  applyE2eEnv();
  if (!process.env.DATABASE_URL) {
    throw new Error(
      'DATABASE_URL is not set. The e2e database cannot be prepared.',
    );
  }

  if (hasCommittedMigrations()) {
    execSync('pnpm exec prisma migrate deploy', { stdio: 'inherit' });
    return;
  }

  execSync(
    'pnpm exec prisma migrate diff --from-empty --to-schema prisma/schema.prisma --script | pnpm exec prisma db execute --stdin',
    { stdio: 'inherit', shell: '/bin/bash' },
  );
}
