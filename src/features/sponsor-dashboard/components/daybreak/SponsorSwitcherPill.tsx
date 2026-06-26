import { ChevronDown } from 'lucide-react';

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useUser } from '@/store/user';

import { EarnAvatar } from '@/features/talent/components/EarnAvatar';

import { SelectSponsor } from '../SelectSponsor';

/**
 * Topbar pill that surfaces the active sponsor's name + logo on the dashboard.
 * Opens the sponsor switcher when the user belongs to more than one org.
 */
export function SponsorSwitcherPill() {
  const { user } = useUser();
  const sponsor = user?.currentSponsor;
  const canSwitch =
    user?.role === 'GOD' || (user?.UserSponsors?.length ?? 0) > 0;

  const inner = (
    <span className="flex items-center gap-2.5 rounded-full border border-[#E6DCC9] bg-[#FBF7EF] py-1.5 pr-3.5 pl-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] transition-colors hover:border-[#d9ccb2]">
      <EarnAvatar
        id={sponsor?.name}
        avatar={sponsor?.logo}
        className="size-8 rounded-[10px]"
      />
      <span className="text-[14.5px] font-semibold tracking-[-0.01em] text-[#221A14]">
        {sponsor?.name ?? 'Your org'}
      </span>
      {canSwitch && <ChevronDown className="size-4 text-[#5C5147]" />}
    </span>
  );

  if (!canSwitch) return inner;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" aria-label="Switch sponsor">
          {inner}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 p-3">
        <p className="font-secondary mb-2 px-1 text-[11px] font-bold tracking-[0.16em] text-[#5C5147] uppercase">
          Switch sponsor
        </p>
        <SelectSponsor isExpanded />
      </PopoverContent>
    </Popover>
  );
}
