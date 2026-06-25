import { X } from 'lucide-react';

import { Dialog, DialogContent } from '@/components/ui/dialog';

interface XVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  status: 'loading' | 'error';
  handle?: string | null;
}

export const XVerificationModal = ({
  isOpen,
  onClose,
  status,
  handle,
}: XVerificationModalProps) => {
  const renderContent = () => {
    switch (status) {
      case 'loading':
        return (
          <div className="h-full">
            <div className="mx-auto flex max-w-[20rem] flex-col items-center pt-20 pb-16">
              <div className="flex gap-1.5">
                <p className="font-serif font-semibold text-[#221A14]">
                  Verifying your X profile
                </p>
                <div className="flex items-end gap-1 pb-[0.45rem]">
                  <span className="sr-only">Loading...</span>
                  <style>{`
                     @keyframes bigBounce {
                       0%, 100% {
                         transform: translateY(0);
                         opacity: 0.3;
                         animation-timing-function: cubic-bezier(0.8, 0, 1, 1);
                       }
                       50% {
                         transform: translateY(-100%);
                         opacity: 1;
                         animation-timing-function: cubic-bezier(0, 0, 0.2, 1);
                       }
                     }
                   `}</style>
                  <div
                    className="size-1 rounded-full bg-[#C4502E]"
                    style={{
                      animation: 'bigBounce 1s infinite',
                      animationDelay: '-0.3s',
                    }}
                  ></div>
                  <div
                    className="size-1 rounded-full bg-[#C4502E]"
                    style={{
                      animation: 'bigBounce 1s infinite',
                      animationDelay: '-0.15s',
                    }}
                  ></div>
                  <div
                    className="size-1 rounded-full bg-[#C4502E]"
                    style={{
                      animation: 'bigBounce 1s infinite',
                    }}
                  ></div>
                </div>
              </div>
            </div>
            <p className="font-secondary border-t border-dashed border-[#E6DCC9]/20 bg-[#F2EAD9] py-2 text-center text-[11px] font-bold tracking-[0.2em] text-[#5C5147] uppercase">
              X verification is open in a different tab
            </p>
          </div>
        );
      case 'error':
        return (
          <div className="flex h-full flex-col">
            <div className="pt-12">
              <div className="flex items-center justify-center">
                <div className="flex items-center justify-center rounded-full bg-[#C4502E]/10 p-6">
                  <div className="rounded-full bg-[#C4502E] p-2.5">
                    <X className="size-7 text-white" strokeWidth={3} />
                  </div>
                </div>
              </div>

              <div className="mx-auto flex max-w-[24rem] flex-col items-center gap-1 pb-12">
                <p className="mt-6 font-serif text-lg font-semibold text-[#221A14]">
                  Uh-Oh Verification Failed
                </p>
                {handle ? (
                  <p className="font-primary text-center text-sm text-[#5C5147]">
                    {`We couldn’t verify if you own the @${handle} profile on X. Make sure you’re logged into the correct X profile during authorisation.`}
                  </p>
                ) : (
                  <p className="font-primary text-center text-sm text-[#5C5147]">
                    We couldn&apos;t verify your X account. Please try again.
                  </p>
                )}
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (status === 'loading' && !open) return;
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange} modal>
      <DialogContent
        className="m-0 max-w-md  border border-[#E6DCC9] bg-[#FBF7EF] p-0  sm:"
        hideCloseIcon
      >
        <div>{renderContent()}</div>
      </DialogContent>
    </Dialog>
  );
};
