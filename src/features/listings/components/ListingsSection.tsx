import { usePrivy } from '@privy-io/react-auth';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { AnimateChangeInHeight } from '@/components/shared/AnimateChangeInHeight';
import { EmptySection } from '@/components/shared/EmptySection';
import { Separator } from '@/components/ui/separator';
import { useBreakpoint } from '@/hooks/use-breakpoint';
import { useServerTimeSync } from '@/hooks/use-server-time';
import { dayjs } from '@/utils/dayjs';
import { formatNumberWithSuffix } from '@/utils/formatNumberWithSuffix';

import { chaptersQuery } from '@/features/chapters/queries/chapters';
import { HACKATHONS } from '@/features/hackathon/constants/hackathons';
import { sponsorStageQuery } from '@/features/home/queries/sponsor-stage';
import { SponsorStage } from '@/features/home/types/sponsor-stage';
import { getRegionSlug } from '@/features/listings/utils/region';
import BountyCard from '@/features/stfun/components/cards/BountyCard';

const SKELETON_COUNT = 6;
const skeletonArray = Array.from({ length: SKELETON_COUNT }, (_, i) => i);

import {
  type ListingCategory,
  type ListingContext,
  type ListingSortOption,
  type ListingStatus,
  type ListingTab,
  useListings,
} from '../hooks/useListings';
import { useListingsFilterCount } from '../hooks/useListingsFilterCount';
import { useListingState } from '../hooks/useListingState';
import type { Listing, ListingTabsProps } from '../types';
import { AddListingCard } from './AddListingCard';
import { DaybreakBrowseHeader } from './DaybreakBrowseHeader';
import { ListingCardSkeleton } from './ListingCard';
import { ListingFilters } from './ListingFilters';
import { ListingTabs } from './ListingTabs';
import { ViewAllButton } from './ViewAllButton';

const TYPE_LABELS: Record<string, string> = {
  bounty: 'Bounty',
  project: 'Project',
  grant: 'Quest',
  hackathon: 'Hackathon',
};

const getInitials = (name?: string) =>
  (name ?? '?')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase() || '?';

const getPrize = (listing: Listing): { prize: string; currency: string } => {
  const token = listing.token ?? '';
  switch (listing.compensationType) {
    case 'range':
      if (listing.minRewardAsk && listing.maxRewardAsk) {
        return {
          prize: `${formatNumberWithSuffix(listing.minRewardAsk)}-${formatNumberWithSuffix(listing.maxRewardAsk)}`,
          currency: token,
        };
      }
      return { prize: formatNumberWithSuffix(listing.rewardAmount ?? 0), currency: token };
    case 'variable':
      if (listing.isWinnersAnnounced && listing.rewardAmount) {
        return { prize: formatNumberWithSuffix(listing.rewardAmount), currency: token };
      }
      return { prize: 'Variable', currency: '' };
    default:
      return { prize: formatNumberWithSuffix(listing.rewardAmount ?? 0), currency: token };
  }
};

// Maps a real listing into the props of the landing-page BountyCard design.
const toBountyCardProps = (listing: Listing, now: number) => {
  const daysLeft = Math.max(0, dayjs(listing.deadline).diff(dayjs(now), 'day'));
  const tags = Array.from(
    new Set((listing.skills ?? []).map((s) => s.skills)),
  ).slice(0, 3);
  const { prize, currency } = getPrize(listing);
  return {
    logo: getInitials(listing.sponsor?.name),
    org: listing.sponsor?.name ?? 'Sponsor',
    location:
      listing.region && listing.region.toLowerCase() !== 'global'
        ? listing.region
        : 'Global',
    title: listing.title ?? '',
    type: TYPE_LABELS[listing.type ?? 'bounty'] ?? 'Bounty',
    tags,
    daysLeft,
    submitted: listing._count?.Submission ?? 0,
    currency,
    prize,
    href: `/earn/listing/${listing.slug}`,
  };
};

export type EmptySectionFilters = {
  activeTab: ListingTab;
  activeCategory: ListingCategory;
  activeStatus: ListingStatus;
  activeSortBy: ListingSortOption;
};

