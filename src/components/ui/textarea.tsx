import * as React from 'react';

import { cn } from '@/utils/cn';

function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        'border-input flex min-h-[60px] w-full rounded-none border-2 bg-card px-3 py-2 text-sm text-foreground transition-shadow placeholder:text-muted-foreground focus-visible:bg-white focus-visible:shadow-[3px_3px_0_var(--fow-shadow)] focus-visible:outline-hidden disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
