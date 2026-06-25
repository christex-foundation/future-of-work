import { useQuery } from '@tanstack/react-query';
import { type GetServerSideProps } from 'next';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/router';
import React, { useState } from 'react';

import { SponsorButton } from '@/components/ProfileSetup/SponsorButton';
import { TalentButton } from '@/components/ProfileSetup/TalentButton';
import { Default } from '@/layouts/Default';
import { Meta } from '@/layouts/Meta';
import { api } from '@/lib/api';
import { useUser } from '@/store/user';
import { getURL } from '@/utils/validUrl';

import { AuthWrapper } from '@/features/auth/components/AuthWrapper';
import { userCountQuery } from '@/features/home/queries/user-count';

const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.82' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.4'/%3E%3C/svg%3E\")";

export default function NewProfilePage({
  showTalentProfile,
}: {
  showTalentProfile: boolean;
}) {
  const { data: totals } = useQuery(userCountQuery);

  const router = useRouter();
  const params = useSearchParams();
  const { user } = useUser();
  const [isTalentLoading, setIsTalentLoading] = useState(false);
  const [isSponsorLoading, setIsSponsorLoading] = useState(false);

  const checkTalent = async () => {
    if (!user) return;
    try {
      if (!user?.isTalentFilled) {
        const originUrl = params?.get('originUrl');
        const type = params?.get('type');
        const query: Record<string, string> = {};
        if (originUrl) query['originUrl'] = originUrl;
        if (type) query['type'] = type;
        router.push({
          pathname: '/earn/new/talent',
          query,
        });
      } else {
        router.push(`/earn/t/${user.username}`);
      }
    } catch (error) {
      setIsTalentLoading(false);
    }
  };

  const checkSponsor = async () => {
    if (!user) return;
    try {
      const sponsors = await api.get('/api/user-sponsors');
      if (sponsors?.data?.length && user.currentSponsorId) {
        router.push('/earn/dashboard/listings?open=1');
      } else {
        const originUrl = params?.get('originUrl');
        router.push({
          pathname: '/earn/new/sponsor',
          query: originUrl ? { originUrl } : undefined,
        });
      }
    } catch (error) {
      setIsSponsorLoading(false);
    }
  };

  return (
    <Default
      className="bg-[#FBF7EF]"
      hideFooter
      meta={
        <Meta
          title="Create your profile | Future of Work"
          description="Set up your Future of Work profile — find paid work as a freelancer or post work as a company on Sierra Leone's marketplace for work."
          canonical="https://future-of-work-lovat.vercel.app/earn/new/"
        />
      }
    >
      <div className="relative flex w-full flex-1 items-center justify-center overflow-hidden bg-[#FBF7EF] px-4 py-14 text-[#221A14]">
        {/* paper-grain warmth */}
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-[5] opacity-[0.42] mix-blend-multiply"
          style={{ backgroundImage: GRAIN }}
        />

        {/* soft sunrise glow behind the headline */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-0 z-0 h-[640px] w-[640px] max-w-[120vw] -translate-x-1/2 -translate-y-[42%] rounded-full opacity-[0.24] blur-[4px]"
          style={{
            background:
              'radial-gradient(circle, #E8B48E, #C4502E 56%, transparent 72%)',
          }}
        />

        <div className="relative z-10 w-full max-w-[920px]">
          {/* headline */}
          <div className="text-center">
            <span className="mb-5 inline-flex items-center justify-center gap-2.5">
              <span
                className="h-[30px] w-[30px] flex-none rounded-full"
                style={{
                  background:
                    'radial-gradient(circle at 50% 62%, #E8B48E, #C4502E)',
                  boxShadow: '0 0 0 5px rgba(196,80,46,0.10)',
                }}
              />
              <span className="text-[12px] font-semibold tracking-[0.2em] text-[#C4502E] uppercase">
                A new day to choose
              </span>
            </span>
            <h1 className="font-serif mx-auto max-w-[14ch] text-[clamp(40px,6vw,72px)] leading-[1.0] font-normal tracking-[-0.02em] text-[#221A14]">
              Who <em className="text-[#C4502E] italic">are</em> you?
            </h1>
            <p className="mx-auto mt-4 max-w-[46ch] text-[18px] leading-[1.55] text-[#5C5147]">
              Good morning. Pick the side you&apos;re on — you can do both later.
            </p>
          </div>

          {/* choice cards */}
          <div
            className={`mx-auto mt-12 grid max-w-[860px] gap-6 ${
              showTalentProfile ? 'sm:grid-cols-2' : 'max-w-[440px]'
            }`}
          >
            {showTalentProfile && (
              <RoleColumn
                role="Freelancer"
                tag="Work"
                accent="terra"
                blurb="Create a profile to start submitting, and get notified on new work opportunities."
                points={[
                  'Work with great companies and teams',
                  'Build your professional portfolio',
                  'Get paid for your work',
                ]}
              >
                <AuthWrapper className="mt-auto block w-full" onClick={checkTalent}>
                  <TalentButton
                    showMessage={false}
                    isLoading={isTalentLoading}
                    checkTalent={checkTalent}
                  />
                </AuthWrapper>
              </RoleColumn>
            )}

            <RoleColumn
              role="Company"
              tag="Hire"
              accent="forest"
              blurb="List a bounty or freelance gig for your project and find your next contributor."
              points={[
                'Get in front of 10,000 weekly visitors',
                '20+ templates to choose from',
                '100% free to post',
              ]}
            >
              <AuthWrapper className="mt-auto block w-full" onClick={checkSponsor}>
                <SponsorButton
                  showMessage={false}
                  isLoading={isSponsorLoading}
                  checkSponsor={checkSponsor}
                />
              </AuthWrapper>
            </RoleColumn>
          </div>

          {/* social proof */}
          {totals?.totalUsers != null && (
            <div className="mt-10 flex items-center justify-center gap-3.5 text-center">
              <span className="flex">
                {['AM', 'DS', 'PN'].map((initials, i) => (
                  <span
                    key={initials}
                    className={`flex h-[28px] w-[28px] items-center justify-center rounded-full border-2 border-[#FBF7EF] bg-[#8FA37E] text-[10px] font-bold text-[#2C3A2E] ${
                      i === 0 ? '' : '-ml-2.5'
                    }`}
                  >
                    {initials}
                  </span>
                ))}
              </span>
              <span className="text-[14.5px] text-[#5C5147]">
                Join{' '}
                <b className="font-semibold text-[#2C3A2E]">
                  {totals?.totalUsers?.toLocaleString('en-us')}+
                </b>{' '}
                others on Future of Work
              </span>
            </div>
          )}
        </div>
      </div>
    </Default>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { req, query } = context;
  let showTalentProfile = true;

  try {
    const response = await api.get(`${getURL()}api/user`, {
      headers: {
        Cookie: req.headers.cookie,
      },
    });

    const { isTalentFilled } = response.data;
    showTalentProfile = isTalentFilled === false;

    if (query.onboarding === 'true' && isTalentFilled) {
      return {
        redirect: {
          destination: '/earn',
          permanent: false,
        },
      };
    }
  } catch (error) {
    console.error('Error fetching user data:', error);
  }

  return {
    props: {
      showTalentProfile,
    },
  };
};

const RoleColumn = ({
  role,
  tag,
  accent,
  blurb,
  points,
  children,
}: {
  role: string;
  tag: string;
  accent: 'terra' | 'forest';
  blurb: string;
  points: string[];
  children: React.ReactNode;
}) => {
  const isTerra = accent === 'terra';
  const accentColor = isTerra ? '#C4502E' : '#2C3A2E';
  return (
    <div className="group relative flex flex-col overflow-hidden rounded-[18px] border border-[#E6DCC9] bg-white px-9 py-9 text-left shadow-[0_12px_34px_-22px_rgba(54,38,22,0.45)] transition-all duration-300 hover:-translate-y-1.5 hover:border-[#d9ccb2] hover:shadow-[0_22px_60px_-34px_rgba(54,38,22,0.5)]">
      {/* left accent strip */}
      <span
        aria-hidden="true"
        className="absolute left-0 top-0 h-full w-1 rounded-l-[18px]"
        style={{ background: accentColor }}
      />
      <span
        className="mb-4 inline-flex items-center gap-2.5 text-[12px] font-semibold tracking-[0.18em] uppercase"
        style={{ color: accentColor }}
      >
        <span
          className="h-2 w-2 flex-none rounded-full"
          style={{ background: accentColor }}
        />
        {tag}
      </span>
      <h2 className="font-serif mb-3 text-[32px] leading-[1.04] font-normal tracking-[-0.01em] text-[#221A14]">
        {role}
      </h2>
      <p className="mb-6 text-[15.5px] leading-[1.5] text-[#5C5147]">{blurb}</p>
      <ul className="mb-8 flex flex-col gap-3">
        {points.map((point) => (
          <li
            key={point}
            className="flex items-start gap-3 text-[15px] leading-[1.4] text-[#221A14]"
          >
            <span
              className="mt-2 h-[7px] w-[7px] flex-none rounded-full"
              style={{ background: accentColor }}
            />
            {point}
          </li>
        ))}
      </ul>
      {children}
    </div>
  );
};
