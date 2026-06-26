import { Plus } from 'lucide-react';

import { useServerTimeSync } from '@/hooks/use-server-time';
import { useUser } from '@/store/user';

import { type ListingWithSubmissions } from '@/features/listings/types';
import {
  DaybreakBountyCard,
  type LiveBounty,
  toLiveBounty,
} from '@/features/listings/utils/toLiveBounty';

function dashboardHref(listing: ListingWithSubmissions): string {
  if (listing.type === 'grant') {
    return `/earn/dashboard/grants/${listing.slug}/applications/`;
  }
  if (listing.isPublished) {
    return `/earn/dashboard/listings/${listing.slug}/submissions/`;
  }
  return `/earn/dashboard/listings/${listing.slug}/edit`;
}

export function ListingBoard({
  listings,
  onCreate,
}: {
  listings: ListingWithSubmissions[];
  onCreate: () => void;
}) {
  const { user } = useUser();
  const { serverTime } = useServerTimeSync();
  const sponsor = user?.currentSponsor;

  return (
    <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {listings.map((listing, i) => {
        const base = toLiveBounty(listing, serverTime());
        const bounty: LiveBounty = {
          ...base,
          sponsor: sponsor?.name ?? base.sponsor,
          sponsorLogo: sponsor?.logo ?? base.sponsorLogo,
          submissions: listing.submissionCount ?? base.submissions,
        };
        return (
          <DaybreakBountyCard
            key={listing.id ?? i}
            bounty={bounty}
            href={dashboardHref(listing)}
          />
        );
      })}
      <button
        onClick={onCreate}
        className="group flex min-h-[240px] flex-col items-center justify-center gap-3 rounded-[18px] border border-dashed border-[#E6DCC9] bg-[#FFFDF8]/45 text-[#5C5147] transition-all duration-200 hover:border-[#2C3A2E] hover:bg-[#FFFDF8] hover:text-[#2C3A2E]"
      >
        <span className="grid size-12 place-items-center rounded-full border border-current">
          <Plus className="size-5" />
        </span>
        <span className="font-serif text-[18px] font-medium text-inherit">
          Post a new listing
        </span>
        <span className="font-secondary text-[11px] font-bold tracking-[0.1em] uppercase">
          Bounty · Project · Quest
        </span>
      </button>
    </div>
  );
}
