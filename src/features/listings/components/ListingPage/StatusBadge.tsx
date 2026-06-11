import React from 'react';

import { cn } from '@/utils/cn';

interface StatusBadgeProps {
  textColor: string;
  text: string;
  Icon: React.JSX.Element;
}

export const StatusBadge = ({ textColor, text, Icon }: StatusBadgeProps) => {
  return (
    <div
      className={cn(
        'flex items-center gap-1 rounded-full border-[1.5px] border-[#221a14] bg-white px-2.5 py-1 text-xs font-bold whitespace-nowrap sm:gap-2 sm:text-sm',
        `${textColor}`,
      )}
    >
      {Icon}
      <p className="hidden sm:flex">{text}</p>
    </div>
  );
};
