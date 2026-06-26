import { Check, ChevronDown, ChevronUp } from 'lucide-react';
import React, { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
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
import { getTrancheApprovedEmailBody } from '@/features/sponsor-dashboard/utils/grantEmailCopy';

const CustomNumberInput = ({
  value,
  onChange,
  min,
  max,
  step = 100,
}: {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max?: number;
  step?: number;
}) => {
  const increment = () => {
    if (max === undefined || value + step <= max) {
      onChange(value + step);
    }
  };

  const decrement = () => {
    if (value - step >= min) {
      onChange(value - step);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      increment();
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      decrement();
      return;
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;

    if (newValue === '') {
      onChange(0);
      return;
    }

    const numericValue = parseFloat(newValue);
    onChange(numericValue);
  };

  return (
    <div className="relative w-[160px]">
      <Input
        value={value || ''}
        onKeyDown={handleKeyDown}
        onChange={handleInputChange}
        className="rounded-r-none border-[#1d1815] bg-[#FBF7EF] pr-8 font-semibold text-[#1d1815]"
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
      />
      <div className="absolute top-0 right-1 flex h-full flex-col">
        <button
          type="button"
          onClick={increment}
          className="flex-1 px-1 text-[#6b5e50] hover:text-[#1d1815]"
          aria-label="Increment value"
        >
          <ChevronUp className="h-3 w-3" />
        </button>
        <button
          type="button"
          onClick={decrement}
          className="flex-1 px-1 text-[#6b5e50] hover:text-[#1d1815]"
          aria-label="Decrement value"
        >
          <ChevronDown className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
};

interface ApproveModalProps {
  approveIsOpen: boolean;
  approveOnClose: () => void;
  trancheId: string | undefined;
  ask: number | undefined;
  granteeName: string | null | undefined;
  projectTitle: string | null | undefined;
  sponsorName: string | null | undefined;
  salutation: string | null | undefined;
  token: string;
  enableCustomEmail: boolean;
  onApproveTranche: (
    trancheId: string,
    approvedAmount: number,
    customNote?: string,
  ) => void;
  grantApprovedAmount: number;
  grantTotalPaid: number;
}

export const ApproveTrancheModal = ({
  trancheId,
  approveIsOpen,
  approveOnClose,
  ask,
  granteeName,
  projectTitle,
  sponsorName,
  salutation,
  token,
  enableCustomEmail,
  onApproveTranche,
  grantApprovedAmount,
  grantTotalPaid,
}: ApproveModalProps) => {
  const [approvedAmount, setApprovedAmount] = useState<number | undefined>(ask);
  const [customNote, setCustomNote] = useState('');
  const [isCustomEmailOpen, setIsCustomEmailOpen] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);

  const remainingAmount = grantApprovedAmount - grantTotalPaid;
  const maxApprovalAmount =
    ask === undefined ? remainingAmount : Math.min(remainingAmount, ask);
  const isInvalidApprovalAmount =
    approvedAmount === undefined ||
    !Number.isFinite(approvedAmount) ||
    approvedAmount === 0 ||
    approvedAmount > maxApprovalAmount;
  const previewEmailBody = getTrancheApprovedEmailBody({
    granteeName,
    projectTitle,
    sponsorName,
    approvedAmount,
    token,
    salutation,
    reviewerNote: sanitizeCustomEmailBody(customNote),
  });

  const closeAndDiscardCustomNote = () => {
    setCustomNote('');
    setIsCustomEmailOpen(false);
    setEmailError(null);
    approveOnClose();
  };

  const { closeWithoutGuard, discardChangesDialog, requestClose } =
    useCustomNoteCloseGuard({
      customNote,
      isEnabled: enableCustomEmail && isCustomEmailOpen,
      onDiscard: closeAndDiscardCustomNote,
    });

  const handleAmountChange = (value: number) => {
    if (value > remainingAmount) {
      setWarningMessage(
        `Amount exceeds remaining grant budget (${remainingAmount} ${token})`,
      );
    } else if (value > (ask as number)) {
      setWarningMessage('Approved amount is greater than the requested amount');
    } else {
      setWarningMessage(null);
    }
    setApprovedAmount(value);
  };

  const approveTranche = async () => {
    if (isInvalidApprovalAmount || !trancheId) return;

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
      await onApproveTranche(
        trancheId,
        approvedAmount,
        enableCustomEmail && isCustomEmailOpen
          ? noteValidation.sanitized
          : undefined,
      );
      closeWithoutGuard();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setApprovedAmount(ask);
    setCustomNote('');
    setIsCustomEmailOpen(false);
    setEmailError(null);
    setWarningMessage(null);
    setLoading(false);
  }, [
    trancheId,
    ask,
    granteeName,
    projectTitle,
    sponsorName,
    salutation,
    token,
  ]);

  return (
    <>
      <Dialog
        open={approveIsOpen}
        onOpenChange={(open) => {
          if (!open) requestClose();
        }}
      >
        <DialogContent
          className="m-0 border-2 border-[#1d1815] bg-[#FBF7EF] p-0 shadow-[5px_5px_0_#1d1815]"
          hideCloseIcon
        >
          <DialogTitle className="font-serif text-md -mb-1 px-6 pt-4 font-semibold text-[#1d1815]">
            Approve Tranche Payment
          </DialogTitle>
          <Separator className="bg-[#1d1815]" />
          <div className="px-6 pb-6 text-[0.95rem]">
            <p className="mb-4 text-[#6b5e50]">
              You are about to approve {granteeName}&apos;s tranche payment.
              They will be notified via email.
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

            <div className="mb-6 flex w-full items-center justify-between">
              <p className="w-full whitespace-nowrap text-[#6b5e50]">
                Approved Amount
              </p>
              <div className="flex">
                <CustomNumberInput
                  value={approvedAmount || 0}
                  onChange={handleAmountChange}
                  min={1}
                  max={maxApprovalAmount}
                />
                <div className="flex items-center rounded-r-md border border-l-0 border-[#1d1815] bg-[#FBF7EF] px-3 text-[0.95rem] text-[#6b5e50]">
                  <TokenIcon
                    className="mr-1 h-5 w-5 rounded-full"
                    alt={`${token} icon`}
                    symbol={token}
                  />
                  {token}
                </div>
              </div>
            </div>

            {warningMessage && (
              <p className="mb-4 text-center text-sm text-[#ce4a2b]">
                {warningMessage}
              </p>
            )}

            {enableCustomEmail && isCustomEmailOpen && (
              <CustomNoteEditor
                id="approve-tranche-custom-note"
                value={customNote}
                previewHtml={previewEmailBody}
                emailType="approval"
                error={emailError}
                onChange={(value) => {
                  const sanitizedNote = sanitizeCustomEmailBody(value);
                  setCustomNote(value);
                  setEmailError(
                    validateCustomEmailNote({
                      noteHtml: value,
                      fullEmailHtml: getTrancheApprovedEmailBody({
                        granteeName,
                        projectTitle,
                        sponsorName,
                        approvedAmount,
                        token,
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
                    'flex-1 border-2 border-[#1d1815] bg-[#123a33] text-[#f4eee3] shadow-[3px_3px_0_#1d1815] hover:bg-[#0d2c27] hover:text-[#f4eee3] disabled:border-[#1d1815]/30 disabled:bg-[#E9E0CD] disabled:text-[#6b5e50] disabled:shadow-none disabled:opacity-100',
                    enableCustomEmail
                      ? 'rounded-l-lg rounded-r-none'
                      : 'rounded-lg',
                  )}
                  disabled={
                    loading ||
                    isInvalidApprovalAmount ||
                    (enableCustomEmail &&
                      isCustomEmailOpen &&
                      (!getCustomEmailPlainText(customNote) || !!emailError))
                  }
                  onClick={approveTranche}
                >
                  {loading ? (
                    <>
                      <span className="loading loading-spinner mr-2" />
                      <span>
                        {isCustomEmailOpen
                          ? 'Approving with Custom Note'
                          : 'Approving'}
                      </span>
                    </>
                  ) : (
                    <>
                      <div className="mr-2 rounded-full bg-[#1d1815] p-0.5">
                        <Check className="size-2.5 text-[#f4eee3]" />
                      </div>
                      <span>
                        {isCustomEmailOpen
                          ? 'Approve with Custom Note'
                          : 'Approve Tranche'}
                      </span>
                    </>
                  )}
                </Button>
                {enableCustomEmail && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        type="button"
                        className="rounded-l-none rounded-r-lg border-2 border-l-0 border-[#1d1815] bg-[#123a33] px-2 text-[#f4eee3] hover:bg-[#0d2c27] hover:text-[#f4eee3]"
                        disabled={loading}
                        aria-label="Approve tranche options"
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
                          Approve with custom note
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
