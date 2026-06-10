export interface Bounty {
  logo: string;
  org: string;
  location: string;
  title: string;
  type: string;
  tags: string[];
  daysLeft: number;
  submitted: number;
  currency: string;
  prize: string;
  href?: string;
}

function ClockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="6.2" stroke="currentColor" strokeWidth="1.3" />
      <path
        d="M8 4.6V8l2.2 1.5"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="6" cy="5.4" r="2.4" stroke="currentColor" strokeWidth="1.3" />
      <path
        d="M1.8 13c0-2.3 1.9-3.8 4.2-3.8s4.2 1.5 4.2 3.8"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
      <path
        d="M10.6 3.2a2.2 2.2 0 010 4.3M11.4 9.4c1.8.3 3 1.6 3 3.6"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CoinIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <circle cx="8" cy="8" r="7" fill="#E6A12B" stroke="#1D1815" strokeWidth="1.2" />
      <circle cx="8" cy="8" r="4" fill="none" stroke="#1D1815" strokeWidth="1.1" />
    </svg>
  );
}

export default function BountyCard({
  logo,
  org,
  location,
  title,
  type,
  tags,
  daysLeft,
  submitted,
  currency,
  prize,
  href = '/earn',
}: Bounty) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group/card flex flex-col gap-4 rounded-xl border-2 border-[#1d1815] bg-[#f4eee3] p-5 text-[#1d1815] shadow-[5px_5px_0_#1d1815] transition-transform duration-200 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[7px_7px_0_#1d1815]"
    >
      {/* top: org + status */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="font-secondary flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[#1d1815] text-[12px] font-bold tracking-wide text-[#f4eee3]">
            {logo}
          </div>
          <span className="font-secondary text-[11px] font-bold tracking-[0.12em] text-[#6b5e50] uppercase">
            {org} &middot; {location}
          </span>
        </div>
        <span className="font-secondary flex shrink-0 items-center gap-1.5 rounded-md bg-[#123a33] px-2.5 py-1 text-[10px] font-bold tracking-[0.1em] text-[#f4eee3] uppercase">
          <span className="h-1.5 w-1.5 bg-[#e6a12b]" />
          Active
        </span>
      </div>

      {/* title */}
      <h3 className="font-serif text-[20px] leading-[1.15] font-semibold md:text-[22px]">
        {title}
      </h3>

      {/* tags */}
      <div className="flex flex-wrap gap-2">
        <span className="font-secondary rounded-md border border-[#ce4a2b] px-2.5 py-1 text-[10px] font-bold tracking-[0.1em] text-[#ce4a2b] uppercase">
          {type}
        </span>
        {tags.map((t) => (
          <span
            key={t}
            className="font-secondary rounded-md border border-[#1d1815]/30 px-2.5 py-1 text-[10px] font-bold tracking-[0.1em] text-[#1d1815]/70 uppercase"
          >
            {t}
          </span>
        ))}
      </div>

      {/* meta */}
      <div className="font-secondary flex items-center gap-4 text-[12px] text-[#6b5e50]">
        <span className="flex items-center gap-1.5">
          <ClockIcon />
          {daysLeft} days left
        </span>
        <span className="flex items-center gap-1.5">
          <UsersIcon />
          {submitted} submitted
        </span>
      </div>

      {/* dashed divider */}
      <div className="border-t border-dashed border-[#1d1815]/40" />

      {/* footer: prize + view */}
      <div className="flex items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <span className="font-secondary text-[10px] font-bold tracking-[0.14em] text-[#6b5e50] uppercase">
            Prize Pool
          </span>
          <span className="font-secondary flex items-center gap-1.5 text-[18px] font-extrabold text-[#ce4a2b]">
            <CoinIcon />
            {currency} {prize}
          </span>
        </div>
        <span className="font-secondary flex items-center gap-1.5 rounded-md bg-[#ce4a2b] px-4 py-2 text-[12px] font-bold tracking-[0.08em] text-[#f4eee3] uppercase shadow-[3px_3px_0_#1d1815] transition-transform duration-200 group-hover/card:translate-x-0.5">
          View &rarr;
        </span>
      </div>
    </a>
  );
}
