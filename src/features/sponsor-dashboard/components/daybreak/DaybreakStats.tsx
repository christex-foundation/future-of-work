import { useEffect, useState } from 'react';

import { Skeleton } from '@/components/ui/skeleton';

import { type SponsorStats } from '../../types';
import { SunGauge } from './SunGauge';

export interface ListingCounts {
  live: number;
  inReview: number;
  completed: number;
  published: number;
  completion: number; // 0..1
}

function useCountUp(target: number, run: boolean, duration = 1100) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!run) return;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(target * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, run, duration]);
  return value;
}

function StatCard({
  dot,
  label,
  value,
  money,
  meta,
  ready,
}: {
  dot: string;
  label: string;
  value: number | undefined;
  money?: boolean;
  meta: string;
  ready: boolean;
}) {
  const animated = useCountUp(value ?? 0, ready);
  return (
    <div className="flex flex-col justify-between rounded-[20px] border border-[#1d181517] bg-[#FBF7EE] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
      <p className="font-secondary flex items-center gap-2 text-[10px] font-bold tracking-[0.18em] text-[#6B5E50] uppercase">
        <span
          className="inline-block size-[7px] rounded-[3px]"
          style={{ background: dot }}
        />
        {label}
      </p>
      {ready ? (
        <p className="font-serif mt-3 text-[32px] leading-none font-semibold tracking-[-0.02em] text-[#1D1815]">
          {money && <span className="text-[18px] text-[#6B5E50]">$</span>}
          {Math.round(animated).toLocaleString('en-US')}
        </p>
      ) : (
        <Skeleton className="mt-3 h-8 w-20 bg-[#1d18150f]" />
      )}
      <p className="mt-2 text-[12px] text-[#6B5E50]">{meta}</p>
    </div>
  );
}

export function DaybreakStats({
  stats,
  counts,
  isLoading,
}: {
  stats: SponsorStats | undefined;
  counts: ListingCounts;
  isLoading: boolean;
}) {
  const ready = !isLoading;
  return (
    <div className="grid grid-cols-2 gap-3">
      {/* hero — sun gauge */}
      <div className="flex items-center gap-3.5 rounded-[20px] bg-[#123A33] p-4 text-[#FBF7EE]">
        <SunGauge
          value={counts.completion}
          size={76}
          stroke={8}
          label="Closed"
        />
        <div className="min-w-0">
          <p className="font-secondary text-[9.5px] font-bold tracking-[0.16em] text-[#E7D3C1] uppercase">
            Review progress
          </p>
          <p className="font-serif mt-1.5 text-[24px] leading-none font-semibold">
            {ready ? counts.completed : '—'}
            <span className="text-[15px] font-medium text-[#E7D3C1]">
              {' '}
              / {counts.published}
            </span>
          </p>
          <p className="mt-1.5 text-[11.5px] text-[#E7D3C1]/70">
            {counts.inReview} need{counts.inReview === 1 ? 's' : ''} a verdict
          </p>
        </div>
      </div>

      <StatCard
        dot="#123A33"
        label="Rewarded"
        value={stats?.totalRewardAmount}
        money
        meta="Paid to earners so far"
        ready={ready}
      />
      <StatCard
        dot="#E6A12B"
        label="Listings"
        value={stats?.totalListingsAndGrants}
        meta={`${counts.live} live · ${counts.inReview} in review`}
        ready={ready}
      />
      <StatCard
        dot="#CE4A2B"
        label="Submissions"
        value={stats?.totalSubmissionsAndApplications}
        meta="Across every listing"
        ready={ready}
      />
    </div>
  );
}
