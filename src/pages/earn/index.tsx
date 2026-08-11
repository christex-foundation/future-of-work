import { useQuery } from '@tanstack/react-query';
import { type GetServerSideProps } from 'next';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

import { JsonLd } from '@/components/shared/JsonLd';
import { Default } from '@/layouts/Default';
import { Meta } from '@/layouts/Meta';
import { prisma } from '@/prisma';
import { useUser } from '@/store/user';
import { formatNumberWithSuffix } from '@/utils/formatNumberWithSuffix';
import {
  generateOrganizationSchema,
  generateWebSiteSchema,
} from '@/utils/json-ld';

import { DaybreakTicker } from '@/features/home/components/DaybreakTicker';
import { EarnHomeHero } from '@/features/home/components/EarnHomeHero';
import { EarnSidebar } from '@/features/home/components/EarnSidebar';
import { EarnSpotlight } from '@/features/home/components/EarnSpotlight';
import { StartHereRail } from '@/features/home/components/StartHereRail';
import { userCountQuery } from '@/features/home/queries/user-count';
import { type EarnBounty } from '@/features/home/types/earn-board';
import { ListingsSection } from '@/features/listings/components/ListingsSection';

const WelcomeModal = dynamic(
  () =>
    import('@/features/home/components/WelcomeModal').then(
      (mod) => mod.WelcomeModal,
    ),
  { ssr: false },
);

const HomepagePop = dynamic(
  () =>
    import('@/features/conversion-popups/components/HomepagePop').then(
      (mod) => mod.HomepagePop,
    ),
  { ssr: false },
);

interface HomePageProps {
  readonly potentialSession: boolean;
  readonly totalUsers: number;
  readonly totalSponsors: number;
  readonly bounties: EarnBounty[];
  readonly spotlight: EarnBounty | null;
  readonly closingSoon: EarnBounty[];
}

export default function HomePage({
  potentialSession,
  totalUsers,
  totalSponsors,
  bounties,
  spotlight,
  closingSoon,
}: HomePageProps) {
  const router = useRouter();
  const { user, isLoading: isUserLoading } = useUser();
  useQuery({ ...userCountQuery, initialData: { totalUsers } });

  const organizationSchema = generateOrganizationSchema();
  const websiteSchema = generateWebSiteSchema();

  // Sponsors have no use for the talent homepage — send them to their dashboard.
  const isSponsor = !isUserLoading && !!user?.currentSponsorId;
  useEffect(() => {
    if (isSponsor) {
      router.replace('/earn/dashboard/listings');
    }
  }, [isSponsor, router]);

  if (isSponsor) return null;

  return (
    <Default
      className="bg-[#FBF7EF]"
      meta={
        <>
          <Meta
            title="Future of Work | Sierra Leone's Digital Marketplace for Work"
            description="Find paid work, bounties, quests, and projects on Future of Work — Sierra Leone's digital marketplace connecting talent with real opportunities. Built by Christex Foundation."
            canonical="https://future-of-work-lovat.vercel.app/earn/"
          />
          <JsonLd data={[organizationSchema, websiteSchema]} />
        </>
      }
    >
      <div className="mx-auto w-full px-4 py-6 lg:px-12 lg:py-10">
        <div className="mx-auto w-full max-w-[88rem] p-0">
          {/* Hero sits above the fold alongside a peek of the live board —
              it no longer claims the full viewport, so the ticker and
              bounty rail are visible on first glance. */}
          <section>
            <EarnSpotlight bounty={spotlight} />
            <div className="mt-8 w-full lg:mt-9">
              <EarnHomeHero
                totalUsers={totalUsers}
                totalSponsors={totalSponsors}
              />
            </div>
          </section>
          <DaybreakTicker items={bounties} />
          <StartHereRail />
          <div
            id="listings"
            className="mt-12 grid grid-cols-1 gap-10 lg:grid-cols-[1fr_320px] lg:scroll-mt-24"
          >
            <main className="min-w-0">
              <ListingsSection
                type="home"
                potentialSession={potentialSession}
              />
            </main>
            <aside className="hidden lg:block">
              <EarnSidebar closingSoon={closingSoon} />
            </aside>
          </div>
        </div>
      </div>
      <WelcomeModal />
      <HomepagePop />
    </Default>
  );
}

export const getServerSideProps: GetServerSideProps<HomePageProps> = async ({
  req,
}) => {
  const cookies = req.headers.cookie || '';

  const cookieExists = /(^|;)\s*user-id-hint=/.test(cookies);
  const now = new Date();

  const [userCount, sponsorCount, rawBounties] = await Promise.all([
    prisma.user.count(),
    prisma.sponsors.count(),
    prisma.bounties.findMany({
      where: {
        isPublished: true,
        isActive: true,
        isArchived: false,
        isPrivate: false,
        status: 'OPEN',
        deadline: { gt: now },
      },
      orderBy: { deadline: 'asc' },
      take: 12,
      select: {
        title: true,
        slug: true,
        deadline: true,
        rewardAmount: true,
        usdValue: true,
        token: true,
        type: true,
        skills: true,
        sponsor: { select: { name: true, isVerified: true } },
        _count: { select: { Submission: true } },
      },
    }),
  ]);

  const totalUsers = Math.max(10, Math.ceil(userCount / 10) * 10);
  const totalSponsors = Math.max(10, Math.ceil(sponsorCount / 10) * 10);

  const toEarn = (b: (typeof rawBounties)[number]): EarnBounty => {
    const skills = Array.isArray(b.skills) ? b.skills : [];
    const tags = skills
      .map((s) =>
        s && typeof s === 'object' && 'skills' in s
          ? (s as { skills?: string }).skills
          : typeof s === 'string'
            ? s
            : undefined,
      )
      .filter((s): s is string => Boolean(s))
      .slice(0, 3);
    const reward = b.rewardAmount ?? b.usdValue ?? null;
    const ms = b.deadline ? b.deadline.getTime() - now.getTime() : 0;
    const daysLeft = b.deadline ? Math.max(1, Math.ceil(ms / 86_400_000)) : null;
    let dueShort = 'closing';
    if (b.deadline && ms > 0) {
      const d = Math.floor(ms / 86_400_000);
      const h = Math.floor((ms % 86_400_000) / 3_600_000);
      dueShort = d >= 1 ? (h > 0 ? `${d}d ${h}h` : `${d}d`) : `${h}h`;
    }
    return {
      title: b.title,
      slug: b.slug,
      sponsor: b.sponsor?.name ?? 'Sponsor',
      cat: tags[0] ?? (b.type === 'project' ? 'Project' : 'Bounty'),
      prizeLabel: reward != null ? `$${formatNumberWithSuffix(reward)}` : '—',
      token: b.token ?? 'USDC',
      tags,
      daysLeft,
      dueShort,
      submissions: b._count?.Submission ?? 0,
      verified: !!b.sponsor?.isVerified,
    };
  };

  const bounties = rawBounties.map(toEarn);
  const spotlightRaw = [...rawBounties].sort(
    (a, b) =>
      (b.rewardAmount ?? b.usdValue ?? 0) - (a.rewardAmount ?? a.usdValue ?? 0),
  )[0];
  const spotlight = spotlightRaw ? toEarn(spotlightRaw) : null;
  const closingSoon = bounties.slice(0, 4);

  return {
    props: {
      potentialSession: cookieExists,
      totalUsers,
      totalSponsors,
      bounties,
      spotlight,
      closingSoon,
    },
  };
};
