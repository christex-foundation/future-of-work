import { execFileSync } from 'node:child_process';

export interface E2eUserRow {
  readonly id: string;
  readonly email: string;
  readonly privyDid: string;
}

export interface E2eListingRow {
  readonly slug: string;
  readonly isPublished: boolean;
  readonly status: string;
}

function callDb<T>(command: string, payload: unknown): T {
  const output = execFileSync(
    'pnpm',
    ['exec', 'tsx', 'tests/e2e/db-cli.ts', command, JSON.stringify(payload)],
    {
      encoding: 'utf8',
      env: process.env,
    },
  );
  return JSON.parse(output) as T;
}

export function findUserByPrivyDid(privyDid: string): E2eUserRow | null {
  return callDb<E2eUserRow | null>('user-by-did', { privyDid });
}

export function findListingByTitle(title: string): E2eListingRow | null {
  return callDb<E2eListingRow | null>('listing-by-title', { title });
}
