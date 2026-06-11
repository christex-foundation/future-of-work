import { ChevronDown, LucideListFilter, X } from 'lucide-react';

import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useBreakpoint } from '@/hooks/use-breakpoint';
import { cn } from '@/utils/cn';

import { CategoryPill } from '@/features/listings/components/CategoryPill';

import {
  type SearchSkills,
  type SearchStatus,
  skillsData,
  statusData,
} from '../constants/schema';

interface DropdownFilterProps {
  activeStatus: SearchStatus[];
  activeSkills: SearchSkills[];
  onStatusToggle: (value: SearchStatus) => void;
  onSkillToggle: (value: SearchSkills) => void;
  disabled?: boolean;
}

function ActiveStatusPills({
  activeStatus,
  onStatusToggle,
  disabled = false,
}: {
  activeStatus: SearchStatus[];
  onStatusToggle: (value: SearchStatus) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {statusData
        .filter((f) => activeStatus.includes(f.value))
        .map((filter) => (
          <CategoryPill
            key={filter.value}
            isActive={true}
            onClick={() => onStatusToggle(filter.value)}
            disabled={disabled}
          >
            <span className="flex items-center gap-1">
              {filter.label}
              <X className="h-3 w-3" />
            </span>
          </CategoryPill>
        ))}
    </div>
  );
}

function StatusFilterList({
  activeStatus,
  onStatusToggle,
  disabled = false,
}: {
  activeStatus: SearchStatus[];
  onStatusToggle: (value: SearchStatus) => void;
  disabled?: boolean;
}) {
  return (
    <>
      {statusData.map((filter) => (
        <DropdownMenuItem
          key={filter.value}
          onSelect={() => !disabled && onStatusToggle(filter.value)}
          className={cn(
            'mb-1 flex items-center gap-2 text-sm text-[#1d1815] last:mb-0',
            disabled && 'pointer-events-none opacity-50',
            activeStatus.includes(filter.value) &&
              'bg-[#e6a12b]/25 font-semibold text-[#1d1815]',
          )}
        >
          <Checkbox
            checked={activeStatus.includes(filter.value)}
            disabled={disabled}
            className="rounded-none border-[#1d1815] data-[state=checked]:border-[#1d1815] data-[state=checked]:bg-[#e6a12b]"
            classNames={{
              indicatorClassName: 'text-[#1d1815]',
            }}
          />
          {filter.label}
        </DropdownMenuItem>
      ))}
    </>
  );
}

function SkillFilterList({
  activeSkills,
  onSkillToggle,
  disabled = false,
}: {
  activeSkills: SearchSkills[];
  onSkillToggle: (value: SearchSkills) => void;
  disabled?: boolean;
}) {
  return (
    <>
      {skillsData.map((filter) => (
        <DropdownMenuItem
          key={filter.value}
          onSelect={() => !disabled && onSkillToggle(filter.value)}
          className={cn(
            'mb-1 flex items-center gap-2 text-[#1d1815] last:mb-0',
            disabled && 'pointer-events-none opacity-50',
            activeSkills.includes(filter.value) &&
              'bg-[#e6a12b]/25 font-semibold text-[#1d1815]',
          )}
        >
          {filter.label}
        </DropdownMenuItem>
      ))}
    </>
  );
}

export function DropdownFilter({
  activeStatus,
  activeSkills,
  onStatusToggle,
  onSkillToggle,
  disabled = false,
}: DropdownFilterProps) {
  const isMd = useBreakpoint('md');

  const activeStatusWithLabels = statusData.filter((f) =>
    activeStatus.includes(f.value),
  );
  const activeSkillsWithLabels = skillsData.filter((f) =>
    activeSkills.includes(f.value),
  );

  const hasActiveFilters =
    activeStatusWithLabels.length > 0 || activeSkillsWithLabels.length > 0;

  return (
    <div className="flex items-center gap-2">
      {isMd && activeStatusWithLabels.length > 0 && (
        <ActiveStatusPills
          activeStatus={activeStatus}
          onStatusToggle={onStatusToggle}
          disabled={disabled}
        />
      )}

      <DropdownMenu>
        <DropdownMenuTrigger
          className="focus-visible:outline-none"
          disabled={disabled}
        >
          <div
            className={cn(
              'relative flex items-center gap-1.5 rounded-md p-2 hover:bg-[#f4eee3] sm:p-1.5',
              'text-sm font-normal md:rounded-none md:border-2 md:border-[#1d1815] md:px-2 md:py-0.5',
              disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
            )}
          >
            {isMd ? (
              <>
                <span className="text-sm font-normal text-[#6b5e50]">
                  Status
                </span>
                <ChevronDown className="h-4 w-4 text-[#6b5e50]" />
              </>
            ) : (
              <LucideListFilter
                className={cn(
                  'h-4 w-4',
                  hasActiveFilters ? 'text-[#ce4a2b]' : 'text-[#6b5e50]',
                )}
              />
            )}
            {!isMd && hasActiveFilters && (
              <span
                className="absolute top-5 right-2 block h-1 w-1 rounded-full bg-[#ce4a2b]"
                aria-hidden="true"
              />
            )}
          </div>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="z-[60] w-40">
          <DropdownMenuLabel className="md:hidden">
            Filter by Status
          </DropdownMenuLabel>
          <StatusFilterList
            activeStatus={activeStatus}
            onStatusToggle={onStatusToggle}
            disabled={disabled}
          />
          {!isMd && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Filter by Skill</DropdownMenuLabel>
              <SkillFilterList
                activeSkills={activeSkills}
                onSkillToggle={onSkillToggle}
                disabled={disabled}
              />
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
