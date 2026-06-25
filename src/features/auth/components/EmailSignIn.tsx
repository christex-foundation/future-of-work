import { useLoginWithEmail } from '@privy-io/react-auth';
import { useSetAtom } from 'jotai';
import { useRouter } from 'next/router';
import posthog from 'posthog-js';
import React, { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/ui/input-otp';
import { cn } from '@/utils/cn';

import { loginEventAtom } from '../atoms';
import { checkEmailValidity, validateEmailRegex } from '../utils/email';
import { handleUserCreation } from '../utils/handleUserCreation';

interface LoginProps {
  redirectTo?: string;
  onSuccess?: () => void;
}

export const EmailSignIn = ({ redirectTo, onSuccess }: LoginProps) => {
  const [email, setEmail] = useState('');
  const [isEmailValid, setIsEmailValid] = useState(false);
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState('');

  const router = useRouter();
  const setLoginEvent = useSetAtom(loginEventAtom);

  const { state, sendCode, loginWithCode } = useLoginWithEmail({
    onComplete: async ({ user, wasAlreadyAuthenticated }) => {
      onSuccess?.();
      await handleUserCreation(user.email?.address || '');
      const url = new URL(redirectTo || router.asPath, window.location.origin);
      if (redirectTo) url.searchParams.set('originUrl', router.asPath);
      router.push(url.toString());
      if (!wasAlreadyAuthenticated) {
        setLoginEvent('fresh_login');
      }
    },
    onError: () => {
      setEmailError('Authentication failed. Please try again.');
      setIsLoading(false);
    },
  });

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const emailInput = e.target.value.trim();
    setEmail(emailInput);
    setIsEmailValid(validateEmailRegex(emailInput));
    setEmailError('');
  };

  const handleEmailSignIn = async () => {
    setIsLoading(true);
    setHasAttemptedSubmit(true);
    setEmailError('');

    if (isEmailValid) {
      try {
        const isValidEmail = await checkEmailValidity(email);
        if (isValidEmail) {
          posthog.capture('email OTP_auth');
          localStorage.setItem('emailForSignIn', email);
          await sendCode({ email });
        } else {
          setIsLoading(false);
          setEmailError(
            'This email address appears to be invalid or needs to be whitelisted. Please check and try again.',
          );
        }
      } catch (error) {
        setIsLoading(false);
        console.error('Error during email validation:', error);
        setEmailError(
          'An error occurred while validating your email. Please try again later.',
        );
      }
    } else {
      setIsLoading(false);
      setEmailError('Please enter a valid email address.');
    }
  };

  const handleVerifyOTP = async (value: string) => {
    setIsLoading(true);
    try {
      await loginWithCode({ code: value });
    } catch (error) {
      setEmailError('Invalid code. Please try again.');
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleEmailSignIn();
    }
  };

  const isError = hasAttemptedSubmit && !isEmailValid;
  const showOTPInput = state.status === 'awaiting-code-input';

  if (showOTPInput) {
    const otpSlot =
      'font-serif h-11 w-9 rounded-[10px] border border-[#E6DCC9] bg-[#FBF7EF] text-base text-[#221A14] data-[active=true]:border-[#C4502E] data-[active=true]:ring-2 data-[active=true]:ring-[#C4502E]/25';
    return (
      <div className="flex w-full flex-col items-center gap-4 pb-2">
        <h1 className="text-center text-[11px] font-bold tracking-[0.18em] text-[#5C5147] uppercase">
          Enter OTP
        </h1>
        <InputOTP
          maxLength={6}
          onComplete={handleVerifyOTP}
          autoFocus
          inputMode="numeric"
        >
          <InputOTPGroup className="gap-1">
            <InputOTPSlot index={0} className={otpSlot} />
            <InputOTPSlot index={1} className={otpSlot} />
            <InputOTPSlot index={2} className={otpSlot} />
            <InputOTPSlot index={3} className={otpSlot} />
            <InputOTPSlot index={4} className={otpSlot} />
            <InputOTPSlot index={5} className={otpSlot} />
          </InputOTPGroup>
        </InputOTP>
        <p className="text-center text-xs text-[#5C5147]">
          We just sent an OTP on your email{' '}
          <b className="text-[#221A14]">{email}</b>
        </p>
        {emailError && (
          <p className="mt-2 text-center text-xs leading-[0.9rem] text-[#C4502E]">
            {emailError}
          </p>
        )}
      </div>
    );
  }

  return (
    <>
      <div className={cn('relative')}>
        <Input
          className={cn(
            'h-12 rounded-[12px] border border-[#E6DCC9] bg-[#F2EAD9]/60 text-base text-[#221A14] placeholder:text-[#5C5147]/60 focus-visible:border-[#C4502E] focus-visible:ring-2 focus-visible:ring-[#C4502E]/25 focus-visible:ring-offset-0',
            isError && 'border-[#C4502E]',
          )}
          onChange={handleEmailChange}
          onKeyDown={handleKeyDown}
          placeholder="Enter your email address"
          value={email}
        />
      </div>
      <Button
        className="ph-no-capture mt-3 h-12 w-full rounded-[13px] bg-[#2C3A2E] text-[15px] font-semibold text-[#FBF7EF] shadow-none transition-all hover:-translate-y-px hover:bg-[#3C4D3D] hover:text-[#FBF7EF] hover:shadow-[0_14px_40px_-22px_rgba(54,38,22,0.45)]"
        disabled={isLoading}
        onClick={handleEmailSignIn}
      >
        {isLoading ? <span>Loading&hellip;</span> : <span>Continue &rarr;</span>}
      </Button>
      {emailError && (
        <p className="mt-2 text-center text-xs leading-[0.9rem] text-[#C4502E]">
          {emailError}
        </p>
      )}
    </>
  );
};
