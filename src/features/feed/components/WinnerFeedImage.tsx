import { ExternalImage } from '@/components/ui/cloudinary-image';
import { TokenIcon } from '@/components/ui/token-icon';
import { getRankLabels } from '@/utils/rank';

import { type Rewards } from '@/features/listings/types';

export const WinnerFeedImage = ({
  token,
  winnerPosition,
  rewards,
  grantApplicationAmount,
}: {
  token: string | undefined;
  winnerPosition: keyof Rewards | undefined;
  rewards: Rewards | undefined;
  grantApplicationAmount?: number;
}) => {
  return (
    <div className="flex h-[200px] w-full flex-col justify-center bg-[#C4502E] md:h-[350px]">
      <ExternalImage
        className="mx-auto h-9 w-9 md:h-16 md:w-16"
        alt="winner"
        src={'/icons/celebration.png'}
      />
      <div className="mt-4 flex w-full items-center justify-center gap-1.5 md:gap-3">
        <TokenIcon
          className="h-7 w-7 md:h-12 md:w-12"
          alt={`${token} icon`}
          symbol={token}
        />
        <p className="font-serif text-[28px] font-normal tracking-[-0.01em] text-[#FBF7EF] md:text-[52px]">
          {!!grantApplicationAmount ? (
            grantApplicationAmount
          ) : (
            <>
              {winnerPosition ? `${rewards?.[Number(winnerPosition)]}` : 'N/A'}
            </>
          )}{' '}
          {token}
        </p>
      </div>
      <p className="mx-auto my-4 w-fit rounded-full bg-[#FBF7EF]/15 px-4 py-1.5 text-[11px] font-semibold tracking-[0.14em] text-[#FBF7EF] uppercase md:text-sm">
        {!!grantApplicationAmount ? (
          'GRANT'
        ) : (
          <>{getRankLabels(Number(winnerPosition))?.toUpperCase()} PRIZE</>
        )}
      </p>
    </div>
  );
};
