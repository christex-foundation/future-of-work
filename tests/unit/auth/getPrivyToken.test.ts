import type { NextApiRequest } from 'next';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const verifyAuthToken = vi.hoisted(() => vi.fn());

vi.mock('@/lib/logger', () => ({
  default: {
    debug: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  },
}));

vi.mock('@/lib/privy', () => ({
  privy: {
    utils: () => ({
      auth: () => ({
        verifyAuthToken,
      }),
    }),
  },
}));

import { getPrivyToken } from '@/features/auth/utils/getPrivyToken';

function request(input: {
  readonly authorization?: string;
  readonly cookie?: string;
}): NextApiRequest {
  return {
    headers: input.authorization ? { authorization: input.authorization } : {},
    cookies: input.cookie ? { 'privy-token': input.cookie } : {},
  } as NextApiRequest;
}

describe('getPrivyToken', () => {
  beforeEach(() => {
    verifyAuthToken.mockReset();
  });

  it('returns null when no token is present', async () => {
    const userId = await getPrivyToken(request({}));

    expect(userId).toBeNull();
    expect(verifyAuthToken).not.toHaveBeenCalled();
  });

  it('verifies an Authorization bearer token and returns user_id', async () => {
    verifyAuthToken.mockResolvedValue({ user_id: 'did:privy:header' });

    const userId = await getPrivyToken(
      request({ authorization: 'Bearer header-token' }),
    );

    expect(verifyAuthToken).toHaveBeenCalledWith('header-token');
    expect(userId).toBe('did:privy:header');
  });

  it('verifies the privy-token cookie and returns user_id', async () => {
    verifyAuthToken.mockResolvedValue({ user_id: 'did:privy:cookie' });

    const userId = await getPrivyToken(request({ cookie: 'cookie-token' }));

    expect(verifyAuthToken).toHaveBeenCalledWith('cookie-token');
    expect(userId).toBe('did:privy:cookie');
  });

  it('returns null when verification throws', async () => {
    verifyAuthToken.mockRejectedValue(new Error('bad token'));

    const userId = await getPrivyToken(
      request({ authorization: 'Bearer bad-token' }),
    );

    expect(userId).toBeNull();
  });
});
