import type { GetServerSideProps } from 'next';

import { ASSET_URL } from '@/constants/ASSET_URL';
import { Meta } from '@/layouts/Meta';
import { prisma } from '@/prisma';
import { formatNumberWithSuffix } from '@/utils/formatNumberWithSuffix';

import DaybreakLanding, {
  type LiveBounty,
} from '@/features/stfun/components/daybreak/DaybreakLanding';

interface HomeProps {
  bounties: LiveBounty[];
}

export default function Home({ bounties }: HomeProps) {
  return (
    <>
      <Meta
        title="Future of Work | Where good work meets fair pay"
        description="A calm, open marketplace connecting talent who want to earn with companies who need work done — fast, transparent, and paid in USDC."
        canonical="https://future-of-work-lovat.vercel.app/"
        og={`${ASSET_URL}/st/og/og-home.png`}
      />
      <DaybreakLanding bounties={bounties} />
    </>
  );
}

function skillsToTags(skills: unknown): string[] {
  if (!Array.isArray(skills)) return [];
  return skills
    .map((s) => {
      if (typeof s === 'string') return s;
      if (s && typeof s === 'object' && 'skills' in s) {
        return (s as { skills?: string }).skills;
      }
      return undefined;
    })
    .filter((s): s is string => Boolean(s))
    .slice(0, 3);
}

export const getServerSideProps: GetServerSideProps<HomeProps> = async () => {
  const now = new Date();

  const raw = await prisma.bounties.findMany({
    where: {
      isPublished: true,
      isActive: true,
      isArchived: false,
      isPrivate: false,
      status: 'OPEN',
      deadline: { gt: now },
    },
    orderBy: { deadline: 'asc' },
    take: 4,
    select: {
      title: true,
      slug: true,
      deadline: true,
      rewardAmount: true,
      usdValue: true,
      token: true,
      type: true,
      skills: true,
      sponsor: { select: { name: true, industry: true } },
    },
  });

  const bounties: LiveBounty[] = raw.map((b) => {
    const tags = skillsToTags(b.skills);
    const daysLeft = b.deadline
      ? Math.max(
          1,
          Math.ceil((b.deadline.getTime() - now.getTime()) / 86_400_000),
        )
      : null;
    const reward = b.rewardAmount ?? b.usdValue ?? null;
    return {
      title: b.title,
      slug: b.slug,
      sponsor: b.sponsor?.name ?? 'Sponsor',
      cat: tags[0] ?? (b.type === 'project' ? 'Project' : 'Bounty'),
      reward,
      prizeLabel: reward != null ? `$${formatNumberWithSuffix(reward)}` : undefined,
      token: b.token ?? 'USDC',
      tags,
      daysLeft,
    };
  });

  return { props: { bounties } };
};
