import path from 'node:path';

export const talentAuthFile = path.join(
  process.cwd(),
  'tests/e2e/.auth/talent.json',
);

export const employerAuthFile = path.join(
  process.cwd(),
  'tests/e2e/.auth/employer.json',
);
