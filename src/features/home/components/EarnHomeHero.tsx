import { usePrivy } from '@privy-io/react-auth';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';

import { TokenIcon } from '@/components/ui/token-icon';
import { useUser } from '@/store/user';
import { cn } from '@/utils/cn';
import { formatNumberWithSuffix } from '@/utils/formatNumberWithSuffix';
import { timeAgoShort } from '@/utils/timeAgo';

import { homeFeedQuery } from '@/features/feed/queries/home-feed';
import { totalsQuery } from '@/features/home/queries/totals';
import { userStatsQuery } from '@/features/home/queries/user-stats';
import { recentEarnersQuery } from '@/features/listings/queries/recent-earners';
import { EarnAvatar } from '@/features/talent/components/EarnAvatar';

const FLIP_INTERVAL = 4200;
const FLIP_DURATION = 300;

// One small, animated micro-label used as a kicker across every face.
const Kicker = ({ children }: { children: React.ReactNode }) => (
  <span className="font-secondary flex items-center gap-2 text-[10px] font-bold tracking-[0.18em] text-[#6b5e50] uppercase">
    <span className="inline-block size-[7px] bg-[#ce4a2b]" />
    {children}
  </span>
);

interface Face {
  href: string;
  render: () => React.ReactNode;
}

function ActivityFlipStack() {
  const { user } = useUser();
  const { authenticated } = usePrivy();

  const { data: totals } = useQuery(totalsQuery);
  const { data: recentEarners } = useQuery(recentEarnersQuery);
  const { data: feed } = useQuery(homeFeedQuery);
  const { data: userStats } = useQuery({
    ...userStatsQuery,
    enabled: !!authenticated,
  });

  const [index, setIndex] = useState(0);
  const [flipping, setFlipping] = useState(false);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const outTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => setReducedMotion(mq.matches);
    onChange();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const earner = recentEarners?.[0] as
    | {
        id?: string;
        firstName?: string;
        lastName?: string;
        photo?: string;
        reward?: number;
        rewardToken?: string;
        title?: string;
      }
    | undefined;
  const submission = feed?.[0];

  const submissionAction = (() => {
    if (!submission) return 'just took an action';
    const t = submission.listing?.type;
    if (submission.isWinner && submission.listing?.isWinnersAnnounced) {
      return t === 'project' ? 'just got selected' : 'just won';
    }
    return t === 'project' ? 'just applied to a project' : 'just submitted';
  })();

  const faces = useMemo<Face[]>(() => {
    const list: Face[] = [
      {
        href: '/earn/leaderboard',
        render: () => (
          <>
            <Kicker>Recent earner</Kicker>
            <div className="mt-4 flex items-center gap-3">
              <EarnAvatar
                id={earner?.id ?? 'earner'}
                avatar={earner?.photo}
                className="size-11"
              />
              <div className="min-w-0">
                <p className="truncate text-[15px] font-bold text-[#1d1815]">
                  {earner
                    ? `${earner.firstName ?? ''} ${earner.lastName ?? ''}`.trim()
                    : 'A new earner'}
                </p>
                <p className="truncate text-[12px] text-[#6b5e50]">
                  {earner?.title ?? 'on Future of Work'}
                </p>
              </div>
            </div>
            <div className="mt-auto flex items-end justify-between">
              <span className="font-secondary flex items-center gap-1.5 text-[20px] font-extrabold text-[#ce4a2b]">
                <TokenIcon
                  className="size-4 rounded-full"
                  alt={earner?.rewardToken ?? 'token'}
                  symbol={earner?.rewardToken}
                />
                {formatNumberWithSuffix(earner?.reward ?? 0)}
                <span className="text-[12px] font-bold text-[#6b5e50]">
                  {earner?.rewardToken ?? 'USDC'}
                </span>
              </span>
              <span className="font-secondary text-[10px] font-bold tracking-[0.1em] text-[#6b5e50] uppercase">
                Leaderboard &rarr;
              </span>
            </div>
          </>
        ),
      },
      {
        href: '/earn/feed?filter=new',
        render: () => (
          <>
            <Kicker>Just now</Kicker>
            <div className="mt-4">
              <p className="text-[15px] font-bold text-[#1d1815]">
                {submission
                  ? `${submission.user.firstName} ${submission.user.lastName}`.trim()
                  : 'Someone'}
                {submission?.user?.username && (
                  <span className="ml-1.5 text-[12px] font-medium text-[#6b5e50]">
                    @{submission.user.username}
                  </span>
                )}
              </p>
              <p className="font-serif mt-1 text-[19px] leading-snug font-semibold text-[#ce4a2b] italic">
                {submissionAction}
              </p>
            </div>
            <div className="mt-auto flex items-end justify-between">
              <span className="text-[12px] text-[#6b5e50]">
                {submission ? timeAgoShort(submission.createdAt) : 'moments ago'}
              </span>
              <span className="font-secondary text-[10px] font-bold tracking-[0.1em] text-[#6b5e50] uppercase">
                See the feed &rarr;
              </span>
            </div>
          </>
        ),
      },
      {
        href: '/earn/all',
        render: () => (
          <>
            <Kicker>Live right now</Kicker>
            <div className="mt-3">
              <p className="font-serif text-[44px] leading-none font-semibold tracking-[-0.02em] text-[#1d1815]">
                <span className="text-[26px] text-[#6b5e50]">$</span>
                {formatNumberWithSuffix(totals?.totalInUSD ?? 0)}
              </p>
              <p className="mt-2 text-[13px] text-[#6b5e50]">
                up for grabs across{' '}
                <b className="font-bold text-[#1d1815]">
                  {totals?.count ?? 0} open listings
                </b>
              </p>
            </div>
            <div className="mt-auto flex items-center justify-end">
              <span className="font-secondary text-[10px] font-bold tracking-[0.1em] text-[#6b5e50] uppercase">
                Browse all &rarr;
              </span>
            </div>
          </>
        ),
      },
    ];

    if (authenticated && user?.isTalentFilled) {
      list.push({
        href: '/earn/t/' + (user?.username ?? ''),
        render: () => (
          <>
            <Kicker>Your wallet</Kicker>
            <div className="mt-3">
              <p className="font-serif text-[44px] leading-none font-semibold tracking-[-0.02em] text-[#1d1815]">
                <span className="text-[26px] text-[#6b5e50]">$</span>
                {formatNumberWithSuffix(userStats?.totalWinnings ?? 0)}
              </p>
              <p className="mt-2 text-[13px] text-[#6b5e50]">
                earned across{' '}
                <b className="font-bold text-[#1d1815]">
                  {userStats?.wins ?? 0} wins
                </b>{' '}
                &middot; {userStats?.participations ?? 0} entries
              </p>
            </div>
            <div className="mt-auto flex items-center justify-end">
              <span className="font-secondary text-[10px] font-bold tracking-[0.1em] text-[#6b5e50] uppercase">
                Your profile &rarr;
              </span>
            </div>
          </>
        ),
      });
    } else {
      list.push({
        href: '/earn/new/talent',
        render: () => (
          <>
            <Kicker>Your wallet</Kicker>
            <div className="mt-4">
              <p className="font-serif text-[24px] leading-tight font-semibold text-[#1d1815]">
                Your earnings start here.
              </p>
              <p className="mt-2 text-[13px] text-[#6b5e50]">
                Build a profile, submit work, and watch this number climb.
              </p>
            </div>
            <div className="mt-auto flex items-center justify-end">
              <span className="font-secondary rounded-md bg-[#ce4a2b] px-3 py-1.5 text-[10px] font-bold tracking-[0.1em] text-[#f4eee3] uppercase shadow-[3px_3px_0_#1d1815]">
                Sign up to earn &rarr;
              </span>
            </div>
          </>
        ),
      });
    }

    return list;
  }, [earner, submission, submissionAction, totals, userStats, authenticated, user]);

  const count = faces.length;

  useEffect(() => {
    if (paused || reducedMotion || count <= 1) return;
    const cycle = setInterval(() => {
      setFlipping(true);
      outTimer.current = setTimeout(() => {
        setIndex((i) => (i + 1) % count);
        setFlipping(false);
      }, FLIP_DURATION - 20);
    }, FLIP_INTERVAL);
    return () => {
      clearInterval(cycle);
      if (outTimer.current) clearTimeout(outTimer.current);
    };
  }, [paused, reducedMotion, count]);

  const active = faces[index % count]!;

  return (
    <div
      className="relative w-full max-w-[420px]"
      style={{ perspective: '1400px' }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* stacked cards behind for depth */}
      <div className="absolute inset-0 translate-x-3 translate-y-3 rounded-xl border-2 border-[#1d1815] bg-[#e3d8c6]" />
      <div className="absolute inset-0 translate-x-1.5 translate-y-1.5 rounded-xl border-2 border-[#1d1815] bg-[#ece2d2]" />

      {/* flipping front card */}
      <Link
        href={active.href}
        className="relative block min-h-[188px]"
        style={{
          transform: flipping ? 'rotateX(-90deg)' : 'rotateX(0deg)',
          opacity: flipping ? 0 : 1,
          transformOrigin: 'center center',
          transition: reducedMotion
            ? 'none'
            : `transform ${FLIP_DURATION}ms cubic-bezier(0.4, 0, 0.2, 1), opacity ${FLIP_DURATION}ms ease`,
        }}
      >
        <div className="flex min-h-[188px] flex-col rounded-xl border-2 border-[#1d1815] bg-[#f4eee3] p-5 text-[#1d1815] shadow-[6px_6px_0_#1d1815]">
          {active.render()}
        </div>
      </Link>

      {/* progress dots */}
      <div className="mt-4 flex items-center justify-center gap-2">
        {faces.map((_, i) => (
          <button
            key={i}
            aria-label={`Show card ${i + 1}`}
            onClick={() => {
              if (i === index) return;
              setFlipping(true);
              if (outTimer.current) clearTimeout(outTimer.current);
              outTimer.current = setTimeout(() => {
                setIndex(i);
                setFlipping(false);
              }, FLIP_DURATION - 20);
            }}
            className={cn(
              'h-1.5 rounded-full transition-all duration-300',
              i === index ? 'w-6 bg-[#f4eee3]' : 'w-1.5 bg-[#f4eee3]/40',
            )}
          />
        ))}
      </div>
    </div>
  );
}

