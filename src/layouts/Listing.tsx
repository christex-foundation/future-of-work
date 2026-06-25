import { useQuery } from '@tanstack/react-query';
import { useAtom } from 'jotai';
import { ChevronRight } from 'lucide-react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import posthog from 'posthog-js';
import { useEffect, useMemo, useState } from 'react';

import { ErrorSection } from '@/components/shared/ErrorSection';
import { type User } from '@/interface/user';
import { Default } from '@/layouts/Default';
import { useUser } from '@/store/user';
import { normalizeCanonicalUrl } from '@/utils/canonical';
import { cn } from '@/utils/cn';
import { getURL } from '@/utils/validUrl';

import { RelatedListings } from '@/features/home/components/RelatedListings';
import { Comments } from '@/features/comments/components/Comments';
import { ListingHeader } from '@/features/listings/components/ListingPage/ListingHeader';
import { PrizeSplit } from '@/features/listings/components/ListingPage/PrizeSplit';
import { RightSideBar } from '@/features/listings/components/ListingPage/RightSideBar';
import { SubmissionActionButton } from '@/features/listings/components/Submission/SubmissionActionButton';
import { submissionCountQuery } from '@/features/listings/queries/submission-count';
import { type Listing } from '@/features/listings/types';
import { getListingTypeLabel } from '@/features/listings/utils/status';
import { exclusiveSponsorData } from '@/constants/exclusiveSponsors';
import { bountySnackbarAtom } from '@/features/navbar/components/BountySnackbar';

interface ListingPageProps {
  listing: Listing | null;
  children: React.ReactNode;
  maxW?: '7xl' | '6xl' | '5xl' | '4xl' | '3xl' | '2xl' | 'xl' | 'lg' | 'md';
  isTemplate?: boolean;
}

