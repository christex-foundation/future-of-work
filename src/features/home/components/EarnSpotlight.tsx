import Link from 'next/link';

import { type EarnBounty } from '@/features/home/types/earn-board';

/**
 * Featured-bounty spotlight — calm editorial treatment.
 * Self-contained (Tailwind + Daybreak palette via arbitrary values), so it
 * renders correctly on /earn without the `.daybreak` page wrapper.
 */
export function EarnSpotlight({ bounty }: { bounty: EarnBounty | null }) {
  if (!bounty) return null;

  const listing = `/earn/listing/${bounty.slug}`;

  return (
    <section style={{ fontFamily: 'var(--font-hanken), sans-serif' }}>
      <div className="relative overflow-hidden rounded-md border border-[#E6DCC9] bg-[#FBF7EF] shadow-[0_30px_80px_-50px_rgba(54,38,22,0.45)]">
        {/* warm terracotta arch — the single signature shape */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-[50px] -right-[90px] h-[760px] w-[380px] rounded-t-[380px]"
          style={{
            background:
              'radial-gradient(120% 80% at 72% 12%, rgba(232,180,142,.45), transparent 58%), linear-gradient(165deg,#C4502E,#9c3a22)',
          }}
        >
          <div className="absolute inset-x-6 top-6 h-[340px] rounded-t-[340px] border border-b-0 border-[rgba(251,247,239,0.3)]" />
        </div>

        {/* content */}
        <div className="relative z-[1] flex min-h-[440px] flex-col px-[clamp(28px,5vw,60px)] py-[clamp(36px,4.5vw,54px)]">
          <header className="flex items-baseline justify-between gap-4">
            <span className="text-[12px] font-semibold tracking-[0.2em] text-[#C4502E] uppercase">
              Featured · {bounty.cat}
            </span>
            <span className="font-serif text-[16px] text-[rgba(251,247,239,0.92)] italic">
              No. 01
            </span>
          </header>
          <hr className="mt-5 h-px border-0 bg-[#E6DCC9]" />

          <Link
            href={listing}
            className="mt-[clamp(34px,4vw,54px)] block max-w-[15ch] font-serif text-[clamp(40px,6.4vw,80px)] leading-[1.04] font-normal tracking-[-0.02em] text-[#221A14] transition-colors hover:text-[#C4502E]"
          >
            {bounty.title}
          </Link>

          <div className="mt-6 flex flex-wrap items-center gap-x-[18px] gap-y-3 text-[14.5px] text-[#5C5147]">
            <span>
              By <b className="font-semibold text-[#221A14]">{bounty.sponsor}</b>
            </span>
            {bounty.verified && (
              <span className="font-semibold text-[#2C3A2E]">
                ✓ Verified sponsor
              </span>
            )}
            {bounty.tags.length > 0 && (
              <>
                <span
                  aria-hidden
                  className="h-1 w-1 rounded-full bg-[#E6DCC9]"
                />
                <span className="flex flex-wrap gap-2">
                  {bounty.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-[#E6DCC9] bg-[#FBF7EF] px-[13px] py-[5px] text-[12.5px] text-[#5C5147]"
                    >
                      {tag}
                    </span>
                  ))}
                </span>
              </>
            )}
          </div>

          <div className="min-h-[36px] flex-1" />

          <footer className="flex flex-wrap items-end justify-between gap-8">
            <div>
              <div className="font-serif text-[clamp(42px,5vw,54px)] leading-none font-normal tracking-[-0.02em] text-[#C4502E]">
                {bounty.prizeLabel}
              </div>
              <div className="mt-2.5 text-[13.5px] text-[#5C5147]">
                Prize pool · paid in {bounty.token}
              </div>
              <div className="mt-1.5 text-[13px] text-[#5C5147]">
                {bounty.submissions} submissions · closes in{' '}
                <b className="font-semibold text-[#2C3A2E]">{bounty.dueShort}</b>
              </div>
            </div>
            <Link
              href={listing}
              className="inline-flex items-center gap-2.5 rounded-full bg-[#2C3A2E] px-[26px] py-3.5 text-[15px] font-semibold text-[#FBF7EF] shadow-[0_14px_30px_-16px_rgba(54,38,22,0.5)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_38px_-18px_rgba(54,38,22,0.55)]"
            >
              Read the brief &amp; submit →
            </Link>
          </footer>
        </div>
      </div>
    </section>
  );
}