interface ListingsSectionProps extends ListingTabsProps {
  customEmptySection?:
    | React.ReactNode
    | ((filters: EmptySectionFilters) => React.ReactNode);
  // 'daybreak' renders the Filing Index masthead + sticky control rail used on
  // the dedicated browse page (/earn/all), in place of the legacy header.
  browseVariant?: 'daybreak';
}
const FOR_YOU_SUPPORTED_TYPES: ReadonlyArray<ListingContext> = [
  'home',
  'all',
] as const;

export const ListingsSection = ({
  type,
  potentialSession,
  region,
  sponsor,
  skill,
  category,
  defaultTab,
  customEmptySection,
  browseVariant,
}: ListingsSectionProps) => {
  const isLg = useBreakpoint('lg');
  const { serverTime } = useServerTimeSync();
  const isSponsorContext = type === 'sponsor';
  const isBookmarksContext = type === 'bookmarks';
  const isProContext = type === 'pro';
  const isAgentContext = type === 'agents';

  const { authenticated, ready } = usePrivy();
  const supportsForYou = FOR_YOU_SUPPORTED_TYPES.includes(type);

  const { data: sponsorStageData } = useQuery({
    ...sponsorStageQuery,
    enabled: false,
  });
  const { data: chapters = [] } = useQuery(chaptersQuery);

  const isDaybreak = browseVariant === 'daybreak';

  const shouldShowAddListingCard = useMemo(() => {
    if (type !== 'home') return false;
    if (!isLg) return false;
    if (!sponsorStageData?.stage) return false;
    return (
      sponsorStageData.stage === SponsorStage.NEW_SPONSOR ||
      sponsorStageData.stage === SponsorStage.NEXT_LISTING
    );
  }, [sponsorStageData, isLg, type]);

  const { data: categoryCounts, isLoading: countsLoading } =
    useListingsFilterCount({
      context: type,
      tab: defaultTab ?? 'all',
      status: 'open',
      region,
      sponsor,
      skill,
      authenticated,
    });

  const optimalDefaultCategory = useMemo((): ListingCategory => {
    if (countsLoading || !categoryCounts) {
      return (potentialSession || (ready && authenticated)) && supportsForYou
        ? 'For You'
        : 'All';
    }

    const forYouCount = categoryCounts['For You'] || 0;

    if (
      (potentialSession || (ready && authenticated)) &&
      supportsForYou &&
      forYouCount > 2
    ) {
      return 'For You';
    }

    return 'All';
  }, [
    categoryCounts,
    countsLoading,
    potentialSession,
    authenticated,
    ready,
    supportsForYou,
  ]);

  const {
    activeTab,
    activeCategory,
    activeStatus,
    activeSortBy,
    activeOrder,
    handleTabChange,
    handleCategoryChange,
    handleStatusChange,
    handleSortChange,
  } = useListingState({
    defaultCategory: optimalDefaultCategory,
    defaultStatus:
      isSponsorContext || isBookmarksContext || isProContext
        ? 'all'
        : undefined,
    defaultSortBy:
      isSponsorContext || isBookmarksContext || isProContext
        ? 'Status'
        : undefined,
    defaultTab,
  });

  // For category contexts, use the category prop (route category)
  // For other contexts, use activeCategory (filter selection)
  const effectiveCategory =
    type === 'category' || type === 'category-all'
      ? (category as ListingCategory)
      : (type === 'bookmarks' || type === 'pro') && activeCategory === 'For You'
        ? ('All' as ListingCategory)
        : activeCategory;

  const {
    data: listings,
    isLoading,
    error,
  } = useListings({
    context: type,
    tab: activeTab,
    category: effectiveCategory,
    status: activeStatus,
    sortBy: activeSortBy,
    order: activeOrder,
    region,
    sponsor,
    skill,
    authenticated,
  });

  const viewAllLink = () => {
    if (HACKATHONS.some((hackathon) => hackathon.slug === activeTab)) {
      return `/earn/hackathon/${activeTab}`;
    }
    let basePath: string;
    if (type === 'home') {
      basePath = '/earn/all';
    } else if (type === 'region') {
      basePath = `/earn/regions/${getRegionSlug(region || '', chapters)}/all`;
    } else if (type === 'skill' && skill) {
      basePath = `/earn/skill/${skill}/all`;
    } else {
      basePath = '/earn/all';
    }

    const params = new URLSearchParams();
    params.set('category', activeCategory);
    if (activeStatus) params.set('status', activeStatus);
    if (activeSortBy) params.set('sortBy', activeSortBy);
    if (activeOrder) params.set('order', activeOrder);
    if (activeTab) params.set('tab', activeTab);
    if (activeCategory) params.set('category', activeCategory);

    return `${basePath}?${params.toString()}`;
  };

  const gridClass = 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3';

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className={gridClass}>
          {skeletonArray.map((index) => (
            <ListingCardSkeleton key={index} />
          ))}
        </div>
      );
    }

    if (error) {
      return <EmptySection title="Error loading listings" />;
    }

    if (!listings?.length) {
      const emptySectionContent =
        typeof customEmptySection === 'function'
          ? customEmptySection({
              activeTab,
              activeCategory: effectiveCategory,
              activeStatus,
              activeSortBy,
            })
          : customEmptySection;

      return (
        <>
          {shouldShowAddListingCard && (
            <div className={gridClass}>
              <AddListingCard
                listingType={
                  activeTab === 'bounties'
                    ? 'bounty'
                    : activeTab === 'projects'
                      ? 'project'
                      : 'bounty'
                }
              />
            </div>
          )}
          {emptySectionContent ?? (
            <EmptySection
              title="No opportunities found"
              message="We don't have any relevant opportunities for the current filters."
            />
          )}
        </>
      );
    }

    return (
      <>
        <div className={gridClass}>
          {shouldShowAddListingCard && (
            <AddListingCard
              listingType={
                activeTab === 'bounties'
                  ? 'bounty'
                  : activeTab === 'projects'
                    ? 'project'
                    : 'bounty'
              }
            />
          )}
          {listings.map((listing) => (
            <BountyCard
              key={listing.id}
              {...toBountyCardProps(listing, serverTime())}
            />
          ))}
        </div>
        {(type === 'home' || type === 'region' || type === 'skill') && (
          <ViewAllButton
            posthogEvent="viewall bottom_listings"
            href={viewAllLink()}
          />
        )}
      </>
    );
  };

  const getTitle = () => {
    if (isSponsorContext) {
      return 'All Listings';
    }
    if (isProContext) {
      return 'Premium Listings';
    }
    if (isAgentContext) {
      return 'Agent-eligible listings';
    }
    return 'Browse Opportunities';
  };

  // Talent-facing browse pages rely on the global nav for tabs/categories, so
  // the in-page heading, tabs and filter bar are only shown where they are
  // functionally required (sponsor, bookmarks and pro contexts).
  const showHeader = isSponsorContext || isBookmarksContext || isProContext;

  if (isDaybreak) {
    return (
      <div className="mb-12">
        <DaybreakBrowseHeader
          activeCategory={activeCategory}
          onCategoryChange={handleCategoryChange}
        />
        <div className="mt-6">
          <AnimateChangeInHeight disableOnHeightZero>
            {renderContent()}
          </AnimateChangeInHeight>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-5 mb-10">
      {showHeader && (
        <>
          <div className="flex w-full items-center justify-between md:mb-1.5">
            {isBookmarksContext ? (
              <span className="font-secondary mb-2 text-[11px] font-bold tracking-[0.18em] text-[#6b5e50] uppercase">
                Filter &amp; sort
              </span>
            ) : (
              <div className="flex items-center">
                <p className="text-lg font-semibold text-slate-800">
                  {getTitle()}
                </p>

                <div className="hidden items-center md:flex">
                  <Separator orientation="vertical" className="mx-3 h-6" />
                  <ListingTabs
                    isPro={isProContext}
                    type={type}
                    activeTab={activeTab}
                    handleTabChange={handleTabChange}
                  />
                </div>
              </div>
            )}

            <ListingFilters
              activeStatus={activeStatus}
              activeSortBy={activeSortBy}
              activeOrder={activeOrder}
              onStatusChange={handleStatusChange}
              onSortChange={handleSortChange}
              showAllFilter
              showStatusSort
            />
          </div>
          <div className="mt-2 mb-1 md:hidden">
            <ListingTabs
              type={type}
              activeTab={activeTab}
              handleTabChange={handleTabChange}
            />
          </div>

          <div className="mb-2 h-px w-full bg-slate-200" />
        </>
      )}

      <AnimateChangeInHeight disableOnHeightZero>
        {renderContent()}
      </AnimateChangeInHeight>
    </div>
  );
};
