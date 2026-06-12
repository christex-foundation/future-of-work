import Link from 'next/link';

import NamedLogo from '@/features/stfun/components/common/NamedLogo';

const PLATFORM_LINKS = [
  { label: 'Find Work', href: '/earn', external: false },
  { label: 'Bounties', href: '/earn/bounties', external: false },
  { label: 'Projects', href: '/earn/projects', external: false },
];

const CONNECT_LINKS = [
  {
    label: 'Get in Touch',
    href: 'mailto:eng@christex.foundation',
    external: true,
  },
  { label: 'Christex Foundation', href: 'https://christex.foundation', external: true },
];

type FooterLink = { label: string; href: string; external: boolean };

function FooterColumn({ title, links }: { title: string; links: FooterLink[] }) {
  return (
    <div className="flex flex-col items-start gap-4">
      <p className="font-secondary text-[11px] font-bold tracking-[0.22em] text-[#e6a12b] uppercase">
        {title}
      </p>
      {links.map((l) => (
        <Link
          key={l.label}
          href={l.href}
          {...(l.external
            ? { target: '_blank', rel: 'noopener noreferrer' }
            : {})}
          className="font-secondary text-[15px] font-medium text-[#f4eee3]/80 transition-colors hover:text-[#f4eee3]"
        >
          {l.label}
        </Link>
      ))}
    </div>
  );
}

export const Footer = () => {
  return (
    <footer className="relative z-10 mt-12 overflow-hidden rounded-t-[48px] bg-[#1d1815]">
      {/* large faded FOW mark watermark */}
      <div
        className="pointer-events-none absolute -bottom-16 left-2 z-0 select-none md:left-12"
        aria-hidden="true"
      >
        <span className="flex items-end font-secondary text-[200px] leading-[0.8] font-semibold tracking-[-0.04em] text-[#f4eee3] opacity-[0.07] md:text-[300px]">
          f
          <svg
            className="mb-[30px] ml-1 h-[104px] w-[104px] md:mb-[44px] md:h-[156px] md:w-[156px]"
            viewBox="0 0 74 74"
          >
            <defs>
              <linearGradient id="footerSunMark" x1="0" y1="1" x2="0" y2="0">
                <stop offset="0" stopColor="#A6371C" />
                <stop offset=".5" stopColor="#CE4A2B" />
                <stop offset="1" stopColor="#E6A12B" />
              </linearGradient>
            </defs>
            <circle cx="37" cy="40" r="22" fill="url(#footerSunMark)" />
            <rect x="8" y="40" width="58" height="4" fill="#F4EEE3" />
            <g stroke="#E6A12B" strokeWidth="3.4" strokeLinecap="round">
              <line x1="37" y1="6" x2="37" y2="13" />
              <line x1="14" y1="15" x2="19" y2="20" />
              <line x1="60" y1="15" x2="55" y2="20" />
            </g>
          </svg>
        </span>
      </div>

      <div className="relative z-10 mx-auto flex max-w-7xl flex-col gap-12 px-8 pt-16 pb-12 md:flex-row md:justify-between md:px-12 lg:pt-20">
        {/* brand */}
        <div className="flex max-w-[340px] flex-col gap-5">
          <NamedLogo />
          <p className="font-primary text-[15px] leading-[1.55] text-[#e7d3c1]/75">
            Sierra Leone&apos;s digital marketplace for work — confident, human,
            and built to be trusted.
          </p>
        </div>

        {/* links */}
        <div className="flex gap-14 sm:gap-20">
          <FooterColumn title="Platform" links={PLATFORM_LINKS} />
          <FooterColumn title="Connect" links={CONNECT_LINKS} />
        </div>
      </div>

      {/* bottom bar */}
      <div className="relative z-10 border-t border-[#f4eee3]/10">
        <div className="mx-auto flex max-w-7xl px-8 pt-6 pb-24 md:px-12 md:pb-6">
          <p className="font-primary text-[13px] text-[#e7d3c1]/55">
            © 2026 Future of Work · Built by Christex Foundation
          </p>
        </div>
      </div>
    </footer>
  );
};
