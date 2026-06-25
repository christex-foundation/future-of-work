import { cn } from '@/utils/cn';
import { formatNumberWithSuffix } from '@/utils/formatNumberWithSuffix';
import { nthLabelGenerator } from '@/utils/rank';

import { BONUS_REWARD_POSITION } from '@/features/listing-builder/constants';

import { type Rewards } from '../../types';

export function PrizeSplit({
  rewards,
  rewardAmount,
  token,
  maxBonusSpots,
}: {
  rewards?: Rewards | null;
  rewardAmount?: number;
  token: string;
  maxBonusSpots: number;
}) {
  let entries = Object.entries(rewards ?? {})
    .map(([pos, amount]) => [Number(pos), Number(amount)] as const)
    .filter(([pos, amount]) => !isNaN(pos) && !isNaN(amount))
    .sort((a, b) => {
      if (a[0] === BONUS_REWARD_POSITION) return 1;
      if (b[0] === BONUS_REWARD_POSITION) return -1;
      return a[0] - b[0];
    });

  // Single-winner bounties carry only a total — show it as the first prize.
  if (entries.length === 0 && rewardAmount && rewardAmount > 0) {
    entries = [[1, rewardAmount] as const];
  }

  if (entries.length === 0) return null;

  return (
    <section>
      <h2 className="font-serif mb-[18px] text-[30px] leading-[1.1] font-normal tracking-[-0.01em]">
        Prize <em className="text-[#C4502E] italic">split</em>
      </h2>
      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3">
        {entries.map(([pos, amount], index) => {
          const isFirst = index === 0 && pos !== BONUS_REWARD_POSITION;
          const isBonus = pos === BONUS_REWARD_POSITION;
          const label = isBonus
            ? `Bonus${maxBonusSpots ? ` ×${maxBonusSpots}` : ''}`
            : `${nthLabelGenerator(pos, true)} place`;
          return (
            <div
              key={pos}
              className={cn(
                'relative rounded-2xl border bg-white px-5 py-6 text-center',
                isFirst
                  ? 'border-[#C4502E] bg-gradient-to-b from-white to-[#fdf3ec]'
                  : 'border-[#E6DCC9]',
              )}
            >
              <div className="text-[12px] font-semibold tracking-[0.14em] text-[#5C5147] uppercase">
                {label}
              </div>
              <div
                className={cn(
                  'font-serif mt-2 text-[40px] leading-tight font-normal',
                  isFirst ? 'text-[#C4502E]' : 'text-[#2C3A2E]',
                )}
              >
                ${formatNumberWithSuffix(amount, 2, true)}
              </div>
              <div className="mt-1 text-[12px] font-medium text-[#8a7f72]">
                {token}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
