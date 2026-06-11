import Link from 'next/link';

import { LocalImage } from '@/components/ui/local-image';

const LINKS = [
  { label: 'Find Work', href: '/earn', external: false },
  {
    label: 'Get in Touch',
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
 * Slim, single-row footer for the sponsor dashboard — solid palette, no
 * rounded top or top margin so it abuts the dashboard surface cleanly.
 */
export const FooterCompact = () => {
  return (
    <footer className="border-t border-[#f4eee3]/10 bg-[#1d1815]">
      <div className="flex flex-col items-center justify-between gap-4 px-8 py-6 md:flex-row">
        {/* wordmark */}
        <div className="flex items-center gap-2.5">
          <LocalImage
            className="size-7 object-contain"
            alt="Future of Work"
            src="/fow-favicon.svg"
          />
          <span className="font-serif text-[16px] font-semibold tracking-[-0.01em] text-[#f4eee3]">
            Future of Work
          </span>
        </div>

        {/* links */}
        <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
          {LINKS.map((l) => (
            <Link
              key={l.label}
              href={l.href}
              {...(l.external
                ? { target: '_blank', rel: 'noopener noreferrer' }
                : {})}
              className="font-secondary text-[13px] font-medium text-[#e7d3c1]/75 transition-colors hover:text-[#f4eee3]"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <p className="font-primary text-[12px] text-[#e7d3c1]/55">
          © 2026 Future of Work · Christex Foundation
        </p>
      </div>
    </footer>
  );
};
