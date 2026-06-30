import Link from 'next/link';

import { type EarnBounty } from '@/features/home/types/earn-board';

/**
 * Featured-bounty spotlight — calm editorial treatment.
 * Self-contained (Tailwind + Daybreak palette via arbitrary values), so it
 * renders correctly on /earn without the `.daybreak` page wrapper.
 */
export function EarnSpotlight({ bounty }: { bounty: EarnBounty | null }) {
  if (!bounty) return null;

  const listing = `/earn/listing/${bounty.slug}`;

  return (
    <section
      style={{ fontFamily: 'var(--font-hanken), sans-serif' }}
      className="flex justify-center"
    >
      {/* compact slanted "featured" strip — a short ribbon, not a full block */}
      <Link
        href={listing}
        className="group relative inline-flex max-w-full -rotate-2 items-center gap-3.5 rounded-[10px] bg-[linear-gradient(100deg,#2C3A2E,#23301f)] py-3 pr-20 pl-5 text-[#FBF7EF] shadow-[0_18px_38px_-22px_rgba(54,38,22,0.7)] transition-transform duration-200 hover:-rotate-1 sm:gap-4 sm:pl-6"
      >
        <span className="text-[11px] font-semibold tracking-[0.2em] text-[#E8B48E] uppercase">
          Featured
        </span>
        <span
          aria-hidden
          className="hidden h-6 w-px bg-[rgba(251,247,239,0.3)] sm:block"
        />
        <span className="hidden min-w-0 max-w-[24ch] truncate font-serif text-[18px] leading-tight font-normal sm:block">
          {bounty.title}
        </span>
        <span
          aria-hidden
          className="h-6 w-px bg-[rgba(251,247,239,0.3)]"
        />
        <span className="font-serif text-[19px] leading-none whitespace-nowrap text-white">
          {bounty.prizeLabel}
        </span>
        <span className="ml-1 inline-flex items-center gap-1.5 rounded-full bg-[#C4502E] px-3.5 py-2 text-[12.5px] font-semibold whitespace-nowrap transition-transform group-hover:translate-x-0.5">
          Read brief →
        </span>
      </Link>
    </section>
  );
}
