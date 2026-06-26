import { X } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';

interface RejectModalProps {
  rejectIsOpen: boolean;
  rejectOnClose: () => void;
  submissionId: string | undefined;
  applicantName: string | null | undefined;
  onRejectSubmission: (applicationId: string) => void;
}

export const RejectSubmissionModal = ({
  submissionId,
  rejectIsOpen,
  rejectOnClose,
  applicantName,
  onRejectSubmission,
}: RejectModalProps) => {
  const [loading, setLoading] = useState<boolean>(false);

  const rejectGrant = async () => {
    if (!submissionId) return;

    setLoading(true);
    try {
      await onRejectSubmission(submissionId);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      rejectOnClose();
    }
  };

  return (
    <Dialog open={rejectIsOpen} onOpenChange={rejectOnClose}>
      <DialogContent className="m-0 p-0" hideCloseIcon>
        <DialogTitle className="text-md font-serif -mb-1 px-6 pt-4 font-semibold text-[#1d1815]">
          Reject Application
        </DialogTitle>
        <Separator />
        <div className="px-6 pb-6 text-[0.95rem]">
          <p className="mb-4 text-[#6b5e50]">
            You are about to reject {applicantName}&apos;s submission request.
            They will be notified via email.
          </p>

          <div className="flex gap-3">
            <div className="w-1/2" />
            <Button variant="ghost" onClick={rejectOnClose} disabled={loading}>
              Close
            </Button>
            <Button
              className="flex-1 rounded-lg border-2 border-[#1d1815] bg-[#ce4a2b] text-[#f4eee3] hover:bg-[#A6371C]"
              disabled={loading}
              onClick={rejectGrant}
            >
              {loading ? (
                <>
                  <span className="loading loading-spinner mr-2" />
                  <span>Rejecting</span>
                </>
              ) : (
                <>
                  <div className="rounded-full bg-[#1d1815] p-0.5">
                    <X className="size-2 text-[#f4eee3]" />
                  </div>
                  <span>Reject Application</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
