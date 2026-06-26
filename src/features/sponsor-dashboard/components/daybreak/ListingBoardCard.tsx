import { Clock, Users } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { TokenIcon } from '@/components/ui/token-icon';
import { useUser } from '@/store/user';
import { cn } from '@/utils/cn';

import { grantAmount } from '@/features/grants/utils/grantAmount';
import { isListingEditable } from '@/features/listing-builder/utils/isListingEditable';
import { type ListingWithSubmissions } from '@/features/listings/types';
import { formatDeadline } from '@/features/listings/utils/deadline';
import { getListingStatus } from '@/features/listings/utils/status';

import { SponsorPrize } from '../SponsorPrize';

type ListingType = 'bounty' | 'project' | 'grant' | 'hackathon';

const TYPE_LABEL: Record<ListingType, string> = {
  bounty: 'Bounty',
  project: 'Project',
  grant: 'Quest',
  hackathon: 'Hackathon',
};

const POOL_LABEL: Record<ListingType, string> = {
  bounty: 'Prize Pool',
  project: 'Budget',
  grant: 'Pool',
  hackathon: 'Prize Pool',
};

export function fowStatus(status: string): {
  label: string;
  badge: string;
  dot: string;
} {
  switch (status) {
    case 'In Progress':
      return { label: 'Live', badge: 'bg-[#2C3A2E] text-[#FBF7EF]', dot: '#8FA37E' };
    case 'In Review':
      return {
        label: 'In review',
        badge: 'bg-[#8FA37E] text-[#221A14]',
        dot: '#221A14',
      };
    case 'Payment Pending':
    case 'Fndn to Pay':
      return {
        label: 'Payment due',
        badge: 'bg-[#F4E6DF] text-[#C4502E]',
        dot: '#C4502E',
      };
    case 'Completed':
      return {
        label: 'Completed',
        badge: 'bg-[#2C3A2E] text-[#FBF7EF]',
        dot: '#8FA37E',
      };
    case 'Under Verification':
      return {
        label: 'Verifying',
        badge: 'bg-[#8FA37E] text-[#221A14]',
        dot: '#221A14',
      };
    case 'Verification Failed':
      return {
        label: 'Verify failed',
        badge: 'bg-[#F4E6DF] text-[#C4502E]',
        dot: '#C4502E',
      };
    case 'Closed':
      return {
        label: 'Closed',
        badge: 'border border-[#221A14]/30 text-[#5C5147]',
        dot: '#5C5147',
      };
    case 'Unpublished':
      return {
        label: 'Unpublished',
        badge: 'border border-[#221A14]/30 text-[#5C5147]',
        dot: '#5C5147',
      };
    default:
      return {
        label: 'Draft',
        badge: 'border border-[#221A14]/30 text-[#5C5147]',
        dot: '#5C5147',
      };
  }
}

