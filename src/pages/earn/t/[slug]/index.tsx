import { SquarePen } from 'lucide-react';
import type { GetServerSideProps } from 'next';
import dynamic from 'next/dynamic';
import Head from 'next/head';
import { useRouter } from 'next/router';
import {
  type JSX,
  memo,
  type ReactNode,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useInView } from 'react-intersection-observer';

import { EmptySection } from '@/components/shared/EmptySection';
import { JsonLd } from '@/components/shared/JsonLd';
import { ShareIcon } from '@/components/shared/shareIcon';
import { ExternalImage } from '@/components/ui/cloudinary-image';
import { useDisclosure } from '@/hooks/use-disclosure';
import { useMediaQuery } from '@/hooks/use-media-query';
import type { User } from '@/interface/user';
import { Default } from '@/layouts/Default';
import { prisma } from '@/prisma';
import { useUser } from '@/store/user';
import { cn } from '@/utils/cn';
import {
  generateBreadcrumbListSchema,
  generatePersonSchema,
} from '@/utils/json-ld';
import { getURL } from '@/utils/validUrl';

import { AuthWrapper } from '@/features/auth/components/AuthWrapper';
const FeedLoop = dynamic(
  () =>
    import('@/features/feed/components/FeedLoop').then((mod) => mod.FeedLoop),
  {
    ssr: false,
  },
);
import { useGetFeed } from '@/features/feed/queries/useGetFeed';
import { type FeedDataProps } from '@/features/feed/types';
import {
  GitHub,
  Linkedin,
  Twitter,
  Website,
} from '@/features/social/components/SocialIcons';
const AddProject = dynamic(
  () =>
    import('@/features/talent/components/AddProject').then(
      (mod) => mod.AddProject,
    ),
  { ssr: false },
);
import { AgentBadge } from '@/features/agents/components/AgentBadge';
import { ProBadge } from '@/features/pro/components/ProBadge';
import { EarnAvatar } from '@/features/talent/components/EarnAvatar';
const ShareProfile = dynamic(
  () =>
    import('@/features/talent/components/shareProfile').then(
      (mod) => mod.ShareProfile,
    ),
  { ssr: false },
);

type UserWithFeed = User & {
  feed: FeedDataProps[];
};
interface TalentProps {
  talent: UserWithFeed;
  stats: {
    wins: number;
    participations: number;
    totalWinnings: number;
  };
  bgIndex: number;
  shouldNoIndex: boolean;
}

const getWorkPreferenceText = (workPrefernce?: string): string | null => {
  if (!workPrefernce || workPrefernce === 'Not looking for Work') {
    return null;
  }
  const fullTimePatterns = [
    'Passively looking for fulltime positions',
    'Actively looking for fulltime positions',
    'Fulltime',
  ];
  const freelancePatterns = [
    'Passively looking for freelance work',
    'Actively looking for freelance work',
    'Freelance',
  ];
  const internshipPatterns = ['Actively looking for internships', 'Internship'];

  if (fullTimePatterns.includes(workPrefernce)) {
    return 'Fulltime Roles';
  }
  if (freelancePatterns.includes(workPrefernce)) {
    return 'Freelance Opportunities';
  }
  if (internshipPatterns.includes(workPrefernce)) {
    return 'Internship Opportunities';
  }

  return workPrefernce;
};

