import { EmptySection } from '@/components/shared/EmptySection';
import { Default } from '@/layouts/Default';
import { Meta } from '@/layouts/Meta';

import {
  type EmptySectionFilters,
  ListingsSection,
} from '@/features/listings/components/ListingsSection';

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
      className="bg-[#6b5e50]"
      meta={
        <Meta
          title="Bookmarks | Superteam Earn"
          description="Your bookmarks on Superteam Earn"
          canonical="https://superteam.fun/earn/bookmarks/"
        />
      }
    >
      <div className="w-full grow px-4 py-8 md:px-6 md:py-12">
        <div className="mx-auto max-w-[1000px]">
          <div className="overflow-hidden rounded-xl border-2 border-[#1d1815] bg-[#f4eee3] shadow-[8px_8px_0_#1d1815]">
            <div className="flex items-center justify-between gap-3 bg-[#1d1815] px-4 py-2.5 md:px-7">
              <span className="font-secondary flex items-center gap-2 text-[10px] font-bold tracking-[0.18em] text-[#f4eee3] uppercase md:text-[11px]">
                <span className="inline-block size-[7px] bg-[#e6a12b]" />
                Your Bookmarks
              </span>
              <span className="font-secondary hidden text-[10px] font-bold tracking-[0.18em] text-[#c9b9a5] uppercase sm:inline">
                Future of Work
              </span>
            </div>
            <div className="px-5 pt-6 pb-5 md:px-8 md:pt-8 md:pb-8">
              <h1 className="font-serif text-[30px] leading-none font-semibold text-[#1d1815] md:text-[38px]">
                Saved opportunities
              </h1>
              <p className="mt-2.5 text-[14px] text-[#6b5e50]">
                Everything you&apos;ve tucked away to come back to.
              </p>
              <ListingsSection
                type="bookmarks"
                customEmptySection={customEmptySection}
              />
            </div>
          </div>
        </div>
      </div>
    </Default>
  );
}
