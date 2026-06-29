import { usePrivy } from '@privy-io/react-auth';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useMemo } from 'react';

import { AnimateChangeInHeight } from '@/components/shared/AnimateChangeInHeight';
import { EmptySection } from '@/components/shared/EmptySection';
import { Separator } from '@/components/ui/separator';
import { useBreakpoint } from '@/hooks/use-breakpoint';
import { useServerTimeSync } from '@/hooks/use-server-time';
import { cn } from '@/utils/cn';

import { chaptersQuery } from '@/features/chapters/queries/chapters';
import { HACKATHONS } from '@/features/hackathon/constants/hackathons';
import { sponsorStageQuery } from '@/features/home/queries/sponsor-stage';
import { SponsorStage } from '@/features/home/types/sponsor-stage';
import { getRegionSlug } from '@/features/listings/utils/region';
import { DaybreakBountyCard } from '@/features/stfun/components/daybreak/DaybreakBountyCard';
import {
  TYPE_LABELS,
  toLiveBounty,
} from '@/features/listings/utils/toLiveBounty';

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
import type { ListingTabsProps } from '../types';
import { AddListingCard } from './AddListingCard';
import { DaybreakBrowseHeader } from './DaybreakBrowseHeader';
import { ListingCardSkeleton } from './ListingCard';
import { ListingFilters } from './ListingFilters';
import { ListingTabs } from './ListingTabs';
import { ViewAllButton } from './ViewAllButton';

// Daybreak board controls (talent /earn home view).
const BOARD_CATEGORIES: ReadonlyArray<{
  label: string;
  value: ListingCategory;
}> = [
  { label: 'All', value: 'All' },
  { label: 'Design', value: 'Design' },
  { label: 'Development', value: 'Development' },
  { label: 'Content', value: 'Content' },
  { label: 'Other', value: 'Other' },
];

const BOARD_SORTS: ReadonlyArray<{
  label: string;
  sortBy: ListingSortOption;
  order: 'asc' | 'desc';
}> = [
  { label: 'Freshest', sortBy: 'Date', order: 'desc' },
  { label: 'Biggest prize', sortBy: 'Prize', order: 'desc' },
  { label: 'Most active', sortBy: 'Submissions', order: 'desc' },
];

const indexPill = (status: string) => {
  if (status === 'Completed')
    return { cls: 'bg-[#F2EAD9] text-[#5C5147]', dot: 'bg-[#5C5147]' };
  if (status === 'In review')
    return { cls: 'bg-[#C4502E]/12 text-[#C4502E]', dot: 'bg-[#C4502E]' };
  return { cls: 'bg-[#8FA37E]/20 text-[#2C3A2E]', dot: 'bg-[#8FA37E]' };
};

// Daybreak editorial leader-row — the canonical list treatment shared by the
// talent /earn board and the sponsor profile index.
function LeaderRow({
  b,
  index,
}: {
  b: ReturnType<typeof toLiveBounty>;
  index: number;
}) {
  const status = b.status ?? 'Open';
  const pill = indexPill(status);
  const isWin = status === 'Completed';
  const meta = isWin
    ? (b.dueLabel ?? 'Winners announced')
    : [
        b.submissions != null
          ? `${b.submissions} submission${b.submissions === 1 ? '' : 's'}`
          : null,
        b.daysLeft != null
          ? `${b.daysLeft} day${b.daysLeft === 1 ? '' : 's'} left`
          : b.dueLabel,
        b.token,
      ]
        .filter(Boolean)
        .join(' · ');
  return (
    <Link
      href={`/earn/listing/${b.slug}`}
      className="group grid grid-cols-[1fr_auto] items-center gap-5 border-b border-[#E6DCC9] px-1.5 py-5 transition-all hover:rounded-xl hover:bg-white hover:px-4 hover:shadow-[0_12px_34px_-22px_rgba(54,38,22,0.45)] sm:grid-cols-[40px_1fr_auto] sm:gap-6"
    >
      <span className="hidden text-right font-serif text-[18px] text-[#5C5147] sm:block">
        {String(index + 1).padStart(2, '0')}
      </span>
      <div className="min-w-0">
        <div className="mb-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1">
          <span className="text-[11px] font-semibold tracking-[0.13em] text-[#6B7A4F] uppercase">
            {b.cat}
          </span>
          <span className="text-[#E6DCC9]">·</span>
          <span className="text-[11px] font-semibold tracking-[0.13em] text-[#5C5147] uppercase">
            {TYPE_LABELS[b.type ?? 'bounty'] ?? b.type ?? 'Bounty'}
          </span>
          <span
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold',
              pill.cls,
            )}
          >
            <span className={cn('size-1.5 rounded-full', pill.dot)} />
            {status}
          </span>
        </div>
        <h3 className="font-serif text-[22px] leading-[1.12] font-normal tracking-[-0.01em] text-[#221A14] group-hover:text-[#2C3A2E]">
          {b.title}
        </h3>
        <p className="mt-1 text-[13.5px] text-[#5C5147]">{meta}</p>
      </div>
      <div className="text-right whitespace-nowrap">
        <div
          className={cn(
            'font-serif text-[26px] leading-none',
            isWin ? 'text-[#C4502E]' : 'text-[#221A14]',
          )}
        >
          {b.prizeLabel}
        </div>
        <span className="mt-2 inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#6B7A4F] transition-all group-hover:gap-2.5 group-hover:text-[#2C3A2E]">
          {isWin ? 'View result' : 'View brief'} →
        </span>
      </div>
    </Link>
  );
}

