import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@/utils/cn';

// Future of Work "Serious Retro" button — chunky espresso frame, hard offset
// shadow that collapses on press, uppercase Hanken. Variant/size API unchanged.
const buttonVariants = cva(
  'focus-visible:ring-ring inline-flex cursor-pointer items-center justify-center gap-2 rounded-none border-2 border-input text-sm font-extrabold tracking-wide uppercase whitespace-nowrap transition-all select-none focus-visible:ring-2 focus-visible:outline-hidden active:translate-x-[3px] active:translate-y-[3px] active:!shadow-none disabled:pointer-events-none disabled:opacity-45 disabled:shadow-none [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground shadow-[3px_3px_0_var(--fow-shadow)] hover:bg-[#b83f22]',
        destructive:
          'bg-destructive text-white shadow-[3px_3px_0_var(--fow-shadow)] hover:bg-[#a6371c]',
        outline:
          'bg-card text-foreground shadow-[3px_3px_0_var(--fow-shadow)] hover:bg-secondary',
        secondary:
          'bg-card text-foreground shadow-[3px_3px_0_var(--fow-shadow)] hover:bg-secondary',
        accent:
          'bg-fow-marigold text-fow-espresso shadow-[3px_3px_0_var(--fow-shadow)] hover:bg-[#d9921f]',
        pine: 'bg-fow-pine text-fow-clay shadow-[3px_3px_0_var(--fow-shadow)] hover:bg-[#0d2c26]',
        ghost:
          'border-transparent shadow-none hover:bg-secondary active:translate-x-0 active:translate-y-0',
        link: 'border-transparent tracking-normal text-primary normal-case shadow-none hover:underline active:translate-x-0 active:translate-y-0',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-8 px-3 text-xs',
        lg: 'h-11 px-8 text-base shadow-[5px_5px_0_var(--fow-shadow)]',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : 'button';

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
