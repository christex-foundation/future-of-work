import { ChevronDown, X } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { TokenIcon } from '@/components/ui/token-icon';
import { cn } from '@/utils/cn';

import { useCustomNoteCloseGuard } from '@/features/sponsor-dashboard/components/GrantApplications/hooks/useCustomNoteCloseGuard';
import { CustomNoteEditor } from '@/features/sponsor-dashboard/components/GrantApplications/Modals/CustomNoteEditor';
import {
  getCustomEmailPlainText,
  sanitizeCustomEmailBody,
  validateCustomEmailNote,
} from '@/features/sponsor-dashboard/utils/customEmailSanitizer';
import { getTrancheRejectedEmailBody } from '@/features/sponsor-dashboard/utils/grantEmailCopy';

interface RejectTrancheProps {
  rejectIsOpen: boolean;
  rejectOnClose: () => void;
  trancheId: string | undefined;
  ask: number | undefined;
  granteeName: string | null | undefined;
  projectTitle: string | null | undefined;
  sponsorName: string | null | undefined;
  salutation: string | null | undefined;
  token: string;
  enableCustomEmail: boolean;
  onRejectTranche: (trancheId: string, customNote?: string) => void;
}

export const RejectTrancheModal = ({
  trancheId,
  rejectIsOpen,
  rejectOnClose,
  ask,
  granteeName,
  projectTitle,
  sponsorName,
  salutation,
  token,
  enableCustomEmail,
  onRejectTranche,
}: RejectTrancheProps) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [customNote, setCustomNote] = useState('');
  const [isCustomEmailOpen, setIsCustomEmailOpen] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  const previewEmailBody = getTrancheRejectedEmailBody({
    granteeName,
    projectTitle,
    sponsorName,
    salutation,
    reviewerNote: sanitizeCustomEmailBody(customNote),
  });

  const closeAndDiscardCustomNote = () => {
    setCustomNote('');
    setIsCustomEmailOpen(false);
    setEmailError(null);
    rejectOnClose();
  };

  const { closeWithoutGuard, discardChangesDialog, requestClose } =
    useCustomNoteCloseGuard({
      customNote,
      isEnabled: enableCustomEmail && isCustomEmailOpen,
      onDiscard: closeAndDiscardCustomNote,
    });

  const rejectTranche = async () => {
    if (!trancheId) return;

    const noteValidation = validateCustomEmailNote({
      noteHtml: customNote.trim(),
      fullEmailHtml: previewEmailBody,
    });
    if (enableCustomEmail && isCustomEmailOpen && !noteValidation.isValid) {
      setEmailError(noteValidation.error);
      return;
    }

    setLoading(true);
    try {
      await onRejectTranche(
        trancheId,
        enableCustomEmail && isCustomEmailOpen
          ? noteValidation.sanitized
          : undefined,
      );
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      closeWithoutGuard();
    }
  };

  useEffect(() => {
    setCustomNote('');
    setIsCustomEmailOpen(false);
    setEmailError(null);
    setLoading(false);
  }, [trancheId]);

  return (
    <>
      <Dialog
        open={rejectIsOpen}
        onOpenChange={(open) => {
          if (!open) requestClose();
        }}
      >
        <DialogContent
          className="m-0 border-2 border-[#1d1815] bg-[#FBF7EF] p-0 shadow-[5px_5px_0_#1d1815]"
          hideCloseIcon
        >
          <DialogTitle className="font-serif text-md -mb-1 px-6 pt-4 font-semibold text-[#1d1815]">
            Reject Tranche Payment
          </DialogTitle>
          <Separator className="bg-[#1d1815]" />
          <div className="px-6 pb-6 text-[0.95rem]">
            <p className="mb-4 text-[#6b5e50]">
              You are about to reject {granteeName}&apos;s tranche payment. They
              will be notified via email.
            </p>

            <div className="mb-6 flex items-center justify-between">
              <p className="text-[#6b5e50]">Tranche Payment</p>
              <div className="flex items-center">
                <TokenIcon
                  className="h-5 w-5 rounded-full"
                  alt={`${token} icon`}
                  symbol={token}
                />
                <p className="ml-1 font-semibold text-[#1d1815]">
                  {ask} <span className="text-[#6b5e50]">{token}</span>
                </p>
              </div>
            </div>

            {enableCustomEmail && isCustomEmailOpen && (
              <CustomNoteEditor
                id="reject-tranche-custom-note"
                value={customNote}
                previewHtml={previewEmailBody}
                emailType="rejection"
                error={emailError}
                onChange={(value) => {
                  const sanitizedNote = sanitizeCustomEmailBody(value);
                  setCustomNote(value);
                  setEmailError(
                    validateCustomEmailNote({
                      noteHtml: value,
                      fullEmailHtml: getTrancheRejectedEmailBody({
                        granteeName,
                        projectTitle,
                        sponsorName,
                        salutation,
                        reviewerNote: sanitizedNote,
                      }),
                    }).error,
                  );
                }}
              />
            )}

            <div className="flex gap-3">
              <div className="w-1/2" />
              <Button variant="ghost" onClick={requestClose} disabled={loading}>
                Close
              </Button>
              <div className="flex flex-1">
                <Button
                  className={cn(
                    'flex-1 border-2 border-[#1d1815] bg-[#ce4a2b] text-[#f4eee3] shadow-[3px_3px_0_#1d1815] hover:bg-[#A6371C]',
                    enableCustomEmail
                      ? 'rounded-l-lg rounded-r-none'
                      : 'rounded-lg',
                  )}
                  disabled={
                    loading ||
                    (enableCustomEmail &&
                      isCustomEmailOpen &&
                      (!getCustomEmailPlainText(customNote) || !!emailError))
                  }
                  onClick={rejectTranche}
                >
                  {loading ? (
                    <>
                      <span className="loading loading-spinner mr-2" />
                      <span>
                        {isCustomEmailOpen
                          ? 'Rejecting with Custom Note'
                          : 'Rejecting'}
                      </span>
                    </>
                  ) : (
                    <>
                      <div className="rounded-full bg-[#1d1815] p-0.5">
                        <X className="size-2 text-[#f4eee3]" />
                      </div>
                      <span>
                        {isCustomEmailOpen
                          ? 'Reject with Custom Note'
                          : 'Reject Tranche'}
                      </span>
                    </>
                  )}
                </Button>
                {enableCustomEmail && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        type="button"
                        className="rounded-l-none rounded-r-lg border-2 border-l-0 border-[#1d1815] bg-[#ce4a2b] px-2 text-[#f4eee3] hover:bg-[#A6371C]"
                        disabled={loading}
                        aria-label="Reject tranche options"
                      >
                        <ChevronDown className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="z-70 w-56">
                      {isCustomEmailOpen ? (
                        <DropdownMenuItem
                          onClick={() => setIsCustomEmailOpen(false)}
                        >
                          Use default email
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem
                          onClick={() => setIsCustomEmailOpen(true)}
                        >
                          Reject with custom note
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      {discardChangesDialog}
    </>
  );
};
