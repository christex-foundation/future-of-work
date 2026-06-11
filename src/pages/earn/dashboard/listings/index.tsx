import { useQuery } from '@tanstack/react-query';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  List,
  Plus,
} from 'lucide-react';
import { type GetServerSideProps } from 'next';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { ExternalImage } from '@/components/ui/cloudinary-image';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useDisclosure } from '@/hooks/use-disclosure';
import { SponsorLayout } from '@/layouts/Sponsor';
import { useUser } from '@/store/user';
import { cn } from '@/utils/cn';

import { type ListingWithSubmissions } from '@/features/listings/types';
import { getListingStatus } from '@/features/listings/utils/status';
import { CreateListingModal } from '@/features/sponsor-dashboard/components/CreateListingModal';
import { DaybreakStats } from '@/features/sponsor-dashboard/components/daybreak/DaybreakStats';
import { ListingBoard } from '@/features/sponsor-dashboard/components/daybreak/ListingBoard';
import { SponsorSwitcherPill } from '@/features/sponsor-dashboard/components/daybreak/SponsorSwitcherPill';
import { ListingTable } from '@/features/sponsor-dashboard/components/ListingTable';
import { ListingTableSkeleton } from '@/features/sponsor-dashboard/components/ListingTableSkeleton';
import { activeHackathonsQuery } from '@/features/sponsor-dashboard/queries/active-hackathons';
import { dashboardQuery } from '@/features/sponsor-dashboard/queries/dashboard';
import { sponsorStatsQuery } from '@/features/sponsor-dashboard/queries/sponsor-stats';

const MemoizedListingTable = React.memo(ListingTable);

type DashboardTab = 'all' | 'bounty' | 'project' | 'grant' | 'hackathon';
type DashboardStatus =
  | 'Draft'
  | 'In Progress'
  | 'In Review'
  | 'Fndn to Pay'
  | 'Payment Pending'
  | 'Completed';

const DEFAULT_TAB: DashboardTab = 'all';