const ProfileActionButton = memo(function ProfileActionButton({
  icon,
  text,
  onClick,
  outline = false,
  isMD,
}: {
  icon: JSX.Element;
  text: string;
  onClick: () => void;
  outline?: boolean;
  isMD: boolean;
}) {
  const base = outline
    ? 'border-2 border-[#1d1815] bg-[#f4eee3] text-[#1d1815] hover:bg-[#1d1815] hover:text-[#f4eee3]'
    : 'border-2 border-[#1d1815] bg-[#1d1815] text-[#f4eee3] shadow-[3px_3px_0_#1d1815] hover:shadow-[1px_1px_0_#1d1815]';

  if (isMD) {
    return (
      <AuthWrapper showCompleteProfileModal allowSponsor>
        <button
          onClick={onClick}
          className={cn(
            'ph-no-capture font-secondary inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-md px-3 text-[12px] font-bold tracking-[0.04em] uppercase transition',
            base,
          )}
        >
          {icon}
          {text}
        </button>
      </AuthWrapper>
    );
  }

  return (
    <AuthWrapper showCompleteProfileModal allowSponsor>
      <button
        aria-label={text}
        onClick={onClick}
        className={cn(
          'inline-flex size-9 items-center justify-center rounded-md transition',
          base,
        )}
      >
        {icon}
      </button>
    </AuthWrapper>
  );
});

function StatTile({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-lg border-2 border-[#1d1815] bg-[#f4eee3] px-3 py-3 shadow-[3px_3px_0_#1d1815]">
      <p className="font-serif text-[26px] leading-none font-semibold text-[#1d1815]">
        {value}
      </p>
      <p className="font-secondary mt-1.5 text-[10px] font-bold tracking-[0.16em] text-[#6b5e50] uppercase">
        {label}
      </p>
    </div>
  );
}

function DossierDivider() {
  return (
    <div className="my-6 border-t border-dashed border-[#1d1815]/25 md:my-7" />
  );
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="font-secondary text-[12px] font-bold tracking-[0.16em] text-[#1d1815] uppercase">
      {children}
    </p>
  );
}

