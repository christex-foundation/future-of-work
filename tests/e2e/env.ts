const DEFAULT_DATABASE_URL = 'mysql://e2e:e2e@127.0.0.1:3306/e2e';

/**
 * Fills process env for the throwaway e2e database and the production server.
 * Privy test secrets are never defaulted.
 */
export function applyE2eEnv(): void {
  process.env.DATABASE_URL ??= DEFAULT_DATABASE_URL;
  process.env.REDIS_URL ??= 'redis://127.0.0.1:6379';
  process.env.AGENT_REDIS_URL ??= 'redis://127.0.0.1:6379';
  process.env.NEXT_PUBLIC_SITE_URL ??= 'http://127.0.0.1:3000/';
  process.env.NEXT_PUBLIC_RPC_URL ??= 'example.invalid';
  process.env.NEXT_PUBLIC_RPC_WS_URL ??= 'wss://example.invalid';
  process.env.IS_LOCAL ??= 'true';
}
