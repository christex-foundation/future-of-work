import { applySchema } from './apply-schema';
import { disconnectDb, getDb } from './db';
import { seed } from './seed';

async function schemaIsReady(): Promise<boolean> {
  try {
    await getDb().$queryRaw`SELECT 1 FROM \`User\` LIMIT 1`;
    return true;
  } catch {
    await disconnectDb();
    return false;
  }
}

async function prepare(): Promise<void> {
  try {
    if (!(await schemaIsReady())) {
      applySchema();
    }
    await seed();
  } finally {
    await disconnectDb();
  }
}

prepare().catch((error: unknown) => {
  const message =
    error instanceof Error ? error.message : 'Unknown prepare error';
  console.error(message);
  process.exit(1);
});
