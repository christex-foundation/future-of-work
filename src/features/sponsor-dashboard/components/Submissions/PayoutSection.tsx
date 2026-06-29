import { useWallet } from '@solana/wallet-adapter-react';
import { ChevronDown, ExternalLink } from 'lucide-react';
import React, { useState } from 'react';

import { CopyButton } from '@/components/ui/copy-tooltip';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { TokenIcon } from '@/components/ui/token-icon';
import { type SubmissionWithUser } from '@/interface/submission';
import { cn } from '@/utils/cn';
import { getRankLabels } from '@/utils/rank';
import { truncatePublicKey } from '@/utils/truncatePublicKey';

import { type Listing, type Rewards } from '@/features/listings/types';
import { getListingStatus } from '@/features/listings/utils/status';
import { EarnAvatar } from '@/features/talent/components/EarnAvatar';

import { PayoutButton } from './PayoutButton';
import { WalletConnectionBadge } from './WalletConnectionBadge';

const PaymentDetailsRow = ({
  paymentDetails,
  token,
}: {
  paymentDetails: Array<{
    txId: string;
    amount: number;
    tranche: number;
  }>;
  token: string;
}) => {
  return (
    <>
      <TableCell>
        {paymentDetails.map((payment, index) => (
          <div className="my-2 flex items-center justify-between" key={index}>
            <p className="text-sm font-medium text-[#5C5147]">
              Tranche {payment.tranche}
            </p>
          </div>
        ))}
      </TableCell>
      <TableCell>
        {paymentDetails.map((payment, index) => (
          <div className="my-2 flex items-center justify-between" key={index}>
            <div className="flex items-center gap-1">
              <TokenIcon
                className="h-4 w-4 rounded-full"
                alt={`${token}`}
                symbol={token}
              />
              <p className="text-sm font-medium text-[#221A14]">
                {payment.amount} <span className="text-[#5C5147]">{token}</span>
              </p>
            </div>
          </div>
        ))}
      </TableCell>
      <TableCell colSpan={2}>
        {paymentDetails.map(
          (payment, index) =>
            payment.txId && (
              <div key={index} className="my-2">
                <div
                  className="flex cursor-pointer items-center gap-1 text-sm font-medium text-[#5C5147] hover:text-[#221A14]"
                  onClick={() => {
                    window.open(
                      `https://solscan.io/tx/${payment.txId}?cluster=${process.env.NEXT_PUBLIC_PAYMENT_CLUSTER}`,
                      '_blank',
                    );
                  }}
                >
                  <p className="text-sm font-medium text-[#5C5147]">
                    {truncatePublicKey(payment.txId, 5)}
                  </p>
                  <ExternalLink className="h-4 w-4 text-[#5C5147]" />
                </div>
              </div>
            ),
        )}
      </TableCell>
    </>
  );
};

