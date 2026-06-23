import { usePrivy } from '@privy-io/react-auth';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import { totalsQuery } from '@/features/home/queries/totals';
import { useUser } from '@/store/user';
import { formatNumberWithSuffix } from '@/utils/formatNumberWithSuffix';

function StatTile({
  value,
  label,
  accent,
  solid,
}: {
  value: React.ReactNode;
  label: string;
  accent?: 'terra';
  solid?: boolean;
}) {
  if (solid) {
    return (
      <div className="rounded-2xl border border-[#2C3A2E] bg-[#2C3A2E] px-6 py-5">
        <div className="font-serif text-[clamp(30px,3.4vw,42px)] leading-none font-normal tracking-[-0.02em] text-[#FBF7EF]">
          {value}
        </div>
        <div className="mt-2.5 text-[13px] text-[#8FA37E]">{label}</div>
      </div>
    );
  }
  const color = accent === 'terra' ? '#C4502E' : '#221A14';
  return (
    <div className="rounded-2xl border border-[#E6DCC9] bg-[#F2EAD9]/55 px-6 py-5">
      <div
        className="font-serif text-[clamp(30px,3.4vw,42px)] leading-none font-normal tracking-[-0.02em]"
        style={{ color }}
      >
        {value}
      </div>
      <div className="mt-2.5 text-[13px] text-[#5C5147]">{label}</div>
    </div>
  );
}

export function EarnHomeHero({
  totalUsers,
  totalSponsors,
}: {
  totalUsers?: number;
  totalSponsors?: number;
}) {
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
  const firstName = authenticated ? user?.firstName : undefined;

  const openCount = totals?.openCount ?? totals?.count ?? 0;
  const openInUSD = totals?.openInUSD ?? 0;

  return (
    <div
      className="mb-12 grid grid-cols-1 items-center gap-x-12 gap-y-9 lg:grid-cols-[1.05fr_0.95fr]"
      style={{ fontFamily: 'var(--font-hanken), sans-serif' }}
    >
      {/* greeting + intro */}
      <div>
        <span className="flex items-center gap-2.5 text-[12px] font-semibold tracking-[0.18em] text-[#C4502E] uppercase">
          <span className="inline-block size-[7px] rounded-full bg-[#8FA37E]" />
          Good {timeOfDay}
          {firstName ? `, ${firstName}` : ''}
        </span>
        <h1 className="font-serif mt-5 text-[clamp(34px,5vw,60px)] leading-[1.02] font-normal tracking-[-0.02em] text-[#221A14]">
          Fresh work on the board,{' '}
          <span className="text-[#C4502E] italic">every morning</span>.
        </h1>
        <p className="mt-5 max-w-[460px] text-[16.5px] leading-relaxed text-[#5C5147]">
          New bounties posted daily. Filter by craft, follow the activity, and
          submit your best work.
        </p>
      </div>

      {/* live stat tiles */}
      <div className="grid grid-cols-2 gap-3.5">
        <StatTile accent="terra" value={openCount} label="Open bounties" />
        <StatTile
          value={<>${formatNumberWithSuffix(openInUSD)}</>}
          label="Up for grabs now"
        />
        <StatTile
          solid
          value={totalUsers != null ? formatNumberWithSuffix(totalUsers) : '—'}
          label="Builders earning"
        />
        <StatTile
          value={totalSponsors != null ? formatNumberWithSuffix(totalSponsors) : '—'}
          label="Companies hiring"
        />
      </div>
    </div>
  );
}
