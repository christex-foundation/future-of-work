import { expect, type BrowserContext, type Page } from '@playwright/test';

export async function privyToken(context: BrowserContext): Promise<string> {
  const cookies = await context.cookies();
  const token = cookies.find((cookie) => cookie.name === 'privy-token')?.value;
  if (!token) {
    throw new Error('Privy session cookie was not set');
  }
  return token;
}

export function privyDidFromToken(token: string): string {
  const segment = token.split('.')[1];
  if (!segment) {
    throw new Error('Privy session token has no payload');
  }

  const payload = JSON.parse(
    Buffer.from(segment, 'base64url').toString('utf8'),
  ) as { readonly sub?: string };

  if (!payload.sub) {
    throw new Error('Privy session token has no subject');
  }

  return payload.sub;
}

/**
 * Walks the email-code UI on /earn/signin and returns the Privy user id from the session cookie.
 */
export async function signInWithEmailCode(
  page: Page,
  email: string,
  otp: string,
): Promise<string> {
  await page.goto('/earn/signin');
  await page.getByRole('button', { name: 'Continue with Email' }).click();
  await page.getByPlaceholder('Enter your email address').fill(email);
  await page.getByRole('button', { name: 'Continue →' }).click();
  await expect(page.getByRole('heading', { name: 'Enter OTP' })).toBeVisible();
  await page.locator('[data-slot="input-otp"]').pressSequentially(otp);
  await expect
    .poll(async () =>
      (await page.context().cookies()).some(
        (cookie) => cookie.name === 'privy-token' && cookie.value.length > 0,
      ),
    )
    .toBe(true);

  return privyDidFromToken(await privyToken(page.context()));
}
