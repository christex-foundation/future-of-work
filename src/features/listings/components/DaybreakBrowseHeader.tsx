import { cn } from '@/utils/cn';

import {
  type ListingCategory,
  type ListingSortOption,
  type ListingTab,
  type OrderDirection,
} from '../hooks/useListings';

const TABS: ReadonlyArray<{ label: string; value: ListingTab; event: string }> =
  [
    { label: 'Bounties', value: 'bounties', event: 'bounties_browsetab' },
    { label: 'Projects', value: 'projects', event: 'projects_browsetab' },
    { label: 'All', value: 'all', event: 'all_browsetab' },
  ];

const CATEGORIES: ReadonlyArray<{ label: string; value: ListingCategory }> = [
  { label: 'All', value: 'All' },
  { label: 'Content', value: 'Content' },
  { label: 'Design', value: 'Design' },
  { label: 'Development', value: 'Development' },
  { label: 'Other', value: 'Other' },
];

const SORTS: ReadonlyArray<{
  label: string;
  sortBy: ListingSortOption;
  order: OrderDirection;
}> = [
  { label: 'Freshest', sortBy: 'Date', order: 'desc' },
  { label: 'Biggest reward', sortBy: 'Prize', order: 'desc' },
  { label: 'Most active', sortBy: 'Submissions', order: 'desc' },
];

interface DaybreakBrowseHeaderProps {
  activeTab: ListingTab;
  onTabChange: (tab: ListingTab, posthogEvent: string) => void;
  activeCategory: ListingCategory;
  onCategoryChange: (category: ListingCategory, posthogEvent?: string) => void;
  activeSortBy: ListingSortOption;
  activeOrder: OrderDirection;
  onSortChange: (sortBy: ListingSortOption, order: OrderDirection) => void;
  resultCount?: number;
}

export const DaybreakBrowseHeader = ({
  activeTab,
  onTabChange,
  activeCategory,
  onCategoryChange,
  activeSortBy,
  activeOrder,
  onSortChange,
  resultCount,
}: DaybreakBrowseHeaderProps) => {
  const leadWord = activeTab === 'projects' ? 'role' : 'contest';

  return (
    <div
      style={{ fontFamily: 'var(--font-hanken), sans-serif' }}
      className="pt-8 lg:pt-10"
    >
      {/* editorial masthead */}
      <span className="flex items-center gap-2.5 text-[12px] font-semibold tracking-[0.2em] text-[#C4502E] uppercase">
        <span className="inline-block h-[1.5px] w-[18px] bg-[#C4502E]" />
        The board, today
      </span>
      <h1
        style={{ fontFamily: 'var(--font-fraunces), serif' }}
        className="mt-3.5 max-w-[18ch] text-[clamp(34px,4.4vw,54px)] leading-[1.03] font-normal tracking-[-0.02em] text-[#221A14]"
      >
        Every opportunity, on its{' '}
        <em className="text-[#C4502E] italic">own cover</em>.
      </h1>
      <p className="mt-3.5 max-w-[52ch] text-[16.5px] text-[#5C5147]">
        The standout {leadWord} leads the page like a magazine feature — the
        rest fill in around it.
      </p>

      {/* tabs + sort */}
      <div className="mt-7 flex flex-wrap items-center justify-between gap-4">
        <div
          role="tablist"
          aria-label="Listing type"
          className="inline-flex rounded-full border border-[#E6DCC9] bg-white p-1"
        >
          {TABS.map((t) => {
            const isActive = activeTab === t.value;
            return (
              <button
                key={t.value}
                role="tab"
                aria-selected={isActive}
                onClick={() => onTabChange(t.value, t.event)}
                className={cn(
                  'rounded-full px-5 py-2 text-[14px] font-semibold transition-colors',
                  isActive
                    ? 'bg-[#2C3A2E] text-[#FBF7EF]'
                    : 'text-[#5C5147] hover:text-[#221A14]',
                )}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-1 rounded-full border border-[#E6DCC9] bg-white p-1">
          {SORTS.map((s) => {
            const isActive =
              activeSortBy === s.sortBy && activeOrder === s.order;
            return (
              <button
                key={s.label}
                onClick={() => onSortChange(s.sortBy, s.order)}
                className={cn(
                  'rounded-full px-3.5 py-1.5 text-[12.5px] font-medium transition-colors',
                  isActive
                    ? 'bg-[#F2EAD9] text-[#221A14] shadow-[inset_0_0_0_1px_#E6DCC9]'
                    : 'text-[#5C5147] hover:text-[#221A14]',
                )}
              >
                {s.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* category pills + count */}
      <div className="mt-5 flex flex-wrap items-center gap-2">
        {CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat.value;
          return (
            <button
              key={cat.value}
              onClick={() =>
                onCategoryChange(cat.value, `${cat.label.toLowerCase()}_navpill`)
              }
              className={cn(
                'rounded-full border px-4 py-1.5 text-[13px] font-medium transition-colors',
                isActive
                  ? 'border-[#2C3A2E] bg-[#2C3A2E] text-[#FBF7EF]'
                  : 'border-[#E6DCC9] bg-white text-[#5C5147] hover:border-[#c9a98f] hover:text-[#221A14]',
              )}
            >
              {cat.label}
            </button>
          );
        })}
        {resultCount != null && (
          <span className="ml-auto text-[14px] text-[#5C5147]">
            <b
              style={{ fontFamily: 'var(--font-fraunces), serif' }}
              className="text-[18px] text-[#2C3A2E]"
            >
              {resultCount}
            </b>{' '}
            open
          </span>
        )}
      </div>
    </div>
  );
};
