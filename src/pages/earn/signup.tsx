import { usePrivy } from '@privy-io/react-auth';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/router';
import { type ReactNode, useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { useUser } from '@/store/user';

import { Login } from '@/features/auth/components/Login';
import { SignIn } from '@/features/auth/components/SignIn';
import {
  acceptInvite,
  verifyInviteQuery,
} from '@/features/sponsor-dashboard/queries/accept-invite';
import { EarnAvatar } from '@/features/talent/components/EarnAvatar';

const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.82' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.4'/%3E%3C/svg%3E\")";

function InviteShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-screen w-full items-center justify-center bg-[#FBF7EF] px-5 py-16">
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.42] mix-blend-multiply"
        style={{ backgroundImage: GRAIN }}
      />
      <div className="relative z-[1] w-full max-w-[460px]">
        <div className="rounded-[22px] border border-[#E6DCC9] bg-white p-8 shadow-[0_30px_80px_-32px_rgba(34,22,14,0.5)] md:p-10">
          {children}
        </div>
      </div>
    </div>
  );
}

const Eyebrow = ({
  children,
  tone = 'forest',
}: {
  children: ReactNode;
  tone?: 'forest' | 'terra';
}) => (
  <span
    className="flex items-center gap-2.5 text-[11.5px] font-semibold tracking-[0.2em] uppercase"
    style={{ color: tone === 'forest' ? '#2C3A2E' : '#C4502E' }}
  >
    <span
      className="inline-block h-[1.5px] w-[18px]"
      style={{ background: tone === 'forest' ? '#2C3A2E' : '#C4502E' }}
    />
    {children}
  </span>
);

