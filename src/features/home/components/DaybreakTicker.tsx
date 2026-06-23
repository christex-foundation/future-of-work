import { type EarnBounty } from '@/features/home/types/earn-board';

/**
 * "Live now" activity ticker band for the /earn board.
 * Calm Daybreak aesthetic, CSS-only marquee, server component (no hooks).
 */
export function DaybreakTicker({ items }: { items: EarnBounty[] }) {
  if (items.length === 0) {
    return null;
  }

  const loop = [...items, ...items];

  return (
    <div
      className="relative my-10 flex w-full items-stretch overflow-hidden rounded-2xl border border-[#E6DCC9] bg-white"
      style={{ fontFamily: 'var(--font-hanken), sans-serif' }}
    >
      {/* Solid terracotta "Live now" label */}
      <div className="flex shrink-0 items-center gap-2.5 bg-[#C4502E] px-5 text-white">
        <span className="size-[7px] animate-pulse rounded-full bg-white" />
        <span className="text-[11px] font-semibold uppercase tracking-[0.16em]">
          Live now
        </span>
      </div>

      {/* Marquee viewport */}
      <div className="group relative flex-1 overflow-hidden py-3.5">
        <span className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-white to-transparent" />
        <span className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-white to-transparent" />
        <div
          className="flex whitespace-nowrap group-hover:[animation-play-state:paused]"
          style={{ animation: 'db-marquee 45s linear infinite' }}
        >
          {loop.map((item, i) => (
            <div key={i} className="mx-5 flex items-center gap-3">
              <span className="font-semibold text-[#2C3A2E]">{item.sponsor}</span>
              <span className="text-[#5C5147]">· {item.title}</span>
              <span className="font-semibold text-[#C4502E]">
                {item.prizeLabel}
              </span>
              <span aria-hidden className="text-[#E6DCC9]">
                ·
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
