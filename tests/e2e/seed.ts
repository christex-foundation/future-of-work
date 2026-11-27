import type { PrismaClient } from '../../src/generated/prisma/client';
import { getDb } from './db';
import {
  COMPLETED_SLUG,
  COMPLETED_TITLE,
  E2E_SPONSOR_SLUG,
  reviewSlug,
  reviewTitle,
  submitSlug,
  submitTitle,
  WORKER_SLOTS,
} from './listings';

const PLACEHOLDER_TALENT_EMAIL = 'talent.e2e@example.com';
const PLACEHOLDER_EMPLOYER_EMAIL = 'employer.e2e@example.com';
const PLACEHOLDER_TALENT_DID = 'did:privy:e2e-talent';
const PLACEHOLDER_EMPLOYER_DID = 'did:privy:e2e-employer';
const TALENT_USERNAME = 'e2e-talent';
const EMPLOYER_USERNAME = 'e2e-employer';

interface AccountSeed {
  readonly email: string;
  readonly privyDid: string;
}

function accountFromEnv(
  emailName: string,
  didName: string,
  placeholderEmail: string,
  placeholderDid: string,
): AccountSeed {
  const email =
    process.env[emailName]?.trim().toLowerCase() || placeholderEmail;
  const privyDid = process.env[didName]?.trim() || placeholderDid;
  return { email, privyDid };
}

function daysFromNow(days: number): Date {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

const SKILLS = [{ skills: 'Frontend', subskills: ['React'] }];
const REWARDS = { '1': 100 };

async function resetE2eRows(
  prisma: PrismaClient,
  emails: readonly string[],
  dids: readonly string[],
): Promise<void> {
  await prisma.creditLedger.deleteMany({
    where: {
      user: { username: { in: [TALENT_USERNAME, EMPLOYER_USERNAME] } },
    },
  });
  await prisma.submission.deleteMany({
    where: { listing: { slug: { startsWith: 'e2e-' } } },
  });
  await prisma.bounties.deleteMany({
    where: { slug: { startsWith: 'e2e-' } },
  });
  await prisma.userSponsors.deleteMany({
    where: { sponsor: { slug: E2E_SPONSOR_SLUG } },
  });
  await prisma.user.deleteMany({
    where: {
      OR: [
        { email: { in: [...emails] } },
        { privyDid: { in: [...dids] } },
        { username: { in: [TALENT_USERNAME, EMPLOYER_USERNAME] } },
      ],
    },
  });
  await prisma.sponsors.deleteMany({
    where: { slug: E2E_SPONSOR_SLUG },
  });
}

/**
 * Seeds the minimum Earn rows for journeys 1–4. Safe to run again on the same database.
 */
export async function seed(): Promise<void> {
  const prisma = getDb();
  const talent = accountFromEnv(
    'PRIVY_TEST_TALENT_EMAIL',
    'PRIVY_TEST_TALENT_DID',
    PLACEHOLDER_TALENT_EMAIL,
    PLACEHOLDER_TALENT_DID,
  );
  const employer = accountFromEnv(
    'PRIVY_TEST_EMPLOYER_EMAIL',
    'PRIVY_TEST_EMPLOYER_DID',
    PLACEHOLDER_EMPLOYER_EMAIL,
    PLACEHOLDER_EMPLOYER_DID,
  );

  await resetE2eRows(
    prisma,
    [
      talent.email,
      employer.email,
      PLACEHOLDER_TALENT_EMAIL,
      PLACEHOLDER_EMPLOYER_EMAIL,
    ],
    [
      talent.privyDid,
      employer.privyDid,
      PLACEHOLDER_TALENT_DID,
      PLACEHOLDER_EMPLOYER_DID,
    ],
  );

  const sponsor = await prisma.sponsors.create({
    data: {
      name: 'E2E Sponsor',
      slug: E2E_SPONSOR_SLUG,
      industry: 'Education',
      isVerified: true,
      isCaution: false,
    },
  });

  const employerUser = await prisma.user.create({
    data: {
      email: employer.email,
      privyDid: employer.privyDid,
      username: EMPLOYER_USERNAME,
      firstName: 'E2E',
      lastName: 'Employer',
      isTalentFilled: true,
      currentSponsorId: sponsor.id,
      featureModalShown: true,
      acceptedTOS: true,
    },
  });

  await prisma.userSponsors.create({
    data: {
      userId: employerUser.id,
      sponsorId: sponsor.id,
      role: 'ADMIN',
    },
  });

  const talentUser = await prisma.user.create({
    data: {
      email: talent.email,
      privyDid: talent.privyDid,
      username: TALENT_USERNAME,
      firstName: 'E2E',
      lastName: 'Talent',
      isTalentFilled: true,
      location: 'Sierra Leone',
      locationUpdatedAt: new Date('2020-01-01T00:00:00.000Z'),
      featureModalShown: true,
      acceptedTOS: true,
    },
  });

  const openDeadline = daysFromNow(14);
  const commitmentDate = daysFromNow(28);

  for (const workerIndex of WORKER_SLOTS) {
    await prisma.bounties.create({
      data: {
        title: submitTitle(workerIndex),
        slug: submitSlug(workerIndex),
        description: 'Seeded open listing for the browse and submit journey.',
        deadline: openDeadline,
        commitmentDate,
        status: 'OPEN',
        isPublished: true,
        publishedAt: new Date(),
        region: 'Global',
        type: 'bounty',
        token: 'USDC',
        rewardAmount: 100,
        rewards: REWARDS,
        skills: SKILLS,
        sponsorId: sponsor.id,
        pocId: employerUser.id,
        pocSocials: employer.email,
        isPrivate: false,
      },
    });

    const review = await prisma.bounties.create({
      data: {
        title: reviewTitle(workerIndex),
        slug: reviewSlug(workerIndex),
        description:
          'Seeded listing with one submission for the review journey.',
        deadline: openDeadline,
        commitmentDate,
        status: 'OPEN',
        isPublished: true,
        publishedAt: new Date(),
        region: 'Global',
        type: 'bounty',
        token: 'USDC',
        rewardAmount: 100,
        rewards: REWARDS,
        skills: SKILLS,
        sponsorId: sponsor.id,
        pocId: employerUser.id,
        pocSocials: employer.email,
        isPrivate: false,
      },
    });

    await prisma.submission.create({
      data: {
        userId: talentUser.id,
        listingId: review.id,
        link: 'https://example.com/e2e-review',
        status: 'Pending',
      },
    });
  }

  await prisma.bounties.create({
    data: {
      title: COMPLETED_TITLE,
      slug: COMPLETED_SLUG,
      description:
        'Seeded completed listing so the open filter has something to hide.',
      deadline: daysFromNow(-7),
      commitmentDate: daysFromNow(-1),
      status: 'CLOSED',
      isPublished: true,
      publishedAt: daysFromNow(-14),
      isWinnersAnnounced: true,
      winnersAnnouncedAt: daysFromNow(-1),
      region: 'Global',
      type: 'bounty',
      token: 'USDC',
      rewardAmount: 100,
      rewards: REWARDS,
      skills: SKILLS,
      sponsorId: sponsor.id,
      pocId: employerUser.id,
      pocSocials: employer.email,
      isPrivate: false,
    },
  });
}
