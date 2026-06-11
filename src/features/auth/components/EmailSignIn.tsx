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
    return (
      <div className="mb-20 flex flex-col items-center gap-4">
        <h1 className="font-secondary text-center text-[11px] font-bold tracking-[0.18em] text-[#6b5e50] uppercase">
          Enter OTP
        </h1>
        <InputOTP
          maxLength={6}
          onComplete={handleVerifyOTP}
          autoFocus
          inputMode="numeric"
        >
          <InputOTPGroup className="gap-2">
            <InputOTPSlot
              index={0}
              className="font-serif h-11 w-11 rounded-none border-2 border-[#1d1815] text-lg text-[#1d1815] first:rounded-none last:rounded-none"
            />
            <InputOTPSlot
              index={1}
              className="font-serif h-11 w-11 rounded-none border-2 border-[#1d1815] text-lg text-[#1d1815] first:rounded-none last:rounded-none"
            />
            <InputOTPSlot
              index={2}
              className="font-serif h-11 w-11 rounded-none border-2 border-[#1d1815] text-lg text-[#1d1815] first:rounded-none last:rounded-none"
            />
            <InputOTPSlot
              index={3}
              className="font-serif h-11 w-11 rounded-none border-2 border-[#1d1815] text-lg text-[#1d1815] first:rounded-none last:rounded-none"
            />
            <InputOTPSlot
              index={4}
              className="font-serif h-11 w-11 rounded-none border-2 border-[#1d1815] text-lg text-[#1d1815] first:rounded-none last:rounded-none"
            />
            <InputOTPSlot
              index={5}
              className="font-serif h-11 w-11 rounded-none border-2 border-[#1d1815] text-lg text-[#1d1815] first:rounded-none last:rounded-none"
            />
          </InputOTPGroup>
        </InputOTP>
        <p className="font-primary text-center text-xs text-[#6b5e50]">
          We just sent an OTP on your email{' '}
          <b className="text-[#1d1815]">{email}</b>
        </p>
        {emailError && (
          <p className="font-primary mt-2 text-center text-xs leading-[0.9rem] text-[#ce4a2b]">
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
            'font-primary h-12 rounded-none border-2 border-[#1d1815] bg-[#FBF7EE] text-lg text-[#1d1815] placeholder:text-[#6b5e50]/60 focus-visible:ring-0 focus-visible:ring-offset-0',
            isError && 'border-[#ce4a2b]',
          )}
          onChange={handleEmailChange}
          onKeyDown={handleKeyDown}
          placeholder="Enter your email address"
          value={email}
        />
      </div>
      <Button
        className="ph-no-capture mt-3 h-12 w-full rounded-none border-2 border-[#1d1815] bg-[#e6a12b] font-medium text-[#1d1815] shadow-[3px_3px_0_#1d1815] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:bg-[#e6a12b] hover:shadow-[1px_1px_0_#1d1815]"
        disabled={isLoading}
        onClick={handleEmailSignIn}
      >
        {isLoading ? (
          <span>Loading...</span>
        ) : (
          <span>Continue with Email →</span>
        )}
      </Button>
      {emailError && (
        <p className="font-primary mt-2 text-center text-xs leading-[0.9rem] text-[#ce4a2b]">
          {emailError}
        </p>
      )}
    </>
  );
};
