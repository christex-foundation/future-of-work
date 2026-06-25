import { useLoginWithOAuth } from '@privy-io/react-auth';
import { useAtomValue, useSetAtom } from 'jotai';
import { ArrowLeft, X } from 'lucide-react';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useState } from 'react';

import { Dialog, DialogContent } from '@/components/ui/dialog';
import { LocalImage } from '@/components/ui/local-image';

import { popupTimeoutAtom } from '@/features/conversion-popups/atoms';

import { loginEventAtom } from '../atoms';
import { handleUserCreation } from '../utils/handleUserCreation';
import { SignIn } from './SignIn';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  isSponsor?: boolean;
  redirectTo?: string;
  hideOverlay?: boolean;
  onOpen?: () => void;
}

export const Login = ({
  isOpen,
  onClose,
  isSponsor = false,
  redirectTo,
  hideOverlay,
}: Props) => {
  const router = useRouter();
  const [loginStep, setLoginStep] = useState(0);
  const popupTimeout = useAtomValue(popupTimeoutAtom);
  const setLoginEvent = useSetAtom(loginEventAtom);

  useLoginWithOAuth({
    onComplete: async ({ user, wasAlreadyAuthenticated }) => {
      await handleUserCreation(user.google?.email || '');
      if (redirectTo) {
        router.push(redirectTo);
      } else {
        const currentPath = router.asPath;
        const url = new URL(window.location.origin + currentPath);

        const privyParams = [
          'privy_oauth_state',
          'privy_oauth_provider',
          'privy_oauth_code',
        ];
        privyParams.forEach((param) => url.searchParams.delete(param));

        router.replace(url.toString());
      }
      if (!wasAlreadyAuthenticated) {
        setLoginEvent('fresh_login');
      }
    },
  });

  useEffect(() => {
    if (popupTimeout) {
      if (isOpen) {
        popupTimeout.pause();
      }
    }
  }, [isOpen]);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open && popupTimeout) {
        popupTimeout.resume();
      }
      onClose();
    },
    [popupTimeout, onClose],
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent
        className="z-200 grid w-[640px] max-w-[calc(100vw-2rem)] grid-cols-1 gap-0 overflow-hidden rounded-[22px] border border-[#E6DCC9] bg-[#FBF7EF] p-0 shadow-[0_30px_80px_-32px_rgba(34,22,14,0.5)] sm:grid-cols-2"
        classNames={{
          overlay: hideOverlay ? 'hidden' : '',
        }}
        hideCloseIcon
      >
        {/* LEFT — art plate */}
        <div
          className="relative hidden flex-col justify-between overflow-hidden p-9 text-white sm:flex"
          style={{
            background:
              'radial-gradient(120% 80% at 82% 8%, rgba(143,163,126,.85), transparent 60%), radial-gradient(120% 100% at 8% 100%, rgba(44,58,46,.92), transparent 55%), linear-gradient(150deg, #C4502E, #8c3520)',
          }}
        >
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.34]"
            style={{
              backgroundImage:
                'repeating-linear-gradient(60deg, rgba(255,255,255,.12) 0 1px, transparent 1px 28px)',
            }}
            aria-hidden="true"
          />
          <span
            className="relative z-10 size-10 rounded-full"
            style={{
              background: 'radial-gradient(circle at 50% 60%, #FBE5CF, #F0B98C)',
              boxShadow: '0 0 0 5px rgba(255,255,255,.14)',
            }}
            aria-hidden="true"
          />
          <h3 className="font-serif relative z-10 text-[31px] leading-[1.08] font-normal tracking-[-0.01em]">
            Paid work,
            <br />
            settled in USDC.
          </h3>
          <div className="relative z-10 flex items-center gap-3">
            <div className="flex" aria-hidden="true">
              <span className="font-serif flex size-[30px] items-center justify-center rounded-full border-2 border-[#b6452a] bg-[#8FA37E] text-xs font-semibold text-[#2C3A2E]">
                A
              </span>
              <span className="font-serif -ml-2 flex size-[30px] items-center justify-center rounded-full border-2 border-[#b6452a] bg-[#E8B48E] text-xs font-semibold text-[#7a2e18]">
                D
              </span>
              <span className="font-serif -ml-2 flex size-[30px] items-center justify-center rounded-full border-2 border-[#b6452a] bg-[#F2EAD9] text-xs font-semibold text-[#2C3A2E]">
                P
              </span>
            </div>
            <span className="text-[12.5px] leading-[1.3] font-medium text-white/90">
              Join 2,400+ builders
              <br />
              earning worldwide
            </span>
          </div>
        </div>

        {/* RIGHT — form panel */}
        <div className="relative flex flex-col bg-[#FBF7EF] pt-10 pb-7">
          <button
            type="button"
            aria-label="Close"
            onClick={() => handleOpenChange(false)}
            className="absolute top-4 right-4 z-10 flex size-[34px] items-center justify-center rounded-full text-[#5C5147] transition-colors hover:bg-[#F2EAD9] hover:text-[#221A14] focus-visible:bg-[#F2EAD9] focus-visible:text-[#221A14] focus-visible:ring-2 focus-visible:ring-[#C4502E]/40 focus-visible:outline-none"
          >
            <X className="size-[18px]" />
          </button>

          <div className="px-9">
            {loginStep === 1 && (
              <button
                type="button"
                aria-label="Back"
                onClick={() => setLoginStep(0)}
                className="mb-3 flex size-8 items-center justify-center rounded-full text-[#5C5147] transition-colors hover:bg-[#F2EAD9] hover:text-[#221A14]"
              >
                <ArrowLeft className="size-5" />
              </button>
            )}
            <LocalImage
              src="/fow-favicon.svg"
              alt="Future of Work"
              className="mb-4 h-8 w-8 object-contain"
            />
            <p className="text-[11.5px] font-semibold tracking-[0.2em] text-[#C4502E] uppercase">
              Join Future of Work
            </p>
            <p className="font-serif mt-2.5 text-[27px] leading-[1.1] font-normal tracking-[-0.01em] text-[#221A14]">
              You&apos;re one step away
            </p>
            <p className="mt-1.5 text-[14.5px] text-[#5C5147]">
              {isSponsor
                ? 'from joining Future of Work'
                : 'from earning in global standards'}
            </p>
          </div>

          <SignIn
            redirectTo={redirectTo}
            loginStep={loginStep}
            setLoginStep={setLoginStep}
            onSuccess={onClose}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};
