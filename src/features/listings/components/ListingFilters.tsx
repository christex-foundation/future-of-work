import { LucideListFilter } from 'lucide-react';
import posthog from 'posthog-js';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/utils/cn';

import {
  ALL_FILTER_OPTION,
  LISTING_FILTER_OPTIONS,
} from '../constants/LISTING_FILTER_OPTIONS';
import { getListingSortOptions } from '../constants/SORT_OPTIONS';
import type {
  ListingSortOption,
  ListingStatus,
  OrderDirection,
} from '../hooks/useListings';

interface ListingFiltersProps {
  activeStatus: ListingStatus;
  activeSortBy: ListingSortOption;
  activeOrder: OrderDirection;
  onStatusChange: (status: ListingStatus) => void;
  onSortChange: (sortBy: ListingSortOption, order: OrderDirection) => void;
  showAllFilter?: boolean;
  showStatusSort?: boolean;
}

export const ListingFilters = ({
  activeStatus,
  activeSortBy,
  activeOrder,
  onStatusChange,
  onSortChange,
  showAllFilter = false,
  showStatusSort = false,
}: ListingFiltersProps) => {
  const sortOptions = getListingSortOptions(activeStatus, showStatusSort);

  const isDefaultFilterApplied =
    ((activeStatus === 'open' || (activeStatus === 'all' && showAllFilter)) &&
      activeSortBy === 'Date' &&
      activeOrder === 'asc') ||
    (showStatusSort &&
      activeStatus === 'all' &&
      activeSortBy === 'Status' &&
      activeOrder === 'asc');

  const filterOptions = showAllFilter
    ? [ALL_FILTER_OPTION, ...LISTING_FILTER_OPTIONS]
    : LISTING_FILTER_OPTIONS;

  return (
    <DropdownMenu
      onOpenChange={(open) => {
        if (open) {
          posthog.capture('open_listing filters');
        }
      }}
    >
      <DropdownMenuTrigger>
        <div className="relative flex cursor-pointer items-center gap-1.5 rounded-md p-2 hover:bg-[#f4eee3] sm:p-1.5">
          <span className="hidden text-[0.8rem] font-semibold text-[#6b5e50] sm:flex">
            Filter
          </span>
          <LucideListFilter className="size-4 stroke-3 text-[#1d1815]" />
          {!isDefaultFilterApplied && (
            <span
              className="absolute right-2 bottom-2 block size-1 rounded-full bg-[#ce4a2b] ring-1 ring-[#FBF7EE]"
              aria-hidden="true"
            />
          )}
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="z-[60]">
        <DropdownMenuLabel>
          Filter By
        </DropdownMenuLabel>
        {filterOptions.map((option) => (
          <DropdownMenuItem
            key={option.label}
            onSelect={() => onStatusChange(option.params.status)}
            className={cn(
              'flex items-center gap-2 text-[#1d1815]',
              activeStatus === option.params.status &&
                'bg-[#e6a12b]/25 font-semibold',
            )}
          >
            <div
              className={cn(
                'flex size-4 items-center justify-center rounded-full border-[1.5px]',
                option.circleClasses.border,
              )}
            >
              <div
                className={cn('size-2 rounded-full', option.circleClasses.bg)}
              />
            </div>
            {option.label}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuLabel>
          Sort By
        </DropdownMenuLabel>
        {sortOptions.map((option) => (
          <DropdownMenuItem
            key={option.label}
            onSelect={() =>
              onSortChange(option.params.sortBy, option.params.order)
            }
            className={cn(
              'flex gap-2 text-[#1d1815]',
              activeSortBy === option.params.sortBy &&
                activeOrder === option.params.order &&
                'bg-[#e6a12b]/25 font-semibold',
            )}
          >
            <div className="text-slate-500">{option.icon}</div>
            {option.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
