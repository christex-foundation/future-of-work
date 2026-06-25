import { SquarePen } from 'lucide-react';
import type { GetServerSideProps } from 'next';
import dynamic from 'next/dynamic';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  type JSX,
  memo,
  type ReactNode,
  useEffect,
  useMemo,
  useState,
} from 'react';

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

interface WorkItem {
  kind: 'submission' | 'pow';
  id: string;
  title: string;
  createdAt: string;
  // submission
  slug?: string;
  type?: string;
  sponsorName?: string | null;
  rewardInUSD?: number;
  isWinner?: boolean;
  winnerPosition?: number | null;
  isWinnersAnnounced?: boolean;
  // pow
  link?: string;
}

interface RankRow {
  rank: number;
  name: string;
  username: string;
  amount: number;
  isMe: boolean;
}

interface TalentProps {
  talent: User;
  stats: {
    wins: number;
    participations: number;
    totalWinnings: number;
  };
  work: WorkItem[];
  monthly: number[];
  ranking: RankRow[] | null;
  shouldNoIndex: boolean;
}

const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.82' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.4'/%3E%3C/svg%3E\")";

const THUMBS = [
  'radial-gradient(120% 90% at 20% 10%,rgba(143,163,126,.92),transparent 60%),linear-gradient(135deg,#C4502E,#7a2c18)',
  'radial-gradient(120% 90% at 80% 10%,rgba(44,58,46,.92),transparent 60%),linear-gradient(135deg,#C4502E,#8c3520)',
  'radial-gradient(120% 90% at 50% 10%,rgba(143,163,126,.85),transparent 60%),linear-gradient(135deg,#2C3A2E,#1c2820)',
];

