import { TriangleAlert } from 'lucide-react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useMemo } from 'react';

const Countdown = dynamic(() => import('react-countdown'), { ssr: false });

import { TokenIcon } from '@/components/ui/token-icon';
import { useServerTimeSync } from '@/hooks/use-server-time';
import { type ParentSkills } from '@/interface/skills';
import { dayjs } from '@/utils/dayjs';

import type { Listing } from '../../types';
import { isDeadlineOver } from '../../utils/deadline';
import { getListingTypeLabel } from '../../utils/status';
import { ApprovalStages } from '../Submission/ApprovalStages';
import { SubmissionActionButton } from '../Submission/SubmissionActionButton';
import { CompensationAmount } from './CompensationAmount';
import { ExtraInfoSection } from './ExtraInfoSection';

const ListingWinners = dynamic(
  () => import('./ListingWinners').then((m) => m.ListingWinners),
  { ssr: false },
);

function getOrdinalSuffix(day: number): string {
  const teenRange = day % 100;
  if (teenRange >= 11 && teenRange <= 13) return 'th';
  switch (day % 10) {
    case 1:
      return 'st';
    case 2:
      return 'nd';
    case 3:
      return 'rd';
    default:
      return 'th';
  }
}

interface CountdownCellsProps {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  completed: boolean;
}

const CountdownCells = ({
  days,
  hours,
  minutes,
  seconds,
  completed,
}: CountdownCellsProps) => {
  if (completed) {
    return (
      <div className="rounded-xl border border-[#E6DCC9] bg-[#FBF7EF] py-3 text-center text-[14px] font-semibold text-[#5C5147]">
        Submissions closed
      </div>
    );
  }
  const pad = (n: number) => String(n).padStart(2, '0');
  const cells: [string, string][] = [
    [pad(days), 'Days'],
    [pad(hours), 'Hrs'],
    [pad(minutes), 'Min'],
    [pad(seconds), 'Sec'],
  ];
  return (
    <div className="flex gap-2">
      {cells.map(([v, l]) => (
        <div
          key={l}
          className="flex-1 rounded-xl border border-[#E6DCC9] bg-[#FBF7EF] py-3 text-center"
        >
          <div className="font-serif text-[26px] leading-none font-normal text-[#2C3A2E]">
            {v}
          </div>
          <div className="mt-1.5 text-[10.5px] font-semibold tracking-[0.1em] text-[#5C5147] uppercase">
            {l}
          </div>
        </div>
      ))}
    </div>
  );
};

function MetaRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-t border-[#E6DCC9] py-2.5 text-[14px]">
      <span className="text-[#5C5147]">{label}</span>
      <span className="font-semibold text-[#221A14]">{value}</span>
    </div>
  );
}

