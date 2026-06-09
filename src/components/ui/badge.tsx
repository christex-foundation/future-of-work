import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@/utils/cn';

// FOW retro badge — pixel (Silkscreen) label, square, hard 2px frame.
const badgeVariants = cva(
  'focus:ring-ring border-input inline-flex items-center gap-1 rounded-none border-2 px-2 py-0.5 font-label text-[10px] leading-none tracking-wide uppercase transition-colors focus:ring-2 focus:outline-hidden',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground',
        secondary: 'bg-secondary text-foreground',
        destructive: 'bg-destructive text-white',
        outline: 'bg-transparent text-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

function Badge({
  className,
  variant,
  ...props
}: React.ComponentProps<'div'> & VariantProps<typeof badgeVariants>) {
  return (
    <div
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
