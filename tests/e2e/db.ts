import { PrismaMariaDb } from '@prisma/adapter-mariadb';

import { PrismaClient } from '../../src/generated/prisma/client';
import { applyE2eEnv } from './env';

let client: PrismaClient | undefined;

export function getDb(): PrismaClient {
  if (client) return client;

  applyE2eEnv();
  const databaseUrl = process.env.DATABASE_URL ?? '';
  const url = new URL(databaseUrl);
  const adapter = new PrismaMariaDb({
    host: url.hostname,
    port: Number.parseInt(url.port, 10) || 3306,
    user: url.username || 'root',
    password: url.password ? decodeURIComponent(url.password) : undefined,
    database: url.pathname.slice(1),
    connectionLimit: 2,
  });

  client = new PrismaClient({ adapter });
  return client;
}

export async function disconnectDb(): Promise<void> {
  if (!client) return;
  await client.$disconnect();
  client = undefined;
}
