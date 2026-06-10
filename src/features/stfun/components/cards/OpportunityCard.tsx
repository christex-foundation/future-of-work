export interface Opportunity {
  title: string;
  cue: string;
  description: string;
  icon: 'bounties' | 'quests' | 'projects';
  /** Warm accent (glyph, role, emblem) — must read on a dark badge. */
  accent: string;
  clearance: string;
  href?: string;
}

function Glyph({
  name,
  color,
  size = 24,
}: {
  name: Opportunity['icon'];
  color: string;
  size?: number;
}) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: color,
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };
  if (name === 'bounties') {
    return (
      <svg {...common}>
        <path d="M7 4h10v4a5 5 0 0 1-10 0V4Z" />
        <path d="M7 6H4v1a3 3 0 0 0 3 3" />
        <path d="M17 6h3v1a3 3 0 0 1-3 3" />
        <path d="M12 13v3" />
        <path d="M9.5 20h5l-1-3h-3l-1 3Z" />
      </svg>
    );
  }
  if (name === 'quests') {
    return (
      <svg {...common}>
        <path d="M6 21V4" />
        <path d="M6 4h11l-2 3.5L17 11H6" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <rect x="3" y="8" width="18" height="12" rx="2" />
      <path d="M8 8V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M3 13h18" />
    </svg>
  );
}

// A few fixed stars for the badge backdrop (no randomness needed).
const STARS = [
  { top: '8%', left: '14%', o: 0.7, s: 2 },
  { top: '12%', left: '78%', o: 0.5, s: 1.5 },
  { top: '20%', left: '40%', o: 0.4, s: 1.5 },
  { top: '6%', left: '54%', o: 0.6, s: 1.5 },
  { top: '26%', left: '88%', o: 0.45, s: 2 },
  { top: '16%', left: '24%', o: 0.35, s: 1 },
  { top: '30%', left: '8%', o: 0.4, s: 1.5 },
];

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2 border-b border-[#f4eee3]/20 py-[5px]">
      <dt className="text-[#f4eee3]/85">{label}</dt>
      <dd className="tracking-[0.12em] text-[#f4eee3]">{value}</dd>
    </div>
  );
}

export default function OpportunityCard({
  title,
  cue,
  description,
  icon,
  accent,
  clearance,
  href = '/earn',
}: Opportunity) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${title} — ${cue}`}
      className="group/id relative mx-auto flex w-full max-w-[330px] flex-col overflow-hidden rounded-[20px] border-2 border-[#1d1815] bg-[#6b5e50] shadow-[5px_5px_0_#1d1815] transition-transform duration-200 hover:-translate-x-0.5 hover:-translate-y-1 hover:shadow-[7px_7px_0_#1d1815]"
    >
      {/* starfield */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        {STARS.map((st, i) => (
          <span
            key={i}
            className="absolute rounded-full bg-[#f4eee3]"
            style={{
              top: st.top,
              left: st.left,
              width: st.s,
              height: st.s,
              opacity: st.o,
            }}
          />
        ))}
      </div>

      <div className="relative flex flex-1 flex-col gap-6 px-5 pt-7 pb-10">
        {/* lanyard slot */}
        <div className="mx-auto h-5 w-20 rounded-full border border-[#e6a12b]/40 bg-[#0e1512]" />

        {/* agency header */}
        <div className="text-center">
          <p className="font-mono text-[10px] font-bold tracking-[0.22em] text-[#f4eee3] uppercase">
            {title}
          </p>
          <p className="font-mono text-[8px] tracking-[0.26em] text-[#f4eee3]/85 uppercase">
            Talent Credential &middot; Sierra Leone
          </p>
        </div>

        <div className="h-px w-full bg-[#1d1815]/35" />

        {/* mark + emblem "photo" */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-col items-start gap-2">
            <div
              className="relative h-6 w-9 shrink-0 overflow-hidden rounded-[5px] border border-[#1d1815]/40"
              style={{ background: '#e6a12b' }}
            >
              <div className="absolute inset-x-1 top-1/2 h-px -translate-y-1/2 bg-[#1d1815]/45" />
              <div className="absolute inset-y-1 left-1/2 w-px -translate-x-1/2 bg-[#1d1815]/45" />
            </div>
            <span className="font-mono text-[8px] tracking-[0.18em] text-[#f4eee3]/85 uppercase">
              Issue 2026
            </span>
          </div>
          <div
            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg border-2 border-[#1d1815]"
            style={{ background: accent }}
          >
            <Glyph name={icon} color="#1D1815" size={30} />
          </div>
        </div>

        {/* credential fields */}
        <dl className="font-mono text-[9px] uppercase">
          <Field label="Clearance" value={clearance} />
        </dl>

        {/* what it is */}
        <p className="mt-0.5 text-center font-primary text-[12.5px] leading-[1.55] text-[#f4eee3]">
          {description}
        </p>

        {/* barcode */}
        <div
          className="mt-0.5 h-8 w-full rounded-[2px]"
          style={{
            background:
              'repeating-linear-gradient(90deg,#f4eee3 0 1px,transparent 1px 3px,#f4eee3 3px 4px,transparent 4px 7px,#f4eee3 7px 9px,transparent 9px 10px,#f4eee3 10px 13px,transparent 13px 15px)',
          }}
        />
        <p className="text-center font-mono text-[8px] tracking-[0.16em] text-[#f4eee3]/75 uppercase">
          Talent property of Future of Work &middot; Apply at /earn
        </p>
      </div>
    </a>
  );
}
