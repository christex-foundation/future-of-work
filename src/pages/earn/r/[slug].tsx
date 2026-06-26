import { usePrivy } from '@privy-io/react-auth';
import { useQuery } from '@tanstack/react-query';
import type { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { ExternalImage } from '@/components/ui/cloudinary-image';
import { api } from '@/lib/api';
import { prisma } from '@/prisma';

import { Login } from '@/features/auth/components/Login';
import { getPrivyToken } from '@/features/auth/utils/getPrivyToken';
import { userCountQuery } from '@/features/home/queries/user-count';
import { liveOpportunitiesQuery } from '@/features/listings/queries/live-opportunities';
import { EarnAvatar } from '@/features/talent/components/EarnAvatar';

interface VerifyResponse {
  valid: boolean;
  remaining?: number;
  inviter?: { id: string; name: string; photo?: string | null };
  reason?: string;
}

const avatars = [
  { name: 'Abhishek', src: '/pfps/t1.webp' },
  { name: 'Pratik', src: '/pfps/md2.webp' },
  { name: 'Yash', src: '/pfps/fff1.webp' },
];

const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.82' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.4'/%3E%3C/svg%3E\")";

interface ReferralLandingProps {
  redirectReason?: 'self_referral' | 'existing_user' | null;
}

export default function ReferralLandingPage({
  redirectReason,
}: ReferralLandingProps) {
  const router = useRouter();
  const { authenticated } = usePrivy();
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  const code = useMemo(() => {
    const slug = router.query.slug as string;
    return slug ? slug.trim().toUpperCase() : '';
  }, [router.query.slug]);

  const { data, isLoading } = useQuery<VerifyResponse>({
    queryKey: ['referral.verify', code],
    queryFn: async () => {
      if (!code) return { valid: false, reason: 'MISSING_CODE' };
      const res = await api.get<VerifyResponse>('/api/user/referral/verify', {
        params: { code },
      });
      return res.data;
    },
    enabled: !!code && !redirectReason,
  });

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout> | undefined;
    if (!isLoading && data) {
      if (data.reason === 'INVALID') {
        toast.error(
          'Referral code is invalid. You will be redirected to the profile creation page in 5 seconds.',
          { duration: 4800, id: 'referral-invalid-link' },
        );
        timeout = setTimeout(
          () => router.push('/earn/new/talent?onboarding=true&referral=true'),
          5000,
        );
      } else if (data.inviter && data.remaining === 0) {
        toast.error(
          'This invitation link has expired. You will be redirected to the profile creation page in 5 seconds.',
          { duration: 4800, id: 'referral-expired-link' },
        );
        timeout = setTimeout(
          () => router.push('/earn/new/talent?onboarding=true&referral=true'),
          5000,
        );
      }
    }
    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [data, isLoading, router]);

  const handleAccept = () => {
    if (!code) return;
    if (!authenticated) {
      setIsLoginOpen(true);
      return;
    }
    router.push('/earn/new/talent?onboarding=true&referral=true&code=' + code);
  };

  function RedirectToast({
    reason,
  }: {
    reason: 'self_referral' | 'existing_user';
  }) {
    useEffect(() => {
      const show = () => {
        if (reason === 'self_referral') {
          toast.warning('You cannot refer yourself.', {
            id: 'toast-self-ref',
            duration: 10000,
          });
        } else if (reason === 'existing_user') {
          toast.warning(
            'This referral is invalid since you have signed up on Earn before with this email ID.',
            {
              id: 'referral-invalid-existing-user',
              duration: 10000,
            },
          );
        }
      };
      const t1 = setTimeout(show, 50);
      const t2 = setTimeout(() => router.replace('/earn'), 500);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }, [reason, router]);
    return null;
  }

  const { data: liveOpportunities } = useQuery({
    ...liveOpportunitiesQuery,
  });

  const { data: totalUsers } = useQuery(userCountQuery);

  const inviterName = data?.inviter?.name?.trim() || 'A member';
  const inviterFirst = inviterName.split(' ')[0];
  const liveValue = liveOpportunities?.totalUsdValue;
  const memberCount = totalUsers?.totalUsers;
  const isInvalid =
    !isLoading &&
    !!data &&
    (!data.valid || data.reason === 'INVALID' || data.remaining === 0);

  if (redirectReason)
    return (
      <main className="ref-page">
        <span className="grain" aria-hidden />
        <RedirectToast reason={redirectReason} />
        <style jsx>{refStyles}</style>
      </main>
    );

  return (
    <main className="ref-page">
      <span className="grain" aria-hidden />

      <header className="ref-nav">
        <a href="/earn" className="brand">
          <span className="sun" aria-hidden />
          Future of Work
        </a>
        <span className="nav-meta">You&rsquo;ve been invited</span>
      </header>

      <section className="center">
        {isLoading ? (
          <article className="card card-quiet" aria-busy>
            <div className="eyebrow">A personal invitation</div>
            <div className="av-skeleton" aria-hidden />
            <p className="loading-line">Opening your invitation…</p>
          </article>
        ) : isInvalid ? (
          <article className="card card-quiet">
            <div className="eyebrow">Invitation</div>
            <h1 className="invited serif">No longer active</h1>
            <p className="oneline serif">
              This invite link is invalid or has expired. We&rsquo;ll take you
              to set up your profile in a moment.
            </p>
            <a href="/earn" className="btn btn-terra">
              Browse bounties instead →
            </a>
          </article>
        ) : (
          <>
            <article className="card">
              <div className="eyebrow">A personal invitation</div>

              <div className="av-ring">
                <EarnAvatar
                  className="size-20"
                  id={data?.inviter?.id}
                  avatar={data?.inviter?.photo ?? undefined}
                />
              </div>

              <h1 className="invited serif">
                <b>{inviterName}</b>
                <br />
                invited you to earn.
              </h1>

              <p className="oneline serif">
                “Get paid global rates in USDC for real work — you&rsquo;d be
                good at this. Come build on Future of Work.”
              </p>

              {liveValue !== undefined && (
                <div className="live">
                  <span className="coin">$</span>
                  <div className="tx">
                    <div className="big serif">${liveValue.toLocaleString()}</div>
                    <div className="sub">live opportunities right now</div>
                  </div>
                </div>
              )}

              <button
                type="button"
                className="btn btn-terra"
                onClick={handleAccept}
                disabled={isLoading || !data?.valid}
              >
                Accept {inviterFirst}&rsquo;s invitation →
              </button>
              <div>
                <a href="/earn" className="browse">
                  Browse bounties first
                </a>
              </div>

              <div className="proof">
                <div className="stack">
                  {avatars.map((avatar, index) => (
                    <span className="sav" key={index}>
                      <ExternalImage
                        className="sav-img"
                        src={avatar.src}
                        alt={avatar.name}
                        loading="eager"
                      />
                    </span>
                  ))}
                </div>
                {memberCount !== null && memberCount !== undefined && (
                  <span className="pt">
                    Join <b>{memberCount.toLocaleString('en-us')}+ builders</b>{' '}
                    earning
                  </span>
                )}
              </div>
            </article>

            <p className="both">
              Win your first bounty and {inviterFirst} earns a referral bonus
              too — <b>you both win.</b>
            </p>
          </>
        )}
      </section>

      <Login isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />

      <style jsx>{refStyles}</style>
    </main>
  );
}

