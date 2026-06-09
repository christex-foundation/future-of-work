import * as React from 'react';

import { cn } from '@/utils/cn';

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'border-input file:text-foreground flex h-9 w-full rounded-none border-2 bg-card px-3 py-1 text-sm text-foreground transition-shadow file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:bg-white focus-visible:shadow-[3px_3px_0_var(--fow-shadow)] focus-visible:outline-hidden disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  );
}

export { Input };
