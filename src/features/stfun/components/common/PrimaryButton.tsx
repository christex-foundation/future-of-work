import Link from 'next/link';

import { cn } from '@/utils/cn';

interface PrimaryButtonProps {
  href: string;
  className?: string;
  children: React.ReactNode;
  target?: string;
  rel?: string;
}

export default function PrimaryButton({
  href,
  className,
  children,
  target,
  rel,
}: PrimaryButtonProps) {
  const isExternal = href.startsWith('mailto:') || href.startsWith('http');

  if (isExternal) {
    return (
      <a
        href={href}
        target={target}
        rel={rel}
        className={cn(
          'primary-cta font-secondary inline-block h-fit rounded-2xl px-6 py-3 text-[14px] leading-[15px] font-bold text-[#1d1815] transition-shadow duration-250 ease-out hover:shadow-[0px_-4px_27px_rgba(230,161,43,0.6),0px_4px_12px_rgba(166,55,28,0.9)]',
          className,
        )}
      >
        {children}
      </a>
    );
  }

  return (
    <Link
      href={href}
      className={cn(
        'primary-cta font-secondary inline-block h-fit rounded-2xl px-6 py-3 text-[14px] leading-[15px] font-bold text-[#1d1815] transition-shadow duration-250 ease-out hover:shadow-[0px_-4px_27px_rgba(230,161,43,0.6),0px_4px_12px_rgba(166,55,28,0.9)]',
        className,
      )}
    >
      {children}
    </Link>
  );
}
