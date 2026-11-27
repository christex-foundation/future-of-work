import { expect, test } from '@playwright/test';

import { employerAuthFile } from '../auth-files';
import { findListingByTitle } from '../read-db';

test.use({ storageState: employerAuthFile });

test('employer publishes a project listing', async ({ page }, testInfo) => {
  const title = `E2E Project ${testInfo.parallelIndex} ${Date.now()}`;

  await page.goto('/earn/dashboard/new');
  await expect(page.getByText('Listing Title')).toBeVisible();

  await page.getByRole('combobox').click();
  await page.getByRole('option', { name: 'Project' }).click();
  await page.getByRole('button', { name: 'Yes, Change Type' }).click();
  await page.getByPlaceholder('Frontend Development for Superteam').fill(title);

  const editor = page.locator('.ProseMirror');
  await editor.click();
  await page.keyboard.type(
    'Overview. Build a short public page. Requirements. One HTML page. Judging Criteria. It loads.',
  );

  await page.getByPlaceholder('Select skills...').click();
  await page.getByRole('option', { name: 'React', exact: true }).click();
  await page.keyboard.press('Escape');

  await page.getByRole('button', { name: /Rewards/ }).click();
  const rewards = page.getByRole('dialog');
  await rewards.getByPlaceholder('10,000').fill('500');
  await rewards.getByRole('button', { name: 'Continue' }).click();

  const deadline = page
    .locator('div')
    .filter({ hasText: /Deadline \(in/ })
    .first();
  await deadline.getByRole('button', { name: '1 Week' }).click();

  const publish = page.getByRole('button', { name: 'Publish', exact: true });
  await expect(publish).toBeEnabled({ timeout: 20_000 });
  await publish.click();

  const publishAnyway = page.getByRole('button', { name: 'Publish anyway' });
  if (await publishAnyway.isVisible()) {
    await publishAnyway.click();
  }

  await expect(
    page
      .getByRole('heading', { name: 'Your Listing is Live' })
      .or(page.getByRole('heading', { name: /verify your listing/i })),
  ).toBeVisible();

  const listing = findListingByTitle(title);
  if (!listing) {
    throw new Error(`No listing row was stored for ${title}`);
  }

  if (listing.isPublished) {
    await page.goto(`/earn/listing/${listing.slug}`);
    await expect(page.getByText(title).first()).toBeVisible();
    return;
  }

  await page.goto('/earn/dashboard/listings');
  await expect(page.getByText(title).first()).toBeVisible();
});
