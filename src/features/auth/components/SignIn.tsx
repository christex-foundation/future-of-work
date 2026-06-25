import { useLoginWithOAuth } from '@privy-io/react-auth';
import { useSetAtom } from 'jotai';
import Link from 'next/link';
import { useRouter } from 'next/router';
import posthog from 'posthog-js';
import { type Dispatch, type SetStateAction, useState } from 'react';

import MdOutlineEmail from '@/components/icons/MdOutlineEmail';
import { Button } from '@/components/ui/button';
import { CopyButton } from '@/components/ui/copy-tooltip';
import { TERMS_OF_USE } from '@/constants/TERMS_OF_USE';
import { useBreakpoint } from '@/hooks/use-breakpoint';
import { GoogleIcon } from '@/svg/google';

import { loginEventAtom } from '../atoms';
import { handleUserCreation } from '../utils/handleUserCreation';
import { EmailSignIn } from './EmailSignIn';

interface SigninProps {
  loginStep: number;
  setLoginStep: Dispatch<SetStateAction<number>>;
  redirectTo?: string;
  onSuccess?: () => void;
}

export const SignIn = ({
  loginStep,
  setLoginStep,
  redirectTo,
  onSuccess,
}: SigninProps) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const isMD = useBreakpoint('md');
  const setLoginEvent = useSetAtom(loginEventAtom);

  const { initOAuth } = useLoginWithOAuth({
    onComplete: async ({ user, wasAlreadyAuthenticated }) => {
      onSuccess?.();
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

  const handleGmailSignIn = async () => {
    posthog.capture('google_auth');
    setIsLoading(true);
    await initOAuth({ provider: 'google' });
  };

  return (
    <div className="mt-6 px-9">
      {loginStep === 0 ? (
        <div className="flex flex-col gap-3">
          <Button
            className="ph-no-capture h-12 w-full gap-2.5 rounded-[13px] bg-[#2C3A2E] text-[15px] font-semibold text-[#FBF7EF] shadow-none transition-all hover:-translate-y-px hover:bg-[#3C4D3D] hover:text-[#FBF7EF] hover:shadow-[0_14px_40px_-22px_rgba(54,38,22,0.45)]"
            size="lg"
            onClick={handleGmailSignIn}
            disabled={isLoading}
          >
            <GoogleIcon />
            {isLoading ? (
              <span>Connecting&hellip;</span>
            ) : (
              <span>Continue with Google</span>
            )}
          </Button>

          <div className="flex items-center gap-3.5 py-1 text-[12.5px] tracking-[0.08em] text-[#5C5147] uppercase">
            <span className="h-px flex-1 bg-[#E6DCC9]" />
            or
            <span className="h-px flex-1 bg-[#E6DCC9]" />
          </div>

          <Button
            variant="outline"
            size="lg"
            className="h-12 w-full gap-2.5 rounded-[13px] border border-[#E6DCC9] bg-transparent text-[15px] font-semibold text-[#221A14] shadow-none transition-all hover:border-[#d9ccb2] hover:bg-[#F2EAD9] hover:text-[#221A14]"
            onClick={() => setLoginStep(1)}
          >
            <MdOutlineEmail className="text-[#6B7A4F]" />
            <span>Continue with Email</span>
          </Button>
        </div>
      ) : (
        <EmailSignIn redirectTo={redirectTo} onSuccess={onSuccess} />
      )}

      <p className="mt-5 text-[12px] leading-[1.5] text-[#5C5147]">
        By using this site, you agree to our{' '}
        <Link
          href={TERMS_OF_USE}
          className="font-semibold text-[#C4502E] hover:text-[#A83F22] hover:underline hover:underline-offset-2"
          target="_blank"
          rel="noopener noreferrer"
        >
          Terms of Use
        </Link>{' '}
        and{' '}
        <Link
          href={`https://superteam.fun/earn/privacy-policy.pdf`}
          className="font-semibold text-[#C4502E] hover:text-[#A83F22] hover:underline hover:underline-offset-2"
          target="_blank"
        >
          Privacy Policy
        </Link>
        .
      </p>

      <p className="mt-3.5 border-t border-[#E6DCC9] pt-3 text-[11.5px] text-[#5C5147]">
        Need help? Reach out at{' '}
        {isMD ? (
          <CopyButton
            text="eng@christex.foundation"
            contentProps={{
              className: 'px-1.5 py-0.5 text-[0.6875rem]',
            }}
          >
            <span className="font-semibold text-[#C4502E] hover:underline hover:underline-offset-2">
              eng@christex.foundation
            </span>
          </CopyButton>
        ) : (
          <a
            href="mailto:eng@christex.foundation"
            className="font-semibold text-[#C4502E] hover:underline hover:underline-offset-2"
            target="_blank"
          >
            eng@christex.foundation
          </a>
        )}
      </p>
    </div>
  );
};
