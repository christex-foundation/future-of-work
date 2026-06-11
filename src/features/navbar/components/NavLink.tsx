import Link from 'next/link';
import React, { type JSX } from 'react';

import { cn } from '@/utils/cn';

interface NavLinkProps extends React.ComponentPropsWithoutRef<typeof Link> {
  href: string;
  label: string | JSX.Element;
  isActive: boolean;
  className?: string;
  isPro?: boolean;
}

export const NavLink = ({
  href,
  label,
  isActive,
  className,
  isPro = false,
  ...props
}: NavLinkProps) => {
  return (
    <Link
      href={href}
      className={cn(
        'font-secondary flex items-center gap-1.5 py-2 font-bold uppercase',
        'h-14',
        'text-[11px] tracking-[0.12em]',
        isActive ? 'text-[#1d1815]' : 'text-[#6b5e50]',
        'hover:text-[#1d1815] hover:no-underline',
        'relative border-b-2',
        isActive ? 'border-[#ce4a2b]' : 'border-transparent',
        className,
      )}
      {...props}
    >
      {label}
      {isActive && (
        <span
          className={cn(
            'inline-block size-1.5',
            isPro ? 'bg-[#1d1815]' : 'bg-[#ce4a2b]',
          )}
        />
      )}
    </Link>
  );
};