const ordinal = (n: number) => {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] || s[v] || s[0]}`;
};

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
    ? 'border border-[#E6DCC9] bg-transparent text-[#221A14] hover:bg-[#F2EAD9] hover:border-[#d9ccb2]'
    : 'border border-transparent bg-[#C4502E] text-white hover:bg-[#A83F22] hover:-translate-y-px hover:shadow-[0_12px_34px_-22px_rgba(54,38,22,0.45)]';

  if (isMD) {
    return (
      <AuthWrapper showCompleteProfileModal allowSponsor>
        <button
          onClick={onClick}
          className={cn(
            'ph-no-capture inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-full px-5 text-[14px] font-semibold transition-all duration-200',
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
          'inline-flex size-10 items-center justify-center rounded-full transition-all duration-200',
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
    <div className="border-r border-b border-[#E6DCC9] px-5 py-4 last:border-r-0 [&:nth-child(2n)]:border-r-0">
      <p className="font-serif text-[28px] leading-none text-[#221A14]">
        {value}
      </p>
      <p className="mt-1.5 text-[12px] text-[#5C5147]">{label}</p>
    </div>
  );
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="inline-flex items-center gap-2.5 text-[12px] font-semibold tracking-[0.2em] text-[#C4502E] uppercase before:h-px before:w-[18px] before:bg-[#C4502E] before:content-['']">
      {children}
    </p>
  );
}

function Sparkline({ data }: { data: number[] }) {
  const max = Math.max(...data, 1);
  return (
    <div className="flex h-[62px] items-end gap-[5px] px-5 pt-4.5 pb-2">
      {data.map((v, i) => {
        const h = Math.max(6, Math.round((v / max) * 100));
        const isLast = i === data.length - 1;
        return (
          <div
            key={i}
            className="flex-1 rounded-t-[4px]"
            style={{
              height: `${h}%`,
              background: isLast
                ? 'linear-gradient(180deg,#C4502E,#A83F22)'
                : 'linear-gradient(180deg,#8FA37E,#6B7A4F)',
            }}
          />
        );
      })}
    </div>
  );
}

function WorkRow({ item, index }: { item: WorkItem; index: number }) {
  const thumb = THUMBS[index % THUMBS.length];

  if (item.kind === 'pow') {
    return (
      <a
        href={item.link}
        target="_blank"
        rel="noopener noreferrer"
        className="group grid grid-cols-[auto_1fr_auto] items-center gap-5 border-b border-[#E6DCC9] px-1.5 py-5 transition-all hover:rounded-xl hover:bg-white hover:px-4 hover:shadow-[0_12px_34px_-22px_rgba(54,38,22,0.45)]"
      >
        <div
          className="h-[58px] w-[78px] shrink-0 rounded-[10px]"
          style={{ backgroundImage: thumb }}
        />
        <div className="min-w-0">
          <p className="text-[11px] font-semibold tracking-[0.14em] text-[#5C5147] uppercase">
            Project
          </p>
          <h3 className="font-serif mt-1 truncate text-[20px] leading-tight text-[#221A14]">
            {item.title}
          </h3>
          <p className="mt-0.5 text-[13.5px] text-[#5C5147]">Self-published</p>
        </div>
        <span className="text-[13px] font-semibold whitespace-nowrap text-[#C4502E] transition-transform group-hover:translate-x-0.5">
          View →
        </span>
      </a>
    );
  }

  const won = item.isWinner && item.isWinnersAnnounced;
  const resultText = won
    ? item.winnerPosition
      ? `★ ${ordinal(item.winnerPosition)} place`
      : '★ Won'
    : '● Submitted';

  return (
    <Link
      href={`/earn/listing/${item.slug}`}
      className="group grid grid-cols-[auto_1fr_auto] items-center gap-5 border-b border-[#E6DCC9] px-1.5 py-5 transition-all hover:rounded-xl hover:bg-white hover:px-4 hover:shadow-[0_12px_34px_-22px_rgba(54,38,22,0.45)]"
    >
      <div
        className="h-[58px] w-[78px] shrink-0 rounded-[10px]"
        style={{ backgroundImage: thumb }}
      />
      <div className="min-w-0">
        <p className="text-[11px] font-semibold tracking-[0.14em] text-[#5C5147] uppercase">
          {item.type} · {won ? 'Winner' : 'Submitted'}
        </p>
        <h3 className="font-serif mt-1 truncate text-[20px] leading-tight text-[#221A14]">
          {item.title}
        </h3>
        {item.sponsorName && (
          <p className="mt-0.5 text-[13.5px] text-[#5C5147]">
            {item.sponsorName}
          </p>
        )}
      </div>
      <div className="text-right whitespace-nowrap">
        <span
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full px-3 py-[5px] text-[12px] font-semibold',
            won
              ? 'bg-[rgba(196,80,46,0.11)] text-[#C4502E]'
              : 'bg-[rgba(44,58,46,0.09)] text-[#2C3A2E]',
          )}
        >
          {resultText}
        </span>
        {won && (item.rewardInUSD ?? 0) > 0 && (
          <span className="font-serif mt-2 block text-[22px] text-[#C4502E]">
            $
            {new Intl.NumberFormat('en-US', {
              maximumFractionDigits: 0,
            }).format(Math.round(item.rewardInUSD || 0))}
          </span>
        )}
      </div>
    </Link>
  );
}

function TalentProfile({
  talent,
  stats,
  work,
  monthly,
  ranking,
  shouldNoIndex,
}: TalentProps) {
  const [showSubskills, setShowSubskills] = useState<Record<number, boolean>>(
    {},
  );

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
    router.replace(router.asPath, undefined, { scroll: false });
  };

  const isMD = useMediaQuery('(min-width: 768px)');

  const isOwner = user?.id === talent?.id;
  const workPreferenceText = getWorkPreferenceText(talent?.workPrefernce);
  const earnedStr = new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 0,
  }).format(Math.round(stats?.totalWinnings || 0));
  const winRate = stats?.participations
    ? Math.round((stats.wins / stats.participations) * 100)
    : 0;
  const hasEarnings = monthly.some((v) => v > 0);

  const introText = (() => {
    const name = talent?.firstName || 'This builder';
    if ((stats?.wins ?? 0) > 0) {
      return `On Future of Work, ${name} has turned ${stats.participations} ${
        stats.participations === 1 ? 'submission' : 'submissions'
      } into ${stats.wins} ${
        stats.wins === 1 ? 'win' : 'wins'
      } and $${earnedStr} earned — proof that great work, published in the open, adds up.`;
    }
    if ((stats?.participations ?? 0) > 0) {
      return `${name} is building in the open on Future of Work — ${
        stats.participations
      } ${
        stats.participations === 1 ? 'submission' : 'submissions'
      } in, with more on the way.`;
    }
    return `${name} is just getting started on Future of Work — early work, published in the open for the world to see.`;
  })();

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
      className="bg-[#FBF7EF]"
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
            {(talent?.private || shouldNoIndex) && (
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
        <div className="relative w-full grow bg-[#FBF7EF] text-[#221A14]">
          {/* paper-grain warmth */}
          <div
            aria-hidden
            className="pointer-events-none fixed inset-0 z-[1] opacity-[0.42] mix-blend-multiply"
            style={{ backgroundImage: GRAIN }}
          />

          {/* COVER — recolored art-plate */}
          <div className="relative h-[180px] overflow-hidden border-b border-[#E6DCC9] md:h-[210px]">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage:
                  'radial-gradient(120% 90% at 14% 14%,rgba(143,163,126,.92),transparent 54%),radial-gradient(120% 120% at 90% 92%,rgba(44,58,46,.92),transparent 54%),linear-gradient(125deg,#C4502E,#7a2c18)',
              }}
            />
            <div
              className="absolute inset-0 opacity-[0.42]"
              style={{
                backgroundImage:
                  'repeating-linear-gradient(115deg,rgba(255,255,255,.12) 0 1px,transparent 1px 24px)',
              }}
            />
          </div>

          <div className="relative z-[2] mx-auto max-w-[1200px] px-4 md:px-10">
            {/* PROFILE HEADER — avatar straddles cover, text sits on paper */}
            <div className="border-b border-[#E6DCC9] pb-7">
              <div className="-mt-[58px] md:-mt-[74px]">
                <div className="inline-flex size-[104px] shrink-0 overflow-hidden rounded-[22px] border-[5px] border-[#FBF7EF] bg-[#FBF7EF] shadow-[0_12px_34px_-22px_rgba(54,38,22,0.45)] md:size-[130px]">
                  <EarnAvatar
                    className="size-full rounded-[17px]"
                    id={talent?.id}
                    avatar={talent?.photo}
                    imgLoading="eager"
                    imgFetchPriority="high"
                  />
                </div>
              </div>

              <div className="mt-4 flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
                <div className="min-w-0">
                  {(talent?.isAgent ||
                    talent?.isPro ||
                    (stats?.wins ?? 0) > 0 ||
                    !!ranking) && (
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      {talent?.isAgent ? (
                        <AgentBadge
                          containerClassName="bg-[rgba(44,58,46,0.09)] px-3 py-[5px] gap-1.5 rounded-full"
                          iconClassName="size-2.5 text-[#2C3A2E]"
                          textClassName="text-[11.5px] font-semibold tracking-wide text-[#2C3A2E]"
                        />
                      ) : (
                        talent?.isPro && (
                          <ProBadge
                            containerClassName="bg-[rgba(196,80,46,0.11)] px-3 py-[5px] gap-1.5 rounded-full"
                            iconClassName="size-2.5 text-[#C4502E]"
                            textClassName="text-[11.5px] font-semibold tracking-wide text-[#C4502E]"
                          />
                        )
                      )}
                      {ranking?.find((r) => r.isMe) && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-[rgba(143,163,126,0.2)] px-3 py-[5px] text-[11.5px] font-semibold tracking-wide text-[#6B7A4F]">
                          ★ Rank #{ranking.find((r) => r.isMe)?.rank}
                        </span>
                      )}
                      {(stats?.wins ?? 0) > 0 && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-[rgba(196,80,46,0.11)] px-3 py-[5px] text-[11.5px] font-semibold tracking-wide text-[#C4502E]">
                          {stats.wins}× winner
                        </span>
                      )}
                    </div>
                  )}
                  <h1 className="font-serif text-[clamp(30px,4.4vw,54px)] leading-none tracking-[-0.02em] text-[#221A14]">
                    {talent?.firstName} {talent?.lastName}
                  </h1>
                  <p className="mt-2 text-[15px] text-[#5C5147]">
                    @
                    {isMD
                      ? talent?.username
                      : talent?.username?.length &&
                          talent?.username.length > 24
                        ? `${talent?.username.slice(0, 24)}...`
                        : talent?.username}
                    {talent?.location && (
                      <>
                        {' · '}
                        <span className="font-medium text-[#2C3A2E]">
                          {talent.location}
                        </span>
                      </>
                    )}
                  </p>
                  {workPreferenceText && (
                    <p className="font-serif mt-2 text-[16px] leading-snug text-[#C4502E] italic">
                      Looking for {workPreferenceText}
                    </p>
                  )}
                  {talent?.currentEmployer && (
                    <p className="mt-1.5 text-[14px] text-[#5C5147]">
                      <span className="text-[#9a8b78]">@ </span>
                      <span className="font-medium text-[#221A14]">
                        {talent.currentEmployer}
                      </span>
                    </p>
                  )}
                </div>

                <div className="flex w-full gap-3 md:w-auto">
                  {isOwner && (
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

            {/* TWO-COLUMN GRID */}
            <div className="grid grid-cols-1 gap-8 py-10 md:grid-cols-[340px_1fr] md:gap-12">
              {/* LEFT RAIL */}
              <aside className="flex flex-col gap-5 md:sticky md:top-[94px] md:self-start">
                {/* Statbox */}
                <div className="overflow-hidden rounded-2xl border border-[#E6DCC9] bg-white shadow-[0_12px_34px_-22px_rgba(54,38,22,0.45)]">
                  <div className="border-b border-[#E6DCC9] bg-gradient-to-b from-white to-[#fdf3ec] px-6 py-7 text-center">
                    <p className="text-[12px] font-semibold tracking-[0.14em] text-[#5C5147] uppercase">
                      Total earned
                    </p>
                    <p className="font-serif mt-2 text-[48px] leading-none text-[#C4502E]">
                      ${earnedStr}
                    </p>
                  </div>
                  <div className="grid grid-cols-2">
                    <StatTile
                      value={String(stats?.participations ?? 0)}
                      label={
                        stats?.participations === 1
                          ? 'Submission'
                          : 'Submissions'
                      }
                    />
                    <StatTile value={String(stats?.wins ?? 0)} label="Won" />
                    <StatTile value={`${winRate}%`} label="Win rate" />
                    {ranking?.find((r) => r.isMe) && (
                      <StatTile
                        value={`#${ranking.find((r) => r.isMe)?.rank}`}
                        label="Global rank"
                      />
                    )}
                  </div>
                </div>

                {/* Skills */}
                {!talent?.isAgent && (
                  <div className="overflow-hidden rounded-2xl border border-[#E6DCC9] bg-white">
                    <div className="border-b border-[#E6DCC9] px-5 py-4">
                      <span className="font-serif text-[18px] text-[#221A14]">
                        Skills
                      </span>
                    </div>
                    {Array.isArray(talent.skills) &&
                    talent.skills.filter(Boolean).length > 0 ? (
                      <div className="flex flex-col gap-4 px-5 py-4">
                        {talent.skills.map((skillItem: any, index: number) =>
                          skillItem ? (
                            <div key={index}>
                              <div className="flex items-center gap-2">
                                <span className="inline-block size-[6px] rounded-full bg-[#C4502E]" />
                                <p className="text-[11px] font-semibold tracking-[0.12em] text-[#5C5147] uppercase">
                                  {skillItem.skills}
                                </p>
                              </div>
                              <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                                {(showSubskills[index]
                                  ? skillItem.subskills
                                  : skillItem.subskills.slice(0, 4)
                                ).map((subskill: string, subIndex: number) => (
                                  <span
                                    key={subIndex}
                                    className="rounded-full border border-[#E6DCC9] bg-[#F2EAD9] px-2.5 py-0.5 text-[12px] font-medium text-[#221A14]"
                                  >
                                    {subskill}
                                  </span>
                                ))}
                                {skillItem.subskills.length > 4 && (
                                  <button
                                    aria-label="Toggle subskills"
                                    onClick={() => handleToggleSubskills(index)}
                                    className="rounded-full border border-[#E6DCC9] bg-white px-2 py-0.5 text-[11px] font-semibold text-[#C4502E] transition hover:bg-[#F2EAD9]"
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
                      <p className="px-5 py-4 text-[13px] text-[#5C5147]">
                        No skills added yet.
                      </p>
                    )}
                    {workPreferenceText && (
                      <div className="border-t border-[#E6DCC9] px-5 py-3.5 text-[14px] text-[#5C5147]">
                        <span className="font-semibold text-[#2C3A2E]">
                          Available
                        </span>{' '}
                        · {workPreferenceText}
                      </div>
                    )}
                  </div>
                )}

                {/* Earnings sparkline */}
                {hasEarnings && (
                  <div className="overflow-hidden rounded-2xl border border-[#E6DCC9] bg-white">
                    <div className="border-b border-[#E6DCC9] px-5 py-4 text-[12px] font-semibold tracking-[0.14em] text-[#5C5147] uppercase">
                      Earnings over time
                    </div>
                    <Sparkline data={monthly} />
                    <div className="px-5 pb-4 text-[13px] text-[#5C5147]">
                      <span className="font-serif text-[16px] text-[#221A14]">
                        ${earnedStr}
                      </span>{' '}
                      earned to date
                    </div>
                  </div>
                )}

                {/* Leaderboard — where they sit */}
                {ranking && ranking.length > 0 && (
                  <div className="overflow-hidden rounded-2xl border border-[#E6DCC9] bg-white">
                    <div className="border-b border-[#E6DCC9] px-5 py-4 text-[12px] font-semibold tracking-[0.14em] text-[#5C5147] uppercase">
                      Top earners · where {talent?.firstName} sits
                    </div>
                    {ranking.map((r) => (
                      <div
                        key={r.username}
                        className={cn(
                          'flex items-center gap-3 border-b border-[#E6DCC9] px-5 py-2.5 last:border-b-0',
                          r.isMe && 'bg-[#fdf3ec] font-semibold',
                        )}
                      >
                        <span
                          className={cn(
                            'font-serif grid size-[26px] shrink-0 place-items-center rounded-full text-[13px]',
                            r.isMe
                              ? 'bg-[#C4502E] text-white'
                              : 'bg-[#F2EAD9] text-[#2C3A2E]',
                          )}
                        >
                          {r.rank}
                        </span>
                        <span className="flex-1 truncate text-[14px] text-[#221A14]">
                          {r.name}
                        </span>
                        <span className="font-serif text-[14px] text-[#C4502E]">
                          $
                          {new Intl.NumberFormat('en-US', {
                            maximumFractionDigits: 0,
                          }).format(r.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Elsewhere */}
                {socialLinks.some(({ link }) => link) && (
                  <div className="overflow-hidden rounded-2xl border border-[#E6DCC9] bg-white">
                    <div className="border-b border-[#E6DCC9] px-5 py-4">
                      <span className="font-serif text-[18px] text-[#221A14]">
                        Elsewhere
                      </span>
                    </div>
                    <div className="flex items-center gap-5 px-5 py-4">
                      {socialLinks.map(({ Icon, link }, i) => (
                        <Icon link={link} className="h-5 w-5" key={i} />
                      ))}
                    </div>
                  </div>
                )}
              </aside>

              {/* MAIN COLUMN */}
              <main className="min-w-0">
                {/* Editorial intro */}
                <p className="font-serif mb-12 text-[22px] leading-[1.45] text-[#332b23] [&::first-letter]:float-left [&::first-letter]:pt-1.5 [&::first-letter]:pr-3 [&::first-letter]:font-medium [&::first-letter]:text-[58px] [&::first-letter]:leading-[0.78] [&::first-letter]:text-[#C4502E]">
                  {introText}
                </p>

                {/* Recent work */}
                <div className="mb-5 flex flex-col gap-3">
                  <SectionLabel>Recent work</SectionLabel>
                  <div className="flex items-center gap-3">
                    <h2 className="font-serif text-[30px] leading-none tracking-[-0.01em] text-[#221A14]">
                      Won bounties &amp; live submissions.
                    </h2>
                    {isOwner && (
                      <button
                        onClick={onOpenPow}
                        className="rounded-full border border-[#E6DCC9] bg-white px-3 py-1 text-[12px] font-semibold text-[#C4502E] transition hover:bg-[#F2EAD9]"
                      >
                        + Add
                      </button>
                    )}
                  </div>
                </div>

                {work.length > 0 ? (
                  <>
                    <div className="border-t border-[#E6DCC9]">
                      {work.map((item, i) => (
                        <WorkRow key={item.id} item={item} index={i} />
                      ))}
                    </div>
                    <Link
                      href="/earn/feed"
                      className="mt-6 inline-flex text-[14px] font-semibold text-[#C4502E] hover:text-[#A83F22]"
                    >
                      View full activity →
                    </Link>
                  </>
                ) : (
                  <div className="rounded-2xl border border-[#E6DCC9] bg-white px-6 py-14 text-center">
                    <ExternalImage
                      className="mx-auto w-28"
                      alt={'talent empty'}
                      src={'/bg/talent-empty.svg'}
                    />
                    <p className="font-serif mx-auto mt-5 w-64 text-[16px] text-[#5C5147] italic">
                      {isOwner
                        ? 'Add some proof of work to build your profile'
                        : 'Nothing to see here yet …'}
                    </p>
                    <div className="mt-6 flex flex-wrap justify-center gap-3">
                      {isOwner && (
                        <button
                          onClick={onOpenPow}
                          className="rounded-full border border-transparent bg-[#C4502E] px-6 py-2.5 text-[14px] font-semibold text-white transition-all duration-200 hover:-translate-y-px hover:bg-[#A83F22] hover:shadow-[0_12px_34px_-22px_rgba(54,38,22,0.45)]"
                        >
                          Add Work
                        </button>
                      )}
                      <button
                        onClick={() => router.push('/earn')}
                        className="rounded-full border border-[#E6DCC9] bg-white px-6 py-2.5 text-[14px] font-semibold text-[#221A14] transition hover:border-[#d9ccb2] hover:bg-[#F2EAD9]"
                      >
                        Browse Bounties
                      </button>
                    </div>
                  </div>
                )}

                {/* Hire band */}
                <div className="relative mt-12 overflow-hidden rounded-2xl bg-[#2C3A2E] px-8 py-9 md:px-10">
                  <div
                    className="pointer-events-none absolute -top-[100px] -right-[100px] size-[300px] rounded-full opacity-[0.32] blur-[2px]"
                    style={{
                      backgroundImage:
                        'radial-gradient(circle,#E8B48E,#C4502E 58%,transparent 72%)',
                    }}
                  />
                  <div className="relative flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
                    <div>
                      <h3 className="font-serif text-[28px] leading-tight text-[#FBF7EF] md:text-[32px]">
                        {isOwner ? (
                          <>
                            Share your profile to get{' '}
                            <em className="text-[#8FA37E] not-italic">hired.</em>
                          </>
                        ) : (
                          <>
                            Want {talent?.firstName} on your{' '}
                            <em className="text-[#8FA37E] not-italic">
                              next bounty?
                            </em>
                          </>
                        )}
                      </h3>
                      <p className="mt-2 max-w-[38ch] text-[14.5px] text-[rgba(251,247,239,0.72)]">
                        {isOwner
                          ? 'The more eyes on your work, the more bounties come your way.'
                          : workPreferenceText
                            ? `Available for ${workPreferenceText.toLowerCase()}.`
                            : 'Building in the open on Future of Work.'}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-3">
                      {isOwner ? (
                        <>
                          <button
                            onClick={onOpen}
                            className="inline-flex h-10 items-center justify-center rounded-full bg-[#C4502E] px-6 text-[14px] font-semibold whitespace-nowrap text-white transition-all duration-200 hover:-translate-y-px hover:bg-[#A83F22]"
                          >
                            Share profile →
                          </button>
                          <button
                            onClick={() => router.push('/earn')}
                            className="inline-flex h-10 items-center justify-center rounded-full bg-[#FBF7EF] px-6 text-[14px] font-semibold whitespace-nowrap text-[#221A14] transition-all duration-200 hover:-translate-y-px"
                          >
                            Browse bounties
                          </button>
                        </>
                      ) : (
                        <>
                          {socialLinks.find(({ link }) => link)?.link && (
                            <a
                              href={socialLinks.find(({ link }) => link)!.link!}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex h-10 items-center justify-center rounded-full bg-[#C4502E] px-6 text-[14px] font-semibold whitespace-nowrap text-white transition-all duration-200 hover:-translate-y-px hover:bg-[#A83F22]"
                            >
                              Message →
                            </a>
                          )}
                          <button
                            onClick={onOpen}
                            className="inline-flex h-10 items-center justify-center rounded-full bg-[#FBF7EF] px-6 text-[14px] font-semibold whitespace-nowrap text-[#221A14] transition-all duration-200 hover:-translate-y-px"
                          >
                            Share
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </main>
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

    // Recent work — real submissions + proof-of-work, merged
    const [subs, pows, monthlyRaw, myRank] = await Promise.all([
      prisma.submission.findMany({
        where: {
          userId: talent.id,
          isActive: true,
          isArchived: false,
          listing: { isPublished: true },
        },
        orderBy: { createdAt: 'desc' },
        take: 6,
        select: {
          id: true,
          rewardInUSD: true,
          isWinner: true,
          winnerPosition: true,
          createdAt: true,
          listing: {
            select: {
              title: true,
              slug: true,
              type: true,
              isWinnersAnnounced: true,
              sponsor: { select: { name: true } },
            },
          },
        },
      }),
      prisma.poW.findMany({
        where: { userId: talent.id },
        orderBy: { createdAt: 'desc' },
        take: 6,
        select: { id: true, title: true, link: true, createdAt: true },
      }),
      prisma.$queryRaw<{ ym: string; amt: number }[]>`
        SELECT DATE_FORMAT(s.createdAt, '%Y-%m') as ym,
               COALESCE(SUM(s.rewardInUSD), 0) as amt
        FROM Submission s
        INNER JOIN Bounties b ON s.listingId = b.id
        WHERE s.userId = ${talent.id}
          AND s.isWinner = 1 AND b.isWinnersAnnounced = 1
        GROUP BY ym
        ORDER BY ym ASC
      `,
      prisma.talentRankings.findFirst({
        where: {
          userId: talent.id,
          skill: 'ALL',
          timeframe: 'ALL_TIME',
        },
        select: { rank: true },
      }),
    ]);

    const work: WorkItem[] = [
      ...subs.map((s) => ({
        kind: 'submission' as const,
        id: s.id,
        title: s.listing?.title ?? 'Untitled',
        slug: s.listing?.slug,
        type: s.listing?.type,
        sponsorName: s.listing?.sponsor?.name ?? null,
        rewardInUSD: Number(s.rewardInUSD) || 0,
        isWinner: !!s.isWinner,
        winnerPosition: s.winnerPosition ?? null,
        isWinnersAnnounced: !!s.listing?.isWinnersAnnounced,
        createdAt: s.createdAt.toISOString(),
      })),
      ...pows.map((p) => ({
        kind: 'pow' as const,
        id: p.id,
        title: p.title,
        link: p.link,
        createdAt: p.createdAt.toISOString(),
      })),
    ]
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
      .slice(0, 6);

    // Earnings over the last 8 months
    const months: string[] = [];
    const cursor = new Date();
    cursor.setDate(1);
    for (let i = 7; i >= 0; i--) {
      const d = new Date(cursor.getFullYear(), cursor.getMonth() - i, 1);
      months.push(
        `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      );
    }
    const monthlyMap = new Map(
      monthlyRaw.map((r) => [r.ym, Number(r.amt) || 0]),
    );
    const monthly = months.map((m) => monthlyMap.get(m) || 0);

    // Leaderboard neighbours from TalentRankings (populated in prod)
    let ranking: RankRow[] | null = null;
    if (myRank) {
      const neighbours = await prisma.talentRankings.findMany({
        where: {
          skill: 'ALL',
          timeframe: 'ALL_TIME',
          rank: { gte: myRank.rank - 2, lte: myRank.rank + 2 },
        },
        orderBy: { rank: 'asc' },
        select: {
          rank: true,
          totalEarnedInUSD: true,
          user: {
            select: { firstName: true, lastName: true, username: true },
          },
        },
      });
      ranking = neighbours.map((n) => ({
        rank: n.rank,
        amount: Number(n.totalEarnedInUSD) || 0,
        name:
          `${n.user?.firstName || ''} ${n.user?.lastName || ''}`.trim() ||
          (n.user?.username ?? ''),
        username: n.user?.username ?? String(n.rank),
        isMe: n.rank === myRank.rank,
      }));
    }

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
      props: { talent, stats, work, monthly, ranking, shouldNoIndex },
    };
  } catch (error) {
    console.error(error);
    return {
      props: { talent: null },
    };
  }
};

export default TalentProfile;