export function ListingBoardCard({
  listing,
  index,
}: {
  listing: ListingWithSubmissions;
  index: number;
}) {
  const { user } = useUser();
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const id = window.setTimeout(() => setShown(true), 50 + index * 55);
    return () => window.clearTimeout(id);
  }, [index]);

  const type = (listing.type ?? 'bounty') as ListingType;
  const status = getListingStatus(listing);
  const st = fowStatus(status);
  const deadline = formatDeadline(listing.deadline, listing.type);

  const submissionLink =
    listing.type === 'grant'
      ? `/earn/dashboard/grants/${listing.slug}/applications/`
      : `/earn/dashboard/listings/${listing.slug}/submissions/`;
  const editLink = `/earn/dashboard/listings/${listing.slug}/edit`;

  const isClickable = listing.isPublished || isListingEditable({ listing, user });
  const href = listing.isPublished ? submissionLink : editLink;
  const actionLabel = listing.isPublished ? 'Manage' : 'Edit';

  const subLabel =
    listing.type === 'project'
      ? 'applications'
      : listing.type === 'grant'
        ? 'applicants'
        : 'submissions';

  const sponsorName = user?.currentSponsor?.name ?? '';
  const sponsorLogo = user?.currentSponsor?.logo
    ? user.currentSponsor.logo.replace(
        '/upload/',
        '/upload/c_scale,w_64,h_64,f_auto/',
      )
    : null;
  const initials =
    sponsorName
      .split(' ')
      .map((w) => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || '—';

  const skillTags = (listing.skills ?? [])
    .map((s) => s.skills)
    .filter(Boolean)
    .slice(0, 2);

  const cardClass = cn(
    'group/card flex flex-col gap-4 rounded-[18px] border border-[#E6DCC9] bg-[#FFFDF8] p-5 text-[#221A14] no-underline shadow-[0_24px_60px_-48px_rgba(54,38,22,0.55)] transition-all duration-200',
    shown ? 'opacity-100' : 'opacity-0',
    isClickable &&
      'hover:-translate-y-0.5 hover:border-[#d9ccb2] hover:shadow-[0_30px_70px_-48px_rgba(54,38,22,0.62)]',
  );

  const inner = (
    <>
      {/* org + status */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="font-secondary flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#2C3A2E] text-[12px] font-bold tracking-wide text-[#FBF7EF] ring-2 ring-[#F2EAD9]">
            {sponsorLogo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={sponsorLogo}
                alt={sponsorName}
                className="size-full object-cover"
              />
            ) : (
              initials
            )}
          </div>
          <span className="font-secondary truncate text-[11px] font-bold tracking-[0.12em] text-[#5C5147] uppercase">
            {sponsorName || TYPE_LABEL[type]}
            {listing.region && listing.region !== 'Global'
              ? ` · ${listing.region}`
              : ''}
          </span>
        </div>
        <span
          className={cn(
            'font-secondary flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1 text-[10px] font-bold tracking-[0.1em] uppercase',
            st.badge,
          )}
        >
          <span className="size-1.5" style={{ background: st.dot }} />
          {st.label}
        </span>
      </div>

      {/* title */}
      <h3 className="font-serif line-clamp-2 min-h-[52px] text-[20px] leading-[1.15] font-semibold md:text-[22px]">
        {listing.title}
      </h3>

      {/* tags */}
      <div className="flex flex-wrap gap-2">
        <span className="font-secondary rounded-full border border-[#C4502E]/25 bg-[#F4E6DF] px-2.5 py-1 text-[10px] font-bold tracking-[0.1em] text-[#C4502E] uppercase">
          {TYPE_LABEL[type]}
        </span>
        {skillTags.map((tag) => (
          <span
            key={tag}
            className="font-secondary rounded-full border border-[#E6DCC9] bg-[#FBF7EF] px-2.5 py-1 text-[10px] font-bold tracking-[0.1em] text-[#5C5147] uppercase"
          >
            {tag}
          </span>
        ))}
      </div>

      {/* meta */}
      <div className="font-secondary flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12px] text-[#5C5147]">
        <span className="flex items-center gap-1.5">
          <Clock className="size-3.5" />
          {deadline}
        </span>
        <span className="flex items-center gap-1.5">
          <Users className="size-3.5" />
          {listing.submissionCount ?? 0} {subLabel}
        </span>
      </div>

      {/* dashed divider */}
      <div className="border-t border-dashed border-[#E6DCC9]" />

      {/* footer: prize + action */}
      <div className="flex items-end justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <span className="font-secondary text-[10px] font-bold tracking-[0.14em] text-[#5C5147] uppercase">
            {POOL_LABEL[type]}
          </span>
          <span className="font-secondary flex items-center gap-1.5 text-[18px] font-extrabold text-[#2C3A2E]">
            <TokenIcon
              className="size-4 rounded-full"
              alt={listing.token || 'token'}
              symbol={listing.token}
            />
            {listing.type === 'grant' ? (
              <span>
                {grantAmount({
                  maxReward: listing?.maxRewardAsk!,
                  minReward: listing?.minRewardAsk!,
                })}
              </span>
            ) : (
              <SponsorPrize
                compensationType={listing?.compensationType}
                maxRewardAsk={listing?.maxRewardAsk}
                minRewardAsk={listing?.minRewardAsk}
                rewardAmount={listing?.rewardAmount}
                className="font-secondary text-[18px] font-extrabold text-[#2C3A2E]"
              />
            )}
            <span className="text-[12px] font-bold text-[#5C5147]">
              {listing.token}
            </span>
          </span>
        </div>
        {isClickable && (
          <span className="font-secondary flex shrink-0 items-center gap-1.5 rounded-full bg-[#2C3A2E] px-4 py-2 text-[12px] font-bold tracking-[0.08em] text-[#FBF7EF] uppercase transition-colors duration-200 group-hover/card:bg-[#3C4D3D]">
            {actionLabel} &rarr;
          </span>
        )}
      </div>
    </>
  );

  if (isClickable) {
    return (
      <Link href={href} className={cardClass}>
        {inner}
      </Link>
    );
  }
  return <div className={cardClass}>{inner}</div>;
}
