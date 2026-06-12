import { usePrivy } from '@privy-io/react-auth';
import { useQuery } from '@tanstack/react-query';
import { motion, useReducedMotion } from 'motion/react';
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

const DEAL_INTERVAL = 3800;

// Fanned positions, front (slot 0) on top. Cards peek toward the bottom-right.
const SLOTS = [
  { x: 0, y: 0, scale: 1, rotate: 0, opacity: 1 },
  { x: 18, y: 16, scale: 0.96, rotate: 2.5, opacity: 1 },
  { x: 34, y: 30, scale: 0.92, rotate: 5, opacity: 0.9 },
  { x: 34, y: 30, scale: 0.92, rotate: 5, opacity: 0 },
];

const Kicker = ({ children }: { children: React.ReactNode }) => (
  <span className="font-secondary flex items-center gap-2 text-[10px] font-bold tracking-[0.18em] text-[#6b5e50] uppercase">
    <span className="inline-block size-[7px] bg-[#ce4a2b]" />
    {children}
  </span>
);

interface Face {
  id: string;
  href: string;
  render: () => React.ReactNode;
}

function ActivityDeck() {
  const { user } = useUser();
  const { authenticated } = usePrivy();
  const reducedMotion = useReducedMotion();

  const { data: totals } = useQuery(totalsQuery);
  const { data: recentEarners } = useQuery(recentEarnersQuery);
  const { data: feed } = useQuery(homeFeedQuery);
  const { data: userStats } = useQuery({
    ...userStatsQuery,
    enabled: !!authenticated,
  });

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

  const openCount = totals?.openCount ?? totals?.count ?? 0;
  const openInUSD = totals?.openInUSD ?? 0;

  const faces = useMemo<Face[]>(() => {
    const list: Face[] = [
      {
        id: 'earner',
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
              <span className="font-secondary flex items-center gap-1.5 text-[22px] font-extrabold text-[#ce4a2b]">
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
        id: 'submission',
        href: '/earn/feed?filter=new',
        render: () => (
          <>
            <Kicker>Just now</Kicker>
            <div className="mt-4">
              <p className="text-[15px] font-bold text-[#1d1815]">
                {submission?.user
                  ? `${submission.user.firstName ?? ''} ${submission.user.lastName ?? ''}`.trim() ||
                    'Someone'
                  : 'Someone'}
                {submission?.user?.username && (
                  <span className="ml-1.5 text-[12px] font-medium text-[#6b5e50]">
                    @{submission.user.username}
                  </span>
                )}
              </p>
              <p className="font-serif mt-1 text-[20px] leading-snug font-semibold text-[#ce4a2b] italic">
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
        id: 'live',
        href: '/earn/all',
        render: () => (
          <>
            <Kicker>Up for grabs</Kicker>
            <div className="mt-3">
              <p className="font-serif text-[48px] leading-none font-semibold tracking-[-0.02em] text-[#1d1815]">
                <span className="text-[28px] text-[#6b5e50]">$</span>
                {formatNumberWithSuffix(openInUSD)}
              </p>
              <p className="mt-2 text-[13px] text-[#6b5e50]">
                live across{' '}
                <b className="font-bold text-[#1d1815]">
                  {openCount} open listing{openCount === 1 ? '' : 's'}
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
        id: 'wallet',
        href: '/earn/t/' + (user?.username ?? ''),
        render: () => (
          <>
            <Kicker>Your wallet</Kicker>
            <div className="mt-3">
              <p className="font-serif text-[48px] leading-none font-semibold tracking-[-0.02em] text-[#1d1815]">
                <span className="text-[28px] text-[#6b5e50]">$</span>
                {formatNumberWithSuffix(userStats?.totalWinnings ?? 0)}
              </p>
              <p className="mt-2 text-[13px] text-[#6b5e50]">
                earned across{' '}
                <b className="font-bold text-[#1d1815]">
                  {userStats?.wins ?? 0} win{userStats?.wins === 1 ? '' : 's'}
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
        id: 'wallet',
        href: '/earn/new/talent',
        render: () => (
          <>
            <Kicker>Your wallet</Kicker>
            <div className="mt-4">
              <p className="font-serif text-[26px] leading-tight font-semibold text-[#1d1815]">
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
  }, [earner, submission, submissionAction, openCount, openInUSD, userStats, authenticated, user]);

  const count = faces.length;

  // order[0] is the front card; the rest fan out behind it.
  const [order, setOrder] = useState<number[]>(() =>
    Array.from({ length: count }, (_, i) => i),
  );
  const [dealing, setDealing] = useState<number | null>(null);
  const [paused, setPaused] = useState(false);
  const orderRef = useRef(order);
  orderRef.current = order;
  const dealTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep the order array in sync if the number of faces changes (auth state).
  useEffect(() => {
    setOrder(Array.from({ length: count }, (_, i) => i));
  }, [count]);

  useEffect(() => {
    if (paused || reducedMotion || count <= 1) return;
    const cycle = setInterval(() => {
      // Fling the current front card up before tucking it to the back.
      setDealing(orderRef.current[0]!);
      dealTimer.current = setTimeout(() => {
        setOrder((p) => [...p.slice(1), p[0]!]);
        setDealing(null);
      }, 240);
    }, DEAL_INTERVAL);
    return () => {
      clearInterval(cycle);
      if (dealTimer.current) clearTimeout(dealTimer.current);
    };
  }, [paused, reducedMotion, count]);

  return (
    <div
      className="relative w-full max-w-[460px]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="relative h-[212px] w-full">
        {faces.map((face, faceIndex) => {
          const slot = order.indexOf(faceIndex);
          const s = SLOTS[Math.min(slot, SLOTS.length - 1)]!;
          const isDealing = dealing === faceIndex;
          const isFront = slot === 0 && dealing === null;

          return (
            <motion.div
              key={face.id}
              className="absolute inset-0"
              style={{ zIndex: isDealing ? 60 : count - slot }}
              initial={false}
              animate={
                isDealing
                  ? { x: 40, y: -58, scale: 1.05, rotate: -11, opacity: 1 }
                  : {
                      x: s.x,
                      y: s.y,
                      scale: s.scale,
                      rotate: s.rotate,
                      opacity: s.opacity,
                    }
              }
              transition={
                reducedMotion
                  ? { duration: 0 }
                  : isDealing
                    ? { duration: 0.24, ease: 'easeOut' }
                    : { type: 'spring', stiffness: 240, damping: 24 }
              }
            >
              <Link
                href={face.href}
                tabIndex={isFront ? 0 : -1}
                className={cn(
                  'flex h-[212px] flex-col rounded-xl border-2 border-[#1d1815] bg-[#f4eee3] p-5 text-[#1d1815] shadow-[6px_6px_0_#1d1815]',
                  !isFront && 'pointer-events-none',
                )}
              >
                {face.render()}
              </Link>
            </motion.div>
          );
        })}
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
  const openCount = totals?.openCount ?? totals?.count ?? 0;
  const openInUSD = totals?.openInUSD ?? 0;

  return (
    <div className="mb-10 grid grid-cols-1 gap-x-10 gap-y-9 lg:min-h-[30vh] lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
      {/* greeting + summary */}
      <div>
        <div className="font-secondary flex items-center gap-2.5 text-[11px] font-bold tracking-[0.24em] text-[#e6a12b] uppercase">
          <span className="inline-block h-0.5 w-6 bg-[#e6a12b]" />
          {dateLabel}
        </div>
        <h1 className="font-serif mt-4 text-[clamp(34px,4.8vw,56px)] leading-[1.0] font-semibold tracking-[-0.02em] text-[#f4eee3]">
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
          There {openCount === 1 ? 'is' : 'are'}{' '}
          <b className="font-bold text-[#f4eee3]">
            {openCount} opportunit{openCount === 1 ? 'y' : 'ies'}
          </b>{' '}
          live right now
          {openInUSD > 0 && (
            <>
              {' '}
              worth{' '}
              <b className="font-bold text-[#f4eee3]">
                ${formatNumberWithSuffix(openInUSD)}
              </b>
            </>
          )}
          . Find one, submit your work, get paid.
        </p>
      </div>

      {/* deck of activity cards */}
      <div className="flex justify-start lg:justify-end">
        <ActivityDeck />
      </div>
    </div>
  );
}
