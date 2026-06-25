import { EmptySection } from '@/components/shared/EmptySection';
import { Default } from '@/layouts/Default';
import { Meta } from '@/layouts/Meta';

import {
  type EmptySectionFilters,
  ListingsSection,
} from '@/features/listings/components/ListingsSection';

const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.82' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.4'/%3E%3C/svg%3E\")";

export default function BookmarksPage() {
  const customEmptySection = (filters: EmptySectionFilters) => {
    const isAllCategory = filters.activeCategory === 'All';
    const title = isAllCategory
      ? "You don't have any bookmarks"
      : 'You have no bookmarks in this category';
    const message =
      'Add some to your bookmarks to keep track of your favorite opportunities';

    return <EmptySection title={title} message={message} />;
  };

  return (
    <Default
      className="bg-[#FBF7EF]"
      meta={
        <Meta
          title="Bookmarks | Future of Work"
          description="Your saved opportunities on Future of Work"
          canonical="https://superteam.fun/earn/bookmarks/"
        />
      }
    >
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.42] mix-blend-multiply"
        style={{ backgroundImage: GRAIN }}
      />
      <div className="relative z-[1] w-full grow px-4 py-10 md:px-6 md:py-14">
        <div className="mx-auto max-w-[1200px]">
          {/* editorial masthead */}
          <span className="flex items-center gap-2.5 text-[12px] font-semibold tracking-[0.2em] text-[#C4502E] uppercase">
            <span className="inline-block h-[1.5px] w-[18px] bg-[#C4502E]" />
            Your bookmarks
          </span>
          <h1
            style={{ fontFamily: 'var(--font-fraunces), serif' }}
            className="mt-3.5 text-[clamp(34px,4.4vw,52px)] leading-[1.03] font-normal tracking-[-0.02em] text-[#221A14]"
          >
            Saved opportunities
          </h1>
          <p className="mt-3.5 max-w-[52ch] text-[16.5px] text-[#5C5147]">
            Everything you&apos;ve tucked away to come back to.
          </p>
          <div className="mt-9">
            <ListingsSection
              type="bookmarks"
              customEmptySection={customEmptySection}
            />
          </div>
        </div>
      </div>
    </Default>
  );
}
