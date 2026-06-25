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
        'flex items-center gap-1.5 py-2 font-medium',
        'h-16',
        'text-[14px] tracking-normal transition-colors duration-200',
        isActive ? 'text-[#221A14]' : 'text-[#5C5147]',
        'hover:text-[#221A14] hover:no-underline',
        'relative border-b',
        isActive
          ? isPro
            ? 'border-[#221A14]'
            : 'border-[#C4502E]'
          : 'border-transparent',
        className,
      )}
      {...props}
    >
      {label}
    </Link>
  );
};
