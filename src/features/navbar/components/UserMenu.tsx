import {
  Bookmark,
  ChevronDown,
  CircleHelp,
  LayoutDashboard,
  LogOut,
  Mail,
  Plus,
  SquarePen,
  User as UserIcon,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import posthog from 'posthog-js';
import { useEffect } from 'react';

import { SupportFormDialog } from '@/components/shared/SupportFormDialog';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useDisclosure } from '@/hooks/use-disclosure';
import { useLogout, useUser } from '@/store/user';
import { cn } from '@/utils/cn';

import { EarnAvatar } from '@/features/talent/components/EarnAvatar';
import { EmailSettingsModal } from '@/features/talent/components/EmailSettingsModal';

const rowCls =
  'flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-sm tracking-tight text-[#221A14] focus:bg-[#F2EAD9] focus:text-[#221A14] [&_svg]:size-4 [&_svg]:text-[#6B7A4F]';

export function UserMenu({
  variant = 'navbar',
}: {
  variant?: 'navbar' | 'rail';
}) {
  const router = useRouter();

  const { user, isLoading } = useUser();
  const logout = useLogout();
  const { isOpen, onClose, onOpen } = useDisclosure();

  const isRail = variant === 'rail';

  useEffect(() => {
    const checkHashAndOpenModal = () => {
      const url = window.location.href;
      const hashIndex = url.indexOf('#');
      const afterHash = hashIndex !== -1 ? url.substring(hashIndex + 1) : '';
      const [hashValue] = afterHash.split('?');
      const hashHasEmail = hashValue === 'emailPreferences';
      if (hashHasEmail) {
        onOpen();
      }
    };

    checkHashAndOpenModal();
  }, [isOpen, onOpen]);

  const handleClose = async () => {
    await router.replace(
      router.asPath.replace('#emailPreferences', ''),
      undefined,
      { shallow: true },
    );
    onClose();
  };

  if (isLoading) {
    return <></>;
  }

  const displayName = user?.firstName
    ? `${user.firstName}${user.lastName ? ` ${user.lastName}` : ''}`
    : (user?.username ?? 'Your account');

  return (
    <>
      <EmailSettingsModal isOpen={isOpen} onClose={handleClose} />
      {user &&
        !user.currentSponsorId &&
        !user.isTalentFilled &&
        !router.pathname.startsWith('/earn/new') && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              posthog.capture('complete profile_nav bar');
              router.push('/earn/new');
            }}
            className="ph-no-capture flex text-xs"
          >
            Complete your Profile
          </Button>
        )}
      <DropdownMenu>
        <DropdownMenuTrigger
          id="user menu"
          className={cn(
            'ph-no-capture focus:outline-hidden',
            isRail
              ? 'relative grid size-[42px] place-items-center overflow-hidden rounded-[13px] border border-[#E6DCC9] transition-transform duration-200 hover:scale-105'
              : 'rounded-full border border-[#E6DCC9] px-2.5 py-1.5 transition-all duration-150 hover:bg-[#F2EAD9] active:bg-[#E9E0CD] data-[state=open]:bg-[#F2EAD9]',
          )}
          aria-label={isRail ? 'Your profile' : undefined}
          onClick={() => {
            posthog.capture('clicked_user menu');
          }}
        >
          {isRail ? (
            <EarnAvatar
              className="size-full rounded-[11px]"
              id={user?.id}
              avatar={user?.photo}
            />
          ) : (
            <div className="flex items-center gap-1.5">
              <EarnAvatar
                className="size-7"
                id={user?.id}
                avatar={user?.photo}
              />
              <div className="flex items-center">
                <p className="text-sm font-medium tracking-tight text-[#221A14]">
                  {user?.firstName ?? user?.email ?? ''}
                </p>
              </div>
              <ChevronDown className="block size-4 text-[#5C5147]" />
            </div>
          )}
        </DropdownMenuTrigger>

        <DropdownMenuContent
          className="ph-no-capture min-w-[260px] overflow-hidden rounded-2xl border border-[#E6DCC9] bg-[#FBF7EF] p-0 font-medium text-[#221A14] shadow-[0_22px_60px_-34px_rgba(54,38,22,0.5)]"
          align={isRail ? 'end' : 'start'}
          side={isRail ? 'right' : 'bottom'}
          sideOffset={8}
        >
          {/* header — avatar, name, email */}
          <div className="flex items-center gap-3 px-3.5 pt-3.5 pb-3">
            <EarnAvatar
              className="size-9 shrink-0"
              id={user?.id}
              avatar={user?.photo}
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[#221A14]">
                {displayName}
              </p>
              {user?.email && (
                <p className="truncate text-xs font-normal text-[#5C5147]">
                  {user.email}
                </p>
              )}
            </div>
          </div>

          <DropdownMenuSeparator className="my-0 bg-[#E6DCC9]" />

          <div className="p-1.5">
            {user?.isTalentFilled && (
              <>
                <DropdownMenuItem asChild>
                  <Link
                    href={`/earn/t/${user?.username}`}
                    onClick={() => {
                      posthog.capture('profile_user menu');
                    }}
                    className={rowCls}
                  >
                    <UserIcon />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link
                    href={`/earn/t/${user?.username}/edit`}
                    onClick={() => {
                      posthog.capture('edit profile_user menu');
                    }}
                    className={rowCls}
                  >
                    <SquarePen />
                    Edit Profile
                  </Link>
                </DropdownMenuItem>
              </>
            )}

            {!!user?.currentSponsorId && (
              <DropdownMenuItem asChild>
                <Link
                  href="/earn/dashboard/listings"
                  onClick={() => {
                    posthog.capture('sponsor dashboard_user menu');
                  }}
                  className={rowCls}
                >
                  <LayoutDashboard />
                  Dashboard
                </Link>
              </DropdownMenuItem>
            )}

            {user?.role === 'GOD' && (
              <>
                <DropdownMenuLabel className="px-3 pt-2 pb-1 text-[11px] tracking-[0.12em] text-[#6B7A4F] uppercase">
                  God Mode
                </DropdownMenuLabel>
                <DropdownMenuItem asChild>
                  <Link href="/earn/new/sponsor" className={rowCls}>
                    <Plus />
                    Create New Sponsor
                  </Link>
                </DropdownMenuItem>
              </>
            )}

            {(user?.isTalentFilled || !!user?.currentSponsorId) && (
              <DropdownMenuItem
                onClick={() => {
                  onOpen();
                  posthog.capture('email preferences_user menu');
                }}
                className={rowCls}
              >
                <Mail />
                Email Preferences
              </DropdownMenuItem>
            )}

            {user?.isTalentFilled && (
              <DropdownMenuItem asChild>
                <Link
                  href="/earn/bookmarks"
                  onClick={() => {
                    posthog.capture('bookmarks_user menu');
                  }}
                  className={rowCls}
                >
                  <Bookmark />
                  Bookmarks
                </Link>
              </DropdownMenuItem>
            )}

            <SupportFormDialog>
              <DropdownMenuItem
                className={rowCls}
                onSelect={(e) => {
                  e.preventDefault();
                  posthog.capture('get help_user menu');
                }}
              >
                <CircleHelp />
                Get Help
              </DropdownMenuItem>
            </SupportFormDialog>

            <DropdownMenuSeparator className="mx-1 my-1.5 bg-[#E6DCC9]" />

            <DropdownMenuItem
              onClick={() => {
                posthog.capture('logout_user menu');
                logout();
              }}
              className="flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-sm tracking-tight text-[#C4502E] focus:bg-[#C4502E]/10 focus:text-[#C4502E] [&_svg]:size-4 [&_svg]:text-[#C4502E]"
            >
              <LogOut />
              Log out
            </DropdownMenuItem>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
