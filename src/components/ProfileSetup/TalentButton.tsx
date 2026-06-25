import { AlertTriangle } from 'lucide-react';
import Link from 'next/link';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

export function TalentButton({
  showMessage,
  isLoading,
  checkTalent,
}: {
  showMessage?: boolean;
  isLoading?: boolean;
  checkTalent: () => void;
}) {
  return (
    <>
      {!!showMessage && (
        <Alert variant="default" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>Please log in to continue!</AlertDescription>
        </Alert>
      )}
      <Link href="#" className="block">
        <Button
          className="h-12 w-full rounded-full border border-transparent bg-[#C4502E] text-[14.5px] font-semibold text-white shadow-none transition-all duration-200 hover:-translate-y-px hover:bg-[#A83F22] hover:text-white hover:shadow-[0_12px_34px_-22px_rgba(54,38,22,0.45)]"
          onClick={() => checkTalent()}
          disabled={isLoading}
        >
          {isLoading ? (
            <span>Redirecting...</span>
          ) : (
            <span>Continue as a Freelancer →</span>
          )}
        </Button>
      </Link>
    </>
  );
}
