import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAtom } from 'jotai';
import { LucideFlag } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import type { SubmissionWithUser } from '@/interface/submission';
import { api } from '@/lib/api';
import { SubmissionLabels } from '@/prisma/enums';

import { selectedSubmissionAtom } from '../../atoms';
import { useRejectSubmissions } from '../../mutations/useRejectSubmissions';
import { SpamConfirmationDialog } from './SpamConfirmationDialog';

interface Props {
  listingSlug: string;
  isMultiSelectOn: boolean;
}

interface UpdateLabelResponse {
  data: {
    id: string;
    label: SubmissionLabels;
    autoFixed?: boolean;
    [key: string]: any;
  };
}

export const SpamButton = ({ listingSlug, isMultiSelectOn }: Props) => {
  const queryClient = useQueryClient();
  const [selectedSubmission, setSelectedSubmission] = useAtom(
    selectedSubmissionAtom,
  );
  const [isSpamDialogOpen, setIsSpamDialogOpen] = useState(false);
  const [pendingSpamLabel, setPendingSpamLabel] = useState<{
    id: string;
    label: SubmissionLabels;
  } | null>(null);

  const rejectSubmissions = useRejectSubmissions(listingSlug);

  const handleSpamClick = async () => {
    if (!selectedSubmission?.id) return;

    setPendingSpamLabel({
      id: selectedSubmission.id,
      label: SubmissionLabels.Spam,
    });
    setTimeout(() => {
      setIsSpamDialogOpen(true);
    }, 0);
  };

  const handleSpamConfirm = (id: string, label: SubmissionLabels) => {
    updateLabel({ id, label });
  };

  const { mutate: updateLabel } = useMutation({
    mutationFn: ({ id, label }: { id: string; label: SubmissionLabels }) =>
      api.post(`/api/sponsor-dashboard/submission/update-label/`, {
        id,
        label,
      }),
    onSuccess: (
      _: UpdateLabelResponse,
      variables: { id: string; label: SubmissionLabels },
    ) => {
      if (variables.label === SubmissionLabels.Spam) {
        rejectSubmissions.mutate([variables.id]);
      }
    },
    onMutate: (variables) => {
      queryClient.setQueryData<SubmissionWithUser[]>(
        ['sponsor-submissions', listingSlug],
        (old) => {
          if (!old) return old;
          return old.map((submission) => {
            if (submission.id === variables.id) {
              if (variables.label === 'Spam') {
                return {
                  ...submission,
                  label: variables.label,
                };
              }
              return { ...submission, label: variables.label };
            }
            return submission;
          });
        },
      );

      setSelectedSubmission((prev) => {
        if (prev && prev.id === variables.id) {
          return { ...prev, label: variables.label };
        }
        return prev;
      });
    },
    onError: (e) => {
      console.log(e);
    },
  });

  const isMarkedAsSpam = selectedSubmission?.label === SubmissionLabels.Spam;

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
      />
    </>
  );
};
