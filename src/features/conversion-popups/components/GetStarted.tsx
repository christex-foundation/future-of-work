import { Button } from '@/components/ui/button';

import { AuthWrapper } from '@/features/auth/components/AuthWrapper';

export const GetStarted = ({
  setIsLoginOpen,
  showLoginOverlay = false,
}: {
  setIsLoginOpen?: (value: boolean) => void;
  showLoginOverlay?: boolean;
}) => {
  return (
    <AuthWrapper
      hideLoginOverlay={!showLoginOverlay}
      redirectTo="/earn/new/talent?type=popup"
      className="w-full"
      onLoginCloseCallback={() => setIsLoginOpen?.(false)}
      onLoginOpenCallback={() => setIsLoginOpen?.(true)}
    >
      <Button className="h-12 w-full rounded-none border-2 border-[#1d1815] bg-[#e6a12b] font-medium text-[#1d1815] shadow-[3px_3px_0_#1d1815] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:bg-[#e6a12b] hover:shadow-[1px_1px_0_#1d1815] focus-visible:ring-0">
        Get Started →
      </Button>
    </AuthWrapper>
  );
};
