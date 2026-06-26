import { TooltipArrow } from '@radix-ui/react-tooltip';
import { useMutation } from '@tanstack/react-query';
import dayjs from 'dayjs';
import {
  AlertTriangle,
  Check,
  ChevronLeft,
  CopyIcon,
  Download,
  ExternalLink,
  MoreVertical,
  Pencil,
  Sheet,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { toast } from 'sonner';

import { ShinyButton } from '@/components/shared/ShinyButton';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { StatusPill } from '@/components/ui/status-pill';
import { Tooltip } from '@/components/ui/tooltip';
import { JTTG } from '@/constants/Telegram';
import { useDisclosure } from '@/hooks/use-disclosure';
import { type SubmissionWithUser } from '@/interface/submission';
import { api } from '@/lib/api';
import { SubmissionLabels, SubmissionStatus } from '@/prisma/enums';
import { useUser } from '@/store/user';
import { cn } from '@/utils/cn';
import { getURL } from '@/utils/validUrl';

import { BoostButton } from '@/features/listing-builder/components/Form/Boost/BoostButton';
import { type Listing } from '@/features/listings/types';
import { isDeadlineOver } from '@/features/listings/utils/deadline';
import { getColorStyles } from '@/features/listings/utils/getColorStyles';
import { getListingIcon } from '@/features/listings/utils/getListingIcon';
import { getListingStatus } from '@/features/listings/utils/status';
import { ProBadge } from '@/features/pro/components/ProBadge';
import { VerifyPaymentModal } from '@/features/sponsor-dashboard/components/Modals/VerifyPayment';

import { ExportSheetsModal } from '../Modals/ExportSheetsModal';
import { UnpublishModal } from '../Modals/UnpublishModal';
import AiReviewBountiesSubmissionsModal from './Modals/AiReviewBounties';
import AiReviewProjectApplicationsModal from './Modals/AiReviewProjects';

interface Props {
  bounty: Listing | undefined;
  isHackathonPage?: boolean;
  remainings: { podiums: number; bonus: number } | null;
  submissions: SubmissionWithUser[];
  onWinnersAnnounceOpen: () => void;
  activeTab: string;
}

export const SubmissionHeader = ({
  bounty,
  isHackathonPage = false,
  remainings,
  submissions,
  onWinnersAnnounceOpen,
  activeTab,
}: Props) => {
  const router = useRouter();
  const { user } = useUser();

  const {
    isOpen: verifyPaymentIsOpen,
    onOpen: verifyPaymentOnOpen,
    onClose: verifyPaymentOnClose,
  } = useDisclosure();

  const {
    isOpen: unpublishIsOpen,
    onOpen: unpublishOnOpen,
    onClose: unpublishOnClose,
  } = useDisclosure();

  const {
    isOpen: exportSheetsIsOpen,
    onOpen: exportSheetsOnOpen,
    onClose: exportSheetsOnClose,
  } = useDisclosure();

  const handleVerifyPayment = () => {
    verifyPaymentOnOpen();
  };

  const listingPath = `earn/listing/${bounty?.slug}`;

  const bountyStatus = getListingStatus(bounty);
  const isProject = bounty?.type === 'project';

  const afterAnnounceDate =
    bounty?.type === 'hackathon'
      ? dayjs().isAfter(bounty?.Hackathon?.announceDate)
      : true;

  const exportMutation = useMutation({
    mutationFn: async () => {
      const response = await api.get(
        `/api/sponsor-dashboard/submission/export/`,
        {
          params: {
            listingId: bounty?.id,
          },
        },
      );
      return response.data;
    },
    onSuccess: async (data) => {
      const url = data?.url || '';
      if (url) {
        try {
          const response = await fetch(url, {
            headers: {
              Accept: 'text/csv,application/octet-stream',
            },
          });

          if (!response.ok) {
            throw new Error(`Failed to download: ${response.status}`);
          }

          const blob = await response.blob();

          const blobUrl = window.URL.createObjectURL(
            new Blob([blob], { type: 'text/csv' }),
          );

          const link = document.createElement('a');
          link.href = blobUrl;
          link.setAttribute('download', `${bounty?.slug || 'submissions'}.csv`);

          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          window.URL.revokeObjectURL(blobUrl);

          toast.success('CSV exported successfully');
        } catch (error) {
          console.error('Download error:', error);
          toast.error('Failed to download CSV. Please try again.');
        }
      } else {
        toast.error('Export URL is empty');
      }
    },
    onError: (error) => {
      console.error('Export error:', error);
      toast.error('Failed to export CSV. Please try again.');
    },
  });

  const exportSubmissionsCsv = () => {
    exportMutation.mutate();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(
      () => {
        toast.success('Link Copied', {
          duration: 3000,
        });
      },
      (err) => {
        console.error('Failed to copy text: ', err);
      },
    );
  };

  const getEditText = () => {
    if (bounty?.type === 'grant') return null;
    if (bounty?.type === 'bounty') return 'Edit Bounty';
    if (bounty?.type === 'project') return 'Edit Project';
    if (bounty?.type === 'hackathon') return 'Edit Track';
    return 'Edit';
  };

  const getListingUrl = () => {
    if (bounty?.type === 'grant') {
      return `${getURL()}earn/grants/${bounty.slug}`;
    }
    return `${getURL()}earn/listing/${bounty?.slug}`;
  };

  const pastDeadline = isDeadlineOver(bounty?.deadline);
  const isCoreMember = user?.people?.type?.toUpperCase() === 'CORE';
  const canCoreMemberEditInReview = Boolean(
    isCoreMember &&
    bounty?.isPublished &&
    !bounty?.isWinnersAnnounced &&
    pastDeadline &&
    bounty?.type !== 'grant',
  );

  const totalPodiumSpots = remainings
    ? remainings.podiums + remainings.bonus
    : 0;
  const rejectedOrSpamSubmissions = submissions.filter(
    (s) =>
      s.status === SubmissionStatus.Rejected ||
      s.label === SubmissionLabels.Spam,
  ).length;
  const eligibleSubmissions = submissions.length - rejectedOrSpamSubmissions;
  const showWarning =
    !!remainings &&
    !bounty?.isWinnersAnnounced &&
    totalPodiumSpots > eligibleSubmissions &&
    bountyStatus === 'In Review';

  return (
    <div className="mb-2 flex items-center justify-between gap-12">
      <div>
        <Breadcrumb className="text-[#6B5E50]">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink
                className="flex cursor-pointer items-center gap-2"
                onClick={() => router.back()}
              >
                <ChevronLeft className="size-6" />
                All Listings
              </BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="mb-2 flex items-center gap-2">
          <div className="ml-1 flex items-center gap-2.5">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#CE4A2B]/10 text-[#CE4A2B]">
              {getListingIcon(bounty?.type!, 'size-4')}
            </span>
            <p className="font-serif text-2xl font-medium tracking-[-0.01em] text-[#1D1815]">
              {bounty?.title}
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="cursor-pointer rounded-md p-2 text-[#6B5E50] transition-all hover:bg-[#ECE2D2] hover:text-[#1D1815]">
                <MoreVertical className="h-4 w-4" />
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48 text-[#6B5E50]">
              {!isHackathonPage && (
                <>
                  <DropdownMenuItem
                    disabled={exportMutation.isPending}
                    onClick={() => exportSubmissionsCsv()}
                    className="cursor-pointer"
                  >
                    {exportMutation.isPending ? (
                      <>
                        <span className="loading loading-spinner" />
                        Exporting...
                      </>
                    ) : (
                      <>
                        <Download className="size-4" />
                        Export CSV
                      </>
                    )}
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onClick={exportSheetsOnOpen}
                    className="cursor-pointer"
                  >
                    <Sheet className="size-4" />
                    Export to Google Sheets
                  </DropdownMenuItem>
                </>
              )}

              <DropdownMenuItem
                onClick={() =>
                  window.open(`${router.basePath}/${listingPath}`, '_blank')
                }
                className="cursor-pointer"
              >
                <ExternalLink className="size-4" />
                View Listing
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => copyToClipboard(getListingUrl())}
                className="cursor-pointer"
              >
                <CopyIcon className="size-4" />
                Copy Link
              </DropdownMenuItem>

              {!!(
                (user?.role === 'GOD' && bounty?.type !== 'grant') ||
                (bounty?.isPublished &&
                  !pastDeadline &&
                  bounty.type !== 'grant') ||
                canCoreMemberEditInReview
              ) &&
                !isHackathonPage &&
                getEditText() && (
                  <DropdownMenuItem className="cursor-pointer" asChild>
                    <Link
                      href={
                        bounty
                          ? `/earn/dashboard/${isHackathonPage ? 'hackathon' : 'listings'}/${bounty.slug}/edit/`
                          : ''
                      }
                    >
                      <Pencil className="size-4" />
                      {getEditText()}
                    </Link>
                  </DropdownMenuItem>
                )}
            </DropdownMenuContent>
          </DropdownMenu>
          <StatusPill
            className="mr-2 ml-2 w-fit text-[0.8rem]"
            color={getColorStyles(bountyStatus).color}
            backgroundColor={getColorStyles(bountyStatus).bgColor}
            borderColor={getColorStyles(bountyStatus).borderColor}
          >
            {bountyStatus}
          </StatusPill>

          {bounty?.isPro && (
            <ProBadge
              containerClassName="mr-2 bg-[#F2EAD9] px-3 py-1 gap-1"
              iconClassName="size-3 text-[#6b5e50]"
              textClassName="text-xs font-medium text-[#6b5e50]"
            />
          )}

          <BoostButton listing={bounty!} />

          <div className="ml-4 -translate-y-2.5">
            <AiReviewProjectApplicationsModal
              listing={bounty}
              applications={submissions}
            />
          </div>
          <div className="ml-4 -translate-y-2.5">
            <AiReviewBountiesSubmissionsModal
              listing={bounty}
              submissions={submissions}
            />
          </div>
        </div>
      </div>
      {!isProject && !bounty?.isWinnersAnnounced && (
        <div className="flex flex-col items-end gap-2">
          {activeTab === 'submissions' && (
            <>
              <div className="flex items-center gap-3">
                {!!remainings &&
                  !isHackathonPage &&
                  !!(remainings.bonus > 0 || remainings.podiums > 0) && (
                    <p className="flex items-center gap-1.5 rounded-full border border-[#e6a12b]/40 bg-[#e6a12b]/15 px-3.5 py-2 text-xs font-medium whitespace-nowrap text-[#6e4f12]">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      {remainings.podiums > 0 && (
                        <>
                          {remainings.podiums}{' '}
                          {remainings.podiums === 1 ? 'Winner' : 'Winners'}{' '}
                        </>
                      )}
                      {remainings.bonus > 0 && <>{remainings.bonus} Bonus </>}
                      Remaining
                    </p>
                  )}
                <Tooltip
                  content={
                    <>
                      You cannot change the winners once the results are
                      published!
                      <TooltipArrow />
                    </>
                  }
                  disabled={!bounty?.isWinnersAnnounced}
                  contentProps={{ sideOffset: 5 }}
                >
                  <ShinyButton
                    disabled={
                      !afterAnnounceDate ||
                      isHackathonPage ||
                      remainings?.podiums !== 0 ||
                      (remainings?.bonus > 0 &&
                        submissions.filter((s) => !s.isWinner).length > 0)
                    }
                    onClick={onWinnersAnnounceOpen}
                    animate={true}
                    classNames={{
                      button: 'h-11 px-6 rounded-full',
                      span: 'rounded-full',
                    }}
                  >
                    <Check className="size-4" />
                    Announce Winners
                  </ShinyButton>
                </Tooltip>
              </div>
              {showWarning && (
                <div className="flex w-64 justify-end">
                  <p className="text-xxs text-right text-[#ce4a2b]">
                    There aren&apos;t enough eligible{' '}
                    {bounty?.type === 'project'
                      ? 'applications'
                      : 'submissions'}
                    .{' '}
                    <a
                      href={JTTG}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#CE4A2B] underline"
                    >
                      Reach out
                    </a>{' '}
                    to update your listing.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {isProject && !bounty?.isWinnersAnnounced && bounty?.isPublished && (
        <div className="flex flex-row-reverse items-center gap-8">
          <p className="text-[#1D1815]">
            {`Didn't find a suitable candidate? `}
            <span
              className="cursor-pointer text-[#CE4A2B] underline"
              onClick={unpublishOnOpen}
            >
              Click here
            </span>
          </p>
        </div>
      )}

      {bounty?.isWinnersAnnounced &&
        activeTab === 'submissions' &&
        !bounty?.isFndnPaying &&
        bountyStatus !== 'Completed' && (
          <ShinyButton
            animate={true}
            classNames={{
              button: 'h-11 px-6 rounded-full',
              span: 'rounded-full',
            }}
            onClick={() => {
              router.push(
                `/earn/dashboard/listings/${bounty?.slug}/submissions?tab=payments`,
              );
            }}
          >
            <Check className="size-4" />
            Pay Winners
          </ShinyButton>
        )}

      {activeTab === 'payments' &&
        !bounty?.isFndnPaying &&
        bountyStatus !== 'Completed' && (
          <Button
            className={cn(
              'border-[#CE4A2B] text-[#CE4A2B] shadow-md hover:bg-[#CE4A2B] hover:text-white',
            )}
            onClick={handleVerifyPayment}
            variant="outline"
          >
            Paid Externally? Click here
          </Button>
        )}

      <VerifyPaymentModal
        listing={bounty}
        isOpen={verifyPaymentIsOpen}
        onClose={verifyPaymentOnClose}
        isHackathonPage={isHackathonPage}
      />

      <UnpublishModal
        unpublishIsOpen={unpublishIsOpen}
        unpublishOnClose={unpublishOnClose}
        listing={bounty}
      />

      <ExportSheetsModal
        isOpen={exportSheetsIsOpen}
        onClose={exportSheetsOnClose}
        apiEndpoint="/api/sponsor-dashboard/submission/export-sheets/"
        queryParams={{ listingId: bounty?.id }}
        entityName="submissions"
      />
    </div>
  );
};
