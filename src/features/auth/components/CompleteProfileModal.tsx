import Link from 'next/link';
import { useRouter } from 'next/router';
import posthog from 'posthog-js';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  bodyText?: string;
  isSponsor: boolean;
}

export function CompleteProfileModal({
  isOpen,
  onClose,
  bodyText,
  isSponsor,
}: Props) {
  const router = useRouter();

  const header = isSponsor
    ? 'Add your talent profile'
    : 'Complete your profile';

  const body = isSponsor
    ? 'You already have a sponsor profile, but we need other details from you before proceeding with this action. Doing this will not impact your sponsor profile.'
    : bodyText;

  const CTA = isSponsor ? 'Add Talent Profile' : 'Complete Profile';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="rounded-none border-2 border-[#1d1815] bg-[#FBF7EE] px-6 py-6 shadow-[6px_6px_0_#1d1815] sm:max-w-md lg:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl font-semibold text-[#1d1815]">
            {header}
          </DialogTitle>
        </DialogHeader>

        <div className="px-0">
          <p className="font-primary text-[#6b5e50]">{body}</p>
        </div>

        <DialogFooter className="px-0 pt-2">
          <Button
            className="ph-no-capture h-10 w-full rounded-none border-2 border-[#1d1815] bg-[#e6a12b] text-[#1d1815] shadow-[3px_3px_0_#1d1815] hover:translate-x-[1px] hover:translate-y-[1px] hover:bg-[#e6a12b] hover:shadow-[1px_1px_0_#1d1815]"
            asChild
            onClick={() => posthog.capture('complete profile_CTA pop up')}
          >
            <Link href={`/earn/new/talent?originUrl=${router.asPath}`}>
              {CTA} →
            </Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
