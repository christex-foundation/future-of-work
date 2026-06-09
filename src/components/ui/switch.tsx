import * as SwitchPrimitive from '@radix-ui/react-switch';
import * as React from 'react';

import { cn } from '@/utils/cn';

function Switch({
  className,
  thumbClassName,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root> & {
  thumbClassName?: string;
}) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        'peer data-[state=checked]:bg-fow-good data-[state=unchecked]:bg-secondary border-input focus-visible:ring-ring inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-none border-2 transition-colors focus-visible:ring-2 focus-visible:outline-hidden disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          'bg-foreground pointer-events-none block h-3 w-3 rounded-none ring-0 transition-transform data-[state=checked]:translate-x-4.5 data-[state=checked]:bg-white data-[state=unchecked]:translate-x-0.5',
          thumbClassName,
        )}
      />
    </SwitchPrimitive.Root>
  );
}

export { Switch };
