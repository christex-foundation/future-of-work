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
        className="font-secondary h-12 w-full rounded-none border-2 border-[#1d1815] bg-[#1d1815] font-bold tracking-[0.06em] text-[#f4eee3] uppercase shadow-none transition-colors duration-150 hover:bg-[#123a33] hover:text-[#f4eee3]"
        onClick={() => checkSponsor()}
        disabled={isLoading}
      >
        {isLoading ? (
          <span>Redirecting...</span>
        ) : (
          <span>Continue as a Company</span>
        )}
      </Button>
    </>
  );
}
