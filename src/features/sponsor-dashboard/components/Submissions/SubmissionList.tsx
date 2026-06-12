import { useAtom } from 'jotai';
import debounce from 'lodash.debounce';
import { Search } from 'lucide-react';
import { type Dispatch, type SetStateAction, useEffect, useRef } from 'react';

import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { StatusPill } from '@/components/ui/status-pill';
import type { SubmissionWithUser } from '@/interface/submission';
import { type SubmissionLabels } from '@/prisma/enums';
import { cn } from '@/utils/cn';
import { dayjs } from '@/utils/dayjs';
import { getRankLabels } from '@/utils/rank';

import {
  type BountySubmissionAi,
  type Listing,
  type ProjectApplicationAi,
} from '@/features/listings/types';
import { EarnAvatar } from '@/features/talent/components/EarnAvatar';

import { selectedSubmissionAtom } from '../../atoms';
import { labelMenuOptions } from '../../constants';
import { colorMap } from '../../utils/statusColorMap';
import { MultiSelectFilter } from './MultiSelectFilter';

interface Props {
  listing?: Listing;
  submissions: SubmissionWithUser[];
  setSearchText: Dispatch<SetStateAction<string>>;
  type?: string;
  selectedFilters: Set<SubmissionLabels | 'Winner' | 'Rejected'>;
  onFilterChange: (
    filters: Set<SubmissionLabels | 'Winner' | 'Rejected'>,
  ) => void;
  toggleSubmission?: (id: string) => void;
  isToggled?: (id: string) => boolean;
  toggleAllSubmissions?: () => void;
  isAllToggled?: boolean;
  isMultiSelectDisabled: boolean;
}

