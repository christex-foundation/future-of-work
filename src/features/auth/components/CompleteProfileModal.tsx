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
      <DialogContent className=" border border-[#E6DCC9] bg-[#FBF7EF] px-6 py-6  sm:max-w-md lg:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl font-semibold text-[#221A14]">
            {header}
          </DialogTitle>
        </DialogHeader>

        <div className="px-0">
          <p className="font-primary text-[#5C5147]">{body}</p>
        </div>

        <DialogFooter className="px-0 pt-2">
          <Button
            className="ph-no-capture h-10 w-full  border border-[#E6DCC9] bg-[#C4502E] text-[#221A14]  hover:bg-[#C4502E] "
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
