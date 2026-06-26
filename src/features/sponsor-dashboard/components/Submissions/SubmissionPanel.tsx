import { useAtom } from 'jotai';
import { ArrowRight, ExternalLink } from 'lucide-react';
import Link from 'next/link';

import MdOutlineAccountBalanceWallet from '@/components/icons/MdOutlineAccountBalanceWallet';
import { Button } from '@/components/ui/button';
import { CopyButton } from '@/components/ui/copy-tooltip';
import type { SubmissionWithUser } from '@/interface/submission';
import { SubmissionLabels } from '@/prisma/enums';
import { formatNumberWithSuffix } from '@/utils/formatNumberWithSuffix';
import { truncatePublicKey } from '@/utils/truncatePublicKey';
import { truncateString } from '@/utils/truncateString';

import { AgentBadge } from '@/features/agents/components/AgentBadge';
import type { Listing } from '@/features/listings/types';
import {
  GitHub,
  Telegram,
  Twitter,
  Website,
} from '@/features/social/components/SocialIcons';
import { EarnAvatar } from '@/features/talent/components/EarnAvatar';

import { selectedSubmissionAtom } from '../../atoms';
import { Details } from './Details';
import { SelectLabel } from './SelectLabel';
import { SelectWinner } from './SelectWinner';
import { SpamButton } from './SpamButton';

interface Props {
  bounty: Listing | undefined;
  submissions: SubmissionWithUser[];
  usedPositions: number[];
  isHackathonPage?: boolean;
  onWinnersAnnounceOpen: () => void;
  isMultiSelectOn?: boolean;
}