export default function SignupPage() {
  const [loginStep, setLoginStep] = useState(0);
  const router = useRouter();
  const { authenticated, logout, ready } = usePrivy();
  const [isNavigating, setIsNavigating] = useState(false);
  const { user, refetchUser } = useUser();

  const { invite } = router.query;
  const cleanToken =
    (Array.isArray(invite) ? invite[0] : invite)?.split('?')[0] || '';
  const hasInvite = !!cleanToken;

  const {
    data: inviteDetails,
    error,
    isPending,
  } = useQuery(verifyInviteQuery(cleanToken));

  const acceptInviteMutation = useMutation({
    mutationFn: acceptInvite,
    onSuccess: async () => {
      toast.success("You've successfully joined the sponsor's dashboard.");
      await refetchUser();
      setIsNavigating(true);
      router.push('/earn/dashboard/listings');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleAcceptInvite = () => {
    acceptInviteMutation.mutate(cleanToken);
  };

  // No invite token → already-signed-in visitors have nothing to accept here,
  // so send them into the app rather than showing a stray login.
  useEffect(() => {
    if (!hasInvite && ready && authenticated) {
      router.replace('/earn');
    }
  }, [hasInvite, ready, authenticated, router]);

  // Bare /earn/signup (no invite): this is a generic join page — reuse the
  // Daybreak "Split Panel" login that powers the rest of the app.
  if (!hasInvite) {
    if (ready && authenticated) return null;
    return (
      <Login
        isOpen
        onClose={() => router.push('/earn')}
        redirectTo="/earn"
      />
    );
  }

  const isEmailMismatch =
    ready &&
    authenticated &&
    user?.email &&
    inviteDetails?.invitedEmail &&
    user.email.toLowerCase() !== inviteDetails.invitedEmail.toLowerCase();

  if (error) {
    return (
      <InviteShell>
        <div className="text-center">
          <div className="flex justify-center">
            <Eyebrow tone="terra">Invitation error</Eyebrow>
          </div>
          <h1 className="font-serif mt-4 text-[28px] leading-[1.1] font-normal tracking-[-0.01em] text-[#221A14]">
            This invite didn&apos;t work
          </h1>
          <p className="mx-auto mt-3 max-w-[34ch] text-[15px] leading-[1.55] text-[#5C5147]">
            {error instanceof Error ? error.message : 'An error occurred'}
          </p>
          <Button
            onClick={() => router.push('/earn')}
            className="mt-7 h-11 rounded-full bg-[#C4502E] px-6 text-[14.5px] font-semibold text-[#FBF7EF] hover:bg-[#A83F22]"
          >
            Go to homepage
          </Button>
        </div>
      </InviteShell>
    );
  }

  if (!ready || isPending) {
    return (
      <InviteShell>
        <div className="flex flex-col items-center text-center">
          <Eyebrow>Team invitation</Eyebrow>
          <h1 className="font-serif mt-4 text-[26px] leading-[1.1] font-normal tracking-[-0.01em] text-[#221A14]">
            Checking your invite&hellip;
          </h1>
          <span className="mt-6 size-7 animate-spin rounded-full border-2 border-[#E6DCC9] border-t-[#2C3A2E]" />
        </div>
      </InviteShell>
    );
  }

  return (
    <InviteShell>
      <div className="flex flex-col items-center text-center">
        <Eyebrow>Team invitation</Eyebrow>

        {inviteDetails?.sponsorLogo && inviteDetails?.sponsorName ? (
          <EarnAvatar
            className="mt-6 size-[72px] rounded-2xl"
            avatar={inviteDetails.sponsorLogo}
            id={inviteDetails.sponsorName}
          />
        ) : null}

        <h1 className="font-serif mt-5 text-[27px] leading-[1.12] font-normal tracking-[-0.01em] text-[#221A14]">
          {inviteDetails?.senderName} invited you to join{' '}
          <span className="text-[#2C3A2E] italic">
            {inviteDetails?.sponsorName}
          </span>
        </h1>
        <p className="mt-2.5 max-w-[38ch] text-[15px] leading-[1.55] text-[#5C5147]">
          Accept to start posting and reviewing work together on Future of Work.
        </p>

        <div className="mt-7 w-full">
          {!authenticated ? (
            <div className="w-full">
              <p className="mb-1 text-[13.5px] font-medium text-[#5C5147]">
                Sign in to accept the invitation
              </p>
              <SignIn loginStep={loginStep} setLoginStep={setLoginStep} />
            </div>
          ) : isEmailMismatch ? (
            <div className="mx-auto w-full max-w-md">
              <p className="text-[14px] leading-[1.55] text-[#5C5147]">
                You&apos;re signed in as{' '}
                <span className="font-semibold text-[#221A14]">
                  {user?.email?.toLowerCase()}
                </span>
                . To accept, log out and sign in as{' '}
                <span className="font-semibold text-[#221A14]">
                  {inviteDetails?.invitedEmail?.toLowerCase()}
                </span>
                .
              </p>
              <Button
                onClick={async () => {
                  try {
                    await logout();
                    router.push(`/earn/signup?invite=${cleanToken}`);
                  } catch (error) {
                    router.push(`/earn/signup?invite=${cleanToken}`);
                  }
                }}
                className="mt-5 h-11 w-full rounded-full bg-[#2C3A2E] px-6 text-[14.5px] font-semibold text-[#FBF7EF] hover:bg-[#3C4D3D]"
              >
                Log out &amp; continue as{' '}
                {inviteDetails?.invitedEmail?.toLowerCase()}
              </Button>
            </div>
          ) : (
            <Button
              disabled={
                !inviteDetails || acceptInviteMutation.isPending || isNavigating
              }
              onClick={handleAcceptInvite}
              className="h-12 w-full rounded-full bg-[#2C3A2E] px-6 text-[15px] font-semibold text-[#FBF7EF] hover:bg-[#3C4D3D] disabled:opacity-60"
            >
              {acceptInviteMutation.isPending || isNavigating
                ? 'Joining…'
                : 'Accept invite'}
            </Button>
          )}
        </div>
      </div>
    </InviteShell>
  );
}
