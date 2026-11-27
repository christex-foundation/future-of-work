import { expect, test } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

import { employerAuthFile, talentAuthFile } from '../auth-files';
import { signInWithEmailCode } from '../helpers/auth';
import { findUserByPrivyDid } from '../read-db';
import { missingE2eSecrets, requireE2eAccounts } from '../secrets';

test('talent signs in with an email code', async ({ page, browser }) => {
  await page.goto('/earn/signin');
  await expect(
    page.getByRole('button', { name: 'Continue with Email' }),
  ).toBeVisible();

  const missing = missingE2eSecrets();
  if (missing.length > 0) {
    throw new Error(
      `Privy test secrets are missing: ${missing.join(', ')}. The e2e job does not skip. Add these GitHub Actions secrets for the dedicated Privy test app. See tests/e2e/README.md.`,
    );
  }

  const accounts = requireE2eAccounts();
  const talentDid = await signInWithEmailCode(
    page,
    accounts.talentEmail,
    accounts.otp,
  );

  await expect
    .poll(() => findUserByPrivyDid(talentDid)?.email ?? '')
    .toBe(accounts.talentEmail);

  await mkdir(path.dirname(talentAuthFile), { recursive: true });
  await page.context().storageState({ path: talentAuthFile });

  const employerContext = await browser.newContext();
  const employerPage = await employerContext.newPage();
  try {
    const employerDid = await signInWithEmailCode(
      employerPage,
      accounts.employerEmail,
      accounts.otp,
    );
    await expect
      .poll(() => findUserByPrivyDid(employerDid)?.email ?? '')
      .toBe(accounts.employerEmail);
    await employerContext.storageState({ path: employerAuthFile });
  } finally {
    await employerContext.close();
  }
});
