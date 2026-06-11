import { useMfaEnrollment, usePrivy } from '@privy-io/react-auth';
import { ArrowLeft, ArrowUpRight, CopyIcon, X } from 'lucide-react';
import { useRouter } from 'next/router';
import posthog from 'posthog-js';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { CopyButton } from '@/components/ui/copy-tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SideDrawer, SideDrawerContent } from '@/components/ui/side-drawer';
import { useBreakpoint } from '@/hooks/use-breakpoint';
import { useUser } from '@/store/user';
import { cn } from '@/utils/cn';
import { formatNumberWithSuffix } from '@/utils/formatNumberWithSuffix';
import { truncatePublicKey } from '@/utils/truncatePublicKey';

import { type TokenAsset } from '../types/TokenAsset';
import { type TxData } from '../types/TxData';
import { type DrawerView } from '../types/WalletTypes';
import { WalletActivity } from './activity/WalletActivity';
import { TokenList } from './tokens/TokenList';
import { WithdrawFundsFlow } from './withdraw/WithdrawFundsFlow';

export function WalletDrawer({
  isOpen,
  onClose,
  tokens,
  isLoading,
  error,
}: {
  isOpen: boolean;
  onClose: () => void;
  tokens: TokenAsset[];
  isLoading: boolean;
  error: Error | null;
}) {
  const [view, setView] = useState<DrawerView>('main');
  const [txData, setTxData] = useState<TxData>({
    signature: '',
    tokenAddress: '',
    amount: '',
    recipientAddress: '',
    timestamp: 0,
    type: 'Withdrawn',
  });

  const { user } = useUser();
  const router = useRouter();

  const { user: privyUser } = usePrivy();
  const { showMfaEnrollmentModal } = useMfaEnrollment();

  const isMD = useBreakpoint('md');

  const handleBack = () => {
    setView('main');
  };

  const totalBalance = tokens?.reduce((acc, token) => {
    return acc + (token.usdValue || 0);
  }, 0);

  const padding = 'px-6 sm:px-8';

  const handleClose = () => {
    const currentPath = window.location.hash;

    if (currentPath === '#wallet') {
      router.push(window.location.pathname, undefined, { shallow: true });
    }

    onClose();
  };

  const handleWithdraw = async () => {
    posthog.capture('withdraw_start');
    if (privyUser?.mfaMethods.length === 0) {
      toast(
        <div className="relative flex flex-col gap-1">
          <X
            className="absolute top-0 right-0 size-4 cursor-pointer text-[#6b5e50] hover:text-[#1d1815]"
            onClick={() => toast.dismiss()}
          />
          <div
            className={cn(
              'font-serif mt-1 pr-6 text-xl font-semibold text-[#1d1815]',
            )}
          >
            Two-Factor Auth is Mandatory
          </div>
          <div className="font-primary text-sm text-[#6b5e50]">
            Setting up two-factor authentication is mandatory to continue
            withdrawing. This will keep your funds secure.
          </div>
          <Button
            onClick={async () => {
              await showMfaEnrollmentModal();
              setView('withdraw');
            }}
            className={cn(
              'mt-2 w-full rounded-none border-2 border-[#1d1815] bg-[#e6a12b] px-4 py-2.5 text-sm font-semibold text-[#1d1815] shadow-[3px_3px_0_#1d1815] transition-colors hover:translate-x-[1px] hover:translate-y-[1px] hover:bg-[#e6a12b] hover:shadow-[1px_1px_0_#1d1815]',
            )}
          >
            Set up 2FA
          </Button>
        </div>,
        {
          duration: 7000,
          style: {
            border: '2px solid #1d1815',
            padding: '1rem',
          },
          className: 'shadow-lg',
          dismissible: true,
        },
      );
    } else {
      setView('withdraw');
    }
  };

  return (
    <SideDrawer isOpen={isOpen} onClose={handleClose}>
      <SideDrawerContent className="w-screen overflow-hidden border-l-2 border-[#1d1815] bg-[#FBF7EE] sm:w-120">
        <ScrollArea className="h-full overflow-y-auto">
          <X
            className="absolute top-5 right-4 z-10 h-5 w-5 cursor-pointer text-[#1d1815] sm:hidden"
            onClick={onClose}
          />
          <div className="flex h-full flex-col">
            <div
              className={cn(
                'items-center border-b border-[#1d1815]/20 bg-[#f4eee3] py-5 pb-4',
                padding,
              )}
            >
              <div className="flex items-baseline gap-2">
                <h2 className="font-serif text-lg font-semibold tracking-tight text-[#1d1815]">
                  {user?.firstName + "'s Wallet"}
                </h2>
                <CopyButton
                  text={user?.walletAddress || ''}
                  className="font-primary flex cursor-pointer items-center gap-1 text-[#6b5e50] hover:text-[#1d1815]"
                  contentProps={{ side: 'right' }}
                  content={'Click to copy'}
                >
                  <p className="text-xs font-medium">
                    {truncatePublicKey(user?.walletAddress)}
                  </p>
                  <CopyIcon className="size-2.5" />
                </CopyButton>
              </div>
              <p className="font-primary text-sm font-medium text-[#6b5e50]">
                You will receive payments in this wallet each time you win.{' '}
                <a
                  href="https://superteamdao.notion.site/using-your-earn-wallet"
                  className="text-[#ce4a2b] underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Learn more
                </a>{' '}
                about what you can do with your rewards.
              </p>
            </div>
            <div className={cn('bg-[#f4eee3] py-4', padding)}>
              <div className="flex items-baseline gap-1">
                <p className="font-serif text-3xl font-semibold tracking-tight text-[#1d1815]">
                  ${formatNumberWithSuffix(totalBalance || 0, 2, true)}
                </p>
                <p className="font-serif text-xl font-semibold tracking-tight text-[#6b5e50]">
                  USD
                </p>
              </div>
              <p className="font-secondary text-[11px] font-bold tracking-[0.2em] text-[#6b5e50] uppercase">
                BALANCE
              </p>
              {view === 'main' && (
                <div className="w-full items-end justify-between">
                  <Button
                    onClick={handleWithdraw}
                    className={cn(
                      'mt-3 rounded-none border-2 border-[#1d1815] bg-[#e6a12b] px-5 text-base text-[#1d1815] shadow-[3px_3px_0_#1d1815] hover:translate-x-[1px] hover:translate-y-[1px] hover:bg-[#e6a12b] hover:shadow-[1px_1px_0_#1d1815]',
                      user?.isPro &&
                        'border-2 border-[#1d1815] bg-[#e6a12b] hover:bg-[#e6a12b]',
                    )}
                    disabled={!tokens?.length}
                  >
                    Withdraw
                    <ArrowUpRight className="h-4 w-4" />
                  </Button>
                  <div
                    onClick={() => showMfaEnrollmentModal()}
                    className="font-primary mt-1.5 cursor-pointer py-0.5 text-xs font-semibold text-[#6b5e50] hover:text-[#1d1815] hover:underline"
                  >
                    {privyUser?.mfaMethods.length === 0
                      ? '+ Add Two Factor Authentication'
                      : 'Edit Two Factor Authentication'}
                  </div>
                </div>
              )}
            </div>
            {view === 'main' && (
              <>
                <div
                  className={cn(
                    'font-secondary border-b border-[#1d1815]/20 pt-6 pb-2 text-[11px] font-bold tracking-[0.2em] text-[#6b5e50] uppercase',
                    padding,
                  )}
                >
                  Assets
                </div>
                <TokenList
                  tokens={tokens || []}
                  isLoading={isLoading}
                  error={error}
                />

                <div
                  className={cn(
                    'font-secondary border-b border-[#1d1815]/20 pt-6 pb-2 text-[11px] font-bold tracking-[0.2em] text-[#6b5e50] uppercase',
                    padding,
                  )}
                >
                  Activity
                </div>
                <WalletActivity setView={setView} setTxData={setTxData} />
              </>
            )}
            {view !== 'main' && (
              <div className="flex items-center border-b border-[#1d1815]/20 py-1.5">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleBack}
                  className="mr-1 ml-4"
                >
                  <ArrowLeft className="h-4 w-4 text-[#1d1815]" />
                </Button>
                <h2 className="font-serif text-sm font-semibold text-[#1d1815]">
                  {view === 'withdraw' && 'Withdraw Funds'}
                  {view === 'success' && 'Successfully Withdrawn'}
                </h2>
              </div>
            )}
            {view !== 'main' && (
              <div className={cn('flex-1 overflow-y-auto py-4', padding)}>
                <WithdrawFundsFlow
                  tokens={tokens || []}
                  setView={setView}
                  view={view}
                  txData={txData}
                  setTxData={setTxData}
                />
              </div>
            )}
            <p className="font-primary sticky bottom-0 mt-auto bg-[#FBF7EE] px-2 py-2 text-center text-xs text-[#6b5e50] sm:text-sm">
              Have questions? Reach out to us at{' '}
              {isMD ? (
                <CopyButton text="eng@christex.foundation">
                  <p className="text-[#ce4a2b] underline hover:text-[#ce4a2b]/80">
                    eng@christex.foundation
                  </p>
                </CopyButton>
              ) : (
                <a
                  href="mailto:eng@christex.foundation"
                  className="text-[#ce4a2b] underline hover:text-[#ce4a2b]/80"
                  target="_blank"
                >
                  eng@christex.foundation
                </a>
              )}
            </p>
          </div>
        </ScrollArea>
      </SideDrawerContent>
    </SideDrawer>
  );
}
