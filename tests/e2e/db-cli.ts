import { disconnectDb, getDb } from './db';

interface UserRow {
  readonly id: string;
  readonly email: string;
  readonly privyDid: string;
}

interface ListingRow {
  readonly slug: string;
  readonly isPublished: boolean;
  readonly status: string;
}

async function main(): Promise<void> {
  const command = process.argv[2];
  const rawPayload = process.argv[3] ?? '{}';
  const payload = JSON.parse(rawPayload) as {
    readonly privyDid?: string;
    readonly title?: string;
  };
  const prisma = getDb();

  try {
    if (command === 'user-by-did') {
      const privyDid = payload.privyDid ?? '';
      const user = await prisma.user.findUnique({
        where: { privyDid },
        select: { id: true, email: true, privyDid: true },
      });
      console.log(JSON.stringify(user satisfies UserRow | null));
      return;
    }

    if (command === 'listing-by-title') {
      const title = payload.title ?? '';
      const listing = await prisma.bounties.findFirst({
        where: { title },
        select: { slug: true, isPublished: true, status: true },
      });
      console.log(JSON.stringify(listing satisfies ListingRow | null));
      return;
    }

    throw new Error(`Unknown e2e database command: ${command ?? ''}`);
  } finally {
    await disconnectDb();
  }
}

main().catch((error: unknown) => {
  const message =
    error instanceof Error ? error.message : 'Unknown database error';
  console.error(message);
  process.exit(1);
});
