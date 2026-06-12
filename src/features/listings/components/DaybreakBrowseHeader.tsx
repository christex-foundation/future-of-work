import { cn } from '@/utils/cn';

import type { ListingCategory } from '../hooks/useListings';

const CATEGORIES: ReadonlyArray<{ label: string; value: ListingCategory }> = [
  { label: 'All', value: 'All' },
  { label: 'Content', value: 'Content' },
  { label: 'Design', value: 'Design' },
  { label: 'Development', value: 'Development' },
  { label: 'Other', value: 'Other' },
];

interface DaybreakBrowseHeaderProps {
  activeCategory: ListingCategory;
  onCategoryChange: (category: ListingCategory, posthogEvent?: string) => void;
}

export const DaybreakBrowseHeader = ({
  activeCategory,
  onCategoryChange,
}: DaybreakBrowseHeaderProps) => {
  return (
    <div className="flex flex-wrap items-center gap-2 pt-6 lg:pt-8">
      {CATEGORIES.map((cat) => {
        const isActive = activeCategory === cat.value;
        return (
          <button
            key={cat.value}
            onClick={() =>
              onCategoryChange(cat.value, `${cat.label.toLowerCase()}_navpill`)
            }
            className={cn(
              'font-secondary rounded-md border px-3.5 py-1.5 text-[11px] font-bold tracking-[0.1em] uppercase transition-colors',
              isActive
                ? 'border-[#e6a12b] bg-[#e6a12b] text-[#1d1815]'
                : 'border-[#f4eee3]/50 text-[#f4eee3] hover:border-[#f4eee3] hover:bg-[#f4eee3]/10',
            )}
          >
            {cat.label}
          </button>
        );
      })}
    </div>
  );
};
