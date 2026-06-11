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
        'ph-no-capture font-pop-body flex h-full items-center gap-2 border-b-[3px] px-3 text-sm font-bold no-underline transition-colors hover:border-[#ff6b3d]/70',
        isActive
          ? 'border-[#ff6b3d] text-[#221a14]'
          : 'border-transparent text-[#8a7f72]',
        className,
      )}
      href={href}
      onClick={onClick}
    >
      {text}
      {subText && (
        <span className="rounded-full border-[1.5px] border-[#221a14] bg-[#ffe3d6] px-1.5 py-px text-[10px] font-bold text-[#221a14]">
          {subText}
        </span>
      )}
    </Link>
  );
};
