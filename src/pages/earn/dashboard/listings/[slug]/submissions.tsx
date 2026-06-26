import { useQuery, useQueryClient } from '@tanstack/react-query';
import { atom, useAtom } from 'jotai';
import { LucideFlag } from 'lucide-react';
import type { GetServerSideProps } from 'next';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/router';
import posthog from 'posthog-js';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDisclosure } from '@/hooks/use-disclosure';
import type { SubmissionWithUser } from '@/interface/submission';
import { SponsorLayout } from '@/layouts/Sponsor';
import { type SubmissionLabels } from '@/prisma/enums';
import { useUser } from '@/store/user';
import { cn } from '@/utils/cn';
import { dayjs } from '@/utils/dayjs';
import { cleanRewards } from '@/utils/rank';

import { DummySubmissionsForm } from '@/features/dev-tools/dummy-submissions/DummySubmissions';
import { BONUS_REWARD_POSITION } from '@/features/listing-builder/constants';
import {
  selectedSubmissionAtom,
  selectedSubmissionIdsAtom,
} from '@/features/sponsor-dashboard/atoms';
import { PublishResults } from '@/features/sponsor-dashboard/components/PublishResults';
import { ScoutTable } from '@/features/sponsor-dashboard/components/Scouts/ScoutTable';
import { MultiActionModal } from '@/features/sponsor-dashboard/components/Submissions/Modals/MultiActionModal';
import { Survey } from '@/features/sponsor-dashboard/components/Submissions/Modals/Survey';
import { PayoutSection } from '@/features/sponsor-dashboard/components/Submissions/PayoutSection';
import { SubmissionHeader } from '@/features/sponsor-dashboard/components/Submissions/SubmissionHeader';
import { SubmissionList } from '@/features/sponsor-dashboard/components/Submissions/SubmissionList';
import { SubmissionPanel } from '@/features/sponsor-dashboard/components/Submissions/SubmissionPanel';
import { SubmissionsPageSkeleton } from '@/features/sponsor-dashboard/components/Submissions/SubmissionsPageSkeleton';
import { useAutoSwitchSponsor } from '@/features/sponsor-dashboard/hooks/use-auto-switch-sponsor';
import { sponsorDashboardListingQuery } from '@/features/sponsor-dashboard/queries/listing';
import { scoutsQuery } from '@/features/sponsor-dashboard/queries/scouts';
import { submissionsQuery } from '@/features/sponsor-dashboard/queries/submissions';
import { type ScoutRowType } from '@/features/sponsor-dashboard/types';

interface Props {
  slug: string;
}

const surveyOpenAtom = atom(false);

