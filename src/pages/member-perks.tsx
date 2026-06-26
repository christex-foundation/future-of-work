import axios from 'axios';
import { type GetServerSideProps } from 'next';

import { Default } from '@/layouts/Default';
import { Meta } from '@/layouts/Meta';

const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.82' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.4'/%3E%3C/svg%3E\")";

interface Perk {
  fields: {
    Name?: string;
    Notes?: string;
    Link?: string;
    Logo?: Array<{ url: string }>;
  };
}

interface MemberPerksProps {
  liveNow: Perk[];
  completed: Perk[];
  comingSoon: Perk[];
}

interface AirtablePerkRecord {
  createdTime?: string;
  fields: Record<string, any>;
}

function PerkRow({ perk }: { perk: Perk }) {
  const name = perk.fields['Name'] || 'Partner offer';
  const notes = perk.fields['Notes'] || '';
  const link = perk.fields['Link'] || '#';
  return (
    <a
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      className="group grid grid-cols-[1fr_auto] items-baseline gap-6 border-b border-[#E6DCC9] py-7"
    >
      <span className="flex flex-col gap-1.5">
        <span className="font-serif text-[22px] font-medium tracking-[-0.01em] text-[#221A14] transition-colors group-hover:text-[#A83F22]">
          {name}
        </span>
        {notes && <span className="text-[15px] text-[#5C5147]">{notes}</span>}
      </span>
      <span className="self-center text-[15px] font-semibold whitespace-nowrap text-[#C4502E] transition-transform group-hover:translate-x-0.5">
        Redeem →
      </span>
    </a>
  );
}

function PerkSection({
  label,
  perks,
}: {
  label: string | null;
  perks: Perk[];
}) {
  if (!perks.length) return null;
  return (
    <section>
      {label && (
        <p className="pt-10 pb-1 text-[13px] font-semibold tracking-[0.16em] text-[#6B7A4F] uppercase">
          {label}
        </p>
      )}
      <div className="border-t border-[#E6DCC9]">
        {perks.map((perk, i) => (
          <PerkRow key={i} perk={perk} />
        ))}
      </div>
    </section>
  );
}

export default function MemberPerks({
  liveNow,
  completed,
  comingSoon,
}: MemberPerksProps) {
  const total = liveNow.length + completed.length + comingSoon.length;
  const groupCount = [liveNow, completed, comingSoon].filter(
    (g) => g.length,
  ).length;
  const showLabels = groupCount > 1;

  return (
    <Default
      className="bg-[#FBF7EF]"
      meta={
        <Meta
          title="Member Perks | Future of Work"
          description="Tools and credits for Future of Work members — exclusive partner offers you can redeem."
          canonical="https://future-of-work-lovat.vercel.app/member-perks/"
        />
      }
    >
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.42] mix-blend-multiply"
        style={{ backgroundImage: GRAIN }}
      />
      <div className="relative z-[1] mx-auto w-full max-w-[880px] px-5 pb-24 md:px-10">
        <section className="pt-14 md:pt-20">
          <h1 className="font-serif text-[clamp(40px,6vw,64px)] leading-[1] font-normal tracking-[-0.03em] text-[#221A14]">
            Perks
          </h1>
          <p className="mt-4 text-[16px] text-[#5C5147]">
            Tools and credits for Future of Work members.
          </p>
          {total > 0 && (
            <p className="mt-4 text-[13px] font-semibold tracking-[0.16em] text-[#6B7A4F] uppercase">
              {total} partner offer{total === 1 ? '' : 's'}
            </p>
          )}
        </section>

        <div className="mt-8">
          {total === 0 ? (
            <div className="border-t border-[#E6DCC9] py-16 text-center">
              <p className="font-serif text-[24px] text-[#221A14]">
                No perks just yet
              </p>
              <p className="mt-2 text-[15px] text-[#5C5147]">
                Member perks will appear here as partners come on board.
              </p>
            </div>
          ) : (
            <>
              <PerkSection
                label={showLabels ? 'Live now' : null}
                perks={liveNow}
              />
              <PerkSection label="Completed" perks={completed} />
              <PerkSection label="Coming soon" perks={comingSoon} />
            </>
          )}
        </div>

        <p className="mt-12 border-t border-[#E6DCC9] pt-6 text-[13px] text-[#5C5147]">
          Member perks are available to verified members. One redemption per
          partner.
        </p>
      </div>
    </Default>
  );
}

export const getServerSideProps: GetServerSideProps = async () => {
  const airtableUrl = `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/${process.env.AIRTABLE_PERKS_TABLE}`;

  try {
    const result = await axios(airtableUrl, {
      headers: {
        Authorization: `Bearer ${process.env.AIRTABLE_API_TOKEN}`,
      },
    });

    const records: AirtablePerkRecord[] =
      result?.data?.records
        ?.slice()
        .sort((a: AirtablePerkRecord, b: AirtablePerkRecord) => {
          const aCreatedTime = a.createdTime
            ? new Date(a.createdTime).getTime()
            : 0;
          const bCreatedTime = b.createdTime
            ? new Date(b.createdTime).getTime()
            : 0;

          return bCreatedTime - aCreatedTime;
        }) ?? [];

    const liveNow = records.filter(
      (item: any) => item.fields['Status'] === 'Live now',
    );
    const completed = records.filter(
      (item: any) => item.fields['Status'] === 'Completed',
    );
    const comingSoon = records.filter(
      (item: any) => item.fields['Status'] === 'Coming Soon',
    );

    return {
      props: {
        liveNow,
        completed,
        comingSoon,
      },
    };
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      console.error('Error fetching perks from Airtable', {
        message: error.message,
        code: error.code,
        status: error.response?.status,
        statusText: error.response?.statusText,
        responseData: error.response?.data,
        request: {
          method: error.config?.method?.toUpperCase() ?? 'GET',
          url: error.config?.url ?? airtableUrl,
          params: error.config?.params,
        },
        env: {
          hasBaseId: Boolean(process.env.AIRTABLE_BASE_ID),
          hasPerksTable: Boolean(process.env.AIRTABLE_PERKS_TABLE),
          hasApiToken: Boolean(process.env.AIRTABLE_API_TOKEN),
        },
      });
    } else {
      console.error('Unexpected error fetching perks:', error);
    }

    return {
      props: {
        liveNow: [],
        completed: [],
        comingSoon: [],
      },
    };
  }
};