export const PayoutSection = ({
  submissions,
  bounty,
}: {
  submissions: SubmissionWithUser[];
  bounty: Listing;
}) => {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const { connected: walletConnected } = useWallet();

  const toggleExpandRow = (id: string) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const winners = submissions.filter(
    (submission) => submission.isWinner && submission.winnerPosition,
  );

  if (bounty.isFndnPaying) {
    return (
      <div className="rounded-[18px] border border-[#E6DCC9] bg-[#FFFDF8] py-8 text-center text-sm text-[#5C5147] shadow-[0_24px_60px_-48px_rgba(54,38,22,0.55)]">
        Payments for this listing are handled by the Solana Foundation.
      </div>
    );
  }

  if (winners.length === 0) {
    return (
      <div className="space-y-4">
        {/* Wallet Connection Header */}
        <div className="flex items-center justify-between rounded-[18px] border border-[#E6DCC9] bg-[#FFFDF8] px-5 py-4 shadow-[0_24px_60px_-48px_rgba(54,38,22,0.55)]">
          <div className="flex flex-col gap-1">
            <h3 className="font-serif text-base font-semibold text-[#221A14]">
              Your Wallet
            </h3>
            <p className="text-xs text-[#5C5147]">
              Directly process payments to winners using this wallet
            </p>
          </div>
          <WalletConnectionBadge />
        </div>

        {/* No Winners Message */}
        <div className="rounded-[18px] border border-[#E6DCC9] bg-[#FFFDF8] py-8 text-center text-sm text-[#5C5147] shadow-[0_24px_60px_-48px_rgba(54,38,22,0.55)]">
          No winners have been announced yet.
        </div>
      </div>
    );
  }

  const isProject = bounty.type === 'project';

  const listingStatus = getListingStatus(bounty);

  const isFndnToPay = listingStatus === 'Fndn to Pay';
  const shouldHideTxLinks =
    bounty.isFndnPaying && listingStatus === 'Completed';

  return (
    <div className="space-y-4">
      {/* Wallet Connection Header */}
      <div className="flex items-center justify-between rounded-[18px] border border-[#E6DCC9] bg-[#FFFDF8] px-5 py-4 shadow-[0_24px_60px_-48px_rgba(54,38,22,0.55)]">
        <div className="flex flex-col gap-1">
          <h3 className="font-serif text-base font-semibold text-[#221A14]">
            Wallet Connection
          </h3>
          <p className="text-xs text-[#5C5147]">
            {walletConnected
              ? 'Process payments to winners using this wallet'
              : 'Connect your wallet to process payments to winners'}
          </p>
        </div>
        <WalletConnectionBadge />
      </div>

      {/* Payment Table */}
      <div className="h-full w-full overflow-x-auto rounded-[18px] border border-[#E6DCC9] bg-[#FFFDF8] shadow-[0_24px_60px_-48px_rgba(54,38,22,0.55)]">
        <Table className="overflow-hidden">
          <TableHeader className="[&_th]:font-secondary border-b border-[#E6DCC9] bg-[#F2EAD9] [&_th]:text-[11px] [&_th]:font-bold [&_th]:tracking-[0.1em] [&_th]:text-[#5C5147] [&_th]:uppercase">
            <TableRow>
              <TableHead className={cn('w-[40%]', isFndnToPay && 'w-[60%]')}>
                Winner Name
              </TableHead>
              <TableHead className={cn('w-[10%]', isFndnToPay && 'w-[20%]')}>
                Position
              </TableHead>
              <TableHead className={cn('w-[10%]', isFndnToPay && 'w-[20%]')}>
                Wallet Address
              </TableHead>
              <TableHead className={cn('w-[15%]', isFndnToPay && 'w-[20%]')}>
                Prize
              </TableHead>
              {isProject && !isFndnToPay && (
                <TableHead className="w-[15%]">% Paid</TableHead>
              )}
              {!isFndnToPay && (
                <TableHead className="w-[15%] whitespace-nowrap">
                  Payment
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {winners.map((submission) => {
              const hasMultipleTranches =
                submission.paymentDetails &&
                submission.paymentDetails.length > 0;

              const isExpanded = expandedRows.has(submission.id);

              const totalPaid =
                submission.paymentDetails?.reduce(
                  (acc, payment) => acc + payment.amount,
                  0,
                ) ?? 0;

              const paidPercentage =
                bounty.rewardAmount && bounty.rewardAmount > 0
                  ? ((totalPaid / bounty.rewardAmount) * 100).toFixed(2)
                  : '0.00';

              return (
                <React.Fragment key={submission.id}>
                  <TableRow>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <EarnAvatar
                          id={submission.user.id}
                          avatar={submission.user.photo}
                          className="size-8"
                        />
                        <div>
                          <div>
                            {submission.user.firstName}{' '}
                            {submission.user.lastName}
                          </div>
                          <div className="text-xs text-[#5C5147]">
                            {'@' + submission.user.username ||
                              submission.user.email ||
                              ''}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium text-[#221A14] capitalize">
                        {isProject
                          ? 'Winner'
                          : getRankLabels(submission.winnerPosition!)}
                      </span>
                    </TableCell>
                    <TableCell>
                      {submission.user.walletAddress ? (
                        <CopyButton
                          text={submission.user.walletAddress}
                          className="gap-1 text-sm text-[#5C5147] underline-offset-1 hover:text-[#221A14] hover:underline"
                          contentProps={{ side: 'right' }}
                        >
                          {truncatePublicKey(submission.user.walletAddress, 5)}
                        </CopyButton>
                      ) : (
                        <span className="text-sm text-[#5C5147]">
                          No wallet
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <TokenIcon
                          symbol={bounty.token}
                          alt={bounty.token || 'token'}
                          className="h-4 w-4"
                        />
                        <span className="font-medium text-[#221A14]">
                          {!!bounty.rewards &&
                            bounty.rewards[
                              submission.winnerPosition as keyof Rewards
                            ]}{' '}
                          <span className="text-[#5C5147]">{bounty.token}</span>
                        </span>
                      </div>
                    </TableCell>
                    {isProject && !isFndnToPay && (
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Progress
                            className="h-1.5 w-16 rounded-full"
                            value={Number(paidPercentage)}
                          />
                          <p className="text-sm font-medium text-[#5C5147]">
                            {paidPercentage}%
                          </p>
                        </div>
                      </TableCell>
                    )}
                    {!isFndnToPay && (
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {submission.isPaid && !shouldHideTxLinks ? (
                            isProject && hasMultipleTranches ? (
                              <div
                                className="flex cursor-pointer items-center gap-1 text-sm font-medium text-[#5C5147] hover:text-[#221A14]"
                                onClick={() => toggleExpandRow(submission.id)}
                              >
                                <span>View transaction links</span>
                                <ChevronDown
                                  className={cn(
                                    'h-4 w-4 text-[#5C5147] transition-transform duration-300 ease-in-out',
                                    isExpanded ? 'rotate-180' : 'rotate-0',
                                  )}
                                />
                              </div>
                            ) : (
                              <div
                                className="flex cursor-pointer items-center text-sm font-medium text-[#5C5147] hover:text-[#221A14]"
                                onClick={() => {
                                  const txId =
                                    submission.paymentDetails?.[0]?.txId;
                                  if (txId) {
                                    window.open(
                                      `https://solscan.io/tx/${txId}?cluster=${process.env.NEXT_PUBLIC_PAYMENT_CLUSTER}`,
                                      '_blank',
                                    );
                                  }
                                }}
                              >
                                {submission.paymentDetails?.[0]?.txId &&
                                  truncatePublicKey(
                                    submission.paymentDetails[0].txId,
                                    5,
                                  )}
                                <ExternalLink className="ml-1 h-4 w-4" />
                              </div>
                            )
                          ) : bounty.isWinnersAnnounced && !isFndnToPay ? (
                            <div className="flex items-center">
                              <PayoutButton
                                bounty={bounty}
                                submission={submission}
                              />
                              {hasMultipleTranches && (
                                <span
                                  onClick={() => toggleExpandRow(submission.id)}
                                >
                                  <ChevronDown
                                    className={cn(
                                      'ml-8 h-4 w-4 text-[#5C5147] transition-transform duration-300 ease-in-out',
                                      isExpanded ? 'rotate-180' : 'rotate-0',
                                    )}
                                  />
                                </span>
                              )}
                            </div>
                          ) : (
                            <></>
                          )}
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                  {isExpanded &&
                    isProject &&
                    hasMultipleTranches &&
                    !shouldHideTxLinks && (
                      <TableRow>
                        <TableCell />
                        <PaymentDetailsRow
                          paymentDetails={submission.paymentDetails!}
                          token={bounty.token || 'USDC'}
                        />
                      </TableRow>
                    )}
                </React.Fragment>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
