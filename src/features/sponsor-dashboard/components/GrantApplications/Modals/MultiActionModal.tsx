import { useQueryClient } from '@tanstack/react-query';
import { useAtom } from 'jotai';
import { AlertTriangle, Flag, X } from 'lucide-react';
import React, { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { api } from '@/lib/api';

import { selectedGrantApplicationAtom } from '../../../atoms';
import { useRejectGrantApplications } from '../../../mutations/useRejectGrantApplications';
import type { GrantApplicationsReturn } from '../../../queries/applications';

type ActionType = 'reject' | 'spam';

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
  applicationIds: string[];
  setSelectedApplicationIds: (ids: Set<string>) => void;
  allApplicationsLength: number;
  actionType: ActionType;
  slug: string;
}

export const MultiActionModal = ({
  isOpen,
  onClose,
  applicationIds,
  setSelectedApplicationIds,
  allApplicationsLength,
  actionType,
  slug,
}: MultiActionModalProps) => {
  const [loading, setLoading] = useState<boolean>(false);
  const queryClient = useQueryClient();
  const [, setSelectedApplication] = useAtom(selectedGrantApplicationAtom);

  const rejectGrantApplications = useRejectGrantApplications(slug);

  const isMultiple = applicationIds.length > 1;
  const isRejectingAll =
    actionType === 'reject' && applicationIds.length === allApplicationsLength;

  const getActionConfig = (): ActionConfig => {
    switch (actionType) {
      case 'reject':
        return {
          title: isRejectingAll
            ? 'Reject All Remaining Applications?'
            : `Reject ${applicationIds.length} Application${isMultiple ? 's' : ''}`,
          description: isRejectingAll
            ? `You are about to reject all ${applicationIds.length} of the remaining applications for this Grant listing. They will be notified via email.`
            : `You are about to reject ${applicationIds.length} application${isMultiple ? 's' : ''}. They will be notified via email.`,
          buttonText: `Reject ${applicationIds.length} Application${isMultiple ? 's' : ''}`,
          buttonClass:
            'rounded-lg border border-[#ce4a2b] bg-[#F2EAD9] text-[#ce4a2b] hover:bg-[#E9E0CD]',
          icon: (
            <div className="rounded-full bg-[#ce4a2b] p-0.5">
              <X className="size-2.5 text-[#f4eee3]" />
            </div>
          ),
          loadingText: 'Rejecting',
          hasWarning: true,
        };

      case 'spam':
        return {
          title: `Mark Application${isMultiple ? 's' : ''} as Spam?`,
          description: `Marking these applications as spam would affect the users' ability to submit to other opportunities on Earn.`,
          buttonText: `Mark as Spam`,
          buttonClass:
            'rounded-lg border border-[#e6a12b] bg-[#F2EAD9] text-[#e6a12b] hover:bg-[#E9E0CD]',
          icon: <Flag className="size-2.5 text-[#e6a12b]" />,
          loadingText: 'Marking as Spam',
          hasWarning: true,
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
          rejectGrantApplications.mutate(applicationIds);
          setSelectedApplicationIds(new Set());
          break;
        case 'spam':
          await api.post(`/api/sponsor-dashboard/grants/update-label/`, {
            ids: applicationIds,
            label: 'Spam',
          });
          rejectGrantApplications.mutate(applicationIds);

          queryClient.setQueryData<GrantApplicationsReturn>(
            ['sponsor-applications', slug],
            (old: GrantApplicationsReturn | undefined) => {
              if (!old) return old;
              return {
                ...old,
                data: old.data.map((application) => {
                  if (applicationIds.includes(application.id)) {
                    return { ...application, label: 'Spam' as any };
                  }
                  return application;
                }),
              };
            },
          );

          setSelectedApplication((prev: any) => {
            if (prev && applicationIds.includes(prev.id)) {
              return { ...prev, label: 'Spam' as any };
            }
            return prev;
          });

          setSelectedApplicationIds(new Set());
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
        <DialogTitle className="text-md -mb-1 px-6 pt-4 font-serif font-semibold text-[#1d1815]">
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
