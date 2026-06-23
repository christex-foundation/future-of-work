'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';

import { homeFeedQuery } from '@/features/feed/queries/home-feed';
import { type EarnBounty } from '@/features/home/types/earn-board';
import { recentEarnersQuery } from '@/features/listings/queries/recent-earners';
import { formatNumberWithSuffix } from '@/utils/formatNumberWithSuffix';

export function EarnSidebar({ closingSoon }: { closingSoon: EarnBounty[] }) {
  const { data: earners } = useQuery(recentEarnersQuery);
  const { data: feed } = useQuery(homeFeedQuery);

  const list = (
    (earners ?? []) as Array<{
      id?: string;
      firstName?: string;
      lastName?: string;
      reward?: number;
      rewardToken?: string;
    }>
  ).filter((e) => e.firstName);

  const acts = (feed ?? []).filter((f) => f.user).slice(0, 4);

  return (
    <div
      className="flex flex-col gap-5"
      style={{ fontFamily: 'var(--font-hanken), sans-serif' }}
    >
      {/* PANEL 1 — Top earners */}
      <div className="rounded-2xl border border-[#E6DCC9] bg-white p-6">
        <h4 className="font-serif text-[18px] font-medium text-[#221A14] mb-4 flex items-center gap-2.5">
          <span className="inline-block size-[7px] rounded-full bg-[#C4502E]" />
          Top earners
        </h4>
        {list.length ? (
          <>
            {list.slice(0, 5).map((e, i) => (
              <div key={e.id ?? i} className="flex items-center gap-3 py-2">
                <span className="font-serif text-[15px] text-[#C4502E] w-4">
                  {i + 1}
                </span>
                <span className="flex-1 text-[14px] text-[#221A14] truncate">
                  {e.firstName} {e.lastName}
                </span>
                <span className="font-serif text-[15px] text-[#2C3A2E]">
                  ${formatNumberWithSuffix(e.reward ?? 0)}
                </span>
              </div>
            ))}
            <Link
              href="/earn/leaderboard"
              className="mt-3 block text-[13px] font-semibold text-[#6B7A4F] hover:text-[#C4502E]"
            >
              View full leaderboard →
            </Link>
          </>
        ) : (
          <>
            <p className="text-[14px] text-[#5C5147]">
              Be the first to climb the board — submit and win.
            </p>
            <Link
              href="/earn/leaderboard"
              className="mt-3 block text-[13px] font-semibold text-[#6B7A4F] hover:text-[#C4502E]"
            >
              View full leaderboard →
            </Link>
          </>
        )}
      </div>

      {/* PANEL 2 — Recent activity */}
      <div className="rounded-2xl border border-[#E6DCC9] bg-white p-6">
        <h4 className="font-serif text-[18px] font-medium text-[#221A14] mb-4 flex items-center gap-2.5">
          <span className="inline-block size-[7px] rounded-full bg-[#C4502E]" />
          Recent activity
        </h4>
        {acts.length ? (
          acts.map((f, i) => {
            const user = f.user!;
            const action =
              f.isWinner && f.listing.isWinnersAnnounced
                ? f.listing.type === 'project'
                  ? 'was selected'
                  : 'just won a bounty'
                : f.listing.type === 'project'
                  ? 'applied to a project'
                  : 'just submitted';
            return (
              <div key={i} className="flex items-start gap-3 py-2.5">
                <div className="size-9 rounded-full bg-[#8FA37E] text-white grid place-items-center font-serif text-[13px] flex-none">
                  {user.firstName[0]}
                  {user.lastName[0]}
                </div>
                <p className="text-[13.5px] leading-snug text-[#5C5147]">
                  <b className="text-[#221A14] font-semibold">
                    {user.firstName} {user.lastName[0]}.
                  </b>{' '}
                  {action}
                </p>
              </div>
            );
          })
        ) : (
          <p className="text-[14px] text-[#5C5147]">
            Activity shows up here as builders submit and win.
          </p>
        )}
      </div>

      {/* PANEL 3 — Closing soon (forest-tinted) */}
      {closingSoon.length === 0 ? null : (
        <div className="rounded-2xl border border-[#2C3A2E] bg-[#2C3A2E] text-[#FBF7EF] p-6">
          <h4 className="font-serif text-[18px] font-medium text-[#FBF7EF] mb-4 flex items-center gap-2.5">
            <span className="inline-block size-[7px] rounded-full bg-[#8FA37E]" />
            Closing soon
          </h4>
          {closingSoon.slice(0, 4).map((b, i) => (
            <div
              key={b.slug ?? i}
              className="flex items-center justify-between gap-3 py-2.5 border-t border-[rgba(251,247,239,0.12)] first:border-t-0"
            >
              <span className="text-[13.5px] truncate text-[rgba(251,247,239,0.9)]">
                {b.title}
              </span>
              <span className="text-[12.5px] font-semibold text-[#E8B48E] whitespace-nowrap">
                {b.dueShort}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
