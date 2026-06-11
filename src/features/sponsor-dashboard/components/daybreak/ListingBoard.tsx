import { Plus } from 'lucide-react';

import { type ListingWithSubmissions } from '@/features/listings/types';

import { ListingBoardCard } from './ListingBoardCard';

export function ListingBoard({
  listings,
  onCreate,
}: {
  listings: ListingWithSubmissions[];
  onCreate: () => void;
}) {
  return (
    <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {listings.map((listing, i) => (
        <ListingBoardCard key={listing.id ?? i} listing={listing} index={i} />
      ))}
      <button
        onClick={onCreate}
        className="group flex min-h-[240px] flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-[#1d1815]/35 bg-transparent text-[#6b5e50] transition-all duration-200 hover:border-[#ce4a2b] hover:text-[#ce4a2b]"
      >
        <span className="grid size-12 place-items-center rounded-md border-2 border-current">
          <Plus className="size-5" />
        </span>
        <span className="font-serif text-[18px] font-semibold text-inherit">
          Post a new listing
        </span>
        <span className="font-secondary text-[11px] font-bold tracking-[0.1em] uppercase">
          Bounty · Project · Quest
        </span>
      </button>
    </div>
  );
}
