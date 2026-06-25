import { useQuery } from '@tanstack/react-query';
import { ExternalLink } from 'lucide-react';
import Link from 'next/link';
import posthog from 'posthog-js';

import { type ParentSkills } from '@/interface/skills';
import { dayjs } from '@/utils/dayjs';
import { getURLSanitized } from '@/utils/getURLSanitized';

import { chaptersQuery } from '@/features/chapters/queries/chapters';

import type { ListingHackathon } from '../../types';
import { getCombinedRegion, getRegionSlug } from '../../utils/region';

interface ExtraInfoSectionProps {
  skills?: ParentSkills[];
  requirements?: string | undefined;
  pocSocials?: string | undefined;
  region?: string | undefined;
  commitmentDate?: string | undefined;
  Hackathon?: ListingHackathon;
  isGrant?: boolean;
  hideWinnerAnnouncement?: boolean;
  isFndnPaying?: boolean;
}

const labelClass =
  'text-[11px] font-semibold tracking-[0.14em] text-[#5C5147] uppercase';
const bodyClass = 'text-[14px] leading-relaxed text-[#3a322a]';

export function ExtraInfoSection({
  skills,
  Hackathon,
  requirements,
  pocSocials,
  region,
  commitmentDate,
  isGrant = false,
  hideWinnerAnnouncement = false,
  isFndnPaying = false,
}: ExtraInfoSectionProps) {
  const { data: chapters = [] } = useQuery(chaptersQuery);
  const regionObject = getCombinedRegion(region || '', false, chapters);
  const regionDisplayName =
    regionObject?.displayValue || regionObject?.name || region;

  const hasRegion = !!region && region !== 'Global';
  const hasSkills = !!skills && skills.length > 0;
  const hasContent =
    hasRegion ||
    !!Hackathon ||
    !!requirements ||
    hasSkills ||
    isFndnPaying ||
    !!pocSocials ||
    (!!commitmentDate && !hideWinnerAnnouncement);

  if (!hasContent) return null;

  return (
    <div className="flex w-full flex-col gap-7 rounded-2xl border border-[#E6DCC9] bg-white p-5">
      {hasRegion && (
        <div className="flex w-full flex-col items-start gap-2">
          <p className={labelClass}>REGIONAL {isGrant ? 'GRANT' : 'LISTING'}</p>
          <p className={bodyClass}>
            This {isGrant ? 'grant' : 'listing'} is only open for people in{' '}
            <Link
              href={`/earn/regions/${getRegionSlug(region!, chapters)}`}
              className="font-semibold text-[#C4502E] hover:underline"
            >
              {region}
            </Link>
          </p>
        </div>
      )}

      {Hackathon && (
        <div className="flex w-full flex-col items-start gap-2">
          <p className={labelClass}>{Hackathon.name?.toUpperCase()} TRACK</p>
          <p className={bodyClass}>{Hackathon.description}</p>
          <a
            className="flex items-center font-medium text-[#C4502E]"
            href={`/earn/hackathon/${Hackathon.name?.toLowerCase()}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            View all tracks
            <ExternalLink className="mx-1 mb-0.5 inline h-4 w-4" />
          </a>
        </div>
      )}

      {requirements && (
        <div className="flex w-full flex-col items-start gap-2">
          <p className={labelClass}>ELIGIBILITY</p>
          <p className={bodyClass}>{requirements}</p>
        </div>
      )}

      {hasSkills && (
        <div className="hidden w-full flex-col items-start gap-2 md:flex">
          <p className={labelClass}>SKILLS NEEDED</p>
          <div className="flex flex-wrap gap-2">
            {skills!.map((skill) => (
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

      {isFndnPaying && (
        <div className="flex w-full flex-col items-start gap-2">
          <p className={labelClass}>KYC REQUIRED</p>
          <p className={bodyClass}>
            {hasRegion ? (
              <>
                Winners will be required to complete KYC from{' '}
                {regionDisplayName || 'their region'} to receive their prize
                money.
              </>
            ) : (
              <>
                Winners will be required to complete KYC to receive their prize
                money.
              </>
            )}
          </p>
        </div>
      )}

      {pocSocials && (
        <div className="flex w-full flex-col items-start gap-2">
          <p className={labelClass}>CONTACT</p>
          <div>
            <a
              className="ph-no-capture font-medium text-[#C4502E]"
              href={getURLSanitized(pocSocials)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => posthog.capture('reach out_listing')}
            >
              Reach out
              <ExternalLink className="mx-1 mb-0.5 inline h-4 w-4" />
            </a>
            <span className={bodyClass}>
              if you have any questions about this listing
            </span>
          </div>
        </div>
      )}

      {!!commitmentDate && !hideWinnerAnnouncement && (
        <div className="flex w-full flex-col items-start gap-2">
          <p className={labelClass}>WINNER ANNOUNCEMENT BY</p>
          <p className={bodyClass}>
            {dayjs(commitmentDate).format('MMMM DD, YYYY')} — as scheduled by the
            sponsor.
          </p>
        </div>
      )}
    </div>
  );
}