export default function BountySubmissions({ slug }: Props) {
  const router = useRouter();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { user } = useUser();

  const [selectedSubmission, setSelectedSubmission] = useAtom(
    selectedSubmissionAtom,
  );

  const [searchText, setSearchText] = useState('');

  const [remainings, setRemainings] = useState<{
    podiums: number;
    bonus: number;
  } | null>(null);
  const [selectedFilters, setSelectedFilters] = useState<
    Set<SubmissionLabels | 'Winner' | 'Rejected'>
  >(new Set());

  const [surveyOpen, setSurveyOpen] = useAtom(surveyOpenAtom);

  const searchParams = useSearchParams();

  const queryClient = useQueryClient();

  const [selectedSubmissionIds, setSelectedSubmissionIds] = useAtom(
    selectedSubmissionIdsAtom,
  );

  const getActiveTab = () => {
    const tabParam = searchParams?.get('tab');
    if (tabParam === 'scout') return 'scout';
    if (tabParam === 'payments') return 'payments';
    return 'submissions';
  };

  const [activeTab, setActiveTab] = useState(getActiveTab());

  useEffect(() => {
    setActiveTab(getActiveTab());
  }, [searchParams]);

  const handleTabChange = (value: string) => {
    const url = new URL(window.location.href);

    if (value === 'submissions') {
      url.searchParams.delete('tab');
    } else {
      url.searchParams.set('tab', value);
    }

    router.push(url.pathname + url.search, undefined, { shallow: true });
    setActiveTab(value);
  };

  useEffect(() => {
    const handleRouteChange = () => {
      setSelectedSubmissionIds(new Set());
    };

    router.events.on('routeChangeStart', handleRouteChange);

    return () => {
      router.events.off('routeChangeStart', handleRouteChange);
    };
  }, [router.events, setSelectedSubmissionIds]);

  const [isToggledAll, setIsToggledAll] = useState(false);
  const [currentAction, setCurrentAction] = useState<
    'reject' | 'bonus' | 'spam' | 'shortlist' | null
  >(null);
  const {
    isOpen: isTogglerOpen,
    onOpen: onTogglerOpen,
    onClose: onTogglerClose,
  } = useDisclosure();
  const {
    isOpen: multiActionConfrimIsOpen,
    onOpen: multiActionConfirmOnOpen,
    onClose: multiActionConfirmOnClose,
  } = useDisclosure();

  const { data: submissions, isLoading: isSubmissionsLoading } = useQuery(
    submissionsQuery(slug),
  );

  const {
    data: bounty,
    isLoading: isBountyLoading,
    error: bountyError,
    refetch: refetchBounty,
  } = useQuery(sponsorDashboardListingQuery(slug));

  const { isSwitching: isSwitchingSponsor } = useAutoSwitchSponsor({
    error: bountyError,
    refetch: refetchBounty,
    queryKey: ['sponsor-dashboard-listing', slug],
  });

  useEffect(() => {
    if (bountyError && !isSwitchingSponsor) {
      const error = bountyError as any;
      if (error?.response?.status === 403) {
        const hasSponsorId = error?.response?.data?.sponsorId;
        if (!hasSponsorId) {
          toast.error('This listing does not belong to you');
          router.push('/earn/dashboard/listings');
        }
      }
    }
  }, [bountyError, router, user?.role, isSwitchingSponsor]);

  const isProject = useMemo(() => bounty?.type === 'project', [bounty]);

  useEffect(() => {
    if (selectedSubmissionIds.size > 0) {
      onTogglerOpen();
    } else {
      onTogglerClose();
    }
  }, [selectedSubmissionIds]);

  useEffect(() => {
    const newSet = new Set(selectedSubmissionIds);
    Array.from(selectedSubmissionIds).forEach((a) => {
      const submissionWithId = submissions?.find(
        (submission) => submission.id === a,
      );
      if (
        submissionWithId &&
        (submissionWithId.status !== 'Pending' ||
          submissionWithId.winnerPosition)
      ) {
        newSet.delete(a);
      }
    });
    setSelectedSubmissionIds(newSet);
  }, [submissions]);

  const isAllCurrentToggled = () =>
    filteredSubmissions
      ?.filter(
        (submission) =>
          submission.status === 'Pending' && !submission.winnerPosition,
      )
      .every((submission) => selectedSubmissionIds.has(submission.id)) || false;

  const toggleSubmission = (id: string) => {
    setSelectedSubmissionIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
        return newSet;
      } else {
        return newSet.add(id);
      }
    });
  };

  const isToggled = useCallback(
    (id: string) => {
      return selectedSubmissionIds.has(id);
    },
    [selectedSubmissionIds, submissions],
  );

  const handleModalAction = (
    action: 'reject' | 'bonus' | 'spam' | 'shortlist',
  ) => {
    setCurrentAction(action);
    multiActionConfirmOnOpen();
  };

  const isMultiSelectDisabled = useMemo(() => {
    if (bounty?.isWinnersAnnounced) return true;
    if (bounty?.type === 'project') return false;
    else {
      if (!bounty?.rewards?.[BONUS_REWARD_POSITION] || !bounty?.maxBonusSpots)
        return true;
    }
    if (remainings?.bonus === 0) return true;
    return false;
  }, [bounty, selectedSubmissionIds, remainings]);

  const multiBonusPodiumsOverSelected = useMemo(
    () =>
      Boolean(
        bounty?.type !== 'project' &&
        bounty?.rewards?.[BONUS_REWARD_POSITION] &&
        bounty?.maxBonusSpots &&
        remainings &&
        selectedSubmissionIds.size > remainings.bonus,
      ),
    [bounty, selectedSubmissionIds, remainings],
  );

  const { data: scouts } = useQuery({
    ...scoutsQuery({
      bountyId: bounty?.id!,
    }),
    enabled: !!(
      !!bounty?.id &&
      bounty.isPublished &&
      !bounty.isWinnersAnnounced &&
      bounty.sponsorId === user?.currentSponsorId
    ),
  });

  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const filteredSubmissions = useMemo(() => {
    if (!submissions) return [];
    return submissions.filter((submission: SubmissionWithUser) => {
      const firstName = submission.user.firstName?.toLowerCase() || '';
      const lastName = submission.user.lastName?.toLowerCase() || '';
      const fullName = `${firstName} ${lastName}`.trim();
      const email = submission.user.email?.toLowerCase() || '';
      const username = submission.user.username?.toLowerCase() || '';
      const twitter = submission.user.twitter?.toLowerCase() || '';
      const discord = submission.user.discord?.toLowerCase() || '';
      const link = submission.link?.toLowerCase() || '';

      const searchLower = searchText.toLowerCase();

      const matchesSearch =
        searchText === '' ||
        firstName.includes(searchLower) ||
        lastName.includes(searchLower) ||
        fullName.includes(searchLower) ||
        email.includes(searchLower) ||
        username.includes(searchLower) ||
        twitter.includes(searchLower) ||
        discord.includes(searchLower) ||
        link.includes(searchLower);

      let matchesLabel = false;

      if (selectedFilters.size === 0) {
        matchesLabel = true;
      } else {
        matchesLabel = Array.from(selectedFilters).some((filter) => {
          if (filter === 'Winner') {
            return submission.isWinner;
          } else if (filter === 'Rejected') {
            return submission.status === 'Rejected';
          } else if (filter === 'Spam') {
            // Spam filter should work regardless of status
            return submission.label === 'Spam';
          } else {
            const isDecided =
              submission.isWinner || submission.status === 'Rejected';
            if (isDecided) {
              return false;
            }
            return submission.label === filter;
          }
        });
      }

      return matchesSearch && matchesLabel;
    });
  }, [submissions, searchText, selectedFilters]);

  useEffect(() => {
    if (filteredSubmissions && filteredSubmissions.length > 0) {
      setSelectedSubmission((selectedSubmission) => {
        if (filteredSubmissions.find((f) => f.id === selectedSubmission?.id)) {
          return selectedSubmission;
        }
        return filteredSubmissions[0];
      });
    }
  }, [filteredSubmissions]);

  useEffect(() => {
    if (bounty && user?.currentSponsorId) {
      if (isSwitchingSponsor) {
        return;
      }

      if (bounty.sponsorId !== user.currentSponsorId) {
        router.push('/earn/dashboard/listings');
        return;
      }

      const podiumWinnersSelected = submissions?.filter(
        (submission) =>
          submission.isWinner &&
          submission.winnerPosition !== BONUS_REWARD_POSITION,
      ).length;

      const bonusWinnerSelected = submissions?.filter(
        (sub) => sub.isWinner && sub.winnerPosition === BONUS_REWARD_POSITION,
      ).length;

      const rewardsLength = cleanRewards(bounty.rewards, true).length;
      setRemainings({
        podiums: rewardsLength - (podiumWinnersSelected || 0),
        bonus:
          (!!bounty?.rewards?.[BONUS_REWARD_POSITION]
            ? bounty.maxBonusSpots || 0
            : 0) - (bonusWinnerSelected || 0),
      });
    }
  }, [bounty, submissions, user?.currentSponsorId, router, isSwitchingSponsor]);

  useEffect(() => {
    if (searchParams?.has('scout')) posthog.capture('scout tab_scout');
  }, []);

  useEffect(() => {
    setIsToggledAll(isAllCurrentToggled());
  }, [selectedSubmissionIds, filteredSubmissions]);

  const toggleAllSubmissions = () => {
    if (!isAllCurrentToggled()) {
      setSelectedSubmissionIds((prev) => {
        const newSet = new Set(prev);
        filteredSubmissions
          ?.filter(
            (submission) =>
              submission.status === 'Pending' && !submission.winnerPosition,
          )
          .map((submission) => newSet.add(submission.id));
        return newSet;
      });
    } else {
      setSelectedSubmissionIds((prev) => {
        const newSet = new Set(prev);
        filteredSubmissions?.map((submission) => newSet.delete(submission.id));
        return newSet;
      });
    }
  };

  const usedPositions = submissions
    ?.filter((s: any) => s.isWinner)
    .map((s: any) => Number(s.winnerPosition))
    .filter((key: number) => !isNaN(key));

  const totalWinners = submissions?.filter((sub) => sub.isWinner).length;
  const totalPaymentsMade = submissions?.filter((sub) => sub.isPaid).length;

  const isExpired = dayjs(bounty?.deadline).isBefore(dayjs());

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!filteredSubmissions.length) return;

      const currentIndex = filteredSubmissions.findIndex(
        (sub) => sub.id === selectedSubmission?.id,
      );

      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          if (currentIndex > 0) {
            setSelectedSubmission(filteredSubmissions[currentIndex - 1]);
          }
          break;
        case 'ArrowDown':
          e.preventDefault();
          if (currentIndex < filteredSubmissions.length - 1) {
            setSelectedSubmission(filteredSubmissions[currentIndex + 1]);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filteredSubmissions, selectedSubmission, setSelectedSubmission]);

  return (
    <SponsorLayout isCollapsible>
      {isBountyLoading || isSubmissionsLoading || isSwitchingSponsor ? (
        <SubmissionsPageSkeleton />
      ) : (
        <>
          {isOpen && (
            <PublishResults
              remainings={remainings}
              isOpen={isOpen}
              onClose={onClose}
              totalWinners={totalWinners || 0}
              totalPaymentsMade={totalPaymentsMade || 0}
              bounty={bounty}
              submissionsLeft={
                submissions?.filter((s) => !s.isWinner).length || 0
              }
              showSurvey={() => setSurveyOpen(true)}
            />
          )}
          {surveyOpen && bounty?.type !== 'grant' && (
            <Survey open={surveyOpen} setOpen={setSurveyOpen} />
          )}
          <DummySubmissionsForm listingId={bounty?.id || ''} slug={slug} />
          <SubmissionHeader
            bounty={bounty}
            remainings={remainings}
            submissions={submissions || []}
            onWinnersAnnounceOpen={onOpen}
            activeTab={activeTab}
          />
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            {bounty?.isPublished && (
              <>
                <TabsList className="mt-3 gap-4 font-medium text-[#6B5E50]">
                  <TabsTrigger
                    value="submissions"
                    className="data-[state=active]:text-[#1D1815] data-[state=active]:after:bg-[#CE4A2B]"
                  >
                    Submissions
                    <div
                      className={cn(
                        'text-xxs ml-2 rounded-full px-2 py-0.5 font-semibold transition-colors',
                        activeTab === 'submissions'
                          ? 'bg-[#CE4A2B] text-white'
                          : 'bg-[#ECE2D2] text-[#6B5E50]',
                      )}
                    >
                      {submissions?.length}
                    </div>
                  </TabsTrigger>
                  {!bounty?.isWinnersAnnounced && !isExpired && (
                    <TabsTrigger
                      value="scout"
                      className={cn(
                        'ph-no-capture',
                        'data-[state=active]:text-[#1D1815] data-[state=active]:after:bg-[#CE4A2B]',
                      )}
                      onClick={() => posthog.capture('scout tab_scout')}
                    >
                      Scout Talent
                      <div className="ml-1.5 h-1.5 w-1.5 rounded-full bg-[#CE4A2B]" />
                    </TabsTrigger>
                  )}
                  {bounty?.isWinnersAnnounced && !bounty?.isFndnPaying && (
                    <TabsTrigger
                      value="payments"
                      className="data-[state=active]:text-[#1D1815] data-[state=active]:after:bg-[#CE4A2B]"
                    >
                      Payments
                    </TabsTrigger>
                  )}
                </TabsList>
                <div className="h-[1.5px] w-full bg-[#1d1815]/12" />
              </>
            )}

            <TabsContent value="submissions" className="w-full px-0">
              <div className="grid h-160 w-full grid-cols-[23rem_1fr] gap-4">
                <SubmissionList
                  listing={bounty}
                  selectedFilters={selectedFilters}
                  onFilterChange={setSelectedFilters}
                  submissions={filteredSubmissions}
                  setSearchText={setSearchText}
                  type={bounty?.type}
                  isToggled={isToggled}
                  toggleSubmission={toggleSubmission}
                  isAllToggled={isToggledAll}
                  toggleAllSubmissions={toggleAllSubmissions}
                  isMultiSelectDisabled={isMultiSelectDisabled}
                />

                <div className="h-full w-full overflow-hidden rounded-2xl border border-[#1d1815]/12 bg-[#FBF7EE] shadow-[0_12px_34px_-22px_rgba(54,38,22,0.45)]">
                  {!filteredSubmissions?.length &&
                  !searchText &&
                  !isSubmissionsLoading ? (
                    <div className="db-working flex h-full flex-col items-center justify-center px-6 py-16 text-center">
                      <svg
                        viewBox="0 0 220 170"
                        className="w-56"
                        role="img"
                        aria-label="Someone working at a laptop"
                      >
                        <circle cx="110" cy="92" r="64" fill="#F2EAD9" />
                        <circle
                          cx="110"
                          cy="92"
                          r="64"
                          fill="none"
                          stroke="#E6DCC9"
                          strokeWidth="1.5"
                        />
                        <g className="db-float">
                          <rect
                            x="50"
                            y="119"
                            width="120"
                            height="7"
                            rx="3.5"
                            fill="#E0D4BD"
                          />
                          <rect
                            x="139"
                            y="84"
                            width="8"
                            height="38"
                            rx="4"
                            fill="#8FA37E"
                          />
                          <circle
                            className="db-dot"
                            cx="141"
                            cy="57"
                            r="2.4"
                            fill="#6B7A4F"
                          />
                          <circle
                            className="db-dot db-dot2"
                            cx="149"
                            cy="54"
                            r="2.4"
                            fill="#6B7A4F"
                          />
                          <circle
                            className="db-dot db-dot3"
                            cx="157"
                            cy="52"
                            r="2.4"
                            fill="#6B7A4F"
                          />
                          <path
                            d="M64 119 L96 119 L102 110 L70 110 Z"
                            fill="#3C4D3D"
                          />
                          <rect
                            x="72"
                            y="80"
                            width="28"
                            height="28"
                            rx="3"
                            fill="#2C3A2E"
                          />
                          <rect
                            className="db-screen"
                            x="75"
                            y="83"
                            width="22"
                            height="22"
                            rx="2"
                            fill="#C4502E"
                          />
                          <rect
                            x="78"
                            y="87"
                            width="13"
                            height="2"
                            rx="1"
                            fill="#F2EAD9"
                            opacity="0.85"
                          />
                          <rect
                            x="78"
                            y="92"
                            width="16"
                            height="2"
                            rx="1"
                            fill="#F2EAD9"
                            opacity="0.6"
                          />
                          <rect
                            x="78"
                            y="97"
                            width="9"
                            height="2"
                            rx="1"
                            fill="#F2EAD9"
                            opacity="0.6"
                          />
                          <path
                            d="M112 119 C112 97 118 89 126 89 C134 89 140 97 140 119 Z"
                            fill="#C4502E"
                          />
                          <circle cx="126" cy="73" r="11" fill="#2C3A2E" />
                          <path
                            className="db-hand"
                            d="M119 103 C110 105 102 108 96 111"
                            stroke="#C4502E"
                            strokeWidth="6"
                            strokeLinecap="round"
                            fill="none"
                          />
                          <rect
                            x="150"
                            y="112"
                            width="11"
                            height="9"
                            rx="2"
                            fill="#3C4D3D"
                          />
                          <path
                            d="M161 114 q4 1 0 5"
                            stroke="#3C4D3D"
                            strokeWidth="1.6"
                            fill="none"
                          />
                          <path
                            className="db-steam"
                            d="M155 109 c2 -2 -2 -4 0 -7"
                            stroke="#8FA37E"
                            strokeWidth="1.6"
                            strokeLinecap="round"
                            fill="none"
                          />
                        </g>
                      </svg>
                      <p className="mt-6 font-serif text-xl font-medium text-[#1D1815]">
                        {selectedFilters.size > 0
                          ? 'Zero Results'
                          : 'People are working!'}
                      </p>
                      <p className="mt-1 font-medium text-[#6B5E50]">
                        {selectedFilters.size > 0
                          ? 'For the filters you have selected'
                          : 'Submissions will start appearing here'}
                      </p>
                      <style>{`
                        .db-working .db-float{animation:dbFloat 3.6s ease-in-out infinite}
                        @keyframes dbFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
                        .db-working .db-screen{animation:dbGlow 1.9s ease-in-out infinite}
                        @keyframes dbGlow{0%,100%{opacity:.5}50%{opacity:.92}}
                        .db-working .db-hand{animation:dbType .5s ease-in-out infinite alternate}
                        @keyframes dbType{from{transform:translateY(0)}to{transform:translateY(1.6px)}}
                        .db-working .db-dot{animation:dbBlink 1.4s ease-in-out infinite}
                        .db-working .db-dot2{animation-delay:.2s}
                        .db-working .db-dot3{animation-delay:.4s}
                        @keyframes dbBlink{0%,100%{opacity:.25}50%{opacity:1}}
                        .db-working .db-steam{animation:dbSteam 2.6s ease-in-out infinite}
                        @keyframes dbSteam{0%{opacity:0;transform:translateY(0)}45%{opacity:.7}100%{opacity:0;transform:translateY(-9px)}}
                        @media (prefers-reduced-motion:reduce){.db-working *{animation:none!important}}
                      `}</style>
                    </div>
                  ) : (
                    <SubmissionPanel
                      isMultiSelectOn={selectedSubmissionIds.size > 0}
                      bounty={bounty}
                      submissions={filteredSubmissions}
                      usedPositions={usedPositions || []}
                      onWinnersAnnounceOpen={onOpen}
                    />
                  )}
                </div>
              </div>

              {(!!searchText || selectedFilters.size > 0) && (
                <div className="mt-4 ml-4 flex items-center justify-start gap-4">
                  <p className="text-sm text-slate-400">
                    Found{' '}
                    <span className="font-bold">
                      {filteredSubmissions.length}
                    </span>{' '}
                    {filteredSubmissions.length === 1 ? 'result' : 'results'}
                  </p>
                </div>
              )}
            </TabsContent>

            {bounty &&
              bounty.id &&
              bounty.isPublished &&
              !bounty.isWinnersAnnounced &&
              !isExpired && (
                <TabsContent value="scout" className="px-0">
                  <ScoutTable
                    bountyId={bounty.id}
                    scouts={scouts || []}
                    setInvited={(userId: string) => {
                      queryClient.setQueryData(
                        ['scouts', bounty.id],
                        (oldData: ScoutRowType[] | undefined) => {
                          if (!oldData) return oldData;
                          return oldData.map((scout) =>
                            scout.userId === userId
                              ? { ...scout, invited: true }
                              : scout,
                          );
                        },
                      );
                    }}
                  />
                </TabsContent>
              )}
            <TabsContent value="payments">
              {submissions && bounty && (
                <PayoutSection submissions={submissions} bounty={bounty} />
              )}
            </TabsContent>
          </Tabs>

          <Dialog
            modal={false}
            onOpenChange={onTogglerClose}
            open={isTogglerOpen}
          >
            <DialogContent
              onEscapeKeyDown={(e) => e.preventDefault()}
              onInteractOutside={(e) => e.preventDefault()}
              classNames={{
                overlay: 'hidden',
              }}
              unsetDefaultPosition
              hideCloseIcon
              className="fixed bottom-4 left-1/2 w-fit max-w-none -translate-x-1/2 overflow-hidden px-5 py-2"
            >
              <div className="mx-auto w-fit rounded-lg">
                {multiBonusPodiumsOverSelected && (
                  <p className="pb-2 text-center text-sm text-red-500">
                    You have {remainings?.bonus || 0} bonus spots available
                  </p>
                )}
                <div className="flex items-center gap-3">
                  <p className="text-base font-medium whitespace-nowrap text-[#1D1815]">
                    {selectedSubmissionIds.size} Selected
                  </p>

                  <div className="h-4 w-px bg-[#1d1815]/20" />

                  <Button
                    className="px-2 font-semibold text-[#6B5E50]"
                    onClick={() => {
                      setSelectedSubmissionIds(new Set());
                    }}
                    variant="ghost"
                  >
                    UNSELECT ALL
                  </Button>

                  <Button
                    className="rounded-lg border border-orange-300 bg-orange-50 text-orange-600 hover:bg-orange-100 disabled:opacity-50"
                    disabled={selectedSubmissionIds.size === 0}
                    onClick={() => handleModalAction('spam')}
                  >
                    <LucideFlag className="size-1" />
                    Mark as Spam
                  </Button>

                  {isProject && (
                    <Button
                      className="rounded-lg border border-red-300 bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50"
                      disabled={selectedSubmissionIds.size === 0}
                      onClick={() => handleModalAction('reject')}
                    >
                      <svg
                        width="13"
                        height="13"
                        viewBox="0 0 13 13"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M6.11111 0.777832C9.49056 0.777832 12.2222 3.5095 12.2222 6.88894C12.2222 10.2684 9.49056 13.0001 6.11111 13.0001C2.73167 13.0001 0 10.2684 0 6.88894C0 3.5095 2.73167 0.777832 6.11111 0.777832ZM8.305 3.83339L6.11111 6.02728L3.91722 3.83339L3.05556 4.69505L5.24944 6.88894L3.05556 9.08283L3.91722 9.9445L6.11111 7.75061L8.305 9.9445L9.16667 9.08283L6.97278 6.88894L9.16667 4.69505L8.305 3.83339Z"
                          fill="#E11D48"
                        />
                      </svg>
                      Reject All
                    </Button>
                  )}

                  <Button
                    className="rounded-lg border border-purple-300 bg-purple-50 text-purple-600 hover:bg-purple-100 disabled:opacity-50"
                    disabled={selectedSubmissionIds.size === 0}
                    onClick={() => handleModalAction('shortlist')}
                  >
                    Shortlist All
                  </Button>

                  {!isProject && (
                    <Button
                      className="rounded-lg border border-blue-300 bg-blue-50 text-blue-600 hover:bg-blue-100 disabled:opacity-50"
                      disabled={
                        selectedSubmissionIds.size === 0 ||
                        multiBonusPodiumsOverSelected
                      }
                      onClick={() => handleModalAction('bonus')}
                    >
                      Assign {selectedSubmissionIds.size} Bonus
                      {selectedSubmissionIds.size > 1 ? 'es' : ''}
                    </Button>
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>
          {currentAction && (
            <MultiActionModal
              isOpen={multiActionConfrimIsOpen}
              onClose={multiActionConfirmOnClose}
              submissionIds={Array.from(selectedSubmissionIds)}
              allSubmissionsLength={submissions?.length || 0}
              actionType={currentAction}
              listing={bounty}
              setSelectedSubmissionIds={setSelectedSubmissionIds}
            />
          )}
        </>
      )}
    </SponsorLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { slug } = context.query;
  return {
    props: { slug },
  };
};
