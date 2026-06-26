import { usePrivy } from '@privy-io/react-auth';
import { createHash } from 'crypto';
import type { GetServerSideProps } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { api } from '@/lib/api';
import { prisma } from '@/prisma';
import { useUser } from '@/store/user';

import { Login } from '@/features/auth/components/Login';

type ClaimStatus = 'valid' | 'invalid' | 'claimed';

interface ClaimPageProps {
  claimCode: string;
  agentName?: string | null;
  agentUsername?: string | null;
  status: ClaimStatus;
}

const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.82' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.4'/%3E%3C/svg%3E\")";

export default function ClaimPage({
  claimCode,
  agentName,
  agentUsername,
  status,
}: ClaimPageProps) {
  const { authenticated, ready } = usePrivy();
  const router = useRouter();
  const { user, isLoading: isUserLoading } = useUser();
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [isClaimed, setIsClaimed] = useState(status === 'claimed');
  const [justClaimed, setJustClaimed] = useState(false);
  const [claimedAgentUsername, setClaimedAgentUsername] = useState(
    agentUsername || null,
  );
  const hasPrivyOAuthParams = useMemo(() => {
    const state = router.query.privy_oauth_state;
    const provider = router.query.privy_oauth_provider;
    const code = router.query.privy_oauth_code;
    return Boolean(state || provider || code);
  }, [
    router.query.privy_oauth_code,
    router.query.privy_oauth_provider,
    router.query.privy_oauth_state,
  ]);

  useEffect(() => {
    if (hasPrivyOAuthParams) {
      setIsLoginOpen(true);
    }
  }, [hasPrivyOAuthParams]);

  const isInvalid = status === 'invalid';
  const isAuthCallbackInProgress = hasPrivyOAuthParams;
  const isAuthCheckPending = !ready;
  const isProfileCheckPending = ready && authenticated && isUserLoading;
  const isTalentProfileIncomplete =
    ready && authenticated && !isUserLoading && !!user && !user.isTalentFilled;

  // The envelope opens on tap for a fresh claim; resolved states (already
  // claimed / invalid) open on their own so the message reads immediately.
  const [isOpen, setIsOpen] = useState(false);
  useEffect(() => {
    if (isInvalid || isClaimed) setIsOpen(true);
  }, [isInvalid, isClaimed]);

  const openEnvelope = () => setIsOpen(true);

  const monogram = (agentName?.trim()?.[0] || 'F').toUpperCase();

  const redirectToTalentProfile = () => {
    void router.push({
      pathname: '/earn/new',
      query: {
        type: 'forced',
        originUrl: router.asPath,
      },
    });
  };

  const handleClaim = async () => {
    if (
      isInvalid ||
      isClaimed ||
      isProfileCheckPending ||
      isAuthCallbackInProgress
    )
      return;
    if (isAuthCheckPending) return;
    if (!authenticated) {
      setIsLoginOpen(true);
      return;
    }
    if (isTalentProfileIncomplete) {
      toast.error('Complete your talent profile before claiming this agent');
      return;
    }

    setIsClaiming(true);
    try {
      const response = await api.post('/api/agents/claim', { claimCode });
      setIsClaimed(true);
      setJustClaimed(true);
      setClaimedAgentUsername(
        response?.data?.agentUsername || agentUsername || null,
      );
      toast.success('Agent claimed successfully');
    } catch (error: any) {
      const apiError =
        error?.response?.data?.error || 'Unable to claim this agent';
      toast.error(apiError);
    } finally {
      setIsClaiming(false);
    }
  };

  const claimDisabled =
    isInvalid ||
    isClaimed ||
    isClaiming ||
    isAuthCallbackInProgress ||
    isAuthCheckPending ||
    isProfileCheckPending ||
    isTalentProfileIncomplete;

  const claimLabel = isClaiming ||
  isAuthCallbackInProgress ||
  isAuthCheckPending ||
  isProfileCheckPending
    ? 'Opening…'
    : isTalentProfileIncomplete
      ? 'Complete profile to claim'
      : authenticated
        ? 'Claim this agent →'
        : 'Sign in to claim →';

  // Lead copy above the envelope, by state.
  const lead = isInvalid ? (
    <>
      This envelope has <em>already</em> been opened.
    </>
  ) : isClaimed ? (
    <>
      It&rsquo;s <em>yours</em>.
    </>
  ) : (
    <>
      There&rsquo;s something <em>for you</em> inside.
    </>
  );
  const sub = isInvalid
    ? 'This claim link is no longer active.'
    : isClaimed
      ? 'The agent has been claimed in your name.'
      : agentName
        ? `An agent named “${agentName}” is waiting to be claimed in your name.`
        : 'An agent is waiting to be claimed in your name.';

  return (
    <>
      <Head>
        <title>Claim agent | Future of Work</title>
      </Head>
      {isLoginOpen && (
        <Login isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
      )}

      <main className="claim-page">
        <span className="grain" aria-hidden />
        <div className="stage">
          {!isOpen && (
            <>
              <p className="lead serif">{lead}</p>
              <p className="sub">{sub}</p>
            </>
          )}

          <div
            className={`env${isOpen ? ' open' : ''}`}
            role={isOpen ? undefined : 'button'}
            tabIndex={isOpen ? -1 : 0}
            aria-label={isOpen ? undefined : 'Open envelope to reveal your agent'}
            onClick={(e) => {
              if (!isOpen && !(e.target as HTMLElement).closest('.l-action'))
                openEnvelope();
            }}
            onKeyDown={(e) => {
              if (!isOpen && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault();
                openEnvelope();
              }
            }}
          >
            <div className="env-body" aria-hidden />
            <div className="flap" aria-hidden />
            <div className="seal-dot serif" aria-hidden>
              {monogram}
            </div>

            <div className="letter">
              {isInvalid ? (
                <>
                  <p className="kick">Claim link expired</p>
                  <p className="l-expired serif">No longer active</p>
                  <p className="l-meta">
                    This link may have already been used, or the agent is no
                    longer available.
                  </p>
                  <div className="l-action">
                    <a href="/earn" className="btn btn-terra">
                      Browse Future of Work
                    </a>
                  </div>
                </>
              ) : isClaimed ? (
                <>
                  <p className="kick ok">
                    {justClaimed ? 'Claimed · Just now' : 'Claimed'}
                  </p>
                  {agentName && (
                    <div className="agent-name serif">{agentName}</div>
                  )}
                  <p className="l-meta">
                    {justClaimed
                      ? 'This agent now belongs to you.'
                      : 'This agent has already been claimed.'}
                  </p>
                  <div className="l-action l-stack">
                    {claimedAgentUsername && (
                      <a
                        href={`/earn/t/${claimedAgentUsername}`}
                        className="btn btn-terra"
                      >
                        View agent profile →
                      </a>
                    )}
                    <a
                      href="/earn"
                      className={`btn ${claimedAgentUsername ? 'btn-ghost' : 'btn-terra'}`}
                    >
                      Browse Future of Work
                    </a>
                  </div>
                </>
              ) : (
                <>
                  <p className="kick">Claim · In your name</p>
                  <div className="agent-name serif">
                    {agentName || 'Your agent'}
                  </div>
                  <p className="l-meta">A Future of Work agent, ready to claim.</p>
                  <div className="l-action l-stack">
                    <button
                      type="button"
                      className="btn btn-terra"
                      onClick={handleClaim}
                      disabled={claimDisabled}
                    >
                      {isClaimed ? 'Claimed' : claimLabel}
                    </button>
                    {isTalentProfileIncomplete && (
                      <div className="l-warn">
                        <p>
                          Complete your talent profile before claiming this
                          agent.
                        </p>
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          onClick={redirectToTalentProfile}
                        >
                          Complete talent profile
                        </button>
                      </div>
                    )}
                  </div>
                  <p className="l-code">
                    Claim code <code>{claimCode}</code>
                  </p>
                </>
              )}
            </div>
          </div>

          {!isOpen && (
            <p className="hint-tap">Tap the envelope to open</p>
          )}
        </div>
      </main>

      <style jsx>{`
        .claim-page {
          --paper: #fbf7ef;
          --paper-2: #f2ead9;
          --ink: #221a14;
          --ink-soft: #5c5147;
          --terra: #c4502e;
          --terra-deep: #a83f22;
          --forest: #2c3a2e;
          --olive: #6b7a4f;
          --gold: #e6a12b;
          --gold-2: #f0b98c;
          --hair: #e6dcc9;
          --serif: var(--font-fraunces), 'Fraunces', serif;
          --sans: var(--font-hanken), 'Hanken Grotesk', sans-serif;
          --shadow: 0 30px 80px -40px rgba(54, 38, 22, 0.55);
          --shadow-sm: 0 12px 34px -22px rgba(54, 38, 22, 0.45);
          position: relative;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 48px 24px;
          background: var(--paper);
          color: var(--ink);
          font-family: var(--sans);
          overflow-x: hidden;
        }
        .grain {
          content: '';
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
        .stage {
          position: relative;
          z-index: 1;
          width: min(600px, 100%);
          text-align: center;
        }
        .lead {
          font-weight: 400;
          font-size: clamp(24px, 4vw, 32px);
          line-height: 1.12;
          letter-spacing: -0.01em;
          margin-bottom: 6px;
        }
        .lead :global(em) {
          font-style: italic;
          color: var(--terra);
        }
        .sub {
          font-size: 14.5px;
          color: var(--ink-soft);
          margin: 0 auto 30px;
          max-width: 30rem;
          line-height: 1.5;
        }

        .env {
          position: relative;
          width: 100%;
          aspect-ratio: 1.55 / 1;
          perspective: 1400px;
          cursor: pointer;
        }
        .env.open {
          cursor: default;
        }
        .env-body {
          position: absolute;
          inset: 0;
          border-radius: 14px;
          background: linear-gradient(160deg, #f4ead6, #ecdfc6);
          border: 1px solid #e0d2b6;
          box-shadow: var(--shadow);
          overflow: hidden;
        }
        .env-body::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(
              135deg,
              transparent 49.6%,
              rgba(0, 0, 0, 0.05) 50%,
              transparent 50.4%
            ),
            linear-gradient(
              45deg,
              transparent 49.6%,
              rgba(0, 0, 0, 0.05) 50%,
              transparent 50.4%
            );
          opacity: 0.5;
        }
        .flap {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 58%;
          z-index: 5;
          transform-origin: top;
          transition: transform 0.8s cubic-bezier(0.4, 0.1, 0.2, 1);
          background: linear-gradient(180deg, #eee0c8, #e4d4b6);
          clip-path: polygon(0 0, 100% 0, 50% 100%);
          border-bottom: 1px solid rgba(0, 0, 0, 0.06);
        }
        .seal-dot {
          position: absolute;
          top: 30%;
          left: 50%;
          transform: translate(-50%, -50%);
          z-index: 8;
          width: 54px;
          height: 54px;
          border-radius: 50%;
          background: radial-gradient(
            circle at 38% 34%,
            var(--gold-2),
            var(--terra) 72%
          );
          box-shadow: 0 8px 18px -6px rgba(168, 63, 34, 0.7);
          display: grid;
          place-items: center;
          color: #fff;
          font-size: 22px;
          transition: opacity 0.35s;
        }
        .hint-tap {
          margin-top: 18px;
          font-size: 13px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--olive);
          font-weight: 600;
        }
        .hint-tap::after {
          content: ' ▾';
        }

        .letter {
          position: absolute;
          left: 3%;
          right: 3%;
          bottom: 6%;
          z-index: 9;
          background: linear-gradient(180deg, #fffdf8, #fcf6ea);
          border: 1px solid var(--hair);
          border-radius: 14px;
          padding: 38px 38px 34px;
          text-align: center;
          box-shadow:
            0 2px 6px rgba(54, 38, 22, 0.06),
            0 26px 60px -28px rgba(54, 38, 22, 0.55);
          transform: translateY(36%) scale(0.96);
          opacity: 0;
          transition:
            transform 0.85s cubic-bezier(0.2, 0.7, 0.2, 1) 0.2s,
            opacity 0.6s 0.2s;
        }
        .env.open .flap {
          transform: rotateX(178deg);
        }
        .env.open .seal-dot {
          opacity: 0;
        }
        .env.open .letter {
          transform: translateY(-56%) scale(1);
          opacity: 1;
        }

        .kick {
          font-size: 11px;
          letter-spacing: 0.26em;
          text-transform: uppercase;
          color: var(--terra);
          font-weight: 700;
        }
        .kick.ok {
          color: var(--forest);
        }
        .agent-name {
          font-weight: 500;
          font-size: clamp(30px, 7vw, 46px);
          line-height: 1.04;
          letter-spacing: -0.02em;
          color: var(--terra);
          margin: 12px 0 8px;
          word-break: break-word;
        }
        .l-expired {
          font-weight: 500;
          font-size: clamp(28px, 6vw, 40px);
          color: var(--ink);
          margin: 12px 0 10px;
        }
        .l-meta {
          font-size: 14.5px;
          color: var(--ink-soft);
          line-height: 1.55;
        }
        .l-action {
          margin-top: 18px;
        }
        .l-stack {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .l-code {
          margin-top: 14px;
          font-size: 12px;
          color: var(--ink-soft);
        }
        .l-code :global(code) {
          font-family: var(--serif);
          font-style: italic;
          color: var(--terra);
          letter-spacing: 0.04em;
        }
        .l-warn {
          margin-top: 4px;
          background: var(--paper-2);
          border: 1px solid var(--hair);
          border-radius: 12px;
          padding: 12px 14px;
          font-size: 12.5px;
          color: var(--ink-soft);
          line-height: 1.45;
          text-align: left;
        }

        .btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-family: var(--sans);
          font-weight: 600;
          font-size: 15.5px;
          padding: 14px 28px;
          border-radius: 40px;
          border: 1px solid transparent;
          cursor: pointer;
          transition: 0.22s;
        }
        .btn-sm {
          margin-top: 10px;
          padding: 9px 18px;
          font-size: 13px;
          width: 100%;
        }
        .btn-terra {
          background: var(--terra);
          color: #fff;
          box-shadow: 0 14px 34px -16px rgba(168, 63, 34, 0.7);
        }
        .btn-terra:hover {
          background: var(--terra-deep);
          transform: translateY(-2px);
        }
        .btn-ghost {
          background: transparent;
          color: var(--forest);
          border-color: var(--hair);
        }
        .btn-ghost:hover {
          background: var(--paper-2);
        }
        .btn:disabled {
          opacity: 0.55;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        .env :global(:focus-visible),
        .btn:focus-visible {
          outline: 2px solid var(--terra);
          outline-offset: 3px;
          border-radius: 8px;
        }

        @media (prefers-reduced-motion: reduce) {
          .flap,
          .letter {
            transition: none;
          }
          .env.open .letter {
            transform: translateY(-56%) scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </>
  );
}

export const getServerSideProps: GetServerSideProps<ClaimPageProps> = async (
  context,
) => {
  const claimCodeParam = context.params?.claimCode;
  if (!claimCodeParam || typeof claimCodeParam !== 'string') {
    return { notFound: true };
  }

  const claimCode = claimCodeParam.trim().toUpperCase();
  const claimCodeHash = createHash('sha256').update(claimCode).digest('hex');

  const agent = await prisma.agent.findUnique({
    where: { claimCodeHash },
    select: {
      name: true,
      status: true,
      claimedByUserId: true,
      user: { select: { username: true } },
    },
  });

  if (!agent || agent.status !== 'ACTIVE') {
    return {
      props: {
        claimCode,
        status: 'invalid',
      },
    };
  }

  return {
    props: {
      claimCode,
      agentName: agent.name,
      agentUsername: agent.user.username,
      status: agent.claimedByUserId ? 'claimed' : 'valid',
    },
  };
};
