import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAtom, useSetAtom } from 'jotai';
import { LucideFlag } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import type { SubmissionWithUser } from '@/interface/submission';
import { api } from '@/lib/api';
import { SubmissionLabels } from '@/prisma/enums';

import { isStateUpdatingAtom, selectedGrantApplicationAtom } from '../../atoms';
import { useRejectGrantApplications } from '../../mutations/useRejectGrantApplications';
import { SpamConfirmationDialog } from '../Submissions/SpamConfirmationDialog';

interface Props {
  grantSlug: string;
  isMultiSelectOn: boolean;
}

export const SpamButton = ({ grantSlug, isMultiSelectOn }: Props) => {
  const queryClient = useQueryClient();
  const [selectedApplication] = useAtom(selectedGrantApplicationAtom);
  const setLabelsUpdating = useSetAtom(isStateUpdatingAtom);
  const [isSpamDialogOpen, setIsSpamDialogOpen] = useState(false);
  const [pendingSpamLabel, setPendingSpamLabel] = useState<{
    id: string;
    label: SubmissionLabels;
  } | null>(null);

  const rejectGrantApplications = useRejectGrantApplications(grantSlug);

  const handleSpamClick = async () => {
    if (!selectedApplication?.id) return;

    setPendingSpamLabel({
      id: selectedApplication.id,
      label: SubmissionLabels.Spam,
    });
    setIsSpamDialogOpen(true);
  };

  const handleSpamConfirm = (id: string, label: SubmissionLabels) => {
    updateLabel({ id, label });
  };

  const { mutate: updateLabel } = useMutation({
    mutationFn: async ({
      id,
      label,
    }: {
      id: string;
      label: SubmissionLabels;
    }) => {
      await api.post(`/api/sponsor-dashboard/grants/update-label/`, {
        id,
        label,
      });
      return { id, label };
    },
    onSuccess: (data: { id: string; label: SubmissionLabels }) => {
      setLabelsUpdating(false);

      if (data.label === SubmissionLabels.Spam) {
        rejectGrantApplications.mutate([data.id]);
      }

      queryClient.setQueryData<SubmissionWithUser[]>(
        ['sponsor-applications', grantSlug],
        (old) => {
          if (!old) return old;
          return old.map((application) => {
            if (application.id === data.id) {
              if (data.label === 'Spam') {
                return {
                  ...application,
                  label: data.label,
                };
              }
              return { ...application, label: data.label };
            }
            return application;
          });
        },
      );
    },
    onMutate: () => {
      setLabelsUpdating(true);
    },
    onError: (e) => {
      console.log(e);
    },
    onSettled: () => {
      setLabelsUpdating(false);
    },
  });

  const isMarkedAsSpam = selectedApplication?.label === SubmissionLabels.Spam;

  return (
    <>
      <Button
        variant="destructive"
        className={`rounded-lg border disabled:opacity-100 ${
          isMarkedAsSpam
            ? 'border-[#e6a12b] bg-[#e6a12b]/25 text-[#1d1815] hover:bg-[#e6a12b]/35'
            : 'border-[#e6a12b]/50 bg-[#e6a12b]/12 text-[#1d1815] hover:bg-[#e6a12b]/20 disabled:opacity-70'
        }`}
        onClick={handleSpamClick}
        disabled={isMarkedAsSpam || isMultiSelectOn}
      >
        <LucideFlag className="size-1 text-[#e6a12b]" />
        {isMarkedAsSpam ? 'Marked as Spam' : 'Spam'}
      </Button>

      <SpamConfirmationDialog
        isOpen={isSpamDialogOpen}
        onClose={() => {
          setIsSpamDialogOpen(false);
          setPendingSpamLabel(null);
        }}
        submissionId={pendingSpamLabel?.id}
        onConfirm={handleSpamConfirm}
        isListing={false}
      />
    </>
  );
};
