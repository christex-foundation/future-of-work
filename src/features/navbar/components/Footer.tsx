import Link from 'next/link';

type FooterLink = { label: string; href: string; external?: boolean };

const EXPLORE_LINKS: FooterLink[] = [
  { label: 'Browse bounties', href: '/earn' },
  { label: 'Leaderboard', href: '/earn/leaderboard' },
  { label: 'Talent profiles', href: '/earn/leaderboard' },
  { label: 'Categories', href: '/earn' },
];

const COMPANY_LINKS: FooterLink[] = [
  { label: 'Post a bounty', href: '/earn/new/sponsor' },
  { label: 'Dashboard', href: '/earn/dashboard' },
  { label: 'Verified sponsors', href: '/earn/new/sponsor' },
  { label: 'Pricing', href: '/earn/new/sponsor' },
];

const ABOUT_LINKS: FooterLink[] = [
  { label: 'How it works', href: '/#builders' },
  {
    label: 'Get in touch',
    href: 'mailto:eng@christex.foundation',
    external: true,
  },
  {
    label: 'Christex Foundation',
    href: 'https://christex.foundation',
    external: true,
  },
];

/**
 * The "Future ◑f Work" wordmark — the rising sun is the "o" of "of",
 * tuned for the light Daybreak paper background (ink text + ink horizon).
 */
function Wordmark() {
  return (
    <span className="flex items-center font-serif text-[22px] leading-none font-medium tracking-[-0.01em] text-[#221A14] select-none">
      <span>Future</span>
      <svg
        className="mx-[3px] mb-[2px]"
        width="18"
        height="18"
        viewBox="0 0 74 74"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="footerSunWordmark" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0" stopColor="#A6371C" />
            <stop offset=".5" stopColor="#CE4A2B" />
            <stop offset="1" stopColor="#E6A12B" />
          </linearGradient>
        </defs>
        <circle cx="37" cy="40" r="22" fill="url(#footerSunWordmark)" />
        <rect x="8" y="40" width="58" height="4" fill="#221A14" />
        <g stroke="#C4502E" strokeWidth="3.4" strokeLinecap="round">
          <line x1="37" y1="6" x2="37" y2="13" />
          <line x1="14" y1="15" x2="19" y2="20" />
          <line x1="60" y1="15" x2="55" y2="20" />
        </g>
      </svg>
      <span>f</span>
      <span className="ml-[7px]">Work</span>
    </span>
  );
}

function FooterColumn({ title, links }: { title: string; links: FooterLink[] }) {
  return (
    <div>
      <h4 className="mb-4 text-[12px] font-semibold tracking-[0.14em] text-[#5C5147] uppercase">
        {title}
      </h4>
      {links.map((l) => (
        <Link
          key={l.label}
          href={l.href}
          {...(l.external
            ? { target: '_blank', rel: 'noopener noreferrer' }
            : {})}
          className="mb-2.5 block text-[14.5px] text-[#5C5147] transition-colors hover:text-[#C4502E] hover:no-underline"
        >
          {l.label}
        </Link>
      ))}
    </div>
  );
}

export const Footer = () => {
  return (
    <footer className="relative z-10 border-t border-[#E6DCC9] bg-[#FBF7EF] pt-[60px] pb-10">
      <div className="mx-auto max-w-[1200px] px-6 md:px-10">
        <div className="grid grid-cols-1 gap-x-[30px] gap-y-12 sm:grid-cols-2 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Link href="/" aria-label="Future of Work">
              <Wordmark />
            </Link>
            <p className="mt-4 max-w-[30ch] text-[14.5px] leading-[1.55] text-[#5C5147]">
              Sierra Leone&apos;s marketplace for paid work — connecting local
              companies with talent, settled in USDC.
            </p>
          </div>
          <FooterColumn title="Explore" links={EXPLORE_LINKS} />
          <FooterColumn title="For Companies" links={COMPANY_LINKS} />
          <FooterColumn title="Company" links={ABOUT_LINKS} />
        </div>

        <div className="mt-[50px] flex flex-col gap-2 border-t border-[#E6DCC9] pt-6 text-[13px] text-[#5C5147] sm:flex-row sm:justify-between">
          <span>© 2026 Future of Work — built by Christex Foundation.</span>
          <span>Paid in USDC · Remote, worldwide</span>
        </div>
      </div>
    </footer>
  );
};