export default function SponsorListings({ tab: queryTab }: { tab: string }) {
  const { user } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const searchParamsFromHook = useSearchParams();

  const searchParams = useMemo(
    () => searchParamsFromHook ?? new URLSearchParams(),
    [searchParamsFromHook],
  );

  const [searchText, setSearchText] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [currentSort, setCurrentSort] = useState<{
    column: string;
    direction: 'asc' | 'desc' | null;
  }>({ column: '', direction: null });
  const listingsPerPage = 15;
  const { data: hackathons } = useQuery({
    ...activeHackathonsQuery(),
    enabled: !!user,
  });

  const activeTab = useMemo((): DashboardTab => {
    const tabParam = searchParams.get('tab');
    if (
      tabParam &&
      ['all', 'bounty', 'project', 'grant', 'hackathon'].includes(tabParam)
    ) {
      return tabParam as DashboardTab;
    }
    return DEFAULT_TAB;
  }, [searchParams]);

  const activeStatus = useMemo((): DashboardStatus | null => {
    const statusParam = searchParams.get('status');
    if (
      statusParam &&
      [
        'Draft',
        'In Progress',
        'In Review',
        'Fndn to Pay',
        'Payment Pending',
        'Completed',
      ].includes(statusParam)
    ) {
      return statusParam as DashboardStatus;
    }
    return null;
  }, [searchParams]);

  const updateQueryParams = useCallback(
    (updates: { tab?: DashboardTab; status?: DashboardStatus | null }) => {
      const newParams = new URLSearchParams(Array.from(searchParams.entries()));

      if (updates.tab !== undefined) {
        if (updates.tab === DEFAULT_TAB) {
          newParams.delete('tab');
        } else {
          newParams.set('tab', updates.tab);
        }
      }

      if (updates.status !== undefined) {
        if (updates.status === null) {
          newParams.delete('status');
        } else {
          newParams.set('status', updates.status);
        }
      }

      const queryString = newParams.toString();
      const newPath = `${pathname}${queryString ? `?${queryString}` : ''}`;
      router.replace(newPath, { scroll: false });
    },
    [searchParams, router, pathname],
  );

  const { data: sponsorStats, isLoading: isStatsLoading } = useQuery(
    sponsorStatsQuery(user?.currentSponsorId),
  );

  const { data: allListings, isLoading: isListingsLoading } = useQuery(
    dashboardQuery(user?.currentSponsorId),
  );

  useEffect(() => {
    if (user?.currentSponsorId) {
      setTimeout(() => {
        setSearchText('');
        setCurrentPage(0);
      }, 0);
    }
  }, [user?.currentSponsorId]);

  const {
    isOpen: isOpenCreateListing,
    onOpen: onOpenCreateListing,
    onClose: onCloseCreateListing,
  } = useDisclosure();

  const filteredListings = useMemo(() => {
    if (!allListings) return [];

    const searchLower = searchText?.toLowerCase();
    const result: ListingWithSubmissions[] = [];

    for (const listing of allListings) {
      if (activeTab !== 'all' && listing.type !== activeTab) continue;
      if (activeStatus && getListingStatus(listing) !== activeStatus) continue;
      if (searchLower && !listing.title?.toLowerCase().includes(searchLower))
        continue;
      result.push(listing);
    }

    if (currentSort.direction && currentSort.column) {
      const factor = currentSort.direction === 'asc' ? 1 : -1;
      return result.toSorted((a, b) => {
        switch (currentSort.column) {
          case 'title':
            return (a.title || '').localeCompare(b.title || '') * factor;
          case 'submissions':
            return (
              ((a.submissionCount ?? 0) - (b.submissionCount ?? 0)) * factor
            );
          case 'deadline': {
            const deadlineA = a.deadline ? new Date(a.deadline).getTime() : 0;
            const deadlineB = b.deadline ? new Date(b.deadline).getTime() : 0;
            return (deadlineA - deadlineB) * factor;
          }
          default:
            return 0;
        }
      });
    }

    return result;
  }, [allListings, activeTab, activeStatus, searchText, currentSort]);

  const paginatedListings = useMemo(() => {
    return filteredListings?.slice(
      currentPage * listingsPerPage,
      (currentPage + 1) * listingsPerPage,
    );
  }, [filteredListings, currentPage, listingsPerPage]);

  const hasGrants = useMemo(() => {
    return allListings?.some((listing) => listing.type === 'grant');
  }, [allListings]);

  const hasHackathons = useMemo(() => {
    return allListings?.some((listing) => listing.type === 'hackathon');
  }, [allListings]);

  const ALL_FILTERS = useMemo(() => {
    const filters: DashboardStatus[] = [
      'Draft',
      'In Progress',
      'In Review',
      'Fndn to Pay',
      'Payment Pending',
      'Completed',
    ];
    return filters;
  }, []);

  const handleStatusFilterChange = useCallback(
    (status: DashboardStatus | null) => {
      updateQueryParams({ status });
      setCurrentPage(0);
    },
    [updateQueryParams],
  );

  const handleTabChange = useCallback(
    (value: string) => {
      const valueToType = {
        all: 'all' as const,
        bounties: 'bounty' as const,
        projects: 'project' as const,
        grants: 'grant' as const,
        hackathons: 'hackathon' as const,
      };

      const tabType = valueToType[value as keyof typeof valueToType] || 'all';
      updateQueryParams({ tab: tabType });
      setCurrentPage(0);
    },
    [updateQueryParams],
  );

  useEffect(() => {
    if (queryTab && queryTab !== activeTab) {
      setTimeout(() => {
        handleTabChange(queryTab);
      }, 0);
    }
  }, [queryTab, activeTab, handleTabChange]);

  const [view, setView] = useState<'board' | 'table'>('board');
  const [clientNow, setClientNow] = useState<Date | null>(null);
  useEffect(() => {
    setClientNow(new Date());
  }, []);

  const counts = useMemo(() => {
    const list = allListings ?? [];
    let live = 0;
    let inReview = 0;
    let completed = 0;
    let published = 0;
    for (const l of list) {
      const s = getListingStatus(l);
      if (l.isPublished) published++;
      if (s === 'In Progress') live++;
      else if (
        s === 'In Review' ||
        s === 'Payment Pending' ||
        s === 'Fndn to Pay'
      )
        inReview++;
      else if (s === 'Completed') completed++;
    }
    return {
      live,
      inReview,
      completed,
      published,
      completion: published ? completed / published : 0,
    };
  }, [allListings]);

  const sponsorName = user?.currentSponsor?.name ?? 'there';
  const hour = clientNow?.getHours() ?? 9;
  const timeOfDay =
    hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
  const dateLabel = clientNow
    ? clientNow.toLocaleDateString('en-US', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      })
    : '';

  const tabDefs: { value: string; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'bounties', label: 'Bounties' },
    { value: 'projects', label: 'Projects' },
    ...(hasGrants ? [{ value: 'grants', label: 'Grants' }] : []),
    ...(hasHackathons ? [{ value: 'hackathons', label: 'Hackathons' }] : []),
  ];
  const activeTabValue =
    activeTab === 'bounty'
      ? 'bounties'
      : activeTab === 'project'
        ? 'projects'
        : activeTab === 'grant'
          ? 'grants'
          : activeTab === 'hackathon'
            ? 'hackathons'
            : 'all';

  return (
    <SponsorLayout>
      <div className="relative -mt-5 -mr-8 -mb-5 -ml-4 min-h-[calc(100vh-3rem)] overflow-hidden bg-[#F4EEE3]">
        <div className="relative z-10 px-8 py-7">
          {/* topbar */}
          <div className="mb-9 flex items-center gap-3">
            <SponsorSwitcherPill />
          </div>

          {/* editorial header + stats */}
          <div className="grid grid-cols-1 gap-x-10 gap-y-7 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div>
              <div className="font-secondary flex items-center gap-2.5 text-[11px] font-bold tracking-[0.26em] text-[#CE4A2B] uppercase">
                <span className="inline-block h-0.5 w-6 bg-[#CE4A2B]" />
                {dateLabel || 'Dashboard'}
              </div>
              <h1 className="font-serif mt-4 text-[clamp(34px,4.6vw,56px)] leading-[0.98] font-semibold tracking-[-0.02em] text-[#1D1815]">
                Good {timeOfDay},
                <br />
                <span className="font-medium text-[#CE4A2B] italic">
                  {sponsorName}.
                </span>
              </h1>
              <p className="mt-3.5 max-w-[520px] text-[15px] leading-relaxed text-[#6B5E50]">
                You have{' '}
                <b className="font-bold text-[#1D1815]">
                  {counts.live} listing{counts.live === 1 ? '' : 's'} live
                </b>{' '}
                and{' '}
                <b className="font-bold text-[#1D1815]">
                  {counts.inReview} waiting
                </b>{' '}
                on your review. The dawn shift is yours — let&apos;s get people
                paid.
              </p>
            </div>

            {/* stat band */}
            <DaybreakStats
              stats={sponsorStats}
              counts={counts}
              isLoading={isStatsLoading}
            />
          </div>

          {/* controls */}
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <div className="flex flex-wrap gap-1.5 rounded-full border border-[#1d181517] bg-[#ECE2D2] p-1.5">
              {tabDefs.map((tabDef) => (
                <button
                  key={tabDef.value}
                  onClick={() => handleTabChange(tabDef.value)}
                  className={cn(
                    'font-secondary rounded-full px-[18px] py-2.5 text-[13px] font-semibold whitespace-nowrap transition-all duration-200',
                    activeTabValue === tabDef.value
                      ? 'bg-[#1D1815] text-[#FBF7EE] shadow-[0_6px_16px_-8px_rgba(29,24,21,0.6)]'
                      : 'text-[#6B5E50] hover:text-[#1D1815]',
                  )}
                >
                  {tabDef.label}
                </button>
              ))}
            </div>
            <div className="flex-1" />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="font-secondary flex h-10 items-center gap-2 rounded-full border border-[#1d181522] bg-[#FBF7EE] px-4 text-[12px] font-semibold text-[#6B5E50] capitalize transition-all hover:border-[#1d181538] hover:text-[#1D1815]">
                  {activeStatus ?? 'All status'}
                  <ChevronDown className="size-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-44 p-1.5">
                <DropdownMenuItem
                  className="cursor-pointer rounded-md text-sm"
                  onClick={() => handleStatusFilterChange(null)}
                >
                  All status
                </DropdownMenuItem>
                {ALL_FILTERS.map((status) => (
                  <DropdownMenuItem
                    key={status}
                    className="cursor-pointer rounded-md text-sm"
                    onClick={() => handleStatusFilterChange(status)}
                  >
                    {status}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="flex gap-1 rounded-xl border border-[#1d181522] bg-[#ECE2D2] p-1">
              <button
                onClick={() => setView('board')}
                aria-label="Board view"
                className={cn(
                  'grid h-8 w-9 place-items-center rounded-lg transition-all',
                  view === 'board'
                    ? 'bg-[#FBF7EE] text-[#1D1815] shadow-[0_2px_6px_-3px_rgba(29,24,21,0.4)]'
                    : 'text-[#6B5E50]',
                )}
              >
                <LayoutGrid className="size-4" />
              </button>
              <button
                onClick={() => setView('table')}
                aria-label="Table view"
                className={cn(
                  'grid h-8 w-9 place-items-center rounded-lg transition-all',
                  view === 'table'
                    ? 'bg-[#FBF7EE] text-[#1D1815] shadow-[0_2px_6px_-3px_rgba(29,24,21,0.4)]'
                    : 'text-[#6B5E50]',
                )}
              >
                <List className="size-4" />
              </button>
            </div>
          </div>

          {/* content */}
          {isListingsLoading && (
            <div className="mt-6">
              <ListingTableSkeleton rows={8} />
            </div>
          )}

          {!isListingsLoading && !!paginatedListings.length && (
            <>
              {view === 'board' ? (
                <ListingBoard
                  listings={paginatedListings}
                  onCreate={onOpenCreateListing}
                />
              ) : (
                <div className="mt-6">
                  <MemoizedListingTable
                    listings={paginatedListings}
                    currentSort={currentSort}
                    onSort={(column, direction) =>
                      setCurrentSort({ column, direction })
                    }
                  />
                </div>
              )}

              <div className="mt-7 flex items-center justify-end">
                <p className="mr-4 text-sm text-[#6B5E50]">
                  <span className="font-bold text-[#1D1815]">
                    {currentPage * listingsPerPage + 1}
                  </span>{' '}
                  -{' '}
                  <span className="font-bold text-[#1D1815]">
                    {Math.min(
                      (currentPage + 1) * listingsPerPage,
                      filteredListings.length,
                    )}
                  </span>{' '}
                  of{' '}
                  <span className="font-bold text-[#1D1815]">
                    {filteredListings.length}
                  </span>{' '}
                  listings
                </p>
                <div className="flex gap-3">
                  <Button
                    disabled={currentPage <= 0}
                    onClick={() => setCurrentPage((prev) => prev - 1)}
                    size="sm"
                    variant="outline"
                    className="rounded-full border-[#1d181522] bg-[#FBF7EE] text-[#1D1815] hover:bg-[#ECE2D2]"
                  >
                    <ChevronLeft className="mr-1 size-4" />
                    Previous
                  </Button>
                  <Button
                    disabled={
                      (currentPage + 1) * listingsPerPage >=
                      filteredListings.length
                    }
                    onClick={() => setCurrentPage((prev) => prev + 1)}
                    size="sm"
                    variant="outline"
                    className="rounded-full border-[#1d181522] bg-[#FBF7EE] text-[#1D1815] hover:bg-[#ECE2D2]"
                  >
                    Next
                    <ChevronRight className="ml-1 size-4" />
                  </Button>
                </div>
              </div>
            </>
          )}

          {/* empty — no listings at all */}
          {!isListingsLoading && !allListings?.length && (
            <div className="mt-24 flex flex-col items-center text-center">
              <ExternalImage
                className="w-28"
                alt="No listings yet"
                src="/bg/talent-empty.svg"
              />
              <p className="font-serif mt-6 text-[24px] font-semibold text-[#1D1815]">
                Create your first listing
              </p>
              <p className="mt-1 text-[#6B5E50]">
                and start getting contributions from the community
              </p>
              <button
                onClick={onOpenCreateListing}
                className="font-secondary mt-6 flex items-center gap-2 rounded-full bg-[#CE4A2B] px-6 py-3 text-[14px] font-bold text-white transition-all hover:bg-[#A6371C]"
              >
                <Plus className="size-4" />
                Create new listing
              </button>
            </div>
          )}

          {/* empty — filtered to zero */}
          {!isListingsLoading &&
            !!allListings?.length &&
            !paginatedListings.length && (
              <div className="mt-20 flex flex-col items-center text-center">
                <ExternalImage
                  className="w-28"
                  alt="No matches"
                  src="/bg/talent-empty.svg"
                />
                <p className="font-serif mt-6 text-[24px] font-semibold text-[#1D1815]">
                  No matches
                </p>
                <p className="mt-1 text-[#6B5E50]">
                  Nothing fits the current filters — try clearing them.
                </p>
              </div>
            )}
        </div>

        {/* floating CTA */}
        <button
          onClick={onOpenCreateListing}
          className="font-secondary fixed right-9 bottom-7 z-40 flex items-center gap-2.5 rounded-full bg-[#CE4A2B] px-5 py-3.5 text-[14px] font-bold text-white shadow-[0_18px_36px_-14px_rgba(206,74,43,0.85)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_24px_44px_-14px_rgba(206,74,43,0.95)]"
        >
          <span className="grid size-6 place-items-center rounded-full bg-white/20">
            <Plus className="size-3.5" strokeWidth={2.6} />
          </span>
          New listing
        </button>
      </div>

      <CreateListingModal
        hackathons={hackathons}
        isOpen={isOpenCreateListing}
        onClose={onCloseCreateListing}
      />
    </SponsorLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ query }) => {
  let tab: string = 'all';
  if (typeof query.tab === 'string') {
    tab = query.tab;
  }
  return {
    props: {
      tab,
    },
  };
};
