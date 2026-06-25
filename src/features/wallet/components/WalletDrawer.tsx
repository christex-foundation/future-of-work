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
            className="absolute top-0 right-0 size-4 cursor-pointer text-[#5C5147] hover:text-[#221A14]"
            onClick={() => toast.dismiss()}
          />
          <div
            className={cn(
              'font-serif mt-1 pr-6 text-xl font-semibold text-[#221A14]',
            )}
          >
            Two-Factor Auth is Mandatory
          </div>
          <div className="font-primary text-sm text-[#5C5147]">
            Setting up two-factor authentication is mandatory to continue
            withdrawing. This will keep your funds secure.
          </div>
          <Button
            onClick={async () => {
              await showMfaEnrollmentModal();
              setView('withdraw');
            }}
            className="mt-2 w-full rounded-xl bg-[#C4502E] px-4 py-2.5 text-sm font-semibold text-[#FBF7EF] transition-colors hover:bg-[#A83F22]"
          >
            Set up 2FA
          </Button>
        </div>,
        {
          duration: 7000,
          style: {
            border: '2px solid #221A14',
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
      <SideDrawerContent className="w-screen overflow-hidden border-l border-[#E6DCC9] bg-[#FBF7EF] sm:w-120">
        <ScrollArea className="h-full overflow-y-auto">
          <div className="flex h-full flex-col">
            {/* header */}
            <div
              className={cn(
                'flex items-start justify-between gap-3 pt-6 pb-3',
                padding,
              )}
            >
              <div className="min-w-0">
                <h2 className="font-serif text-[22px] font-medium tracking-[-0.01em] text-[#221A14]">
                  {user?.firstName ? `${user.firstName}'s Wallet` : 'Wallet'}
                </h2>
                <CopyButton
                  text={user?.walletAddress || ''}
                  contentProps={{ side: 'right' }}
                  content={'Click to copy'}
                >
                  <span className="mt-1.5 inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-[#E6DCC9] bg-[#F2EAD9] px-2.5 py-1 text-xs font-medium text-[#5C5147] transition-colors hover:text-[#221A14]">
                    {truncatePublicKey(user?.walletAddress)}
                    <CopyIcon className="size-3" />
                  </span>
                </CopyButton>
              </div>
              <button
                type="button"
                aria-label="Close"
                onClick={handleClose}
                className="flex size-9 flex-none items-center justify-center rounded-full text-[#5C5147] transition-colors hover:bg-[#F2EAD9] hover:text-[#221A14]"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* balance card */}
            <div className={cn('pb-1', padding)}>
              <div
                className="relative overflow-hidden rounded-[18px] p-6 text-[#FBF7EF]"
                style={{ background: 'linear-gradient(160deg, #34433a, #2C3A2E)' }}
              >
                <div
                  className="pointer-events-none absolute inset-0 opacity-[0.16]"
                  style={{
                    backgroundImage:
                      'repeating-linear-gradient(60deg, rgba(255,255,255,.5) 0 1px, transparent 1px 26px)',
                  }}
                  aria-hidden="true"
                />
                <p className="relative text-[10.5px] font-semibold tracking-[0.2em] text-[#8FA37E] uppercase">
                  Balance
                </p>
                <p className="relative mt-1 font-serif text-[40px] leading-none font-normal">
                  ${formatNumberWithSuffix(totalBalance || 0, 2, true)}
                  <span className="ml-1.5 text-lg text-[#FBF7EF]/70">USD</span>
                </p>
                {view === 'main' && (
                  <Button
                    onClick={handleWithdraw}
                    disabled={!tokens?.length}
                    className="relative mt-5 h-11 w-full rounded-xl bg-[#C4502E] text-[15px] font-semibold text-[#FBF7EF] shadow-none transition-colors hover:bg-[#A83F22] hover:text-[#FBF7EF] disabled:opacity-60"
                  >
                    Withdraw
                    <ArrowUpRight className="size-4" />
                  </Button>
                )}
              </div>
              {view === 'main' && (
                <>
                  <button
                    type="button"
                    onClick={() => showMfaEnrollmentModal()}
                    className="mt-2.5 cursor-pointer text-xs font-semibold text-[#6B7A4F] transition-colors hover:text-[#C4502E]"
                  >
                    {privyUser?.mfaMethods.length === 0
                      ? '+ Add two-factor authentication'
                      : 'Edit two-factor authentication'}
                  </button>
                  <p className="pt-3 text-[13px] leading-snug text-[#5C5147]">
                    You&apos;ll receive payments here each time you win.{' '}
                    <a
                      href="https://superteamdao.notion.site/using-your-earn-wallet"
                      className="font-medium text-[#C4502E] hover:underline"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Learn more
                    </a>
                  </p>
                </>
              )}
            </div>
            {view === 'main' && (
              <>
                <div
                  className={cn(
                    'pt-6 pb-2 text-[11px] font-semibold tracking-[0.16em] text-[#6B7A4F] uppercase',
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
                    'pt-6 pb-2 text-[11px] font-semibold tracking-[0.16em] text-[#6B7A4F] uppercase',
                    padding,
                  )}
                >
                  Activity
                </div>
                <WalletActivity setView={setView} setTxData={setTxData} />
              </>
            )}
            {view !== 'main' && (
              <div className="flex items-center border-b border-[#E6DCC9]/20 py-1.5">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleBack}
                  className="mr-1 ml-4"
                >
                  <ArrowLeft className="h-4 w-4 text-[#221A14]" />
                </Button>
                <h2 className="font-serif text-sm font-semibold text-[#221A14]">
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
            <p className="font-primary sticky bottom-0 mt-auto bg-[#FBF7EF] px-2 py-2 text-center text-xs text-[#5C5147] sm:text-sm">
              Have questions? Reach out to us at{' '}
              {isMD ? (
                <CopyButton text="eng@christex.foundation">
                  <p className="text-[#C4502E] underline hover:text-[#C4502E]/80">
                    eng@christex.foundation
                  </p>
                </CopyButton>
              ) : (
                <a
                  href="mailto:eng@christex.foundation"
                  className="text-[#C4502E] underline hover:text-[#C4502E]/80"
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
