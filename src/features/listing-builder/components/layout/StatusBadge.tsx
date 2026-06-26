import { useAtomValue } from 'jotai';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/utils/cn';

import { listingStatusAtom } from '../../atoms';
import { type ListingStatus } from '../../types';

interface StatusBadgeProps {
  className?: string;
}

export function StatusBadge({ className }: StatusBadgeProps) {
  const status = useAtomValue(listingStatusAtom);
  const statusConfig: Record<
    ListingStatus,
    { label: string; className: string }
  > = {
    draft: {
      label: 'Draft',
      className: 'bg-[#EEF1E7] text-[#2C3A2E] hover:bg-[#EEF1E7]',
    },
    published: {
      label: 'Published',
      className: 'bg-[#EEF1E7] text-[#2C3A2E] hover:bg-[#EEF1E7]',
    },
    unpublished: {
      label: 'Unpublished',
      className: 'bg-[#F4E6DF] text-[#C4502E] hover:bg-[#F4E6DF]',
    },
    verifying: {
      label: 'Verifying',
      className: 'bg-[#F2EAD9] text-[#5C5147] hover:bg-[#F2EAD9]',
    },
    'payment pending': {
      label: 'Payment Pending',
      className: 'bg-[#F2EAD9] text-[#8A6D2F] hover:bg-[#F2EAD9]',
    },
    completed: {
      label: 'Completed',
      className: 'bg-green-50 text-green-600 hover:bg-green-50',
    },
    'verification failed': {
      label: 'Verification Failed',
      className: 'bg-red-50 text-red-600 hover:bg-red-50',
    },
    blocked: {
      label: 'Blocked',
      className: 'bg-red-50 text-red-600 hover:bg-red-50',
    },
  };

  const config = statusConfig[status || 'draft'];

  return (
    <Badge
      variant="secondary"
      className={cn('rounded-full font-medium', config.className, className)}
    >
      {config.label}
    </Badge>
  );
}
