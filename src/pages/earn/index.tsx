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
import {
  generateOrganizationSchema,
  generateWebSiteSchema,
} from '@/utils/json-ld';

import { EarnHomeHero } from '@/features/home/components/EarnHomeHero';
import { userCountQuery } from '@/features/home/queries/user-count';
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
}

export default function HomePage({
  potentialSession,
  totalUsers,
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
      className="bg-[#6b5e50]"
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
          <EarnHomeHero />
          <ListingsSection type="home" potentialSession={potentialSession} />
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

  const [userCount, sponsorCount] = await Promise.all([
    prisma.user.count(),
    prisma.sponsors.count(),
  ]);

  const totalUsers = Math.ceil((userCount - 289) / 10) * 10;
  const totalSponsors = Math.ceil(sponsorCount / 10) * 10;

  return {
    props: { potentialSession: cookieExists, totalUsers, totalSponsors },
  };
};