export const SubmissionList = ({
  listing,
  submissions,
  setSearchText,
  type,
  selectedFilters,
  onFilterChange,
  toggleSubmission,
  isToggled,
  toggleAllSubmissions,
  isAllToggled,
  isMultiSelectDisabled,
}: Props) => {
  const [selectedSubmission, setSelectedSubmission] = useAtom(
    selectedSubmissionAtom,
  );

  const debouncedSetSearchTextRef = useRef<
    ReturnType<typeof debounce> | undefined
  >(undefined);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    debouncedSetSearchTextRef.current = debounce(setSearchText, 300);

    return () => {
      debouncedSetSearchTextRef.current?.cancel();
    };
  }, [setSearchText]);

  useEffect(() => {
    if (selectedSubmission?.id && scrollContainerRef.current) {
      const selectedElement = scrollContainerRef.current.querySelector(
        `[data-submission-id="${selectedSubmission.id}"]`,
      );

      if (selectedElement) {
        selectedElement.scrollIntoView({
          block: 'nearest',
        });
      }
    }
  }, [selectedSubmission?.id]);

  const getSubmissionLabel = (submission: SubmissionWithUser) => {
    if (submission?.isWinner && submission?.winnerPosition) {
      if (type === 'project') {
        return 'Winner';
      } else {
        return getRankLabels(submission.winnerPosition);
      }
    } else if (
      submission.status === 'Rejected' &&
      listing?.type === 'project'
    ) {
      return 'Rejected';
    } else if (submission?.label === 'Spam') {
      return 'Spam';
    } else if (submission?.label) {
      return labelMenuOptions(listing?.type).find(
        (option) => option.value === submission.label,
      )?.label;
    } else {
      return '';
    }
  };

  const getSubmissionColors = (submission: SubmissionWithUser) => {
    if (submission?.isWinner) {
      return colorMap.Winner;
    } else if (submission.status === 'Rejected') {
      return colorMap.Rejected;
    } else if (submission?.label && colorMap[submission.label]) {
      return colorMap[submission.label];
    } else {
      return {
        bg: 'bg-[#ECE2D2]',
        color: 'text-[#6B5E50]',
        border: 'border-[#1d1815]/12',
      };
    }
  };

  return (
    <div className="h-full w-full rounded-l-lg border border-[#1d1815]/12 bg-[#FBF7EE]">
      <div className="flex w-full items-center justify-between gap-2 p-3">
        {!isMultiSelectDisabled && (
          <Checkbox
            className="data-[state=checked]:border-[#CE4A2B] data-[state=checked]:bg-[#CE4A2B]"
            checked={isAllToggled}
            disabled={isMultiSelectDisabled}
            onCheckedChange={() =>
              toggleAllSubmissions && toggleAllSubmissions()
            }
          />
        )}

        <div className="relative w-full">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[#6B5E50]" />
          <Input
            className="placeholder:text-md h-10 border-[#1d1815]/12 bg-[#F4EEE3] pl-9 placeholder:font-medium placeholder:text-[#6B5E50] focus-visible:ring-[#CE4A2B]"
            onChange={(e) => {
              debouncedSetSearchTextRef.current?.(e.target.value);
            }}
            placeholder="Search Submissions"
            type="text"
          />
        </div>
        <MultiSelectFilter
          selectedFilters={selectedFilters}
          onFilterChange={onFilterChange}
          listingType={listing?.type}
          isAiCommitted={submissions.some(
            (submission) =>
              (
                submission?.ai as unknown as
                  | ProjectApplicationAi
                  | BountySubmissionAi
              )?.commited,
          )}
        />
      </div>
      <div
        ref={scrollContainerRef}
        className="scrollbar-thin scrollbar-w-1 scrollbar-thumb-[#1d1815]/15 hover:scrollbar-thumb-[#1d1815]/25 h-[42rem] w-full overflow-y-auto rounded-bl-lg border-t border-[#1d1815]/12 bg-[#FBF7EE]"
      >
        {submissions.map((submission) => {
          const { bg, color, border } = getSubmissionColors(submission);
          return (
            <div
              key={submission?.id}
              data-submission-id={submission?.id}
              className={cn(
                'flex cursor-pointer items-center justify-between gap-4 border-b border-[#1d1815]/10 px-3 py-2',
                'hover:bg-[#ECE2D2]',
                selectedSubmission?.id === submission?.id
                  ? 'bg-[#ECE2D2]'
                  : 'bg-transparent',
              )}
              onClick={() => {
                setSelectedSubmission(submission);
              }}
            >
              <div className="flex items-center">
                {!isMultiSelectDisabled && (
                  <Checkbox
                    className="data-[state=checked]:border-[#CE4A2B] data-[state=checked]:bg-[#CE4A2B] mr-2 disabled:invisible"
                    checked={isToggled && isToggled(submission.id)}
                    disabled={
                      submission?.status !== 'Pending' ||
                      !!submission?.winnerPosition ||
                      isMultiSelectDisabled
                    }
                    onCheckedChange={() =>
                      toggleSubmission && toggleSubmission(submission.id)
                    }
                  />
                )}
                <EarnAvatar
                  id={submission?.user?.id}
                  avatar={submission?.user?.photo || undefined}
                />
                <div className="ml-2 w-40">
                  <div className="flex items-center gap-1">
                    <p className="flex min-w-0 items-center gap-2 overflow-hidden text-sm font-medium text-ellipsis whitespace-nowrap text-[#1D1815]">
                      {`${submission?.user?.firstName} ${submission?.user?.lastName}`}
                    </p>
                  </div>
                  <p className="text-xxs overflow-hidden text-ellipsis whitespace-nowrap text-[#6B5E50]">
                    Submitted:{' '}
                    {dayjs(submission?.createdAt).format('MMM D YYYY')}
                  </p>
                </div>
              </div>

              <StatusPill
                className="w-fit px-2 py-0.5 text-[10px]"
                color={color}
                backgroundColor={bg}
                borderColor={border}
              >
                {getSubmissionLabel(submission)}
              </StatusPill>
            </div>
          );
        })}
      </div>
    </div>
  );
};