function LeaderRowSkeleton() {
  return (
    <div className="grid grid-cols-[1fr_auto] items-center gap-6 border-b border-[#E6DCC9] px-1.5 py-5 sm:grid-cols-[40px_1fr_auto]">
      <div className="hidden h-4 w-6 animate-pulse rounded bg-[#E9E0CD] sm:block" />
      <div className="space-y-2">
        <div className="h-3 w-32 animate-pulse rounded bg-[#E9E0CD]" />
        <div className="h-5 w-2/3 animate-pulse rounded bg-[#E9E0CD]" />
      </div>
      <div className="h-6 w-16 animate-pulse rounded bg-[#E9E0CD]" />
    </div>
  );
}

// Talent /earn board table — mirrors the sponsor dashboard ListingBoardList:
// title + meta, status pill, submissions + progress, prize, closes.
const HOME_COLS =
  'grid grid-cols-[1fr_auto] items-center gap-4 md:grid-cols-[minmax(220px,1.4fr)_124px_168px_120px_96px] md:gap-6';

function homeStatusPill(status: string) {
  if (status === 'Completed')
    return {
      label: 'Completed',
      className: 'bg-[#E7E6E1] text-[#2C3A2E]',
      dot: '#2C3A2E',
    };
  if (status === 'In review')
    return {
      label: 'In review',
      className: 'bg-[#F4E6DF] text-[#C4502E]',
      dot: '#C4502E',
    };
  return {
    label: 'Open',
    className: 'bg-[#E5E8DD] text-[#2C3A2E]',
    dot: '#6F845F',
  };
}

function homeCloses(b: ReturnType<typeof toLiveBounty>) {
  if (b.status === 'Completed') return { label: 'paid', cls: 'text-[#6F845F]' };
  if (b.status === 'In review') return { label: 'closed', cls: 'text-[#5C5147]' };
  if (b.daysLeft != null)
    return {
      label: `in ${b.daysLeft}d`,
      cls: b.daysLeft <= 3 ? 'text-[#C4502E]' : 'text-[#5C5147]',
    };
  return { label: '—', cls: 'text-[#5C5147]' };
}

function HomeListRow({
  b,
  maxSubmissions,
}: {
  b: ReturnType<typeof toLiveBounty>;
  maxSubmissions: number;
}) {
  const pill = homeStatusPill(b.status ?? 'Open');
  const submissions = b.submissions ?? 0;
  const progress = maxSubmissions
    ? Math.max(8, Math.round((submissions / maxSubmissions) * 100))
    : 0;
  const closes = homeCloses(b);

  return (
    <Link
      href={`/earn/listing/${b.slug}`}
      className="block transition-colors hover:bg-[#F2EAD9]/45"
    >
      <div className={cn(HOME_COLS, 'min-h-[100px] px-5 py-5 md:px-6')}>
        <div className="min-w-0">
          <h3 className="max-w-[24rem] truncate font-serif text-[20px] leading-[1.1] font-medium tracking-[-0.01em] text-[#221A14] md:text-[21px]">
            {b.title}
          </h3>
          <p className="mt-1.5 truncate text-[13px] font-medium text-[#5C5147]">
            {b.sponsor} · {b.cat}
          </p>
        </div>

        <div className="hidden md:block">
          <span
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-semibold',
              pill.className,
            )}
          >
            <span
              className="size-1.5 rounded-full"
              style={{ background: pill.dot }}
            />
            {pill.label}
          </span>
        </div>

        <div className="hidden items-center gap-3 md:flex">
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

        <div className="font-serif text-[20px] leading-none font-medium text-[#221A14] md:text-[22px]">
          {b.prizeLabel}
        </div>

        <div
          className={cn(
            'hidden text-right text-[13px] font-medium md:block',
            closes.cls,
          )}
        >
          {closes.label}
        </div>
      </div>
    </Link>
  );
}

