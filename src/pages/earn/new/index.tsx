import { useQuery } from '@tanstack/react-query';
import { type GetServerSideProps } from 'next';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/router';
import React, { useState } from 'react';

import MdCheck from '@/components/icons/MdCheck';
import { SponsorButton } from '@/components/ProfileSetup/SponsorButton';
import { TalentButton } from '@/components/ProfileSetup/TalentButton';
import { Default } from '@/layouts/Default';
import { Meta } from '@/layouts/Meta';
import { api } from '@/lib/api';
import { useUser } from '@/store/user';
import { getURL } from '@/utils/validUrl';

import { AuthWrapper } from '@/features/auth/components/AuthWrapper';
import { userCountQuery } from '@/features/home/queries/user-count';

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
      className="bg-[#6b5e50]"
      hideFooter
      meta={
        <Meta
          title="Create your profile | Future of Work"
          description="Set up your Future of Work profile — find paid work as a freelancer or post work as a company on Sierra Leone's marketplace for work."
          canonical="https://future-of-work-lovat.vercel.app/earn/new/"
        />
      }
    >
      <div className="flex w-full flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-[56rem] border-2 border-[#1d1815] bg-[#f4eee3]">
          {/* top bar */}
          <div className="flex flex-col gap-2 border-b-2 border-[#1d1815] px-6 py-5 sm:flex-row sm:items-baseline sm:justify-between sm:px-8">
            <span className="font-secondary text-[11px] font-extrabold tracking-[0.2em] text-[#6b5e50] uppercase">
              Future of Work / Onboarding
            </span>
            <h1 className="font-serif text-3xl font-semibold text-[#1d1815]">
              Who are you?
            </h1>
          </div>

          {/* role grid */}
          <div className="grid grid-cols-1 md:grid-cols-2">
            {showTalentProfile && (
              <RoleColumn
                role="Freelancer"
                tag="Work"
                tagClassName="bg-[#ce4a2b]"
                blurb="Create a profile to start submitting, and get notified on new work opportunities."
                points={[
                  'Work with great companies and teams',
                  'Build your professional portfolio',
                  'Get paid for your work',
                ]}
                className="border-b-2 border-[#1d1815] md:border-r-2 md:border-b-0"
              >
                <AuthWrapper className="mt-6 block w-full" onClick={checkTalent}>
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
              tagClassName="bg-[#123a33]"
              blurb="List a bounty or freelance gig for your project and find your next contributor."
              points={[
                'Get in front of 10,000 weekly visitors',
                '20+ templates to choose from',
                '100% free to post',
              ]}
            >
              <AuthWrapper className="mt-6 block w-full" onClick={checkSponsor}>
                <SponsorButton
                  showMessage={false}
                  isLoading={isSponsorLoading}
                  checkSponsor={checkSponsor}
                />
              </AuthWrapper>
            </RoleColumn>
          </div>

          {/* social proof footer */}
          {totals?.totalUsers != null && (
            <div className="border-t-2 border-[#1d1815] px-6 py-3.5 text-center">
              <span className="font-secondary text-[11px] font-bold tracking-[0.18em] text-[#6b5e50] uppercase">
                Join {totals?.totalUsers?.toLocaleString('en-us')}+ others on
                Future of Work
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
  tagClassName,
  blurb,
  points,
  className = '',
  children,
}: {
  role: string;
  tag: string;
  tagClassName: string;
  blurb: string;
  points: string[];
  className?: string;
  children: React.ReactNode;
}) => {
  return (
    <div className={`px-6 py-7 sm:px-8 ${className}`}>
      <div className="flex items-baseline justify-between gap-3 border-b-2 border-[#1d1815] pb-4">
        <span className="font-serif text-[32px] font-bold tracking-[-0.02em] text-[#1d1815]">
          {role}
        </span>
        <span
          className={`font-secondary border-2 border-[#1d1815] px-2 py-1 text-[10px] font-extrabold tracking-[0.16em] text-[#f4eee3] uppercase ${tagClassName}`}
        >
          {tag}
        </span>
      </div>
      <p className="mt-4 text-sm leading-relaxed text-[#6b5e50]">{blurb}</p>
      <ul className="mt-5 flex flex-col gap-3.5">
        {points.map((point) => (
          <BulletPoint key={point}>{point}</BulletPoint>
        ))}
      </ul>
      {children}
    </div>
  );
};

const BulletPoint = ({ children }: { children: React.ReactNode }) => {
  return (
    <li className="flex items-center gap-3">
      <span className="flex h-[18px] w-[18px] flex-none items-center justify-center bg-[#1d1815]">
        <MdCheck className="h-3 w-3 text-[#f4eee3]" />
      </span>
      <span className="text-sm text-[#1d1815]">{children}</span>
    </li>
  );
};
