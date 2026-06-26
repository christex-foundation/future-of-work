import { type GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import { useEffect, useState, useTransition } from 'react';

import { type PrismaUserWithoutKYC } from '@/interface/user';
import { Default } from '@/layouts/Default';
import { Meta } from '@/layouts/Meta';
import { prisma } from '@/prisma';
import {
  type TalentRankingSkills,
  type TalentRankingTimeframe,
} from '@/prisma/enums';
import { type TalentRankingsWhereInput } from '@/prisma/models/TalentRankings';

import { getPrivyToken } from '@/features/auth/utils/getPrivyToken';
import { HomepagePop } from '@/features/conversion-popups/components/HomepagePop';
import { FilterRow } from '@/features/leaderboard/components/FilterRow';
import { Pagination } from '@/features/leaderboard/components/Pagination';
import { RanksTable } from '@/features/leaderboard/components/RanksTable';
import {
  type RowType,
  type SKILL,
  type TIMEFRAME,
} from '@/features/leaderboard/types';
import { getSubskills, skillCategories } from '@/features/leaderboard/utils';

const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.82' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.4'/%3E%3C/svg%3E\")";

interface Props {
  results: RowType[];
  skill: SKILL;
  timeframe: TIMEFRAME;
  page: number;
  count: number;
  userRank: RowType | null;
  search?: string;
}

function TalentLeaderboard({
  results,
  skill: curSkill,
  timeframe: curTimeframe,
  page: curPage,
  count,
  userRank,
  search: curSearch,
}: Props) {
  const [timeframe, setTimeframe] = useState<TIMEFRAME>(curTimeframe);
  const [skill, setSkill] = useState<SKILL>(curSkill);
  const [page, setPage] = useState(curPage);
  const [search, setSearch] = useState(curSearch || '');
  const [loading, setLoading] = useState(false);
  const [isSearchLoading, setIsSearchLoading] = useState(false);

  const [, startTransition] = useTransition();
  const router = useRouter();

  const handleStart = (url: string) => {
    if (url !== router.asPath) {
      setLoading(true);
      setIsSearchLoading(true);
    }
  };

  const handleComplete = (url: string) => {
    if (url === router.asPath) {
      setLoading(false);
      setIsSearchLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      setLoading(false);
      setIsSearchLoading(false);
    };
  }, []);

  useEffect(() => {
    router.events.on('routeChangeStart', handleStart);
    router.events.on('routeChangeComplete', handleComplete);
    router.events.on('routeChangeError', handleComplete);

    return () => {
      router.events.off('routeChangeStart', handleStart);
      router.events.off('routeChangeComplete', handleComplete);
      router.events.off('routeChangeError', handleComplete);
    };
  }, [router]);

  useEffect(() => {
    const url = new URL(window.location.href);

    if (url.searchParams.get('skill') !== skill)
      url.searchParams.set('skill', skill);

    if (url.searchParams.get('timeframe') !== timeframe)
      url.searchParams.set('timeframe', timeframe);

    if (Number(url.searchParams.get('page')) !== page)
      url.searchParams.set('page', String(page));

    if (url.searchParams.get('search') !== search)
      url.searchParams.set('search', search);

    startTransition(() => {
      router.replace(`?${url.searchParams.toString()}`, undefined, {
        scroll: false,
      });
    });
  }, [skill, timeframe, page, search]);

  return (
    <Default
      className="bg-[#FBF7EF]"
      meta={
        <Meta
          title={`Talent Leaderboard | Future of Work`}
          description={`Where you stand among the top builders on Future of Work — a published ranking by total earned, refreshed weekly and paid in USDC.`}
        />
      }
    >
      <HomepagePop />
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.42] mix-blend-multiply"
        style={{ backgroundImage: GRAIN }}
      />
      <div className="relative z-[1] mx-auto w-full max-w-[1200px] px-5 pb-24 md:px-10">
        {/* hero */}
        <section className="max-w-[780px] pt-12 md:pt-16">
          <span className="flex items-center gap-2.5 text-[12px] font-semibold tracking-[0.2em] text-[#6B7A4F] uppercase before:h-[1.5px] before:w-[18px] before:bg-[#6B7A4F] before:content-['']">
            The Leaderboard
          </span>
          <h1 className="mt-4 font-serif text-[clamp(36px,5vw,58px)] leading-[1.02] font-normal tracking-[-0.025em] text-[#221A14]">
            Where you stand among{' '}
            <em className="text-[#C4502E] italic">the top builders.</em>
          </h1>
          <p className="mt-3.5 max-w-[60ch] text-[18px] leading-[1.5] text-[#5C5147]">
            A published ranking of every contributor by total earned — across
            public bounties, projects and hackathon tracks. Refreshed weekly,
            paid in USDC.
          </p>
        </section>

        <div className="mt-9 flex w-full flex-col items-start gap-3">
          <FilterRow
            skill={skill}
            setSkill={(value: SKILL) => setSkill(value)}
            timeframe={timeframe}
            setTimeframe={(value: TIMEFRAME) => setTimeframe(value)}
            onSearch={setSearch}
            isSearchLoading={isSearchLoading}
            search={curSearch || ''}
          />
          <RanksTable
            loading={loading}
            userRank={userRank}
            skill={skill}
            rankings={results}
            search={search}
          />
          <Pagination
            count={count}
            page={page}
            setPage={(v: number) => setPage(v)}
          />
        </div>
      </div>
    </Default>
  );
}

