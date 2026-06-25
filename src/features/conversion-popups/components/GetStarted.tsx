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
      <Button className="h-12 w-full  border border-[#E6DCC9] bg-[#C4502E] font-medium text-[#221A14]  transition-all hover:bg-[#C4502E]  focus-visible:ring-0">
        Get Started →
      </Button>
    </AuthWrapper>
  );
};