export function EarnHomeHero() {
  const { user } = useUser();
  const { authenticated } = usePrivy();
  const { data: totals } = useQuery(totalsQuery);

  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
  }, []);

  const hour = now?.getHours() ?? 9;
  const timeOfDay =
    hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
  const dateLabel = now
    ? now.toLocaleDateString('en-US', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      })
    : 'Future of Work';

  const firstName = authenticated ? user?.firstName : undefined;

  return (
    <div className="mb-9 grid grid-cols-1 gap-x-10 gap-y-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
      {/* greeting + summary */}
      <div>
        <div className="font-secondary flex items-center gap-2.5 text-[11px] font-bold tracking-[0.24em] text-[#e6a12b] uppercase">
          <span className="inline-block h-0.5 w-6 bg-[#e6a12b]" />
          {dateLabel}
        </div>
        <h1 className="font-serif mt-4 text-[clamp(32px,4.4vw,52px)] leading-[1.0] font-semibold tracking-[-0.02em] text-[#f4eee3]">
          Good {timeOfDay}
          {firstName ? (
            <>
              ,<br />
              <span className="font-medium text-[#e6a12b] italic">
                {firstName}.
              </span>
            </>
          ) : (
            <span className="text-[#e6a12b]">.</span>
          )}
        </h1>
        <p className="mt-4 max-w-[480px] text-[15px] leading-relaxed text-[#e7d3c1]">
          There{' '}
          {totals?.count === 1 ? 'is' : 'are'}{' '}
          <b className="font-bold text-[#f4eee3]">
            {totals?.count ?? 0} opportunit
            {totals?.count === 1 ? 'y' : 'ies'}
          </b>{' '}
          live right now worth{' '}
          <b className="font-bold text-[#f4eee3]">
            ${formatNumberWithSuffix(totals?.totalInUSD ?? 0)}
          </b>
          . Find one, submit your work, get paid.
        </p>
      </div>

      {/* flipping activity stack */}
      <div className="flex justify-start lg:justify-end">
        <ActivityFlipStack />
      </div>
    </div>
  );
}
