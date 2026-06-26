import React from 'react';

import { cn } from '@/utils/cn';

export const ShinyButton = ({
  children,
  onClick,
  classNames,
  disabled,
  animate = false,
}: {
  children: React.ReactNode;
  onClick: () => void;
  classNames?: {
    button?: string;
    span?: string;
  };
  disabled?: boolean;
  animate?: boolean;
}) => {
  return (
    <button
      className={cn(
        'ph-no-capture relative inline-flex h-10 items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold text-white',
        'bg-[#2C3A2E] shadow-[0_10px_24px_-14px_rgba(44,58,46,0.85)]',
        'cursor-pointer transition-all duration-200 ease-out focus:ring-0 focus:outline-hidden',
        !disabled &&
          'hover:-translate-y-0.5 hover:bg-[#3C4D3D] hover:shadow-[0_16px_32px_-14px_rgba(44,58,46,0.95)]',
        !disabled &&
          animate &&
          'after:absolute after:inset-0 after:rounded-full after:ring-1 after:ring-[#C4502E]/30 after:ring-offset-2 after:ring-offset-[#FBF7EE]',
        disabled && 'cursor-not-allowed opacity-50',
        classNames?.button,
        classNames?.span,
      )}
      disabled={disabled}
      onClick={onClick}
      tabIndex={-1}
    >
      {children}
    </button>
  );
};