export const SubmissionPanel = ({
  bounty,
  submissions,
  usedPositions,
  isHackathonPage,
  onWinnersAnnounceOpen,
  isMultiSelectOn,
}: Props) => {
  const isProject = bounty?.type === 'project';

  const [selectedSubmission] = useAtom(selectedSubmissionAtom);
  const shouldHideTxLinks = bounty?.isFndnPaying;
  const paymentTxId = selectedSubmission?.paymentDetails?.[0]?.txId;

  return (
    <div className="sticky top-[3rem] w-full">
      {submissions.length ? (
        <>
          <div className="rounded-t-xl border-b border-[#1d1815]/12 bg-[#FBF7EE] py-1">
            <div className="flex w-full items-center justify-between px-4 pt-3">
              <div className="flex w-full items-center gap-2">
                <EarnAvatar
                  className="h-10 w-10"
                  id={selectedSubmission?.user?.id}
                  avatar={selectedSubmission?.user?.photo || undefined}
                />

                <div>
                  <div className="flex items-center gap-2">
                    <p className="w-full font-medium whitespace-nowrap text-[#1D1815]">
                      {`${selectedSubmission?.user?.firstName}'s Submission`}
                    </p>
                    {!!selectedSubmission?.agentId && (
                      <AgentBadge
                        containerClassName="bg-[#1d1815] px-2 py-[3px] gap-[3px]"
                        iconClassName="size-2 text-[#f4eee3]"
                        textClassName="text-[8px] font-medium text-[#f4eee3]"
                      />
                    )}
                  </div>
                  <Link
                    className="flex w-full items-center text-xs font-medium whitespace-nowrap text-[#CE4A2B]"
                    href={`/earn/t/${selectedSubmission?.user?.username}`}
                  >
                    View Profile <ArrowRight className="inline-block h-3 w-3" />
                  </Link>
                </div>
                <div className="ml-3 self-start">
                  {!isHackathonPage &&
                    selectedSubmission?.status === 'Pending' &&
                    !bounty?.isWinnersAnnounced &&
                    !selectedSubmission.isWinner &&
                    selectedSubmission?.label !== SubmissionLabels.Spam && (
                      <SelectLabel
                        type={bounty?.type}
                        listingSlug={bounty?.slug!}
                      />
                    )}
                </div>
              </div>
              <div className="ph-no-capture flex w-full items-center justify-end gap-2">
                {!selectedSubmission?.isWinner &&
                  (bounty?.isWinnersAnnounced
                    ? selectedSubmission?.label === SubmissionLabels.Spam
                    : selectedSubmission?.status === 'Pending' ||
                      selectedSubmission?.label === SubmissionLabels.Spam) && (
                    <SpamButton
                      listingSlug={bounty?.slug!}
                      isMultiSelectOn={!!isMultiSelectOn}
                    />
                  )}
                {!bounty?.isWinnersAnnounced && !isHackathonPage && (
                  <SelectWinner
                    onWinnersAnnounceOpen={onWinnersAnnounceOpen}
                    isMultiSelectOn={!!isMultiSelectOn}
                    bounty={bounty}
                    usedPositions={usedPositions}
                    isHackathonPage={isHackathonPage}
                  />
                )}
                {selectedSubmission?.isWinner &&
                  selectedSubmission?.winnerPosition &&
                  selectedSubmission?.isPaid &&
                  !isProject &&
                  !shouldHideTxLinks &&
                  paymentTxId && (
                    <Button
                      className="mr-4 border-[#1d1815]/20 text-[#6B5E50]"
                      onClick={() => {
                        window.open(
                          `https://solscan.io/tx/${paymentTxId}?cluster=${process.env.NEXT_PUBLIC_PAYMENT_CLUSTER}`,
                          '_blank',
                        );
                      }}
                      size="default"
                      variant="outline"
                    >
                      View Payment Tx
                      <ExternalLink className="ml-2 h-4 w-4" />
                    </Button>
                  )}
              </div>
            </div>
            <div className="flex items-center gap-5 px-5 py-2">
              {selectedSubmission?.user?.email && (
                <CopyButton
                  text={selectedSubmission.user.email}
                  className="gap-1 text-sm text-[#6B5E50] underline-offset-1 hover:text-[#1D1815] hover:underline"
                  contentProps={{ side: 'right' }}
                >
                  {truncateString(selectedSubmission.user.email, 36)}
                </CopyButton>
              )}

              {selectedSubmission?.user?.walletAddress && (
                <CopyButton
                  className="gap-1 text-sm text-[#6B5E50] underline-offset-1 hover:text-[#1D1815] hover:underline"
                  contentProps={{ side: 'right' }}
                  text={selectedSubmission.user.walletAddress}
                >
                  <MdOutlineAccountBalanceWallet />
                  <p>
                    {truncatePublicKey(
                      selectedSubmission.user.walletAddress || '',
                      3,
                    )}
                  </p>
                </CopyButton>
              )}

              <div className="flex gap-2">
                <Telegram
                  className="h-[0.9rem] w-[0.9rem] text-[#6B5E50]"
                  link={
                    selectedSubmission?.telegram ||
                    selectedSubmission?.user?.telegram ||
                    ''
                  }
                />

                <Twitter
                  className="h-[0.9rem] w-[0.9rem] text-[#6B5E50]"
                  link={selectedSubmission?.user?.twitter || ''}
                />

                <GitHub
                  className="h-[0.9rem] w-[0.9rem] text-[#6B5E50]"
                  link={selectedSubmission?.user?.github || ''}
                />

                <Website
                  className="h-[0.9rem] w-[0.9rem] text-[#6B5E50]"
                  link={selectedSubmission?.user?.website || ''}
                />
              </div>
              {isProject && (
                <p className="text-sm whitespace-nowrap text-[#6B5E50]">
                  $
                  {formatNumberWithSuffix(
                    selectedSubmission?.totalEarnings || 0,
                  )}{' '}
                  Earned
                </p>
              )}
            </div>
          </div>
          <Details bounty={bounty} isHackathonPage={isHackathonPage} />
        </>
      ) : (
        <div className="p-3">
          <p className="font-serif text-xl font-medium text-[#1D1815]">
            No submissions found
          </p>
          <p className="text-sm text-[#6B5E50]">Try a different search query</p>
        </div>
      )}
    </div>
  );
};
