import { usePrivy } from '@privy-io/react-auth';
import { Gift } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import posthog from 'posthog-js';
import { useEffect, useMemo, useState } from 'react';

import IoSearchOutline from '@/components/icons/IoSearchOutline';
import IoWalletOutline from '@/components/icons/IoWalletOutline';
import { Button } from '@/components/ui/button';
import { LocalImage } from '@/components/ui/local-image';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useCreditBalance } from '@/store/credit';
import { useUser } from '@/store/user';
import { cn } from '@/utils/cn';
import { formatNumberWithSuffix } from '@/utils/formatNumberWithSuffix';

import { CreditIcon } from '@/features/credits/icon/credit';

import { LISTING_NAV_ITEMS } from '../constants';
import { LogoContextMenu } from './LogoContextMenu';
import { NavLink } from './NavLink';
import { UserMenu } from './UserMenu';

interface Props {
  onLoginOpen: () => void;
  onSearchOpen: () => void;
  onWalletOpen: () => void;
  walletBalance: number;
  onCreditOpen: () => void;
  onReferralOpen: () => void;
}

export const DesktopNavbar = ({
  onLoginOpen,
  onSearchOpen,
  onWalletOpen,
  onCreditOpen,
  onReferralOpen,
  walletBalance,
}: Props) => {
  const { authenticated, ready } = usePrivy();
  const router = useRouter();

  const { user, isLoading } = useUser();
  const { creditBalance } = useCreditBalance();

  const [authUiReady, setAuthUiReady] = useState(() => ready);
  useEffect(() => {
    if (!ready) {
      setAuthUiReady(false);
      return;
    }
    setAuthUiReady(true);
  }, [ready, authenticated]);

  const isDashboardRoute = useMemo(
    () => router.pathname.startsWith('/earn/dashboard'),
    [router.pathname],
  );
  const isNewTalentRoute = useMemo(
    () => router.pathname.startsWith('/earn/new/talent'),
    [router.pathname],
  );

  const hideSponsorCTA = useMemo(() => {
    if (!isNewTalentRoute) return false;
    try {
      const url = new URL(window.location.origin + router.asPath);
      return url.searchParams.get('referral') === 'true';
    } catch {
      return router.asPath.includes('referral=true');
    }
  }, [isNewTalentRoute, router.asPath]);

  const maxWidth = useMemo(() => {
    if (isDashboardRoute) {
      return 'max-w-full';
    }
    if (isNewTalentRoute) {
      return '2xl:max-w-[82rem]';
    }
    return 'max-w-7xl';
  }, [isDashboardRoute, isNewTalentRoute]);

  const padding = useMemo(() => {
    if (isDashboardRoute) {
      return 'pr-8 pl-0';
    }
    if (isNewTalentRoute) {
      return 'pr-8 pl-24 2xl:pl-0';
    }
    return 'px-2 lg:px-6';
  }, [isDashboardRoute, isNewTalentRoute]);

  const margin = useMemo(() => {
    if (isNewTalentRoute) {
      return 'mx-0 2xl:mx-auto';
    }
    return 'mx-auto';
  }, [isNewTalentRoute]);

  const openCreditDrawer = () => {
    posthog.capture('open_credits');
    onCreditOpen();
  };

  const isPro = user?.isPro;

  return (
    <div
      className={cn(
        'hidden h-16 border-b border-[#221A14]/10 bg-[#FBF7EF]/85 text-[#5C5147] backdrop-blur-md lg:flex',
        padding,
      )}
    >
      <div
        className={cn(
          'mx-auto flex w-full max-w-7xl justify-between',
          maxWidth,
          margin,
        )}
      >
        <div className="ph-no-capture flex w-fit items-center gap-3 lg:gap-5">
          <LogoContextMenu>
            <Link
              href="/earn"
              className={cn(
                'flex items-center hover:no-underline',
                isDashboardRoute
                  ? 'h-16 w-[84px] justify-center border-r border-[#221A14]/10'
                  : 'gap-3',
              )}
              onClick={() => {
                posthog.capture('homepage logo click_universal');
              }}
            >
              <LocalImage
                className="h-[1.6rem] cursor-pointer object-contain"
                alt="Future of Work"
                src="/fow-favicon.svg"
              />
            </Link>
          </LogoContextMenu>

          {isDashboardRoute && (
            <p className="font-secondary text-[11px] font-bold tracking-[0.18em] text-[#221A14] uppercase">
              SPONSORS
            </p>
          )}

          <Separator
            orientation="vertical"
            className="h-6 bg-[#221A14]/12"
          />

          {!router.pathname.startsWith('/earn/new/') && !isDashboardRoute && (
            <>
              {LISTING_NAV_ITEMS?.map((navItem) => {
                const isCurrent = `${navItem.href}` === router.asPath;
                return (
                  <NavLink
                    isPro={isPro}
                    className="ph-no-capture"
                    onClick={() => {
                      posthog.capture(navItem.posthog);
                    }}
                    key={navItem.label}
                    href={navItem.href ?? '#'}
                    label={navItem.label}
                    isActive={isCurrent}
                  />
                );
              })}
            </>
          )}

          {!router.pathname.startsWith('/earn/search') &&
            !router.pathname.startsWith('/earn/new/') && (
              <div
                className="flex cursor-pointer items-center gap-1.5 rounded-full border border-[#221A14]/15 px-2.5 py-2 text-[#5C5147] transition-all duration-150 hover:border-[#221A14]/35 hover:bg-[#221A14]/4 hover:text-[#221A14]"
                onClick={onSearchOpen}
              >
                <IoSearchOutline className="size-4" />
              </div>
            )}
        </div>

        <div className="flex items-center gap-4 py-1.5">
          {((!authUiReady && !authenticated) || (isLoading && !user)) && (
            <div className="flex items-center gap-2">
              <Skeleton className="size-7 rounded-full" />
              <Skeleton className="mr-4 h-3 w-20" />
            </div>
          )}

          {authUiReady && authenticated && (
            <div className="ph-no-capture flex items-center gap-2">
              {user?.currentSponsorId && !isDashboardRoute && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-full text-[13px] font-medium text-[#221A14] hover:bg-[#221A14]/5 hover:text-[#221A14]"
                  onClick={() => {
                    posthog.capture('sponsor dashboard_navbar');
                  }}
                  asChild
                >
                  <Link href="/earn/dashboard/listings">
                    <span>Dashboard</span>
                    <div className="size-1.5 rounded-full bg-[#C4502E]" />
                  </Link>
                </Button>
              )}

              {!user?.currentSponsorId && user?.isTalentFilled && (
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    'rounded-full border border-[#8FA37E]/45 bg-[#8FA37E]/15 text-[13px] font-medium text-[#2C3A2E] hover:bg-[#8FA37E]/25 hover:text-[#2C3A2E]',
                    isPro &&
                      'border-[#221A14]/15 bg-[#221A14]/5 text-[#221A14] hover:bg-[#221A14]/10',
                  )}
                  onClick={onReferralOpen}
                >
                  <Gift />
                  <span>Get Free Credits</span>
                </Button>
              )}

              {user?.isTalentFilled && (
                <div className="flex items-center gap-1.5">
                  <div
                    className="flex cursor-pointer items-center gap-1.5 rounded-full px-2 py-2 text-[#5C5147] transition-all duration-150 hover:bg-[#221A14]/5 hover:text-[#221A14]"
                    onClick={openCreditDrawer}
                  >
                    <CreditIcon
                      className={cn(
                        'size-4',
                        isPro ? 'text-[#221A14]' : 'text-[#C4502E]',
                      )}
                    />
                    <p className="text-sm font-bold text-[#221A14]">
                      {creditBalance}
                    </p>
                  </div>
                  <div className="relative">
                    <div
                      className="flex cursor-pointer items-center gap-2 rounded-full px-2 py-1.5 text-[#5C5147] transition-all duration-150 hover:bg-[#221A14]/5 hover:text-[#221A14]"
                      onClick={onWalletOpen}
                    >
                      <IoWalletOutline
                        className={cn(
                          'size-6',
                          isPro ? 'text-[#221A14]' : 'text-[#2C3A2E]',
                        )}
                      />
                      <span
                        className={cn(
                          'font-secondary absolute top-px -right-1.5 block rounded-md px-1 py-px text-[10px] font-bold tracking-tight text-[#FBF7EF]',
                          isPro ? 'bg-[#221A14]' : 'bg-[#2C3A2E]',
                        )}
                      >
                        ${formatNumberWithSuffix(walletBalance || 0, 1, false)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
              <UserMenu />
            </div>
          )}

          {authUiReady && !authenticated && (
            <div className="ph-no-capture flex items-center gap-2">
              <div className="flex items-center gap-0">
                {!hideSponsorCTA && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-full text-[13px] font-medium text-[#221A14] hover:bg-[#221A14]/5 hover:text-[#221A14]"
                    onClick={() => {
                      posthog.capture('create a listing_navbar');
                      router.push('/earn/sponsor');
                    }}
                  >
                    <span>Become a Sponsor</span>
                    <div className="size-1.5 rounded-full bg-[#C4502E]" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-full text-[13px] font-medium text-[#221A14] hover:bg-[#221A14]/5 hover:text-[#221A14]"
                  onClick={() => {
                    posthog.capture('login_navbar');
                    onLoginOpen();
                  }}
                >
                  Login
                </Button>
              </div>
              <Button
                size="sm"
                className="my-1 rounded-full bg-[#2C3A2E] px-5 text-[13px] font-semibold text-[#FBF7EF] transition-all duration-200 hover:-translate-y-px hover:bg-[#3C4D3D] hover:text-[#FBF7EF] hover:shadow-[0_12px_34px_-22px_rgba(54,38,22,0.45)]"
                onClick={() => {
                  posthog.capture('signup_navbar');
                  onLoginOpen();
                }}
              >
                Sign Up &rarr;
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
