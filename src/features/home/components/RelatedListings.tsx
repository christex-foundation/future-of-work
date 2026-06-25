import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { type ReactNode, useMemo } from 'react';

import { useServerTimeSync } from '@/hooks/use-server-time';
import { dayjs } from '@/utils/dayjs';
import { CompensationAmount } from '@/features/listings/components/ListingPage/CompensationAmount';
import { type Listing } from '@/features/listings/types';
import { liveListingsQuery } from '@/features/listings/queries/live-listings';
import { relatedlistingsQuery } from '@/features/listings/queries/related-listing';

interface LiveListingProps {
  children: ReactNode;
  listingId: string;
  isHackathon?: boolean;
  excludeIds?: string[];
  exclusiveSponsorId?: string;
}

const SHOW_LIMIT = 3;

function SimCard({ listing }: { listing: Listing }) {
  const { serverTime } = useServerTimeSync();
  const {
    title,
    slug,
    type,
    sponsor,
    deadline,
    token,
    rewardAmount,
    compensationType,
    minRewardAsk,
    maxRewardAsk,
    isWinnersAnnounced,
  } = listing;

  let dueLabel = 'Closing soon';
  if (deadline) {
    const ms = dayjs(deadline).diff(serverTime());
    if (ms <= 0) {
      dueLabel = isWinnersAnnounced ? 'Completed' : 'In review';
    } else {
      const d = Math.floor(ms / 86_400_000);
      const h = Math.floor((ms % 86_400_000) / 3_600_000);
      dueLabel = d >= 1 ? `${d}d ${h}h left` : `${h}h left`;
    }
  }

  const cat = type === 'project' ? 'Project' : 'Bounty';

  return (
    <Link
      href={`/earn/listing/${slug}`}
      className="group flex flex-col rounded-2xl border border-[#E6DCC9] bg-white p-6 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#d9ccb2] hover:no-underline hover:shadow-[0_12px_34px_-22px_rgba(54,38,22,0.45)]"
    >
      <span className="text-[11px] font-semibold tracking-[0.14em] text-[#2C3A2E] uppercase">
        {cat}
      </span>
      <h4 className="font-serif mt-2.5 line-clamp-2 text-[21px] leading-snug font-normal text-[#221A14]">
        {title}
      </h4>
      <div className="mt-auto flex items-center justify-between pt-4 text-[13px] text-[#5C5147]">
        <span className="truncate pr-2">
          {sponsor?.name} · {dueLabel}
        </span>
        <CompensationAmount
          compensationType={compensationType}
          rewardAmount={rewardAmount}
          minRewardAsk={minRewardAsk}
          maxRewardAsk={maxRewardAsk}
          token={token}
          isWinnersAnnounced={isWinnersAnnounced}
          className="font-serif shrink-0 text-[20px] font-normal text-[#C4502E]"
        />
      </div>
    </Link>
  );
}

export const RelatedListings = ({
  children,
  listingId,
  isHackathon = false,
  exclusiveSponsorId,
  excludeIds: ids,
}: LiveListingProps) => {
  const deadline = useMemo(() => dayjs().add(1, 'day').toISOString(), []);

  const { data: relatedListings } = useQuery(
    relatedlistingsQuery({
      take: SHOW_LIMIT,
      listingId,
    }),
  );

  const { data: liveListings } = useQuery(
    liveListingsQuery({
      take: SHOW_LIMIT,
      deadline,
      order: 'asc',
      type: isHackathon ? 'hackathon' : undefined,
      excludeIds: ids ? ids : undefined,
      exclusiveSponsorId,
    }),
  );

  const combinedListings = useMemo(() => {
    const related = relatedListings ?? [];
    if (related.length >= SHOW_LIMIT) return related.slice(0, SHOW_LIMIT);

    const relatedIds = new Set(related.map((l) => l.id));
    const remaining = (liveListings ?? [])
      .filter((l) => !relatedIds.has(l.id))
      .slice(0, SHOW_LIMIT - related.length);

    return [...related, ...remaining];
  }, [relatedListings, liveListings]);

  if (combinedListings.length === 0) return null;

  return (
    <div>
      {children}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {combinedListings.map((listing) => (
          <SimCard listing={listing} key={listing?.id} />
        ))}
      </div>
    </div>
  );
};
