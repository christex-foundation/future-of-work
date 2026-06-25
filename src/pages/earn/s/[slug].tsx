import { InfoIcon, Pencil } from 'lucide-react';
import { type GetServerSideProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';

import FaXTwitter from '@/components/icons/FaXTwitter';
import { JsonLd } from '@/components/shared/JsonLd';
import { LinkTextParser } from '@/components/shared/LinkTextParser';
import { VerifiedBadge } from '@/components/shared/VerifiedBadge';
import { Button } from '@/components/ui/button';
import { LocalImage } from '@/components/ui/local-image';
import { Tooltip } from '@/components/ui/tooltip';
import { type SponsorType } from '@/interface/sponsor';
import { Default } from '@/layouts/Default';
import { Meta } from '@/layouts/Meta';
import { getSponsorStats, type SponsorStats } from '@/pages/api/sponsors/stats';
import { prisma } from '@/prisma';
import { useUser } from '@/store/user';
import { cn } from '@/utils/cn';
import { getURLSanitized } from '@/utils/getURLSanitized';
import {
  generateBreadcrumbListSchema,
  generateSponsorOrganizationSchema,
} from '@/utils/json-ld';
import { getURL } from '@/utils/validUrl';

import { GrantsSection } from '@/features/grants/components/GrantsSection';
import {
  type EmptySectionFilters,
  ListingsSection,
} from '@/features/listings/components/ListingsSection';

interface Props {
  sponsor: SponsorType;
  stats: SponsorStats | null;
}

// Daybreak paper-grain overlay
const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.82' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.4'/%3E%3C/svg%3E\")";

const fmtNum = (n: number) =>
  Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(n || 0);

const SponsorPage = ({ sponsor, stats }: Props) => {
  const logo = sponsor.logo;
  const url = sponsor.url;
  const twitter = sponsor.twitter;
  const isVerified = sponsor.isVerified;
  const sSlug = sponsor.slug;
  const name = sponsor.name;
  const bio = sponsor.bio;

  const ogImage = new URL(`${getURL()}api/dynamic-og/sponsor/`);
  ogImage.searchParams.set('logo', logo || '');
  ogImage.searchParams.set('title', name || '');
  ogImage.searchParams.set('slug', sSlug || '');

  const { user } = useUser();
  const isSponsor = user?.currentSponsorId === sponsor.id;

  const organizationSchema = generateSponsorOrganizationSchema(sponsor);
  const breadcrumbSchema = generateBreadcrumbListSchema([
    { name: 'Home', url: '/' },
    { name: name || 'Sponsor' },
  ]);

  const getTwitterIntentUrl = () => {
    const twitterHandle = twitter ? twitter.split('/').pop() : name;
    const sponsorHandle = `@${twitterHandle}`;
    const message = `Would love to contribute to ${sponsorHandle}\nHow about you add a listing on @SuperteamEarn!`;
    return `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}`;
  };

  const customEmptySection = (filters: EmptySectionFilters) => {
    const getEmptySectionCopy = () => {
      const isStatusAll = filters.activeStatus === 'all';
      const isTabAll = filters.activeTab === 'all';
      const isCategoryAll = filters.activeCategory === 'All';
      const isDefaultFilters = isStatusAll && isTabAll && isCategoryAll;

      if (isDefaultFilters) {
        if (isSponsor) {
          return {
            title: 'Create your next listing',
            message: "You don't have any listings",
            buttonText: 'Create Listing',
            buttonHref: '/earn/dashboard/listings/?open=1',
          };
        }

        return {
          title: 'The sponsor has not posted a listing on Earn yet',
          message: 'you can tweet at them to create some!',
          buttonText: 'Post on X',
          buttonHref: getTwitterIntentUrl(),
        };
      }

      return {
        title: 'Zero results for your current filters',
        message: 'Try resetting the filters',
        buttonText: 'Reset Filters',
        buttonHref: `/earn/s/${sSlug}`,
      };
    };

    const copy = getEmptySectionCopy();

    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="mb-6 flex size-16 items-center justify-center rounded-full bg-[#F2EAD9]">
          <Pencil className="h-7 w-7 text-[#6B7A4F]" />
        </div>
        <h3 className="mb-2 font-serif text-[22px] leading-[1.2] text-[#221A14]">
          {copy.title}
        </h3>
        <p className="mb-6 text-[#5C5147]">{copy.message}</p>
        <Button
          className="rounded-full bg-[#2C3A2E] px-8 text-[#FBF7EF] hover:bg-[#3C4D3D]"
          asChild
        >
          <Link
            href={copy.buttonHref}
            target={copy.buttonHref.startsWith('http') ? '_blank' : undefined}
          >
            {copy.buttonText}
          </Link>
        </Button>
      </div>
    );
  };

  const prettyUrl = url
    ? url.replace(/^https?:\/\//, '').replace(/\/$/, '')
    : '';
  const twitterHandle = twitter ? `@${twitter.split('/').pop()}` : '';
  const completionStr = `${(stats?.completionRate ?? 0).toFixed(0)}%`;

  const dateline = [
    {
      k: 'Total rewarded',
      v: `$${fmtNum(stats?.totalRewardAmount || 0)}`,
      lead: true,
    },
    { k: 'Completion rate', v: completionStr },
    stats?.totalListingsAndGrants != null
      ? { k: 'Listings posted', v: fmtNum(stats.totalListingsAndGrants) }
      : null,
    stats?.totalSubmissionsAndApplications != null
      ? { k: 'Submissions', v: fmtNum(stats.totalSubmissionsAndApplications) }
      : null,
  ].filter(Boolean) as { k: string; v: string; lead?: boolean }[];

  return (
    <Default
      className="bg-[#FBF7EF]"
      hideFooter
      meta={
        <>
          <Meta
            title={`${name} Opportunities | Future of Work`}
            description={`Check out all of ${name}'s latest earning opportunities on a single page.`}
            canonical={`https://superteam.fun/earn/s/${sSlug}/`}
            og={ogImage.toString()}
          />
          <Head>
            <meta property="og:image:width" content="1200" />
            <meta property="og:image:height" content="630" />
            <meta
              property="og:image:alt"
              content={`${name} on Future of Work`}
            />
          </Head>
          <JsonLd data={[organizationSchema, breadcrumbSchema]} />
        </>
      }
    >
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.42] mix-blend-multiply"
        style={{ backgroundImage: GRAIN }}
      />
      {/* MASTHEAD — full-bleed gradient band, content centered */}
      <section className="relative z-[1] overflow-hidden border-b border-[#2C3A2E]/40">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'radial-gradient(120% 100% at 12% 8%,rgba(143,163,126,.95),transparent 52%),radial-gradient(130% 130% at 92% 100%,rgba(28,40,32,.96),transparent 56%),linear-gradient(135deg,#3C4D3D,#1b2820)',
          }}
        />
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              'repeating-linear-gradient(118deg,rgba(255,255,255,.12) 0 1px,transparent 1px 26px)',
          }}
        />
        <div
          className="pointer-events-none absolute -top-[90px] -right-[90px] size-[300px] rounded-full opacity-50 blur-[2px]"
          style={{
            backgroundImage:
              'radial-gradient(circle,rgba(232,180,142,.55),rgba(196,80,46,.4) 55%,transparent 72%)',
          }}
        />
        <div className="relative z-[2] mx-auto max-w-[1200px] px-5 md:px-10">
          <div className="flex min-h-[320px] flex-col justify-between gap-10 py-9 md:min-h-[360px] md:py-12">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <span className="flex items-center gap-3 text-[11.5px] font-semibold tracking-[0.28em] text-[#FBF7EF]/65 uppercase before:h-[1.5px] before:w-6 before:bg-[#8FA37E] before:content-['']">
                Sponsor profile
              </span>
              <span className="text-right text-[11.5px] font-semibold tracking-[0.22em] text-[#FBF7EF]/60 uppercase">
                Hiring in the open
              </span>
            </div>
            <div className="flex flex-wrap items-end gap-5 md:gap-7">
              <div className="grid size-[88px] shrink-0 place-items-center overflow-hidden rounded-[20px] border-[3px] border-[#FBF7EF]/85 bg-gradient-to-br from-[#2C3A2E] to-[#8FA37E] shadow-[0_12px_34px_-22px_rgba(0,0,0,0.5)] md:size-[104px]">
                {logo ? (
                  <LocalImage
                    src={logo}
                    alt={name ?? 'Logo'}
                    className="size-full object-cover"
                  />
                ) : (
                  <span className="font-serif text-5xl text-white">
                    {(name ?? 'M').charAt(0)}
                  </span>
                )}
              </div>
              <div className="min-w-0">
                <h1 className="font-serif text-[clamp(40px,7vw,84px)] leading-[0.92] font-normal tracking-[-0.03em] text-[#FBF7EF]">
                  {name}
                </h1>
                <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-[14px] font-medium text-[#FBF7EF]/85">
                  <span>@{sSlug}</span>
                  {url && (
                    <>
                      <span className="size-1 rounded-full bg-[#FBF7EF]/45" />
                      <Link
                        href={getURLSanitized(url)}
                        target="_blank"
                        className="text-[#FBF7EF] underline-offset-4 hover:underline"
                      >
                        {prettyUrl} ↗
                      </Link>
                    </>
                  )}
                  {twitter && (
                    <>
                      <span className="size-1 rounded-full bg-[#FBF7EF]/45" />
                      <Link
                        href={twitter}
                        target="_blank"
                        className="text-[#FBF7EF] underline-offset-4 hover:underline"
                      >
                        {twitterHandle} ↗
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* centered content */}
      <div className="relative z-[1] mx-auto max-w-[1200px] px-5 pb-24 md:px-10">
        {/* badges */}
        {!!isVerified && (
          <div className="mt-7 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#2C3A2E]/10 px-3 py-[5px] text-[11.5px] font-semibold text-[#2C3A2E]">
              <VerifiedBadge style={{ width: '0.85rem', height: '0.85rem' }} />
              Verified sponsor
            </span>
          </div>
        )}

        {/* standfirst — the bio as an editorial tagline */}
        {bio && (
          <LinkTextParser
            text={bio}
            className="mt-9 max-w-[58ch] font-serif text-[clamp(20px,2.4vw,27px)] leading-[1.4] font-normal break-normal tracking-[-0.01em] text-[#332b23]"
          />
        )}

        {/* DATELINE — trust stats */}
        <section className="mt-10 flex flex-wrap border-y-[1.5px] border-[#221A14]">
          {dateline.map((d, i) => (
            <div
              key={i}
              className="flex min-w-[45%] flex-1 flex-col gap-1 border-r border-[#E6DCC9] px-6 py-[18px] last:border-r-0 sm:min-w-[140px]"
            >
              <span className="flex items-center gap-1.5 text-[10.5px] font-semibold tracking-[0.2em] text-[#5C5147] uppercase">
                {d.k}
                {d.k === 'Completion rate' && (
                  <Tooltip content="The share of eligible bounties where winners were announced.">
                    <InfoIcon className="h-3 w-3 text-[#8FA37E]" />
                  </Tooltip>
                )}
              </span>
              <span
                className={cn(
                  'font-serif text-[clamp(26px,3vw,38px)] leading-none',
                  d.lead ? 'text-[#C4502E]' : 'text-[#2C3A2E]',
                )}
              >
                {d.v}
              </span>
            </div>
          ))}
        </section>

        {/* LISTINGS — editorial index */}
        <div className="mt-12">
          <ListingsSection
            type="sponsor"
            sponsor={sSlug}
            sponsorIndex
            customEmptySection={customEmptySection}
          />
          <GrantsSection hideWhenEmpty type="sponsor" sponsor={sSlug} />
        </div>

        {/* CTA BAND */}
        <section className="relative mt-16 flex flex-wrap items-center justify-between gap-7 overflow-hidden rounded-[22px] bg-[#2C3A2E] px-8 py-11 text-[#FBF7EF] md:px-12">
          <div
            className="pointer-events-none absolute -top-[110px] -right-[110px] size-[320px] rounded-full opacity-[0.32] blur-[2px]"
            style={{
              backgroundImage:
                'radial-gradient(circle,#E8B48E,#C4502E 58%,transparent 72%)',
            }}
          />
          <div className="relative max-w-[42ch]">
            <span className="text-[11px] font-semibold tracking-[0.22em] text-[#8FA37E] uppercase">
              Stay in the loop
            </span>
            <h3 className="mt-3 font-serif text-[clamp(26px,3.4vw,38px)] leading-[1.05] font-normal">
              Follow {name} for{' '}
              <em className="text-[#8FA37E] not-italic">new bounties.</em>
            </h3>
            <p className="mt-3 text-[15px] text-[#FBF7EF]/75">
              Get notified the moment a new brief opens — and get in early.
            </p>
          </div>
          <div className="relative flex flex-wrap gap-3">
            {twitter && (
              <Link
                href={twitter}
                target="_blank"
                className="inline-flex items-center gap-2 rounded-full bg-[#FBF7EF] px-5 py-2.5 text-[14.5px] font-semibold text-[#221A14] transition hover:-translate-y-0.5"
              >
                <FaXTwitter className="h-4 w-4 fill-[#221A14]" /> Follow on X
              </Link>
            )}
            <a
              href="#listings"
              className="inline-flex items-center rounded-full bg-[#8FA37E] px-5 py-2.5 text-[14.5px] font-semibold text-[#2C3A2E] transition hover:bg-[#9fb18e]"
            >
              Work with {name} →
            </a>
          </div>
        </section>
      </div>
    </Default>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { params } = context;

  const slug = params?.slug;

  if (typeof slug !== 'string') {
    return { notFound: true };
  }

  const sponsor = await prisma.sponsors.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      bio: true,
      logo: true,
      url: true,
      twitter: true,
      isVerified: true,
    },
  });

  if (!sponsor) {
    return { notFound: true };
  }

  const stats = await getSponsorStats(sponsor.id);

  return {
    props: {
      sponsor: JSON.parse(JSON.stringify(sponsor)),
      stats: JSON.parse(JSON.stringify(stats)),
    },
  };
};

export default SponsorPage;