const refStyles = `
  .ref-page {
    --paper: #fbf7ef;
    --paper-2: #f2ead9;
    --ink: #221a14;
    --ink-soft: #5c5147;
    --terra: #c4502e;
    --terra-deep: #a83f22;
    --sage: #8fa37e;
    --forest: #2c3a2e;
    --forest-soft: #3c4d3d;
    --olive: #6b7a4f;
    --peach: #e8b48e;
    --hair: #e6dcc9;
    --line-soft: rgba(34, 26, 20, 0.08);
    --shadow: 0 22px 60px -34px rgba(54, 38, 22, 0.5);
    --serif: var(--font-fraunces), 'Fraunces', serif;
    --sans: var(--font-hanken), 'Hanken Grotesk', sans-serif;
    position: relative;
    min-height: 100vh;
    background: var(--paper);
    color: var(--ink);
    font-family: var(--sans);
    overflow-x: hidden;
  }
  .grain {
    position: fixed;
    inset: 0;
    z-index: 0;
    pointer-events: none;
    opacity: 0.42;
    mix-blend-mode: multiply;
    background-image: ${GRAIN};
  }
  .serif {
    font-family: var(--serif);
  }

  .ref-nav {
    position: relative;
    z-index: 2;
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 76px;
    padding: 0 40px;
    background: rgba(251, 247, 239, 0.82);
    backdrop-filter: blur(12px);
    border-bottom: 1px solid var(--line-soft);
  }
  .brand {
    display: flex;
    align-items: center;
    gap: 12px;
    font-family: var(--serif);
    font-weight: 500;
    font-size: 22px;
    letter-spacing: -0.01em;
    color: var(--ink);
    text-decoration: none;
  }
  .sun {
    width: 30px;
    height: 30px;
    border-radius: 50%;
    flex: 0 0 auto;
    background: radial-gradient(circle at 50% 62%, var(--peach), var(--terra));
    box-shadow: 0 0 0 4px rgba(196, 80, 46, 0.12);
  }
  .nav-meta {
    font-size: 13px;
    color: var(--ink-soft);
  }

  .center {
    position: relative;
    z-index: 1;
    min-height: calc(100vh - 76px);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 30px 24px 60px;
  }

  .card {
    position: relative;
    width: 100%;
    max-width: 440px;
    background: #fffdf8;
    border: 1px solid var(--hair);
    border-radius: 24px;
    box-shadow: var(--shadow);
    padding: 44px 40px 38px;
    text-align: center;
  }
  .card::before {
    content: '';
    position: absolute;
    left: 50%;
    top: -1px;
    transform: translateX(-50%);
    width: 78px;
    height: 4px;
    border-radius: 0 0 6px 6px;
    background: linear-gradient(90deg, var(--terra), var(--peach));
  }
  .card-quiet {
    padding: 40px;
  }

  .eyebrow {
    font-size: 11px;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    font-weight: 700;
    color: var(--terra);
    margin-bottom: 24px;
  }

  .av-ring {
    display: inline-flex;
    margin: 0 auto 18px;
    border-radius: 50%;
    box-shadow: 0 0 0 5px rgba(196, 80, 46, 0.1);
  }
  .av-skeleton {
    width: 78px;
    height: 78px;
    border-radius: 50%;
    margin: 4px auto 18px;
    background: linear-gradient(140deg, var(--paper-2), var(--paper-3, #e9e0cd));
  }
  .loading-line {
    font-size: 14px;
    color: var(--ink-soft);
  }

  .invited {
    font-weight: 400;
    font-size: 26px;
    line-height: 1.2;
    letter-spacing: -0.01em;
  }
  .invited b {
    color: var(--terra);
    font-weight: 500;
  }
  .oneline {
    font-style: italic;
    font-weight: 300;
    font-size: 18px;
    color: var(--ink-soft);
    line-height: 1.5;
    margin: 22px auto 0;
    max-width: 30ch;
  }

  .live {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 11px;
    background: var(--paper-2);
    border: 1px solid var(--hair);
    border-radius: 14px;
    padding: 13px 18px;
    margin: 26px 0 24px;
  }
  .coin {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    flex: 0 0 auto;
    display: grid;
    place-items: center;
    background: linear-gradient(140deg, var(--peach), var(--terra));
    color: #fff;
    font-weight: 700;
    font-size: 14px;
  }
  .tx {
    text-align: left;
  }
  .big {
    font-size: 19px;
    line-height: 1;
  }
  .sub {
    font-size: 12px;
    color: var(--ink-soft);
  }

  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    width: 100%;
    font-family: var(--sans);
    font-weight: 600;
    font-size: 16px;
    padding: 15px;
    border-radius: 14px;
    border: 1px solid transparent;
    cursor: pointer;
    transition: 0.22s;
    white-space: nowrap;
  }
  .btn-terra {
    background: var(--terra);
    color: #fff;
  }
  .btn-terra:hover {
    background: var(--terra-deep);
    transform: translateY(-1px);
    box-shadow: 0 12px 34px -22px rgba(54, 38, 22, 0.45);
  }
  .btn:disabled {
    opacity: 0.55;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
  .card-quiet .btn {
    margin-top: 22px;
  }

  .browse {
    display: inline-block;
    margin-top: 14px;
    font-size: 13.5px;
    color: var(--olive);
    font-weight: 600;
    border-bottom: 1px solid var(--sage);
    padding-bottom: 2px;
    text-decoration: none;
  }

  .proof {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 11px;
    margin-top: 26px;
    padding-top: 22px;
    border-top: 1px solid var(--hair);
  }
  .stack {
    display: flex;
  }
  .sav {
    width: 30px;
    height: 30px;
    border-radius: 50%;
    border: 2px solid #fffdf8;
    margin-left: -8px;
    overflow: hidden;
    flex: 0 0 auto;
    background: var(--paper-2);
  }
  .sav:first-child {
    margin-left: 0;
  }
  .sav :global(.sav-img) {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
  .pt {
    font-size: 12.5px;
    color: var(--ink-soft);
    font-weight: 600;
  }
  .pt b {
    color: var(--ink);
  }

  .both {
    margin-top: 26px;
    font-size: 12.5px;
    color: var(--ink-soft);
    text-align: center;
    max-width: 40ch;
  }
  .both b {
    color: var(--terra);
  }

  .btn:focus-visible,
  .browse:focus-visible,
  .brand:focus-visible {
    outline: 2px solid var(--olive);
    outline-offset: 3px;
    border-radius: 6px;
  }

  @media (prefers-reduced-motion: reduce) {
    .btn {
      transition: none;
    }
  }
  @media (max-width: 760px) {
    .ref-nav {
      padding: 0 22px;
    }
  }
`;

export const getServerSideProps: GetServerSideProps = async ({
  params,
  req,
}) => {
  try {
    const slug =
      (params?.slug as string | undefined)?.trim().toUpperCase() || '';

    const inviter = slug
      ? await prisma.user.findUnique({
          where: { referralCode: slug },
          select: { id: true },
        })
      : null;

    const privyDid = await getPrivyToken(req);
    const viewer = privyDid
      ? await prisma.user.findUnique({
          where: { privyDid },
          select: { id: true, isTalentFilled: true },
        })
      : null;

    if (inviter && viewer && viewer.id === inviter.id) {
      return { props: { redirectReason: 'self_referral' } };
    }

    if (viewer?.isTalentFilled) {
      return { props: { redirectReason: 'existing_user' } };
    }

    return { props: { redirectReason: null } };
  } catch {
    return { props: { redirectReason: null } };
  }
};
