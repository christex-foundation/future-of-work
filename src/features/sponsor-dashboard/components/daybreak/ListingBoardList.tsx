import Link from 'next/link';

import { TokenIcon } from '@/components/ui/token-icon';
import { useUser } from '@/store/user';
import { cn } from '@/utils/cn';

import { grantAmount } from '@/features/grants/utils/grantAmount';
import { isListingEditable } from '@/features/listing-builder/utils/isListingEditable';
import { type ListingWithSubmissions } from '@/features/listings/types';
import { formatDeadline } from '@/features/listings/utils/deadline';
import { getListingStatus } from '@/features/listings/utils/status';

import { SponsorPrize } from '../SponsorPrize';
import { fowStatus } from './ListingBoardCard';

function ListingRow({ listing }: { listing: ListingWithSubmissions }) {
  const { user } = useUser();

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

  const rowClass = cn(
    'group/row flex items-center gap-4 rounded-xl border-2 border-[#1d1815] bg-[#f4eee3] px-5 py-4 text-[#1d1815] no-underline shadow-[3px_3px_0_#1d1815] transition-all duration-200',
    isClickable &&
      'hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0_#1d1815]',
  );

  const inner = (
    <>
      {/* org badge */}
      <div className="font-secondary grid size-11 shrink-0 place-items-center overflow-hidden rounded-md bg-[#123a33] text-[12px] font-bold tracking-wide text-[#f4eee3]">
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

      {/* title + meta */}
      <div className="min-w-0 flex-1">
        <h3 className="truncate text-[17px] leading-tight font-bold">
          {listing.title}
        </h3>
        <p className="font-secondary mt-1 truncate text-[11px] font-bold tracking-[0.12em] text-[#6b5e50] uppercase">
          {sponsorName ? `${sponsorName} · ` : ''}
          {deadline}
        </p>
      </div>

      {/* amount + status */}
      <div className="flex shrink-0 flex-col items-end gap-2">
        <span className="font-secondary flex items-center gap-1.5 text-[15px] font-extrabold text-[#123a33]">
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
              className="font-secondary text-[15px] font-extrabold text-[#123a33]"
            />
          )}
          <span className="text-[11px] font-bold text-[#6b5e50]">
            {listing.token}
          </span>
        </span>
        <span
          className={cn(
            'font-secondary flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[10px] font-bold tracking-[0.1em] uppercase',
            st.badge,
          )}
        >
          <span className="size-1.5" style={{ background: st.dot }} />
          {st.label}
        </span>
      </div>
    </>
  );

  if (isClickable) {
    return (
      <Link href={href} className={rowClass}>
        {inner}
      </Link>
    );
  }
  return <div className={rowClass}>{inner}</div>;
}

export function ListingBoardList({
  listings,
}: {
  listings: ListingWithSubmissions[];
}) {
  return (
    <div className="mt-6 flex flex-col gap-4">
      {listings.map((listing, i) => (
        <ListingRow key={listing.id ?? i} listing={listing} />
      ))}
    </div>
  );
}
