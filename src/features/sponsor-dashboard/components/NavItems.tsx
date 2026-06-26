import Link from 'next/link';
import { useRouter } from 'next/router';
import { type ReactNode } from 'react';

import { type IconType } from '@/components/icons/helpers/GenIcon';
import { cn } from '@/utils/cn';

interface NavItemProps {
  icon: IconType;
  link?: string;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export const NavItem = ({
  icon: Icon,
  link,
  children,
  className,
  onClick,
}: NavItemProps) => {
  const router = useRouter();
  const currentPath = router.asPath.split('?')[0];
  const isExternalLink = link?.startsWith('https://');
  const resolvedLink = isExternalLink ? link : `/earn/dashboard${link}`;
  const isActiveLink = resolvedLink
    ? currentPath?.startsWith(resolvedLink)
    : false;

  return (
    <Link
      href={resolvedLink || '#'}
      target={isExternalLink ? '_blank' : undefined}
      rel={isExternalLink ? 'noopener noreferrer' : undefined}
      onClick={onClick}
      aria-label={typeof children === 'string' ? children : undefined}
      className={cn(
        'group relative grid size-[46px] place-items-center rounded-[14px] border-2 transition-all duration-200',
        isActiveLink
          ? 'border-[#221A14] bg-[#8FA37E] text-[#221A14]'
          : 'border-transparent text-[#5C5147] hover:bg-[#F2EAD9] hover:text-[#221A14]',
        className,
      )}
    >
      {/* active indicator bar */}
      {isActiveLink && (
        <span className="absolute top-1/2 -left-[19px] h-6 w-1 -translate-y-1/2 bg-[#8FA37E]" />
      )}

      {Icon && <Icon className="size-5" />}

      {/* slide-out label */}
      <span className="font-secondary pointer-events-none absolute left-full z-40 ml-3 origin-left scale-90 rounded-lg border border-[#E6DCC9]/20 bg-[#2C3A2E] px-2.5 py-1.5 text-[11px] font-semibold tracking-[0.04em] whitespace-nowrap text-[#FBF7EF] uppercase opacity-0 shadow-[0_8px_24px_-8px_rgba(44,58,46,0.45)] transition-all duration-150 group-hover:scale-100 group-hover:opacity-100">
        {children}
      </span>
    </Link>
  );
};
