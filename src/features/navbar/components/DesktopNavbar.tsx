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
      return 'pr-8 pl-6';
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
        'hidden h-14 border-b-2 border-[#1d1815] bg-[#f4eee3] text-[#6b5e50] lg:flex',
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
              className="flex items-center gap-3 hover:no-underline"
              onClick={() => {
                posthog.capture('homepage logo click_universal');
              }}
            >
              <LocalImage
                className="h-[1.6rem] cursor-pointer object-contain"
                alt="Future of Work"
                src="/fow-favicon.svg"
              />

              {isDashboardRoute && (
                <>
                  <div className="h-6 w-[2px] bg-[#1d1815]" />
                  <p className="font-secondary text-[11px] font-bold tracking-[0.18em] text-[#1d1815] uppercase">
                    SPONSORS
                  </p>
                </>
              )}
            </Link>
          </LogoContextMenu>

          <Separator
            orientation="vertical"
            className="h-6 bg-[#1d1815]/20"
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
                className="flex cursor-pointer items-center gap-1.5 rounded-md border border-[#1d1815]/30 px-2 py-2 text-[#6b5e50] transition-all duration-100 hover:border-[#1d1815]/60 hover:bg-[#1d1815]/5 hover:text-[#1d1815]"
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
                  className="font-secondary text-[11px] font-bold tracking-[0.1em] text-[#1d1815] uppercase hover:bg-[#1d1815]/5 hover:text-[#1d1815]"
                  onClick={() => {
                    posthog.capture('sponsor dashboard_navbar');
                  }}
                  asChild
                >
                  <Link href="/earn/dashboard/listings">
                    <span>Dashboard</span>
                    <div className="block size-1.5 bg-[#e6a12b]" />
                  </Link>
                </Button>
              )}

              {!user?.currentSponsorId && user?.isTalentFilled && (
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    'font-secondary border border-[#e6a12b] bg-[#e6a12b]/15 text-[11px] font-bold tracking-[0.08em] text-[#1d1815] uppercase hover:bg-[#e6a12b]/25 hover:text-[#1d1815]',
                    isPro &&
                      'border-[#1d1815]/20 bg-[#1d1815]/5 text-[#1d1815] hover:bg-[#1d1815]/10',
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
                    className="flex cursor-pointer items-center gap-1.5 rounded-md px-2 py-2 text-[#6b5e50] transition-all duration-100 hover:bg-[#1d1815]/5 hover:text-[#1d1815]"
                    onClick={openCreditDrawer}
                  >
                    <CreditIcon
                      className={cn(
                        'size-4',
                        isPro ? 'text-[#1d1815]' : 'text-[#ce4a2b]',
                      )}
                    />
                    <p className="text-sm font-bold text-[#1d1815]">
                      {creditBalance}
                    </p>
                  </div>
                  <div className="relative">
                    <div
                      className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-[#6b5e50] transition-all duration-100 hover:bg-[#1d1815]/5 hover:text-[#1d1815]"
                      onClick={onWalletOpen}
                    >
                      <IoWalletOutline
                        className={cn(
                          'size-6',
                          isPro ? 'text-[#1d1815]' : 'text-[#123a33]',
                        )}
                      />
                      <span
                        className={cn(
                          'font-secondary absolute top-px -right-1.5 block rounded-md px-1 py-px text-[10px] font-bold tracking-tight text-[#f4eee3]',
                          isPro ? 'bg-[#1d1815]' : 'bg-[#123a33]',
                        )}
                      >
                        ${formatNumberWithSuffix(walletBalance || 0, 1, false)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
              {!isDashboardRoute && <UserMenu />}
            </div>
          )}

          {authUiReady && !authenticated && (
            <div className="ph-no-capture flex items-center gap-2">
              <div className="flex items-center gap-0">
                {!hideSponsorCTA && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="font-secondary text-[11px] font-bold tracking-[0.1em] text-[#1d1815] uppercase hover:bg-[#1d1815]/5 hover:text-[#1d1815]"
                    onClick={() => {
                      posthog.capture('create a listing_navbar');
                      router.push('/earn/sponsor');
                    }}
                  >
                    <span>Become a Sponsor</span>
                    <div className="block size-1.5 bg-[#e6a12b]" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="font-secondary text-[11px] font-bold tracking-[0.1em] text-[#1d1815] uppercase hover:bg-[#1d1815]/5 hover:text-[#1d1815]"
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
                className="font-secondary my-1 w-full border-2 border-[#1d1815] bg-[#ce4a2b] px-4 text-[11px] font-bold tracking-[0.08em] text-[#f4eee3] uppercase shadow-[3px_3px_0_#1d1815] transition-all duration-150 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-[#ce4a2b] hover:text-[#f4eee3] hover:shadow-[5px_5px_0_#1d1815]"
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
