'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useMemo } from 'react';

import { api } from '@/lib/api';
import { useUser } from '@/store/user';
import { formatNumberWithSuffix } from '@/utils/formatNumberWithSuffix';

import {
  goodFirstBounties,
  parseSkills,
  type ScorableBounty,
} from '@/features/listings/utils/bountyMatch';
import {
  DaybreakBountyCard,
  type LiveBounty,
} from '@/features/stfun/components/daybreak/DaybreakBountyCard';

type Listing = {
  title: string;
  slug: string;
  rewardAmount?: number | null;
  usdValue?: number | null;
  token?: string | null;
  type?: string | null;
  skills?: unknown;
  deadline?: string | null;
  sponsor?: { name?: string | null } | null;
  _count?: { Submission?: number } | null;
};

function skillNames(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((s) =>
      s && typeof s === 'object' && 'skills' in s
        ? (s as { skills?: string }).skills
        : typeof s === 'string'
          ? s
          : undefined,
    )
    .filter((s): s is string => Boolean(s))
    .slice(0, 3);
}

function toCard(l: Listing): LiveBounty {
  const tags = skillNames(l.skills);
  const reward = l.rewardAmount ?? l.usdValue ?? null;
  const now = Date.now();
  const daysLeft = l.deadline
    ? Math.max(1, Math.ceil((new Date(l.deadline).getTime() - now) / 86_400_000))
    : null;
  return {
    title: l.title,
    slug: l.slug,
    sponsor: l.sponsor?.name ?? 'Sponsor',
    cat: tags[0] ?? (l.type === 'project' ? 'Project' : 'Bounty'),
    reward: null,
    prizeLabel: reward != null ? `$${formatNumberWithSuffix(reward)}` : '—',
    token: l.token ?? 'USDC',
    tags,
    daysLeft,
    status: 'Good first',
  };
}

/**
 * "Good first bounties" rail — clear briefs, better odds, matched to the
 * user's skills (from the get-to-know-you quiz). Pure reuse of existing
 * listings data + the bountyMatch scorer; hides itself when there's nothing
 * beginner-friendly to show.
 */
export function StartHereRail() {
  const { user, isLoading } = useUser();

  const { data: listings = [] } = useQuery<Listing[]>({
    queryKey: ['start-here-listings'],
    queryFn: async () => (await api.get('/api/listings')).data,
    staleTime: 1000 * 60 * 5,
  });

  const picks = useMemo(() => {
    const skills = parseSkills(user?.skills);
    const scorable: (ScorableBounty & { _l: Listing })[] = listings.map((l) => ({
      skills: l.skills,
      type: l.type,
      rewardAmount: l.rewardAmount,
      usdValue: l.usdValue,
      submissionCount: l._count?.Submission ?? 0,
      _l: l,
    }));
    return goodFirstBounties(scorable, skills, 3).map((x) => x._l);
  }, [listings, user?.skills]);

  // Only for signed-in FIRST-TIME users — NOT a default section. Hidden for
  // logged-out visitors and for returning/established users.
  if (isLoading) return null;
  const isNewcomer =
    !!user && !user.surveysShown?.onboarding && !user.isTalentFilled;
  if (!isNewcomer) return null;
  if (picks.length < 2) return null;

  return (
    <section
      className="mb-12"
      style={{ fontFamily: 'var(--font-hanken), sans-serif' }}
    >
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <span className="flex items-center gap-2.5 text-[12px] font-semibold tracking-[0.18em] text-[#C4502E] uppercase">
            <span className="inline-block size-[7px] rounded-full bg-[#8FA37E]" />
            New here? Start here
          </span>
          <h2 className="mt-3 font-serif text-[clamp(24px,3vw,32px)] leading-tight font-normal tracking-[-0.01em] text-[#221A14]">
            Good first bounties — <span className="text-[#C4502E] italic">better odds</span>.
          </h2>
        </div>
        <Link
          href="/earn/all"
          className="hidden text-[13.5px] font-semibold whitespace-nowrap text-[#6B7A4F] hover:text-[#C4502E] sm:block"
        >
          Browse all →
        </Link>
      </div>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {picks.map((l) => (
          <DaybreakBountyCard key={l.slug} bounty={toCard(l)} />
        ))}
      </div>
    </section>
  );
}