function HomeListSkeleton() {
  return (
    <section className="overflow-hidden rounded-[18px] border border-[#E6DCC9] bg-[#FFFDF8]">
      <div className="divide-y divide-[#E6DCC9]">
        {skeletonArray.map((i) => (
          <div
            key={i}
            className="flex items-center justify-between px-6 py-6"
          >
            <div className="space-y-2">
              <div className="h-5 w-64 animate-pulse rounded bg-[#E9E0CD]" />
              <div className="h-3 w-40 animate-pulse rounded bg-[#E9E0CD]" />
            </div>
            <div className="h-6 w-20 animate-pulse rounded bg-[#E9E0CD]" />
          </div>
        ))}
      </div>
    </section>
  );
}

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
  // sponsor-only: renders the catalogue as the Daybreak "editorial index"
  // (numbered leader rows) used on the company profile, in place of the card grid.
  sponsorIndex?: boolean;
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
  sponsorIndex,
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

  const gridClass = isDaybreak
    ? 'cover-mosaic'
    : type === 'home'
      ? 'grid grid-cols-1 gap-5 md:grid-cols-2'
      : 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3';

  const resolveEmpty = () =>
    typeof customEmptySection === 'function'
      ? customEmptySection({
          activeTab,
          activeCategory: effectiveCategory,
          activeStatus,
          activeSortBy,
        })
      : customEmptySection;

  // Talent /earn board renders as an editorial leader-row list (not the grid).
  const isHomeList = type === 'home';

  const renderContent = () => {
    if (isHomeList) {
      if (isLoading) return <HomeListSkeleton />;
      if (error) return <EmptySection title="Error loading listings" />;
      if (!listings?.length) {
        return (
          resolveEmpty() ?? (
            <EmptySection
              title="No opportunities found"
              message="We don't have any relevant opportunities for the current filters."
            />
          )
        );
      }
      const maxSubmissions = Math.max(
        1,
        ...listings.map((l) => l._count?.Submission ?? 0),
      );
      return (
        <>
          <section className="overflow-hidden rounded-[18px] border border-[#E6DCC9] bg-[#FFFDF8] shadow-[0_28px_80px_-58px_rgba(54,38,22,0.55)]">
            <div
              className={cn(
                HOME_COLS,
                'hidden border-b border-[#E6DCC9] bg-[#FBF7EF] px-6 py-3 text-[10px] font-bold tracking-[0.18em] text-[#5C5147] uppercase md:grid',
              )}
            >
              <span>Bounty</span>
              <span>Status</span>
              <span>Submissions</span>
              <span>Prize</span>
              <span className="text-right">Closes</span>
            </div>
            <div className="divide-y divide-[#E6DCC9] bg-[#FFFDF8]">
              {listings.map((listing) => (
                <HomeListRow
                  key={listing.id}
                  b={toLiveBounty(listing, serverTime())}
                  maxSubmissions={maxSubmissions}
                />
              ))}
            </div>
          </section>
          <ViewAllButton
            posthogEvent="viewall bottom_listings"
            href={viewAllLink()}
          />
        </>
      );
    }

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
      const emptySectionContent = resolveEmpty();

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
          {listings.map((listing, index) => (
            <DaybreakBountyCard
              key={listing.id}
              bounty={toLiveBounty(listing, serverTime())}
              featured={isDaybreak && index === 0}
            />
          ))}
        </div>
        {(type === 'region' || type === 'skill') && (
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

  if (sponsorIndex) {
    const sponsorTabs: { id: ListingTab; title: string }[] = [
      { id: 'all', title: 'All' },
      { id: 'bounties', title: 'Bounties' },
      { id: 'projects', title: 'Projects' },
    ];

    const renderIndex = () => {
      if (isLoading) {
        return (
          <div className="mt-3.5 border-t-[1.5px] border-[#221A14]">
            {skeletonArray.map((i) => (
              <LeaderRowSkeleton key={i} />
            ))}
          </div>
        );
      }
      if (error) return <EmptySection title="Error loading listings" />;
      if (!listings?.length) {
        return (
          resolveEmpty() ?? (
            <EmptySection
              title="No opportunities found"
              message="We don't have any relevant opportunities for the current filters."
            />
          )
        );
      }
      return (
        <div className="mt-3.5 border-t-[1.5px] border-[#221A14]">
          {listings.map((listing, i) => (
            <LeaderRow
              key={listing.id}
              b={toLiveBounty(listing, serverTime())}
              index={i}
            />
          ))}
        </div>
      );
    };

    return (
      <div id="listings" className="mt-2 mb-10">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <span className="mb-3.5 inline-flex items-center gap-2.5 text-[12px] font-semibold tracking-[0.2em] text-[#6B7A4F] uppercase before:h-[1.5px] before:w-[18px] before:bg-[#6B7A4F] before:content-['']">
              The work
            </span>
            <h2 className="font-serif text-[clamp(28px,4vw,42px)] leading-none font-normal tracking-[-0.015em] text-[#221A14]">
              Open briefs &amp; the archive.
            </h2>
          </div>
          <div className="flex gap-1 rounded-full border border-[#E6DCC9] bg-[#F2EAD9] p-1.5">
            {sponsorTabs.map((t) => (
              <button
                key={t.id}
                onClick={() => handleTabChange(t.id, 'sponsor_index')}
                className={cn(
                  'rounded-full px-4 py-2 text-[13.5px] font-semibold transition',
                  activeTab === t.id
                    ? 'bg-[#2C3A2E] text-[#FBF7EF]'
                    : 'text-[#5C5147] hover:text-[#221A14]',
                )}
              >
                {t.title}
              </button>
            ))}
          </div>
        </div>
        <AnimateChangeInHeight disableOnHeightZero>
          {renderIndex()}
        </AnimateChangeInHeight>
      </div>
    );
  }

  if (isDaybreak) {
    return (
      <div className="mb-12">
        <DaybreakBrowseHeader
          activeTab={activeTab}
          onTabChange={handleTabChange}
          activeCategory={activeCategory}
          onCategoryChange={handleCategoryChange}
          activeSortBy={activeSortBy}
          activeOrder={activeOrder}
          onSortChange={handleSortChange}
          resultCount={!isLoading && !error ? listings?.length : undefined}
        />
        <div className="mt-8">
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
              <span className="font-secondary mb-2 text-[11px] font-bold tracking-[0.18em] text-[#5C5147] uppercase">
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

          <div className="mb-2 h-px w-full bg-[#E6DCC9]" />
        </>
      )}

      {type === 'home' && (
        <div
          style={{ fontFamily: 'var(--font-hanken), sans-serif' }}
          className="mb-7 flex flex-wrap items-center justify-between gap-4"
        >
          <div className="flex flex-wrap gap-2">
            {BOARD_CATEGORIES.map((c) => (
              <button
                key={c.value}
                onClick={() => handleCategoryChange(c.value)}
                className={cn(
                  'rounded-full border px-4 py-1.5 text-[13px] font-medium transition',
                  activeCategory === c.value
                    ? 'border-[#2C3A2E] bg-[#2C3A2E] text-[#FBF7EF]'
                    : 'border-[#E6DCC9] bg-white text-[#5C5147] hover:border-[#c9a98f] hover:text-[#221A14]',
                )}
              >
                {c.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1 rounded-full border border-[#E6DCC9] bg-white p-1">
            {BOARD_SORTS.map((s) => (
              <button
                key={s.label}
                onClick={() => handleSortChange(s.sortBy, s.order)}
                className={cn(
                  'rounded-full px-3.5 py-1.5 text-[12.5px] font-medium transition',
                  activeSortBy === s.sortBy && activeOrder === s.order
                    ? 'bg-[#F2EAD9] text-[#221A14]'
                    : 'text-[#5C5147] hover:text-[#221A14]',
                )}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <AnimateChangeInHeight disableOnHeightZero>
        {renderContent()}
      </AnimateChangeInHeight>
    </div>
  );
};
