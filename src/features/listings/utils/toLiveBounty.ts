import { dayjs } from '@/utils/dayjs';
import { formatNumberWithSuffix } from '@/utils/formatNumberWithSuffix';

import {
  DaybreakBountyCard,
  type LiveBounty,
} from '@/features/stfun/components/daybreak/DaybreakBountyCard';

import type { Listing } from '../types';

export { DaybreakBountyCard };
export type { LiveBounty };

export const TYPE_LABELS: Record<string, string> = {
  bounty: 'Bounty',
  project: 'Project',
  grant: 'Quest',
  hackathon: 'Hackathon',
};

export const getPrize = (
  listing: Listing,
): { prize: string; currency: string } => {
  const token = listing.token ?? '';
  switch (listing.compensationType) {
    case 'range':
      if (listing.minRewardAsk && listing.maxRewardAsk) {
        return {
          prize: `${formatNumberWithSuffix(listing.minRewardAsk)}-${formatNumberWithSuffix(listing.maxRewardAsk)}`,
          currency: token,
        };
      }
      return {
        prize: formatNumberWithSuffix(listing.rewardAmount ?? 0),
        currency: token,
      };
    case 'variable':
      if (listing.isWinnersAnnounced && listing.rewardAmount) {
        return {
          prize: formatNumberWithSuffix(listing.rewardAmount),
          currency: token,
        };
      }
      return { prize: 'Variable', currency: '' };
    default:
      return {
        prize: formatNumberWithSuffix(listing.rewardAmount ?? 0),
        currency: token,
      };
  }
};

// Maps a real listing into the canonical DaybreakBountyCard's props,
// so every surface (marketing homepage, the /earn board, and the sponsor
// dashboard) renders the exact same card.
export const toLiveBounty = (listing: Listing, now: number): LiveBounty => {
  const tags = Array.from(
    new Set((listing.skills ?? []).map((s) => s.skills)),
  ).slice(0, 3);
  const { prize, currency } = getPrize(listing);
  const isBeforeDeadline = dayjs(now).isBefore(dayjs(listing.deadline));
  const daysLeft = isBeforeDeadline
    ? Math.max(1, dayjs(listing.deadline).diff(dayjs(now), 'day'))
    : null;

  const isProject = listing.type === 'project';

  let status = 'Open';
  let dueLabel: string | undefined;
  if (listing.isWinnersAnnounced) {
    status = 'Completed';
    dueLabel = isProject ? 'Role filled' : 'Winners announced';
  } else if (!isBeforeDeadline) {
    status = 'In review';
    dueLabel = isProject ? 'Applications closed' : 'Submissions closed';
  }

  // Elapsed-time meter (bounties): share of the publish→deadline window used up.
  let elapsedPct: number | null = null;
  if (listing.publishedAt && listing.deadline) {
    const start = dayjs(listing.publishedAt).valueOf();
    const end = dayjs(listing.deadline).valueOf();
    if (end > start) {
      elapsedPct = Math.min(
        100,
        Math.max(0, Math.round(((now - start) / (end - start)) * 100)),
      );
    }
  }

  const applyBy =
    isProject && isBeforeDeadline && listing.deadline
      ? dayjs(listing.deadline).format('MMM D')
      : null;

  return {
    title: listing.title ?? '',
    slug: listing.slug ?? '',
    sponsor: listing.sponsor?.name ?? 'Sponsor',
    sponsorLogo: listing.sponsor?.logo ?? null,
    cat: tags[0] ?? TYPE_LABELS[listing.type ?? 'bounty'] ?? 'Bounty',
    reward: null,
    prizeLabel: prize === 'Variable' ? 'Variable' : `$${prize}`,
    token: currency || 'USDC',
    tags,
    daysLeft,
    status,
    dueLabel,
    type: isProject ? 'project' : 'bounty',
    submissions: listing._count?.Submission ?? null,
    elapsedPct: isProject ? null : elapsedPct,
    applyBy,
  };
};
