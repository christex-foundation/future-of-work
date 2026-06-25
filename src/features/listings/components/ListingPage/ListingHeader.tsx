import { Check } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import posthog from 'posthog-js';

import { LocalImage } from '@/components/ui/local-image';
import { Tooltip } from '@/components/ui/tooltip';
import { ASSET_URL } from '@/constants/ASSET_URL';
import { useServerTimeSync } from '@/hooks/use-server-time';
import { type SponsorType } from '@/interface/sponsor';
import { useUser } from '@/store/user';
import { timeAgoShort } from '@/utils/timeAgo';

import { BoostButton } from '@/features/listing-builder/components/Form/Boost/BoostButton';

import { type Listing } from '../../types';
import { BookmarkListing } from './BookmarkListing';
import { ListingTabLink } from './ListingTabLink';
import { SecondaryOptions } from './SecondaryOptions';

const SponsorAvatar = ({ sponsor }: { sponsor: SponsorType | undefined }) => {
  return (
    <Link href={`/earn/s/${sponsor?.slug}`} className="shrink-0">
      <LocalImage
        className="h-11 w-11 rounded-xl border border-[#E6DCC9] object-cover"
        alt={sponsor?.name ?? 'Sponsor'}
        src={sponsor?.logo || `${ASSET_URL}/logo/sponsor-logo.png`}
      />
    </Link>
  );
};

export function ListingHeader({
  listing,
  isTemplate = false,
  commentCount,
  submissionNumber,
  isSubmissionNumberLoading = false,
}: {
  listing: Listing;
  isTemplate?: boolean;
  commentCount?: number;
  submissionNumber?: number;
  isSubmissionNumberLoading?: boolean;
}) {
  const {
    type,
    title,
    sponsor,
    slug,
    region,
    isWinnersAnnounced,
    publishedAt,
    isPro,
  } = listing;
  const router = useRouter();

  const { user } = useUser();
  const { serverTime } = useServerTimeSync();

  const isProject = type === 'project';
  const isSubmissionPage = router.pathname.endsWith('/submission');

  const regionLabel = !region || region === 'Global' ? 'Global, remote' : region;
  const postedAgo = publishedAt
    ? timeAgoShort(publishedAt, serverTime())
    : undefined;

  return (
    <div className="pt-3 md:pt-5">
      {/* title + actions */}
      <div className="flex items-start justify-between gap-4">
        <h1 className="font-serif max-w-[20ch] text-[34px] leading-[1.04] font-normal tracking-[-0.02em] text-[#221A14] sm:text-[44px] lg:text-[56px]">
          {title}
        </h1>
        {listing.id && listing.isPublished && (
          <div className="flex shrink-0 items-center gap-2">
            {user?.currentSponsorId === listing.sponsorId ? (
              <BoostButton listing={listing} />
            ) : (
              <BookmarkListing isTemplate={isTemplate} id={listing.id} />
            )}
            <SecondaryOptions listing={listing} />
          </div>
        )}
      </div>

      {/* byline */}
      <div className="mt-6 flex items-center gap-3.5 text-[15px] text-[#5C5147]">
        <SponsorAvatar sponsor={sponsor} />
        <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
          <span>Posted by</span>
          <Link
            href={`/earn/s/${sponsor?.slug}`}
            className="font-semibold text-[#221A14] hover:underline"
            onClick={() => {
              posthog.capture('sponsor_listing', {
                sponsor_slug: sponsor?.slug,
                sponsor_name: sponsor?.name,
                listing_title: title,
              });
            }}
          >
            {sponsor?.name}
          </Link>
          {!!sponsor?.isVerified && (
            <span className="inline-flex items-center gap-1 rounded-full bg-[#8FA37E]/20 px-2.5 py-0.5 text-[12px] font-semibold text-[#2C3A2E]">
              <Check className="h-3 w-3" strokeWidth={3} />
              Verified
            </span>
          )}
          {postedAgo && (
            <>
              <span className="opacity-50">·</span>
              <span>{postedAgo} ago</span>
            </>
          )}
          <span className="opacity-50">·</span>
          <Tooltip
            content={
              isProject
                ? 'A Project is a short-term gig where sponsors solicit applications and select the best one to work on it.'
                : 'Bounties are open for anyone to submit work — the best submissions win.'
            }
            contentProps={{ className: 'max-w-80' }}
          >
            <span>{regionLabel}</span>
          </Tooltip>
        </div>
      </div>

      {/* tabs */}
      <div className="mt-7 flex h-9 items-center border-b border-[#E6DCC9]">
        <ListingTabLink
          href={
            !isTemplate
              ? `/earn/listing/${slug}/`
              : `/earn/templates/listings/${slug}/`
          }
          text="Details"
          isActive={!router.asPath.split('/')[3]?.includes('submission')}
          className="mr-6"
          isPro={isPro}
        />

        {!isProject && isWinnersAnnounced && (
          <ListingTabLink
            onClick={() => posthog.capture('submissions tab_listing')}
            href={`/earn/listing/${slug}/submission`}
            text="Submissions"
            isActive={!!router.asPath.split('/')[3]?.includes('submission')}
            subText={isSubmissionNumberLoading ? '...' : submissionNumber + ''}
            isPro={isPro}
          />
        )}
        {!!commentCount && !isSubmissionPage && (
          <Link
            href="#comments"
            className="ml-auto hidden text-[13px] text-[#5C5147] transition-colors hover:text-[#C4502E] md:block"
          >
            {commentCount} {commentCount === 1 ? 'comment' : 'comments'}
          </Link>
        )}
      </div>
    </div>
  );
}
