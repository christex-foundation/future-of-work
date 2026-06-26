import { useQueryClient } from '@tanstack/react-query';
import { useAtom } from 'jotai';
import { AlertTriangle, Flag, X } from 'lucide-react';
import React, { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import type { SubmissionWithUser } from '@/interface/submission';
import { api } from '@/lib/api';

import { BONUS_REWARD_POSITION } from '@/features/listing-builder/constants';
import { type Listing } from '@/features/listings/types';
import { selectedSubmissionAtom } from '@/features/sponsor-dashboard/atoms';
import { useRejectSubmissions } from '@/features/sponsor-dashboard/mutations/useRejectSubmissions';
import { useToggleWinner } from '@/features/sponsor-dashboard/mutations/useToggleWinner';

type ActionType = 'reject' | 'bonus' | 'spam' | 'shortlist';

interface ActionConfig {
  title: string;
  description: string;
  buttonText: string;
  buttonClass: string;
  icon?: React.ReactNode;
  loadingText: string;
  hasWarning?: boolean;
}

interface MultiActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  submissionIds: string[];
  setSelectedSubmissionIds: (ids: Set<string>) => void;
  allSubmissionsLength: number;
  actionType: ActionType;
  listing: Listing | undefined;
}

export const MultiActionModal = ({
  isOpen,
  onClose,
  submissionIds,
  setSelectedSubmissionIds,
  allSubmissionsLength,
  actionType,
  listing,
}: MultiActionModalProps) => {
  const [loading, setLoading] = useState<boolean>(false);
  const queryClient = useQueryClient();
  const [, setSelectedSubmission] = useAtom(selectedSubmissionAtom);

  const rejectSubmissions = useRejectSubmissions(listing?.slug || '');
  const { mutateAsync: toggleWinner } = useToggleWinner(listing);

  const isMultiple = submissionIds.length > 1;
  const isRejectingAll =
    actionType === 'reject' && submissionIds.length === allSubmissionsLength;

  const getActionConfig = (): ActionConfig => {
    switch (actionType) {
      case 'reject':
        return {
          title: isRejectingAll
            ? 'Reject All Remaining Applications?'
            : `Reject ${submissionIds.length} Application${isMultiple ? 's' : ''}`,
          description: isRejectingAll
            ? `You are about to reject all ${submissionIds.length} of the remaining applications for this Project listing. They will be notified via email.`
            : `You are about to reject ${submissionIds.length} application${isMultiple ? 's' : ''}. They will be notified via email.`,
          buttonText: `Reject ${submissionIds.length} Application${isMultiple ? 's' : ''}`,
          buttonClass:
            'rounded-lg border-2 border-[#1d1815] bg-[#ce4a2b] text-[#f4eee3] hover:bg-[#A6371C]',
          icon: (
            <div className="rounded-full bg-[#1d1815] p-0.5">
              <X className="size-2.5 text-[#f4eee3]" />
            </div>
          ),
          loadingText: 'Rejecting',
          hasWarning: true,
        };

      case 'bonus':
        return {
          title: `Select ${submissionIds.length} submission${isMultiple ? 's' : ''} for bonus spot${isMultiple ? 's' : ''}`,
          description: `You are about to select ${submissionIds.length} submissions for Bonus spot${isMultiple ? 's' : ''}. You can update this list till you announce winners.`,
          buttonText: `Allocate Bonus spot(s)`,
          buttonClass:
            'rounded-lg border-2 border-[#1d1815] bg-[#e6a12b] text-[#1d1815] hover:bg-[#d49223]',
          loadingText: 'Allocating Bonus',
        };

      case 'spam':
        return {
          title: `Mark Submission${isMultiple ? 's' : ''} as Spam?`,
          description: `Marking these submissions as spam would affect the users' ability to submit to other opportunities on Earn.`,
          buttonText: `Mark as Spam`,
          buttonClass:
            'rounded-lg border-2 border-[#1d1815] bg-[#FBF7EF] text-[#1d1815] hover:bg-[#F2EAD9]',
          icon: <Flag className="size-2.5 text-[#1d1815]" />,
          loadingText: 'Marking as Spam',
          hasWarning: true,
        };

      case 'shortlist':
        return {
          title: `Shortlist Submission${isMultiple ? 's' : ''}?`,
          description: `You're about to shortlist ${submissionIds.length} submission${isMultiple ? 's' : ''} for further review. You can update this list anytime.`,
          buttonText: `Shortlist ${isMultiple ? 'All' : ''}`,
          buttonClass:
            'rounded-lg border-2 border-[#1d1815] bg-[#123a33] text-[#f4eee3] hover:bg-[#0d2b26]',
          loadingText: 'Shortlisting',
        };

      default:
        throw new Error(`Unknown action type: ${actionType}`);
    }
  };

  const handleAction = async () => {
    setLoading(true);
    try {
      switch (actionType) {
        case 'reject':
          rejectSubmissions.mutate(submissionIds);
          setSelectedSubmissionIds(new Set());
          break;
        case 'bonus':
          const bonusSubmissions = submissionIds.map((s) => ({
            id: s,
            isWinner: true,
            winnerPosition: BONUS_REWARD_POSITION,
          }));
          await toggleWinner(bonusSubmissions);
          setSelectedSubmissionIds(new Set());
          break;
        case 'spam':
          await api.post(`/api/sponsor-dashboard/submission/update-label/`, {
            ids: submissionIds,
            label: 'Spam',
          });
          rejectSubmissions.mutate(submissionIds);

          queryClient.setQueryData<SubmissionWithUser[]>(
            ['sponsor-submissions', listing?.slug],
            (old) => {
              if (!old) return old;
              return old.map((submission) => {
                if (submissionIds.includes(submission.id)) {
                  return { ...submission, label: 'Spam' as any };
                }
                return submission;
              });
            },
          );

          setSelectedSubmission((prev) => {
            if (prev && submissionIds.includes(prev.id)) {
              return { ...prev, label: 'Spam' as any };
            }
            return prev;
          });

          setSelectedSubmissionIds(new Set());
          break;
        case 'shortlist':
          await api.post(`/api/sponsor-dashboard/submission/update-label/`, {
            ids: submissionIds,
            label: 'Shortlisted',
          });

          queryClient.setQueryData<SubmissionWithUser[]>(
            ['sponsor-submissions', listing?.slug],
            (old) => {
              if (!old) return old;
              return old.map((submission) => {
                if (submissionIds.includes(submission.id)) {
                  return { ...submission, label: 'Shortlisted' as any };
                }
                return submission;
              });
            },
          );

          setSelectedSubmission((prev) => {
            if (prev && submissionIds.includes(prev.id)) {
              return { ...prev, label: 'Shortlisted' as any };
            }
            return prev;
          });

          setSelectedSubmissionIds(new Set());
          break;
      }
    } catch (error) {
      console.error(`Error performing ${actionType} action:`, error);
    } finally {
      setLoading(false);
      onClose();
    }
  };

  const config = getActionConfig();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="m-0 p-0" hideCloseIcon>
        <DialogTitle className="text-md font-serif -mb-1 px-6 pt-4 font-semibold text-[#1d1815]">
          {config.title}
        </DialogTitle>
        <Separator />
        <div className="px-6 pb-6 text-[0.95rem]">
          <p className="mb-4 text-[#6b5e50]">{config.description}</p>

          {config.hasWarning && (
            <div className="mb-4 flex items-center gap-1">
              <AlertTriangle className="h-4 w-4 text-[#ce4a2b]" />
              <span className="text-sm font-medium text-[#1d1815]">
                This action cannot be undone!
              </span>
            </div>
          )}
          <div className="flex gap-3">
            <div className="w-1/2" />
            <Button variant="ghost" onClick={onClose} disabled={loading}>
              Close
            </Button>
            <Button
              className={`flex-1 ${config.buttonClass}`}
              disabled={loading}
              onClick={handleAction}
            >
              {loading ? (
                <>
                  <span className="loading loading-spinner mr-2" />
                  <span>{config.loadingText}</span>
                </>
              ) : (
                <>
                  {config.icon}
                  {config.buttonText}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
