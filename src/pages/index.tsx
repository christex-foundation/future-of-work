import type { GetServerSideProps } from 'next';
import Head from 'next/head';

import { JsonLd } from '@/components/shared/JsonLd';
import { ASSET_URL } from '@/constants/ASSET_URL';
import { Meta } from '@/layouts/Meta';
import { prisma } from '@/prisma';
import { generateSuperteamChaptersSchema } from '@/utils/json-ld';

import PrimaryButton from '@/features/stfun/components/common/PrimaryButton';
import Collab from '@/features/stfun/components/sections/Collab';
import FindWork from '@/features/stfun/components/sections/FindWork';
import Hero from '@/features/stfun/components/sections/Hero';
import LoveRespect from '@/features/stfun/components/sections/LoveRespect';
import Production from '@/features/stfun/components/sections/Production';

interface HomePageProps {
  readonly chapters: Array<{
    name: string;
    region: string;
    displayValue: string;
    slug: string;
    code: string;
    country: string[];
    icons?: string;
    link?: string;
  }>;
  readonly chaptersForSchema: Array<{
    name: string;
    displayValue: string;
    slug: string;
    code: string;
    country: string[];
    icons?: string;
    link?: string;
  }>;
}

function parseCountries(rawCountries: unknown): string[] {
  if (!Array.isArray(rawCountries)) return [];
  return rawCountries.filter(
    (country): country is string => typeof country === 'string',
  );
}

export default function Home({ chaptersForSchema }: HomePageProps) {
  return (
    <>
      <Meta
        title="Superteam | The Talent Layer of Solana"
        description="Superteam is a community of the best talent learning, earning and building in crypto."
        canonical="https://superteam.fun/"
        og={`${ASSET_URL}/st/og/og-home.png`}
      />
      <JsonLd data={generateSuperteamChaptersSchema(chaptersForSchema)} />
      <Head>
        <link
          rel="preload"
          as="image"
          href="/hero-dawn.jpg"
          // @ts-expect-error fetchpriority is a valid attribute but not typed
          imagesrcset="/hero-dawn-sm.jpg 860w, /hero-dawn.jpg 1719w"
          imagesizes="100vw"
        />
      </Head>

      <Hero
        eyebrow="A New Day for Work"
        heading={
          <>
            Talent is everywhere.{' '}
            <em className="text-[#CE4A2B] italic">Opportunity</em>{' '}
            shouldn&apos;t be the gap.
          </>
        }
        buttonVisible={false}
      >
        <PrimaryButton
          href="/earn"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-8 bg-white text-center"
        >
          Start Earning
        </PrimaryButton>
      </Hero>

      <FindWork />

      <Production />

      <LoveRespect />

      <Collab />
    </>
  );
}

export const getServerSideProps: GetServerSideProps<
  HomePageProps
> = async () => {
  const chapters = await prisma.chapter.findMany({
    where: { active: true },
    select: {
      name: true,
      region: true,
      displayValue: true,
      slug: true,
      code: true,
      countries: true,
      icons: true,
      link: true,
    },
  });

  const chaptersForSchema = chapters.map((chapter) => ({
    name: chapter.name,
    displayValue: chapter.displayValue || chapter.name,
    slug: chapter.slug,
    code: chapter.code || '',
    country: parseCountries(chapter.countries),
    icons: chapter.icons || undefined,
    link: chapter.link || undefined,
  }));

  const chaptersForGeographies = chapters.map((chapter) => ({
    name: chapter.name,
    region: chapter.region,
    displayValue: chapter.displayValue || chapter.region,
    slug: chapter.slug,
    code: chapter.code || '',
    country: parseCountries(chapter.countries),
    icons: chapter.icons || undefined,
    link: chapter.link || undefined,
  }));

  return {
    props: {
      chapters: chaptersForGeographies,
      chaptersForSchema,
    },
  };
};
