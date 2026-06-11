import { useLoginWithOAuth } from '@privy-io/react-auth';
import { useAtomValue, useSetAtom } from 'jotai';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useState } from 'react';

import { Dialog, DialogContent } from '@/components/ui/dialog';

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
        className="z-200 w-[23rem] gap-0 rounded-none border-2 border-[#1d1815] bg-[#FBF7EE] p-0 pt-2 shadow-[6px_6px_0_#1d1815]"
        classNames={{
          overlay: hideOverlay ? 'hidden' : '',
        }}
        hideCloseIcon
      >
        <div className="px-6 pt-7 pb-5">
          {loginStep === 1 && (
            <ArrowLeft
              className="absolute top-8 left-5 h-5 w-5 cursor-pointer text-[#6b5e50] transition-colors hover:text-[#1d1815]"
              onClick={() => setLoginStep(0)}
            />
          )}
          <p className="font-secondary text-center text-[11px] font-bold tracking-[0.22em] text-[#e6a12b] uppercase">
            Join Future of Work
          </p>
          <p className="font-serif mt-2 text-center text-2xl leading-tight font-semibold text-[#1d1815]">
            You&apos;re one step away
          </p>
          <p className="font-primary mt-1 text-center text-sm text-[#6b5e50]">
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
      </DialogContent>
    </Dialog>
  );
};
