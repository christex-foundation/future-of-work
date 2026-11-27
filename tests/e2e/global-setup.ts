import { execFileSync } from 'node:child_process';

import { applyE2eEnv } from './env';

export default function globalSetup(): void {
  applyE2eEnv();
  execFileSync('pnpm', ['exec', 'tsx', 'tests/e2e/prepare.ts'], {
    stdio: 'inherit',
    env: process.env,
  });
}
