import { expect, test } from '@playwright/test';

import { employerAuthFile, talentAuthFile } from '../auth-files';
import { reviewSlug, TALENT_NAME } from '../listings';

test('employer marks a seeded submission and the talent sees it', async ({
  browser,
}, testInfo) => {
  const slug = reviewSlug(testInfo.parallelIndex);
  const employerContext = await browser.newContext({
    storageState: employerAuthFile,
  });
  const talentContext = await browser.newContext({
    storageState: talentAuthFile,
  });
  const employerPage = await employerContext.newPage();
  const talentPage = await talentContext.newPage();

  try {
    await employerPage.goto(`/earn/dashboard/listings/${slug}/submissions`);
    await employerPage.getByText(TALENT_NAME).first().click();
    await employerPage.getByRole('button', { name: 'Select Winner' }).click();
    await employerPage.getByRole('menuitem', { name: /1st/ }).click();

    await talentPage.goto(`/earn/listing/${slug}`);
    await expect(
      talentPage.getByRole('heading', { name: 'Bounty Won' }),
    ).toBeVisible();
  } finally {
    await employerContext.close();
    await talentContext.close();
  }
});