function TalentProfile({ talent, stats, shouldNoIndex }: TalentProps) {
  const [activeTab, setActiveTab] = useState<'activity' | 'projects'>(
    'activity',
  );
  const [showSubskills, setShowSubskills] = useState<Record<number, boolean>>(
    {},
  );
  const { ref, inView } = useInView();

  const feedParams = useMemo(
    () => ({
      filter: 'new' as const,
      timePeriod: '',
      isWinner: false,
      take: 5,
      userId: talent?.id,
      takeOnlyType: activeTab === 'activity' ? undefined : ('pow' as const),
    }),
    [talent?.id, activeTab],
  );

  const {
    data: feed,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useGetFeed(feedParams);

  useEffect(() => {
    if (inView && hasNextPage) {
      fetchNextPage();
    }
  }, [inView, fetchNextPage, hasNextPage]);

  const handleToggleSubskills = (index: number) => {
    setShowSubskills((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };
  const { user } = useUser();

  useEffect(() => {
    let ignore = false;
    if (user?.id && talent?.id && user.id !== talent?.id) {
      import('posthog-js').then(({ default: posthog }) => {
        if (!ignore) posthog.capture('clicked profile_talent');
      });
    }
    return () => {
      ignore = true;
    };
  }, [talent?.id, user?.id]);

  const {
    isOpen: isOpenPow,
    onOpen: onOpenPow,
    onClose: onClosePow,
  } = useDisclosure();

  const { isOpen, onOpen, onClose } = useDisclosure();

  const socialLinks = useMemo(
    () => [
      { Icon: Twitter, link: talent?.twitter },
      { Icon: Linkedin, link: talent?.linkedin },
      { Icon: GitHub, link: talent?.github },
      { Icon: Website, link: talent?.website },
    ],
    [talent?.twitter, talent?.linkedin, talent?.github, talent?.website],
  );

  const router = useRouter();

  const handleEditProfileClick = () => {
    router.push(`/earn/t/${talent?.username}/edit`);
  };

  const addNewPow = () => {
    refetch();
  };

  const isMD = useMediaQuery('(min-width: 768px)');

  const workPreferenceText = getWorkPreferenceText(talent?.workPrefernce);

  const isPublicProfile = !!talent?.id && !talent.private;

  const description = useMemo(() => {
    if (!isPublicProfile) return '';

    const parts: string[] = [];
    const fullName = `${talent?.firstName || ''} ${
      talent?.lastName || ''
    }`.trim();

    if (fullName) parts.push(fullName);
    if (workPreferenceText) parts.push(`looking for ${workPreferenceText}`);
    if (talent?.currentEmployer)
      parts.push(`works at ${talent.currentEmployer}`);
    if (talent?.location) parts.push(`based in ${talent.location}`);

    const statsStr = `$${Math.round(
      stats?.totalWinnings || 0,
    ).toLocaleString()} earned, ${stats?.wins || 0} wins on Superteam Earn.`;

    return parts.length > 0
      ? `${parts.join(' | ')}. ${statsStr}`
      : `Talent profile on Superteam Earn. ${statsStr}`;
  }, [talent, workPreferenceText, stats, isPublicProfile]);

  const ogImage = useMemo(() => {
    const path = talent?.isPro
      ? `${getURL()}api/dynamic-og/pro-talent/`
      : `${getURL()}api/dynamic-og/talent/`;
    const url = new URL(path);
    url.searchParams.set('name', `${talent?.firstName} ${talent?.lastName}`);
    url.searchParams.set('username', talent?.username!);
    url.searchParams.set('skills', JSON.stringify(talent?.skills));
    url.searchParams.set(
      'totalEarned',
      stats?.totalWinnings?.toFixed(0) || '0',
    );
    url.searchParams.set('submissionCount', stats?.participations?.toString());
    url.searchParams.set('winnerCount', stats?.wins?.toString());
    if (talent?.photo) {
      url.searchParams.set('photo', talent.photo);
    }
    return url;
  }, [
    talent?.isPro,
    talent?.firstName,
    talent?.lastName,
    talent?.username,
    talent?.skills,
    talent?.photo,
    stats?.totalWinnings,
    stats?.participations,
    stats?.wins,
  ]);

  const title =
    talent?.firstName && talent?.lastName
      ? `${talent?.firstName} ${talent?.lastName} | Superteam Earn Talent`
      : 'Superteam Earn';

  const feedItems = useMemo(
    () => feed?.pages.flatMap((page) => page) ?? [],
    [feed?.pages],
  );

  // Generate JSON-LD schemas for public profiles only
  const personSchema = isPublicProfile
    ? generatePersonSchema({
        firstName: talent?.firstName,
        lastName: talent?.lastName,
        username: talent?.username,
        photo: talent?.photo,
        workPreference: workPreferenceText,
        currentEmployer: talent?.currentEmployer,
        location: talent?.location,
        skills: talent?.skills,
        twitter: talent?.twitter,
        linkedin: talent?.linkedin,
        github: talent?.github,
        website: talent?.website,
      })
    : null;

  const breadcrumbSchema = isPublicProfile
    ? generateBreadcrumbListSchema([
        { name: 'Home', url: '/' },
        { name: 'Talent', url: '/leaderboard/' },
        {
          name:
            `${talent?.firstName || ''} ${talent?.lastName || ''}`.trim() ||
            'Talent',
        },
      ])
    : null;

  return (
    <Default
      className="bg-[#6b5e50]"
      meta={
        <>
          <Head>
            <title>{title}</title>
            <meta property="og:title" content={title} />
            <meta property="og:image" content={ogImage.toString()} />
            <meta name="twitter:title" content={title} />
            <meta name="twitter:image" content={ogImage.toString()} />
            <meta name="twitter:card" content="summary_large_image" />
            <meta property="og:image:width" content="1200" />
            <meta property="og:image:height" content="630" />
            <meta
              property="og:image:alt"
              content={
                isPublicProfile
                  ? `${talent?.firstName} ${talent?.lastName} - Talent profile on Superteam Earn`
                  : 'Talent on Superteam'
              }
            />
            <meta property="og:type" content="profile" />
            <meta charSet="UTF-8" key="charset" />
            <meta
              name="viewport"
              content="width=device-width, initial-scale=1, maximum-scale=1"
              key="viewport"
            />
            <link
              rel="preconnect"
              href="https://res.cloudinary.com"
              crossOrigin=""
            />
            <link rel="dns-prefetch" href="https://res.cloudinary.com" />
            {isPublicProfile && (
              <>
                <meta name="description" content={description} />
                <meta property="og:description" content={description} />
                <meta name="twitter:description" content={description} />
                <link
                  rel="canonical"
                  href={`https://superteam.fun/earn/t/${talent?.username}/`}
                />
              </>
            )}
            {(talent.private || shouldNoIndex) && (
              <>
                <meta name="robots" content="noindex, nofollow" />
                <meta name="googlebot" content="noindex, nofollow" />
              </>
            )}
          </Head>
          {personSchema && breadcrumbSchema && (
            <JsonLd data={[personSchema, breadcrumbSchema]} />
          )}
        </>
      }
    >
      {!talent?.id && (
        <EmptySection message="Sorry! The profile you are looking for is not available." />
      )}
      {!!talent?.id && (
        <div className="w-full grow bg-[#6b5e50] px-4 py-8 md:px-6 md:py-14">
          <div className="mx-auto max-w-[760px]">
            <div className="overflow-hidden rounded-xl border-2 border-[#1d1815] bg-[#f4eee3] shadow-[8px_8px_0_#1d1815]">
              {/* Dossier header bar */}
              <div className="flex items-center justify-between gap-3 bg-[#1d1815] px-4 py-2.5 md:px-7">
                <span className="font-secondary flex items-center gap-2 text-[10px] font-bold tracking-[0.18em] text-[#f4eee3] uppercase md:text-[11px]">
                  <span className="inline-block size-[7px] bg-[#e6a12b]" />
                  Talent Dossier
                  <span className="text-[#c9b9a5]">
                    №
                    {String(hashStringToInt(talent.id) % 10000).padStart(4, '0')}
                  </span>
                </span>
                <span className="font-secondary hidden text-[10px] font-bold tracking-[0.18em] text-[#c9b9a5] uppercase sm:inline">
                  Future of Work
                </span>
              </div>

              <div className="p-5 md:p-8">
                {/* Identity + stat cluster */}
                <div className="flex flex-col gap-7 md:flex-row md:items-start md:justify-between md:gap-8">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start gap-4">
                      <div className="inline-flex shrink-0 overflow-hidden rounded-lg border-2 border-[#1d1815] bg-[#1d1815] shadow-[4px_4px_0_#1d1815]">
                        <EarnAvatar
                          className="size-16 rounded-none md:size-20"
                          id={talent?.id}
                          avatar={talent?.photo}
                          imgLoading="eager"
                          imgFetchPriority="high"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h1 className="font-secondary text-[22px] leading-tight font-bold tracking-[-0.01em] text-[#1d1815] md:text-[26px]">
                            {talent?.firstName} {talent?.lastName}
                          </h1>
                          {talent?.isAgent ? (
                            <AgentBadge
                              containerClassName="bg-[#1d1815] px-2 py-[3px] gap-[3px] rounded-md"
                              iconClassName="size-2 text-[#e6a12b]"
                              textClassName="text-[8px] md:text-[9px] font-bold tracking-wide text-[#f4eee3]"
                            />
                          ) : (
                            talent?.isPro && (
                              <ProBadge
                                containerClassName="bg-[#e6a12b] px-2 py-[3px] gap-[3px] rounded-md"
                                iconClassName="size-2 text-[#1d1815]"
                                textClassName="text-[8px] md:text-[9px] font-bold tracking-wide text-[#1d1815]"
                              />
                            )
                          )}
                        </div>
                        <p className="font-secondary mt-1 text-[13px] font-semibold text-[#6b5e50]">
                          @
                          {isMD
                            ? talent?.username
                            : talent?.username?.length &&
                                talent?.username.length > 24
                              ? `${talent?.username.slice(0, 24)}...`
                              : talent?.username}
                        </p>
                        {workPreferenceText && (
                          <p className="font-serif mt-2.5 text-[17px] leading-snug font-semibold text-[#ce4a2b] italic">
                            Looking for {workPreferenceText}
                          </p>
                        )}
                        {(talent?.currentEmployer || talent?.location) && (
                          <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-[#6b5e50]">
                            {talent?.currentEmployer && (
                              <span>
                                <span className="text-[#9a8b78]">@ </span>
                                <span className="font-medium text-[#3a322b]">
                                  {talent.currentEmployer}
                                </span>
                              </span>
                            )}
                            {talent?.currentEmployer && talent?.location && (
                              <span className="inline-block size-1 rounded-full bg-[#9a8b78]" />
                            )}
                            {talent?.location && (
                              <span className="font-medium text-[#3a322b]">
                                {talent.location}
                              </span>
                            )}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-col gap-4 md:w-[270px]">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="col-span-2 rounded-lg border-2 border-[#1d1815] bg-[#1d1815] px-4 py-3 shadow-[3px_3px_0_#ce4a2b]">
                        <p className="font-serif text-[30px] leading-none font-semibold text-[#e6a12b]">
                          $
                          {new Intl.NumberFormat('en-US', {
                            maximumFractionDigits: 0,
                          }).format(Math.round(stats?.totalWinnings || 0))}
                        </p>
                        <p className="font-secondary mt-1.5 text-[10px] font-bold tracking-[0.16em] text-[#c9b9a5] uppercase">
                          Total Earned
                        </p>
                      </div>
                      <StatTile
                        value={String(stats?.participations ?? 0)}
                        label={
                          stats?.participations === 1
                            ? 'Submission'
                            : 'Submissions'
                        }
                      />
                      <StatTile value={String(stats?.wins ?? 0)} label="Won" />
                    </div>
                    <div className="flex gap-3">
                      {user?.id === talent?.id && (
                        <ProfileActionButton
                          icon={<SquarePen className="size-4" />}
                          text="Edit Profile"
                          onClick={handleEditProfileClick}
                          isMD={isMD}
                        />
                      )}
                      <ProfileActionButton
                        icon={<ShareIcon />}
                        text="Share"
                        onClick={onOpen}
                        outline
                        isMD={isMD}
                      />
                    </div>
                  </div>
                </div>

                <ShareProfile
                  username={talent?.username as string}
                  isOpen={isOpen}
                  onClose={onClose}
                  id={talent?.id}
                />

                {!talent?.isAgent && (
                  <>
                    <DossierDivider />
                    <div>
                      <SectionLabel>Skills</SectionLabel>
                      {Array.isArray(talent.skills) &&
                      talent.skills.filter(Boolean).length > 0 ? (
                        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                          {talent.skills.map((skillItem: any, index: number) =>
                            skillItem ? (
                              <div
                                key={index}
                                className="rounded-lg border border-[#1d1815]/20 bg-[#efe8da] p-3.5"
                              >
                                <div className="flex items-center gap-2">
                                  <span className="inline-block size-[6px] bg-[#ce4a2b]" />
                                  <p className="font-secondary text-[11px] font-bold tracking-[0.12em] text-[#6b5e50] uppercase">
                                    {skillItem.skills}
                                  </p>
                                </div>
                                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                                  {(showSubskills[index]
                                    ? skillItem.subskills
                                    : skillItem.subskills.slice(0, 4)
                                  ).map((subskill: string, subIndex: number) => (
                                    <span
                                      key={subIndex}
                                      className="rounded border border-[#1d1815]/15 bg-[#f4eee3] px-2 py-0.5 text-[12px] font-medium text-[#3a322b]"
                                    >
                                      {subskill}
                                    </span>
                                  ))}
                                  {skillItem.subskills.length > 4 && (
                                    <button
                                      aria-label="Toggle subskills"
                                      onClick={() =>
                                        handleToggleSubskills(index)
                                      }
                                      className="rounded border border-[#1d1815] bg-[#1d1815] px-1.5 py-0.5 text-[11px] font-bold text-[#f4eee3] transition hover:bg-[#ce4a2b]"
                                    >
                                      {showSubskills[index]
                                        ? 'Less'
                                        : `+${skillItem.subskills.length - 4}`}
                                    </button>
                                  )}
                                </div>
                              </div>
                            ) : null,
                          )}
                        </div>
                      ) : (
                        <p className="mt-4 text-[13px] text-[#6b5e50]">
                          No skills added yet.
                        </p>
                      )}
                    </div>
                  </>
                )}

                {socialLinks.some(({ link }) => link) && (
                  <>
                    <DossierDivider />
                    <div className="flex items-center gap-5">
                      <SectionLabel>Elsewhere</SectionLabel>
                      <div className="flex items-center gap-5">
                        {socialLinks.map(({ Icon, link }, i) => (
                          <Icon link={link} className="h-5 w-5" key={i} />
                        ))}
                      </div>
                    </div>
                  </>
                )}

                <DossierDivider />
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <SectionLabel>Proof of Work</SectionLabel>
                    {user?.id === talent?.id && (
                      <button
                        onClick={onOpenPow}
                        className="rounded-md border border-[#1d1815] bg-[#f4eee3] px-2 py-1 text-[11px] font-bold tracking-wide text-[#1d1815] uppercase transition hover:bg-[#1d1815] hover:text-[#f4eee3]"
                      >
                        + Add
                      </button>
                    )}
                  </div>
                  <div className="inline-flex items-center gap-1 self-start rounded-lg border-2 border-[#1d1815] bg-[#f4eee3] p-1 sm:self-auto">
                    {(['activity', 'projects'] as const).map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={cn(
                          'font-secondary rounded-md px-3 py-1.5 text-[11px] font-bold tracking-[0.06em] uppercase transition',
                          activeTab === tab
                            ? 'bg-[#1d1815] text-[#f4eee3]'
                            : 'text-[#6b5e50] hover:text-[#1d1815]',
                        )}
                      >
                        {tab === 'activity' ? 'Activity' : 'Projects'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-5" style={{ contentVisibility: 'auto' }}>
                  <FeedLoop
                    feed={feedItems}
                    isFetchingNextPage={isFetchingNextPage}
                    isLoading={isLoading}
                    type="profile"
                  >
                    <ExternalImage
                      className="mx-auto mt-20 w-28"
                      alt={'talent empty'}
                      src={'/bg/talent-empty.svg'}
                    />
                    <p className="font-serif mx-auto mt-5 w-64 text-center text-[16px] text-[#6b5e50] italic">
                      {user?.id === talent?.id
                        ? 'Add some proof of work to build your dossier'
                        : 'Nothing to see here yet …'}
                    </p>
                    {user?.id === talent?.id ? (
                      <button
                        onClick={onOpenPow}
                        className="mx-auto mt-5 block rounded-md border-2 border-[#1d1815] bg-[#1d1815] px-6 py-2 text-[14px] font-semibold text-[#f4eee3] shadow-[3px_3px_0_#1d1815] transition hover:shadow-[1px_1px_0_#1d1815]"
                      >
                        Add Work
                      </button>
                    ) : (
                      <div className="mt-5" />
                    )}

                    <button
                      onClick={() => router.push('/earn')}
                      className="mx-auto mt-3 block rounded-md border-2 border-[#1d1815] bg-[#f4eee3] px-6 py-2 text-[14px] font-semibold text-[#1d1815] transition hover:bg-[#1d1815] hover:text-[#f4eee3]"
                    >
                      Browse Bounties
                    </button>
                  </FeedLoop>
                  <div ref={ref} style={{ height: 10 }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      <AddProject
        isOpen={isOpenPow}
        onClose={onClosePow}
        upload
        onNewPow={addNewPow}
      />
    </Default>
  );
}

const hashStringToInt = (input: string): number => {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
};

interface SubmissionStats {
  participations: bigint;
  wins: bigint;
  listingWinnings: number | null;
}

interface GrantStats {
  grantWinnings: number | null;
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { slug } = context.query;
  try {
    context.res.setHeader(
      'Cache-Control',
      's-maxage=60, stale-while-revalidate=600',
    );

    const username = Array.isArray(slug) ? slug[0] : (slug as string);

    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const [talent, submissionStats, grantStats] = await Promise.all([
      prisma.user.findUnique({
        where: { username },
        select: {
          id: true,
          twitter: true,
          linkedin: true,
          github: true,
          website: true,
          username: true,
          workPrefernce: true,
          firstName: true,
          lastName: true,
          skills: true,
          photo: true,
          currentEmployer: true,
          location: true,
          private: true,
          isPro: true,
          isAgent: true,
        },
      }),
      prisma.$queryRaw<SubmissionStats[]>`
        SELECT
          COUNT(*) as participations,
          SUM(CASE WHEN s.isWinner = 1 AND b.isWinnersAnnounced = 1 THEN 1 ELSE 0 END) as wins,
          COALESCE(SUM(CASE WHEN s.isWinner = 1 AND b.isWinnersAnnounced = 1 THEN s.rewardInUSD ELSE 0 END), 0) as listingWinnings
        FROM Submission s
        LEFT JOIN Bounties b ON s.listingId = b.id
        INNER JOIN User u ON u.username = ${username}
        LEFT JOIN Agent a ON a.userId = u.id
        WHERE s.userId = u.id
          OR (a.id IS NOT NULL AND s.agentId = a.id)
      `,
      prisma.$queryRaw<GrantStats[]>`
        SELECT COALESCE(SUM(ga.approvedAmountInUSD), 0) as grantWinnings
        FROM GrantApplication ga
        INNER JOIN User u ON ga.userId = u.id
        WHERE u.username = ${username}
          AND ga.applicationStatus IN ('Approved', 'Completed')
      `,
    ]);

    if (!talent) {
      return { props: { talent: null } };
    }

    const subStats = submissionStats[0] || {
      participations: 0n,
      wins: 0n,
      listingWinnings: 0,
    };
    const gStats = grantStats[0] || { grantWinnings: 0 };

    const participations = Number(subStats.participations);
    const wins = Number(subStats.wins);
    const listingWinnings = subStats.listingWinnings || 0;
    const grantWinnings = gStats.grantWinnings || 0;
    const totalWinnings = listingWinnings + grantWinnings;

    const stats = { participations, wins, totalWinnings };

    const isOnLeaderboard = totalWinnings > 0;
    const hasRecentActivity = isOnLeaderboard
      ? false
      : await Promise.all([
          prisma.submission.findFirst({
            where: {
              userId: talent.id,
              createdAt: { gte: threeMonthsAgo },
            },
            select: { id: true },
          }),
          prisma.grantApplication.findFirst({
            where: {
              userId: talent.id,
              createdAt: { gte: threeMonthsAgo },
            },
            select: { id: true },
          }),
        ]).then(([submission, grantApp]) => !!submission || !!grantApp);
    const shouldNoIndex = !isOnLeaderboard && !hasRecentActivity;

    const bgIndex = talent?.id ? hashStringToInt(talent.id) % 5 : 0;
    const bgNum = bgIndex + 1;

    if (!talent.isPro) {
      context.res.setHeader(
        'Link',
        `</assets/backgrounds/${bgNum}-mobile.avif>; rel=preload; as=image; type=image/avif; fetchpriority=high; media="(max-width: 639px)", </assets/backgrounds/${bgNum}-desktop.avif>; rel=preload; as=image; type=image/avif; fetchpriority=high; media="(min-width: 640px)"`,
      );
    }

    return {
      props: { talent, stats, bgIndex, shouldNoIndex },
    };
  } catch (error) {
    console.error(error);
    return {
      props: { talent: null },
    };
  }
};

export default TalentProfile;
