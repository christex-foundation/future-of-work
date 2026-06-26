import Link from 'next/link';

import { useUser } from '@/store/user';
import { cn } from '@/utils/cn';
import { dayjs } from '@/utils/dayjs';

import { grantAmount } from '@/features/grants/utils/grantAmount';
import { isListingEditable } from '@/features/listing-builder/utils/isListingEditable';
import { type ListingWithSubmissions } from '@/features/listings/types';
import { getListingStatus } from '@/features/listings/utils/status';

import { SponsorPrize } from '../SponsorPrize';

const tableColumns =
  'grid grid-cols-[minmax(280px,1.35fr)_132px_178px_128px_104px] items-center gap-6';

function statusStyle(status: string) {
  if (status === 'In Progress') {
    return {
      label: 'Open',
      className: 'bg-[#E5E8DD] text-[#2C3A2E]',
      dot: '#6F845F',
    };
  }
  if (status === 'In Review' || status === 'Under Verification') {
    return {
      label: status === 'Under Verification' ? 'Verifying' : 'In Review',
      className: 'bg-[#F4E6DF] text-[#C4502E]',
      dot: '#C4502E',
    };
  }
  if (status === 'Completed') {
    return {
      label: 'Completed',
      className: 'bg-[#E7E6E1] text-[#2C3A2E]',
      dot: '#2C3A2E',
    };
  }
  if (status === 'Payment Pending' || status === 'Fndn to Pay') {
    return {
      label: 'Payment Due',
      className: 'bg-[#F4E6DF] text-[#C4502E]',
      dot: '#C4502E',
    };
  }
  return {
    label: status === 'Draft' ? 'Draft' : status,
    className: 'bg-[#EDE6D7] text-[#5C5147]',
    dot: '#9B907F',
  };
}

function listingHref(listing: ListingWithSubmissions, isClickable: boolean) {
  if (!isClickable) return '#';
  if (listing.isPublished) {
    return listing.type === 'grant'
      ? `/earn/dashboard/grants/${listing.slug}/applications/`
      : `/earn/dashboard/listings/${listing.slug}/submissions/`;
  }
  return `/earn/dashboard/listings/${listing.slug}/edit`;
}

function metaText(listing: ListingWithSubmissions) {
  const posted = listing.publishedAt
    ? `Posted ${dayjs(listing.publishedAt).fromNow()}`
    : 'Not yet published';
  const skill = listing.skills?.[0]?.skills;
  return skill ? `${posted} · ${skill}` : posted;
}

function closesText(listing: ListingWithSubmissions, status: string) {
  if (!listing.isPublished) return { label: '—', urgent: false, paid: false };
  if (status === 'Completed') return { label: 'paid', urgent: false, paid: true };
  if (!listing.deadline || listing.type === 'grant') {
    return { label: '—', urgent: false, paid: false };
  }

  const now = dayjs();
  const deadline = dayjs(listing.deadline);
  if (deadline.isBefore(now)) {
    return { label: 'closed', urgent: false, paid: false };
  }

  const days = Math.max(1, deadline.diff(now, 'day'));
  return { label: `in ${days}d`, urgent: days <= 3, paid: false };
}

function ListingRow({
  listing,
  maxSubmissions,
}: {
  listing: ListingWithSubmissions;
  maxSubmissions: number;
}) {
  const { user } = useUser();
  const status = getListingStatus(listing);
  const statusPill = statusStyle(status);
  const isClickable = listing.isPublished || isListingEditable({ listing, user });
  const href = listingHref(listing, isClickable);
  const submissions = listing.submissionCount ?? listing._count?.Submission ?? 0;
  const progress = maxSubmissions
    ? Math.max(8, Math.round((submissions / maxSubmissions) * 100))
    : 0;
  const closes = closesText(listing, status);

  const inner = (
    <div className={cn(tableColumns, 'min-h-[108px] px-6 py-5')}>
      <div className="min-w-0">
        <h3 className="font-serif max-w-[22rem] text-[21px] leading-[1.08] font-medium tracking-[-0.01em] text-[#221A14]">
          {listing.title}
        </h3>
        <p className="mt-1.5 truncate text-[13px] font-medium text-[#5C5147]">
          {metaText(listing)}
        </p>
      </div>

      <div>
        <span
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-semibold',
            statusPill.className,
          )}
        >
          <span
            className="size-1.5 rounded-full"
            style={{ background: statusPill.dot }}
          />
          {statusPill.label}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <span className="w-7 text-[16px] font-medium text-[#221A14]">
          {submissions || '—'}
        </span>
        <span className="h-1.5 w-24 overflow-hidden rounded-full bg-[#E4D9C7]">
          {!!submissions && (
            <span
              className="block h-full rounded-full bg-[#6F845F]"
              style={{ width: `${progress}%` }}
            />
          )}
        </span>
      </div>

      <div className="font-serif text-[22px] leading-none font-medium text-[#221A14]">
        {listing.type === 'grant' ? (
          grantAmount({
            maxReward: listing?.maxRewardAsk!,
            minReward: listing?.minRewardAsk!,
          })
        ) : (
          <SponsorPrize
            compensationType={listing?.compensationType}
            maxRewardAsk={listing?.maxRewardAsk}
            minRewardAsk={listing?.minRewardAsk}
            rewardAmount={listing?.rewardAmount}
            className="font-serif text-[22px] leading-none font-medium text-[#221A14]"
          />
        )}
      </div>

      <div
        className={cn(
          'text-right text-[13px] font-medium',
          closes.urgent
            ? 'text-[#C4502E]'
            : closes.paid
              ? 'text-[#6F845F]'
              : 'text-[#5C5147]',
        )}
      >
        {closes.label}
      </div>
    </div>
  );

  if (!isClickable) {
    return <div className="block">{inner}</div>;
  }

  return (
    <Link
      href={href}
      className="block transition-colors hover:bg-[#F2EAD9]/45"
    >
      {inner}
    </Link>
  );
}

export function ListingBoardList({
  listings,
}: {
  listings: ListingWithSubmissions[];
}) {
  const maxSubmissions = Math.max(
    1,
    ...listings.map(
      (listing) => listing.submissionCount ?? listing._count?.Submission ?? 0,
    ),
  );

  return (
    <section className="mt-6 overflow-hidden rounded-[18px] border border-[#E6DCC9] bg-[#FFFDF8] shadow-[0_28px_80px_-58px_rgba(54,38,22,0.55)]">
      <div
        className={cn(
          tableColumns,
          'border-b border-[#E6DCC9] bg-[#FBF7EF] px-6 py-3 text-[10px] font-bold tracking-[0.18em] text-[#5C5147] uppercase',
        )}
      >
        <span>Bounty</span>
        <span>Status</span>
        <span>Submissions</span>
        <span>Prize</span>
        <span className="text-right">Closes</span>
      </div>

      <div className="divide-y divide-[#E6DCC9] bg-[#FFFDF8]">
        {listings.map((listing, i) => (
          <ListingRow
            key={listing.id ?? i}
            listing={listing}
            maxSubmissions={maxSubmissions}
          />
        ))}
      </div>
    </section>
  );
}
