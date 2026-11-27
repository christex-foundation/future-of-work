import type { NextApiHandler, NextApiRequest, NextApiResponse } from 'next';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { NextApiRequestWithUser } from '@/features/auth/types';

const verifyAuthToken = vi.hoisted(() => vi.fn());
const findUnique = vi.hoisted(() => vi.fn());

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

vi.mock('@/prisma', () => ({
  prisma: {
    user: {
      findUnique,
      update: vi.fn(),
    },
    userSponsors: {
      findFirst: vi.fn(),
    },
  },
}));

import updateUser from '@/pages/api/user/update';

import { withAuth } from '@/features/auth/utils/withAuth';

interface MockResponse {
  statusCode: number;
  body: unknown;
  status: (code: number) => MockResponse;
  json: (payload: unknown) => MockResponse;
}

function createResponse(): MockResponse {
  const response: MockResponse = {
    statusCode: 200,
    body: undefined,
    status: (code) => {
      response.statusCode = code;
      return response;
    },
    json: (payload) => {
      response.body = payload;
      return response;
    },
  };
  return response;
}

function createRequest(authorization?: string): NextApiRequestWithUser {
  return {
    headers: authorization ? { authorization } : {},
    cookies: {},
  } as NextApiRequestWithUser;
}

async function invoke(
  handler: NextApiHandler,
  authorization?: string,
): Promise<MockResponse> {
  const response = createResponse();
  await handler(
    createRequest(authorization),
    response as unknown as NextApiResponse,
  );
  return response;
}

describe('withAuth', () => {
  beforeEach(() => {
    verifyAuthToken.mockReset();
    findUnique.mockReset();
  });

  it('returns 401 when the token is missing', async () => {
    const response = await invoke(withAuth(async () => undefined));

    expect(response.statusCode).toBe(401);
    expect(response.body).toEqual({ error: 'Unauthorized' });
  });

  it('returns 403 when the token has no user row', async () => {
    verifyAuthToken.mockResolvedValue({ user_id: 'did:privy:missing' });
    findUnique.mockResolvedValue(null);

    const response = await invoke(
      withAuth(async () => undefined),
      'Bearer token',
    );

    expect(response.statusCode).toBe(403);
    expect(response.body).toEqual({ error: 'User has no record.' });
  });

  it('returns 403 when the user is blocked', async () => {
    verifyAuthToken.mockResolvedValue({ user_id: 'did:privy:blocked' });
    findUnique.mockResolvedValue({ id: 'user-1', isBlocked: true });

    const response = await invoke(
      withAuth(async () => undefined),
      'Bearer token',
    );

    expect(response.statusCode).toBe(403);
    expect(response.body).toEqual({ error: 'User is blocked' });
  });

  it('sets req.userId and runs the handler', async () => {
    verifyAuthToken.mockResolvedValue({ user_id: 'did:privy:ok' });
    findUnique.mockResolvedValue({ id: 'user-1', isBlocked: false });
    let seenUserId = '';

    const response = await invoke(
      withAuth(async (req, res) => {
        seenUserId = req.userId ?? '';
        res.status(204).json({ ok: true });
      }),
      'Bearer token',
    );

    expect(seenUserId).toBe('user-1');
    expect(response.statusCode).toBe(204);
    expect(response.body).toEqual({ ok: true });
  });

  it('returns 401 from the wrapped user update route', async () => {
    const response = createResponse();
    await updateUser(
      createRequest() as unknown as NextApiRequest,
      response as unknown as NextApiResponse,
    );

    expect(response.statusCode).toBe(401);
    expect(response.body).toEqual({ error: 'Unauthorized' });
  });
});
