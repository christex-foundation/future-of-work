import { AlertTriangle } from 'lucide-react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

export function SponsorButton({
  showMessage,
  isLoading,
  checkSponsor,
}: {
  showMessage?: boolean;
  isLoading?: boolean;
  checkSponsor: () => void;
}) {
  return (
    <>
      {!!showMessage && (
        <Alert variant="default" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>Please log in to continue!</AlertDescription>
        </Alert>
      )}
      <Button
        className="h-12 w-full rounded-full border border-transparent bg-[#2C3A2E] text-[14.5px] font-semibold text-white shadow-none transition-all duration-200 hover:-translate-y-px hover:bg-[#3C4D3D] hover:text-white hover:shadow-[0_12px_34px_-22px_rgba(54,38,22,0.45)]"
        onClick={() => checkSponsor()}
        disabled={isLoading}
      >
        {isLoading ? (
          <span>Redirecting...</span>
        ) : (
          <span>Continue as a Company →</span>
        )}
      </Button>
    </>
  );
}
