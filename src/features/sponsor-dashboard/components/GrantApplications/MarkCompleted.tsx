import { Check } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useDisclosure } from '@/hooks/use-disclosure';

import { type GrantApplicationWithUser } from '../../types';
import { MarkCompleteModal } from './Modals/MarkCompletedModal';

interface Props {
  isCompleted: boolean;
  applicationId: string;
  onMarkCompleted: (updatedApplication: GrantApplicationWithUser) => void;
}

export function MarkCompleted({
  isCompleted,
  applicationId,
  onMarkCompleted,
}: Props) {
  const {
    isOpen: markAsCompletedIsOpen,
    onOpen: markAsCompletedOnOpen,
    onClose: markAsCompletedOnClose,
  } = useDisclosure();

  if (isCompleted) {
    return (
      <Button
        variant="ghost"
        className="pointer-events-none border-[#e6dcc9] text-[#6b5e50]"
      >
        <Check className="mr-2 h-4 w-4" />
        Completed
      </Button>
    );
  }

  return (
    <>
      <MarkCompleteModal
        isOpen={markAsCompletedIsOpen}
        onClose={markAsCompletedOnClose}
        applicationId={applicationId}
        onMarkCompleted={onMarkCompleted}
      />
      <Button
        className="rounded-lg border border-[#123a33] bg-[#F2EAD9] px-4 text-[#123a33] hover:bg-[#E9E0CD]"
        onClick={markAsCompletedOnOpen}
      >
        <>
          <div className="rounded-full bg-[#123a33] p-0.5">
            <Check className="size-2 text-[#f4eee3]" />
          </div>
          <span>Mark as Completed</span>
        </>
      </Button>
    </>
  );
}
