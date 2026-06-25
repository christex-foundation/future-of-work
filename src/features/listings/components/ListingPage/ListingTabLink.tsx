import Link from 'next/link';

import { cn } from '@/utils/cn';

type ListingTabLinkProps = {
  href: string;
  text: string;
  isActive: boolean;
  subText?: string;
  onClick?: () => void;
  className?: string;
  isPro?: boolean;
};

export const ListingTabLink = ({
  href,
  text,
  isActive,
  onClick,
  className,
  subText,
}: ListingTabLinkProps) => {
  return (
    <Link
      className={cn(
        'ph-no-capture flex h-full items-center gap-2 border-b-2 px-0.5 text-[14.5px] font-medium no-underline transition-colors',
        isActive
          ? 'border-[#C4502E] text-[#221A14]'
          : 'border-transparent text-[#5C5147] hover:text-[#221A14]',
        className,
      )}
      href={href}
      onClick={onClick}
    >
      {text}
      {subText && (
        <span className="rounded-full bg-[#C4502E]/12 px-2 py-px text-[11px] font-semibold text-[#C4502E]">
          {subText}
        </span>
      )}
    </Link>
  );
};