export function RightSideBar({
  listing,
  skills,
  isTemplate = false,
  submissionNumber,
  isSubmissionNumberLoading = false,
  commentCount = 0,
}: {
  listing: Listing;
  skills?: ParentSkills[];
  isTemplate?: boolean;
  submissionNumber?: number;
  isSubmissionNumberLoading?: boolean;
  commentCount?: number;
}) {
  const {
    token,
    type,
    deadline,
    rewardAmount,
    compensationType,
    maxRewardAsk,
    minRewardAsk,
    Hackathon,
    isWinnersAnnounced,
  } = listing;

  const { serverTime, isSync } = useServerTimeSync();
  const router = useRouter();

  const hasHackathonStarted = Hackathon?.startDate
    ? dayjs().isAfter(Hackathon.startDate)
    : true;

  const submissionRange = useMemo(() => {
    if (submissionNumber === undefined) return '';
    if (submissionNumber <= 10) return '0-10';
    if (submissionNumber <= 25) return '10-25';
    if (submissionNumber <= 50) return '25-50';
    if (submissionNumber <= 100) return '50-100';
    if (submissionNumber <= 200) return '100-200';
    if (submissionNumber <= 300) return '200-300';
    return '300+';
  }, [submissionNumber]);

  const isProject = type === 'project';
  const inReview =
    isDeadlineOver(deadline, serverTime()) && !isWinnersAnnounced;

  const countdownDate = hasHackathonStarted ? deadline : Hackathon?.startDate;
  const countdownLabel = hasHackathonStarted
    ? 'Time remaining'
    : 'Until submissions open';

  return (
    <div className="flex w-full flex-col gap-5">
      {/* APPLY BOX */}
      <div className="rounded-2xl border border-[#E6DCC9] bg-white p-6 shadow-[0_12px_34px_-22px_rgba(54,38,22,0.45)]">
        {!router.asPath.split('/')[4]?.includes('submission') &&
          listing.isWinnersAnnounced && (
            <div className="block w-full pb-6 lg:hidden">
              <ListingWinners bounty={listing} />
            </div>
          )}

        <div className="inline-flex items-center gap-2.5 text-[12px] font-semibold tracking-[0.2em] text-[#C4502E] uppercase">
          <span className="h-px w-4 bg-[#C4502E]" />
          {isProject ? 'Payment' : 'Total prize pool'}
        </div>

        <div className="mt-3 flex items-center gap-2">
          <TokenIcon
            className="h-7 w-7 rounded-full border border-[#E6DCC9]"
            alt="token icon"
            symbol={token}
          />
          <CompensationAmount
            compensationType={compensationType}
            rewardAmount={rewardAmount}
            maxRewardAsk={maxRewardAsk}
            minRewardAsk={minRewardAsk}
            token={token}
            isWinnersAnnounced={isWinnersAnnounced}
            className="font-serif text-[40px] leading-none font-normal text-[#C4502E]"
          />
        </div>

        <div className="mt-6">
          <p className="mb-2 text-[11px] font-semibold tracking-[0.14em] text-[#5C5147] uppercase">
            {countdownLabel}
          </p>
          {isSync && countdownDate ? (
            <Countdown
              date={countdownDate}
              now={serverTime}
              renderer={CountdownCells}
              zeroPadDays={2}
            />
          ) : (
            <div className="rounded-xl border border-[#E6DCC9] bg-[#FBF7EF] py-3 text-center text-[14px] text-[#5C5147]">
              Syncing…
            </div>
          )}
        </div>

        <div className="mt-5 hidden w-full lg:flex">
          <SubmissionActionButton listing={listing} isTemplate={isTemplate} />
        </div>

        {inReview && listing.commitmentDate && (
          <p className="mt-3 hidden text-center text-[13px] text-[#5C5147] lg:block">
            Winner announcement by{' '}
            {(() => {
              const d = dayjs(listing.commitmentDate);
              const day = d.date();
              return (
                <span className="font-semibold text-[#221A14]">
                  {day}
                  <sup className="relative -top-0.5 text-[10px]">
                    {getOrdinalSuffix(day)}
                  </sup>{' '}
                  {d.format('MMM')}
                </span>
              );
            })()}
          </p>
        )}

        {listing.isWinnersAnnounced &&
          listing.isFndnPaying &&
          dayjs(listing.winnersAnnouncedAt).isAfter(dayjs.utc('2025-08-06')) && (
            <div className="mt-4 w-full">
              <ApprovalStages listing={listing} />
            </div>
          )}

        {isProject && deadline && dayjs(deadline).isAfter(new Date()) && (
          <div className="mt-4 flex w-full gap-2.5 rounded-xl border border-[#8FA37E]/40 bg-[#8FA37E]/12 p-3.5">
            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-[#2C3A2E]" />
            <p className="text-[12.5px] leading-relaxed text-[#3C4D3D]">
              Don&apos;t start working just yet — apply first, and begin only
              once you&apos;ve been hired for the project.
            </p>
          </div>
        )}

        {/* META LIST */}
        <div className="mt-6">
          {deadline && (
            <MetaRow
              label="Deadline"
              value={dayjs(deadline).format('MMM DD, YYYY')}
            />
          )}
          <MetaRow
            label={isProject ? 'Applications' : 'Submissions'}
            value={
              isSubmissionNumberLoading
                ? '…'
                : !isProject
                  ? (submissionNumber ?? 0).toLocaleString('en-us')
                  : submissionRange
            }
          />
          <MetaRow label="Comments" value={commentCount} />
        </div>
      </div>

      {/* SKILLS & TAGS */}
      {skills && skills.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-[#E6DCC9] bg-white">
          <div className="font-serif border-b border-[#E6DCC9] px-5 py-3.5 text-[18px]">
            Skills &amp; tags
          </div>
          <div className="flex flex-wrap gap-2 p-5">
            <span className="rounded-full border border-[#2C3A2E] bg-[#2C3A2E] px-3 py-1 text-[12.5px] text-[#FBF7EF]">
              {getListingTypeLabel(type ?? '')}
            </span>
            {skills.map((skill) => (
              <Link
                key={skill}
                href={`/earn/skill/${skill.toLowerCase().replace(/\s+/g, '-')}`}
                className="rounded-full border border-[#E6DCC9] bg-[#FBF7EF] px-3 py-1 text-[12.5px] text-[#5C5147] transition-colors hover:border-[#d9ccb2] hover:text-[#C4502E] hover:no-underline"
              >
                {skill}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* REGION / CONTACT / WINNER DATE */}
      <ExtraInfoSection
        region={listing.region}
        pocSocials={listing.pocSocials}
        commitmentDate={listing.commitmentDate}
        Hackathon={listing.Hackathon}
        hideWinnerAnnouncement={inReview}
      />
    </div>
  );
}