export default TalentLeaderboard;

export const getServerSideProps: GetServerSideProps = async ({
  query,
  req,
}) => {
  const skill = (query.skill || 'ALL') as TalentRankingSkills;
  const timeframe = (query.timeframe || 'ALL_TIME') as TalentRankingTimeframe;
  const search = (query.search as string) || '';
  let page = Number(query.page) || 1;
  if (page < 1) page = 1;

  const privyDid = await getPrivyToken(req);
  let user: PrismaUserWithoutKYC | null = null;

  if (privyDid) {
    user = (await prisma.user.findUnique({
      where: { privyDid },
    })) as PrismaUserWithoutKYC | null;
  }

  const PAGE_SIZE = 10;

  const whereClause: TalentRankingsWhereInput = {
    skill,
    timeframe,
    ...(search
      ? {
          OR: [
            { user: { username: { contains: search } } },
            { user: { firstName: { contains: search } } },
            { user: { lastName: { contains: search } } },
          ],
        }
      : {}),
  };

  const count = await prisma.talentRankings.count({
    where: whereClause,
  });
  const totalPages = Math.ceil(count / PAGE_SIZE);
  if (page < 1 || page > totalPages) {
    page = 1;
  }
  const results = await prisma.talentRankings.findMany({
    where: whereClause,
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
    orderBy: {
      rank: 'asc',
    },
    include: {
      user: {
        select: {
          photo: true,
          firstName: true,
          lastName: true,
          username: true,
          skills: true,
          location: true,
        },
      },
    },
  });

  let userRank: (typeof results)[0] | null = null;
  let formatterUserRank: RowType | null = null;
  if (user && !results.find((c) => c.userId === user?.id)) {
    userRank = await prisma.talentRankings.findFirst({
      where: {
        skill,
        timeframe,
        userId: user?.id,
      },
      include: {
        user: {
          select: {
            photo: true,
            firstName: true,
            lastName: true,
            username: true,
            skills: true,
            location: true,
          },
        },
      },
    });
    if (userRank) {
      formatterUserRank = {
        rank: userRank.rank,
        skills: getSubskills(
          userRank.user.skills as any,
          skillCategories[skill],
        ),
        username: userRank.user.username,
        name: userRank.user.firstName + ' ' + userRank.user.lastName,
        pfp: userRank.user.photo,
        dollarsEarned: userRank.totalEarnedInUSD,
        winRate: userRank.winRate,
        submissions: userRank.submissions,
        wins: userRank.wins,
      };
    }
  }

  return {
    props: {
      results: results.map((result) => ({
        rank: result.rank,
        skills: getSubskills(result.user.skills as any, skillCategories[skill]),
        username: result.user.username,
        name: result.user.firstName + ' ' + result.user.lastName,
        pfp: result.user.photo,
        dollarsEarned: result.totalEarnedInUSD,
        winRate: result.winRate,
        submissions: result.submissions,
        wins: result.wins,
      })),
      skill,
      timeframe,
      page,
      count,
      userRank: formatterUserRank,
      search,
    },
  };
};