function WhatWeExpect({ requirements }: { requirements: string }) {
  const items = requirements
    .split(/\r?\n+/)
    .map((s) => s.trim().replace(/^[-•*]\s*/, ''))
    .filter(Boolean);
  const list = items.length > 0 ? items : [requirements.trim()];

  return (
    <section>
      <h2 className="font-serif mb-[18px] text-[30px] leading-[1.1] font-normal tracking-[-0.01em]">
        What we <em className="text-[#C4502E] italic">expect</em>
      </h2>
      <ul className="grid gap-3.5">
        {list.map((item, i) => (
          <li
            key={i}
            className="flex items-start gap-4 rounded-[13px] border border-[#E6DCC9] bg-white px-5 py-[18px]"
          >
            <span
              className={cn(
                'mt-2 h-2.5 w-2.5 shrink-0 rounded-full',
                i % 2 === 0 ? 'bg-[#C4502E]' : 'bg-[#2C3A2E]',
              )}
            />
            <span className="text-[14.5px] leading-relaxed text-[#5C5147]">
              {item}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Breadcrumbs({ listing }: { listing: Listing }) {
  const typeLabel = listing.type === 'project' ? 'Projects' : 'Bounties';
  return (
    <nav className="flex items-center gap-1.5 pt-6 pb-1 text-[13px] text-[#5C5147]">
      <Link href="/earn" className="transition-colors hover:text-[#C4502E]">
        Browse bounties
      </Link>
      <ChevronRight className="h-3.5 w-3.5 opacity-50" />
      <Link
        href={listing.type === 'project' ? '/earn/projects' : '/earn/bounties'}
        className="transition-colors hover:text-[#C4502E]"
      >
        {typeLabel}
      </Link>
      <ChevronRight className="h-3.5 w-3.5 opacity-50" />
      <span className="max-w-[40ch] truncate opacity-60">{listing.title}</span>
    </nav>
  );
}

export function ListingPageLayout({
  listing: initialListing,
  children,
  isTemplate = false,
}: ListingPageProps) {
  const [, setBountySnackbar] = useAtom(bountySnackbarAtom);
  const { user } = useUser();

  const { data: submissionNumber = 0, isLoading: isSubmissionNumberLoading } =
    useQuery(submissionCountQuery(initialListing?.id ?? ''));
  const [commentCount, setCommentCount] = useState(0);
  const iterableSkills = useMemo(
    () => initialListing?.skills?.map((e) => e.skills) ?? [],
    [initialListing?.skills],
  );

  useEffect(() => {
    if (initialListing?.type === 'bounty') {
      posthog.capture('open_bounty');
    } else if (initialListing?.type === 'project') {
      posthog.capture('open_project');
    }
  }, []);

  useEffect(() => {
    if (initialListing) {
      setBountySnackbar({
        isCaution: initialListing.sponsor?.isCaution,
        submissionCount: submissionNumber,
        deadline: initialListing.deadline,
        rewardAmount: initialListing.rewardAmount,
        type: initialListing.type,
        isPublished: initialListing.isPublished,
        status: initialListing.status,
        sponsorId: initialListing.sponsorId,
        slug: initialListing.slug,
      });
    }
  }, [initialListing, submissionNumber, setBountySnackbar]);

  const encodedTitle = encodeURIComponent(initialListing?.title || '');
  const ogImage = new URL(`${getURL()}api/dynamic-og/listing/`);

  ogImage.searchParams.set('title', encodedTitle);
  ogImage.searchParams.set(
    'reward',
    initialListing?.rewardAmount?.toString() || '',
  );
  ogImage.searchParams.set('token', initialListing?.token || '');
  ogImage.searchParams.set('sponsor', initialListing?.sponsor?.name || '');
  ogImage.searchParams.set('logo', initialListing?.sponsor?.logo || '');
  ogImage.searchParams.set('type', initialListing?.type || '');
  ogImage.searchParams.set(
    'compensationType',
    initialListing?.compensationType || '',
  );
  ogImage.searchParams.set(
    'minRewardAsk',
    initialListing?.minRewardAsk?.toString() || '',
  );
  ogImage.searchParams.set(
    'maxRewardAsk',
    initialListing?.maxRewardAsk?.toString() || '',
  );
  ogImage.searchParams.set(
    'isSponsorVerified',
    initialListing?.sponsor?.isVerified?.toString() || 'false',
  );

  const router = useRouter();
  const isSubmissionPage = router.pathname.endsWith('/submission');
  const canonicalUrl = initialListing?.slug
    ? normalizeCanonicalUrl(`${getURL()}earn/listing/${initialListing.slug}/`)
    : undefined;

  const isProject = initialListing?.type === 'project';
  const hasRewards =
    !!initialListing?.rewards &&
    Object.keys(initialListing.rewards).length > 0;
  const showPrizeSplit =
    !isSubmissionPage &&
    !isProject &&
    (hasRewards || !!initialListing?.rewardAmount);

  return (
    <Default
      className="bg-[#FBF7EF]"
      meta={
        <Head>
          <title>{`${
            initialListing?.title || 'Apply'
          } by ${initialListing?.sponsor?.name} | Future of Work`}</title>
          <meta
            name="description"
            content={`${getListingTypeLabel(initialListing?.type ?? 'Listing')} on Future of Work | ${
              initialListing?.sponsor?.name
            } is seeking freelancers and builders ${
              initialListing?.title
                ? `to work on ${initialListing.title}`
                : '| Apply Here'
            }`}
          />
          {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}
          {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}
          <meta
            property="og:title"
            content={`${initialListing?.title || 'Listing'} | Future of Work`}
          />
          <meta property="og:image" content={ogImage.toString()} />
          <meta
            name="twitter:title"
            content={`${initialListing?.title || 'Listing'} | Future of Work`}
          />
          <meta name="twitter:image" content={ogImage.toString()} />
          <meta name="twitter:card" content="summary_large_image" />
          <meta property="og:image:width" content="1200" />
          <meta property="og:image:height" content="630" />
          <meta
            property="og:image:alt"
            content={`${initialListing?.title || 'Listing'} - ${initialListing?.type === 'bounty' ? 'Bounty' : 'Project'} by ${initialListing?.sponsor?.name || 'Sponsor'} on Future of Work`}
          />
          <meta property="og:type" content="website" />
          <meta charSet="UTF-8" key="charset" />
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1, maximum-scale=1"
            key="viewport"
          />
        </Head>
      }
    >
      <div className="bg-[#FBF7EF] text-[#221A14]">
        {initialListing === null && <ErrorSection />}
        {initialListing !== null && !initialListing?.id && (
          <ErrorSection message="Sorry! The bounty you are looking for is not available." />
        )}
        {initialListing !== null && !!initialListing?.id && (
          <div className="mx-auto w-full max-w-[1200px] px-5 lg:px-10">
            {!isSubmissionPage && <Breadcrumbs listing={initialListing} />}

            <ListingHeader
              isTemplate={isTemplate}
              commentCount={commentCount}
              listing={initialListing}
              submissionNumber={submissionNumber}
              isSubmissionNumberLoading={isSubmissionNumberLoading}
            />

            <div
              className={cn(
                'grid min-h-screen grid-cols-1 gap-10 pt-10 lg:items-start lg:gap-14',
                !isSubmissionPage && 'lg:grid-cols-[1fr_360px]',
              )}
            >
              {/* ARTICLE */}
              <article className="flex min-w-0 flex-col gap-12 pb-12">
                <section>
                  {!isSubmissionPage && (
                    <h2 className="font-serif mb-[18px] text-[30px] leading-[1.1] font-normal tracking-[-0.01em]">
                      The <em className="text-[#C4502E] italic">brief</em>
                    </h2>
                  )}
                  {children}
                </section>

                {showPrizeSplit && (
                  <PrizeSplit
                    rewards={initialListing.rewards}
                    rewardAmount={initialListing.rewardAmount}
                    token={initialListing.token || 'USDC'}
                    maxBonusSpots={initialListing.maxBonusSpots ?? 0}
                  />
                )}

                {!isSubmissionPage && !!initialListing.requirements && (
                  <WhatWeExpect requirements={initialListing.requirements} />
                )}
              </article>

              {/* ASIDE */}
              {!isSubmissionPage && (
                <aside className="flex w-full flex-col gap-5 lg:sticky lg:top-24">
                  <RightSideBar
                    isTemplate={isTemplate}
                    listing={initialListing}
                    skills={iterableSkills}
                    submissionNumber={submissionNumber}
                    isSubmissionNumberLoading={isSubmissionNumberLoading}
                    commentCount={commentCount}
                  />
                </aside>
              )}
            </div>

            <div
              id="comments"
              className="mt-4 rounded-2xl border border-[#E6DCC9] bg-white p-5 shadow-[0_12px_34px_-22px_rgba(54,38,22,0.45)] md:p-7"
            >
              <Comments
                isTemplate={isTemplate}
                isAnnounced={initialListing?.isWinnersAnnounced ?? false}
                listingSlug={initialListing?.slug ?? ''}
                listingType={initialListing?.type ?? ''}
                poc={initialListing?.poc as User}
                sponsorId={initialListing?.sponsorId}
                isVerified={initialListing?.sponsor?.isVerified}
                refId={initialListing?.id ?? ''}
                refType="BOUNTY"
                count={commentCount}
                setCount={setCommentCount}
                isDisabled={
                  !initialListing.isPublished &&
                  initialListing.status === 'OPEN'
                }
                isListingAndUserPro={
                  (initialListing?.isPro ?? false) && (user?.isPro ?? false)
                }
              />
            </div>

            {!isSubmissionPage && initialListing.id && (
              <section className="border-t border-[#E6DCC9] py-16">
                <RelatedListings
                  isHackathon={!!initialListing.hackathonId}
                  listingId={initialListing.id}
                  excludeIds={initialListing.id ? [initialListing.id] : undefined}
                  exclusiveSponsorId={
                    Object.values(exclusiveSponsorData).some(
                      (sponsor) => sponsor.title === initialListing?.sponsor?.name,
                    )
                      ? initialListing?.sponsorId
                      : undefined
                  }
                >
                  <h3 className="font-serif mb-[26px] text-[32px] leading-[1.1] font-normal tracking-[-0.01em]">
                    {initialListing.Hackathon
                      ? 'Related tracks open now'
                      : 'Similar bounties open now'}
                  </h3>
                </RelatedListings>
              </section>
            )}

            <div className="sticky bottom-14 z-40 mb-12 w-full border-t border-[#E6DCC9] bg-[#FBF7EF] py-2 lg:hidden">
              <SubmissionActionButton
                listing={initialListing}
                isTemplate={isTemplate}
              />
            </div>
          </div>
        )}
      </div>
    </Default>
  );
}
