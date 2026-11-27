import { expect, test } from '@playwright/test';

import { talentAuthFile } from '../auth-files';
import { COMPLETED_TITLE, submitTitle } from '../listings';

test.use({ storageState: talentAuthFile });

test('talent filters open listings and submits to one', async ({
  page,
}, testInfo) => {
  const title = submitTitle(testInfo.parallelIndex);

  await page.goto('/earn/opportunities');
  await expect(
    page.getByRole('link', { name: new RegExp(title) }),
  ).toBeVisible();
  await expect(
    page.getByRole('link', { name: new RegExp(COMPLETED_TITLE) }),
  ).toHaveCount(0);

  await page.getByText('Filter', { exact: true }).click();
  await page.getByRole('menuitem', { name: 'Completed' }).click();
  await expect(
    page.getByRole('link', { name: new RegExp(COMPLETED_TITLE) }),
  ).toBeVisible();
  await expect(page.getByRole('link', { name: new RegExp(title) })).toHaveCount(
    0,
  );

  await page.getByText('Filter', { exact: true }).click();
  await page.getByRole('menuitem', { name: 'Open' }).click();
  await page.getByRole('link', { name: new RegExp(title) }).click();

  await page.getByRole('button', { name: 'Submit Now' }).click();
  await page.getByRole('button', { name: 'Start →' }).click();
  await expect(
    page.getByRole('heading', { name: /Where's your/ }),
  ).toBeVisible();
  await page.getByPlaceholder('Add a link').fill('example.com/e2e-work');
  await page.getByRole('button', { name: 'OK', exact: true }).click();

  await expect(page.getByRole('heading', { name: /tweet/ })).toBeVisible();
  await page.getByRole('button', { name: 'OK', exact: true }).click();

  await expect(page.getByRole('heading', { name: /context/ })).toBeVisible();
  await page.getByRole('button', { name: 'OK', exact: true }).click();

  await expect(page.getByRole('heading', { name: /Look good/ })).toBeVisible();
  await page.getByRole('button', { name: /Submit using 1 credit/ }).click();
  await expect(
    page.getByRole('button', { name: 'Edit Submission' }),
  ).toBeVisible();
});
