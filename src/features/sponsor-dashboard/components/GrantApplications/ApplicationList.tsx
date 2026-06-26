import { useAtom } from 'jotai';
import debounce from 'lodash.debounce';
import { Search } from 'lucide-react';
import { useEffect, useRef } from 'react';

import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { StatusPill } from '@/components/ui/status-pill';
import { Tooltip } from '@/components/ui/tooltip';
import {
  type GrantApplicationStatus,
  type SubmissionLabels,
} from '@/prisma/enums';
import { cn } from '@/utils/cn';

import { isEligiblePeopleType } from '@/features/membership/utils/peopleEligibility';
import { EarnAvatar } from '@/features/talent/components/EarnAvatar';

import { selectedGrantApplicationAtom } from '../../atoms';
import { labelMenuOptionsGrants } from '../../constants';
import { type GrantApplicationWithUser } from '../../types';
import { colorMap } from '../../utils/statusColorMap';
import { MultiSelectFilter } from './MultiSelectFilter';

interface Props {
  applications: GrantApplicationWithUser[] | undefined;
  setSearchText: (value: string) => void;
  toggleApplication: (id: string) => void;
  isToggled: (id: string) => boolean;
  toggleAllApplications: () => void;
  isAllToggled: boolean;
  selectedFilters: Set<GrantApplicationStatus | SubmissionLabels>;
  onFilterChange: (
    filters: Set<GrantApplicationStatus | SubmissionLabels>,
  ) => void;
  isToggleDisabled: boolean;
}

export const ApplicationList = ({
  applications,
  setSearchText,
  toggleApplication,
  isToggled,
  toggleAllApplications,
  isAllToggled,
  selectedFilters,
  onFilterChange,
  isToggleDisabled,
}: Props) => {
  const debouncedSetSearchTextRef = useRef<
    ReturnType<typeof debounce> | undefined
  >(undefined);
  const [selectedApplication, setSelectedApplication] = useAtom(
    selectedGrantApplicationAtom,
  );

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    debouncedSetSearchTextRef.current = debounce(setSearchText, 300);

    return () => {
      debouncedSetSearchTextRef.current?.cancel();
    };
  }, [setSearchText]);

  useEffect(() => {
    if (selectedApplication?.id && scrollContainerRef.current) {
      const selectedElement = scrollContainerRef.current.querySelector(
        `[data-application-id="${selectedApplication.id}"]`,
      );

      if (selectedElement) {
        selectedElement.scrollIntoView({
          block: 'nearest',
        });
      }
    }
  }, [selectedApplication?.id]);

  return (
    <div className="h-full w-full rounded-l-lg border border-[#e6dcc9] bg-[#FBF7EF]">
      <div className="flex w-full items-center justify-between gap-2 p-3">
        <Checkbox
          checked={!isToggleDisabled ? isAllToggled : false}
          disabled={isToggleDisabled}
          onCheckedChange={() => toggleAllApplications()}
          className="data-[state=checked]:border-[#ce4a2b] data-[state=checked]:bg-[#ce4a2b]"
        />
        <div className="relative w-full">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[#6b5e50]" />
          <Input
            className="placeholder:text-md focus-visible:ring-[#ce4a2b] h-10 border-[#e6dcc9] bg-[#FBF7EF] pl-9 placeholder:font-medium placeholder:text-[#6b5e50]"
            onChange={(e) => {
              debouncedSetSearchTextRef.current?.(e.target.value);
            }}
            placeholder="Search Applications"
            type="text"
          />
        </div>
        <MultiSelectFilter
          selectedFilters={selectedFilters}
          onFilterChange={onFilterChange}
        />
      </div>
      <div
        ref={scrollContainerRef}
        className="scrollbar-thin scrollbar-w-1 scrollbar-track-[#FBF7EF] scrollbar-thumb-[#e6dcc9] hover:scrollbar-thumb-[#1d1815]/30 h-[42rem] w-full overflow-y-auto rounded-bl-lg border-t border-[#e6dcc9] bg-[#FBF7EF]"
      >
        {applications?.map((application) => {
          const applicationStatus = application?.applicationStatus;

          const applicationLabel = application?.label;
          const applicationLabelUi = labelMenuOptionsGrants.find(
            (s) => s.value === application?.label,
          )?.label;
          const {
            bg: statusBg,
            color: statusColor,
            border: statusBorder,
          } = colorMap[applicationStatus as GrantApplicationStatus];
          const {
            bg: labelBg,
            color: labelColor,
            border: labelBorder,
          } = colorMap[applicationLabel];
          const isEligibleMember = isEligiblePeopleType(
            application?.user.people?.type,
          );
          const chapter = isEligibleMember
            ? application?.user.people?.chapter
            : null;
          return (
            <div
              key={application?.id}
              data-application-id={application?.id}
              className={cn(
                'flex cursor-pointer items-center justify-between gap-4 border-b border-[#e6dcc9] px-3 py-2',
                'hover:bg-[#F2EAD9]',
                selectedApplication?.id === application?.id
                  ? 'bg-[#F2EAD9]'
                  : 'bg-transparent',
              )}
              onClick={() => {
                setSelectedApplication(application);
              }}
            >
              <div className="flex items-center">
                <Checkbox
                  className="data-[state=checked]:border-[#ce4a2b] data-[state=checked]:bg-[#ce4a2b] mr-2 disabled:invisible"
                  checked={isToggled(application.id)}
                  disabled={application?.applicationStatus !== 'Pending'}
                  onCheckedChange={() => toggleApplication(application.id)}
                />

                <EarnAvatar
                  id={application?.user?.id}
                  avatar={application?.user?.photo || undefined}
                />

                <div className="ml-2 w-40">
                  <p className="overflow-hidden text-sm font-medium text-ellipsis whitespace-nowrap text-[#1d1815]">
                    {application?.projectTitle}
                  </p>
                  <span className="flex items-center gap-2">
                    <p className="overflow-hidden text-xs font-medium text-ellipsis whitespace-nowrap text-[#6b5e50]">
                      {`${application?.user?.firstName} ${application?.user?.lastName}`}
                    </p>
                    {chapter?.icons && (
                      <Tooltip content={`${chapter.name} Member`}>
                        <img
                          src={chapter.icons}
                          alt="Superteam Member"
                          className="size-3 rounded-full"
                        />
                      </Tooltip>
                    )}
                  </span>
                </div>
              </div>

              <div className="ml-auto flex w-min flex-col justify-end gap-1 align-bottom">
                {applicationLabel === 'Spam' ? (
                  <StatusPill
                    className="ml-auto w-fit text-[0.625rem]"
                    color={labelColor}
                    backgroundColor={labelBg}
                    borderColor={labelBorder}
                  >
                    {applicationLabelUi || applicationLabel}
                  </StatusPill>
                ) : applicationStatus !== 'Pending' ||
                  applicationLabel === 'Unreviewed' ? (
                  <StatusPill
                    className="ml-auto w-fit text-[0.625rem]"
                    color={statusColor}
                    backgroundColor={statusBg}
                    borderColor={statusBorder}
                  >
                    {applicationStatus}
                  </StatusPill>
                ) : (
                  <StatusPill
                    className="ml-auto w-fit text-[0.625rem]"
                    color={labelColor}
                    backgroundColor={labelBg}
                    borderColor={labelBorder}
                  >
                    {applicationLabelUi || applicationLabel}
                  </StatusPill>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
