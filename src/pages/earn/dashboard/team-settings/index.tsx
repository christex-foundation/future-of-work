import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import debounce from 'lodash.debounce';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Lock,
  MoreHorizontal,
  Plus,
  Search,
} from 'lucide-react';
import posthog from 'posthog-js';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

import { VerifiedBadgeLarge } from '@/components/shared/VerifiedBadge';
import { Button } from '@/components/ui/button';
import { CopyButton } from '@/components/ui/copy-tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip } from '@/components/ui/tooltip';
import { useDisclosure } from '@/hooks/use-disclosure';
import type { UserSponsor } from '@/interface/userSponsor';
import { SponsorLayout } from '@/layouts/Sponsor';
import { api } from '@/lib/api';
import { type Role } from '@/prisma/enums';
import { useUser } from '@/store/user';
import { cn } from '@/utils/cn';

import { InviteMembers } from '@/features/sponsor-dashboard/components/Members/InviteMembers';
import { MembersTableSkeleton } from '@/features/sponsor-dashboard/components/Members/MembersTableSkeleton';
import { membersQuery } from '@/features/sponsor-dashboard/queries/members';
import { EarnAvatar } from '@/features/talent/components/EarnAvatar';

const ROLE_OPTIONS: ReadonlyArray<{
  value: Role;
  label: string;
}> = [
  {
    value: 'MEMBER',
    label: 'Member',
  },
  {
    value: 'ADMIN',
    label: 'Admin',
  },
] as const;

const getRoleLabel = (role: Role) => (role === 'ADMIN' ? 'Admin' : 'Member');

const COLS = 'grid-cols-[1.7fr_0.9fr_1.6fr_auto]';

function RoleChip({ role }: { role?: Role | null }) {
  const isAdmin = role === 'ADMIN';
  return (
    <span
      className={cn(
        'font-secondary inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[10px] font-bold tracking-[0.1em] uppercase',
        isAdmin
          ? 'bg-[#123a33] text-[#f4eee3]'
          : 'border border-[#1d1815]/30 text-[#6b5e50]',
      )}
    >
      <span
        className="size-1.5"
        style={{ background: isAdmin ? '#e6a12b' : '#6b5e50' }}
      />
      {isAdmin ? 'Admin' : 'Member'}
    </span>
  );
}

const Index = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { user } = useUser();
  const [searchText, setSearchText] = useState('');
  const [skip, setSkip] = useState(0);
  const length = 15;

  const queryClient = useQueryClient();

  const debouncedSetSearchTextRef = useRef<
    ReturnType<typeof debounce> | undefined
  >(undefined);

  useEffect(() => {
    debouncedSetSearchTextRef.current = debounce(setSearchText, 300);

    return () => {
      debouncedSetSearchTextRef.current?.cancel();
    };
  }, [setSearchText]);

  useEffect(() => {
    posthog.capture('members tab_sponsor');
  }, []);

  const { data: membersData, isLoading: isMembersLoading } = useQuery(
    membersQuery({
      searchText,
      skip,
      length,
      currentSponsorId: user?.currentSponsorId,
    }),
  );

  const totalMembers = membersData?.total || 0;
  const members = membersData?.data || [];

  const sponsor = user?.currentSponsor;
  const sponsorName = sponsor?.name ?? '';

  const isAdminLoggedIn = useMemo(() => {
    if (user?.role === 'GOD') return true;

    const userSponsor = user?.UserSponsors?.find(
      (s) => s.sponsorId === user.currentSponsorId,
    );
    if (
      user === undefined ||
      user?.UserSponsors === undefined ||
      userSponsor === undefined
    ) {
      return false;
    }

    return userSponsor.role === 'ADMIN';
  }, [user]);

  const invalidateMemberData = async () => {
    await queryClient.invalidateQueries({
      queryKey: ['members', user?.currentSponsorId],
    });
  };

  const removeMemberMutation = useMutation({
    mutationFn: async (userId: string) => {
      await api.post('/api/sponsor-dashboard/members/remove', {
        id: userId,
      });
    },
    onSuccess: async () => {
      await invalidateMemberData();
      toast.success('Member removed successfully');
    },
    onError: (error) => {
      console.error('Error removing member:', error);
      toast.error('Failed to remove member. Please try again.');
    },
  });

  const updateMemberRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: Role }) => {
      await api.post('/api/sponsor-dashboard/members/update-role', {
        id: userId,
        role,
      });
    },
    onSuccess: async (_data, variables) => {
      await invalidateMemberData();
      toast.success(
        `${getRoleLabel(variables.role)} role updated successfully`,
      );
    },
    onError: (error) => {
      console.error('Error updating member role:', error);
      toast.error('Failed to update role. Please try again.');
    },
  });

  const onRemoveMember = async (userId: string) => {
    await removeMemberMutation.mutateAsync(userId);
  };

  const onChangeMemberRole = async (userId: string, role: Role) => {
    await updateMemberRoleMutation.mutateAsync({ userId, role });
  };

  const inviteButton = isAdminLoggedIn ? (
    <button
      type="button"
      className="ph-no-capture font-secondary flex items-center gap-2 rounded-md border-2 border-[#1d1815] bg-[#ce4a2b] px-4 py-2.5 text-[12px] font-bold tracking-[0.08em] text-[#f4eee3] uppercase shadow-[3px_3px_0_#1d1815] transition-all duration-150 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0_#1d1815]"
      onClick={() => {
        posthog.capture('invite member_sponsor');
        onOpen();
      }}
    >
      <Plus className="size-4" />
      Invite members
    </button>
  ) : (
    <Tooltip
      content="Only Admins can invite new members to a sponsor profile. Please ask one of your Admins to invite a new user."
      contentProps={{ side: 'bottom' }}
    >
      <button
        type="button"
        disabled
        className="ph-no-capture font-secondary flex cursor-not-allowed items-center gap-2 rounded-md border-2 border-[#1d1815]/30 px-4 py-2.5 text-[12px] font-bold tracking-[0.08em] text-[#6b5e50] uppercase"
      >
        <Lock className="size-4" />
        Invite members
      </button>
    </Tooltip>
  );

  return (
    <SponsorLayout>
      {isOpen && <InviteMembers isOpen={isOpen} onClose={onClose} />}

      <div className="pb-10">
        {/* header */}
        <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="font-secondary flex items-center gap-2.5 text-[11px] font-bold tracking-[0.26em] text-[#CE4A2B] uppercase">
              <span className="inline-block h-0.5 w-6 bg-[#CE4A2B]" />
              Team{sponsorName ? ` · ${sponsorName}` : ''}
            </div>
            <h1 className="font-serif mt-3.5 text-[clamp(30px,3.4vw,42px)] leading-[1.02] font-semibold tracking-[-0.02em] text-[#1D1815]">
              Team members
            </h1>
            <p className="mt-2.5 max-w-[460px] text-[15px] leading-relaxed text-[#6B5E50]">
              Manage who can access your sponsor profile.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* org identity */}
            {!!sponsor && (
              <div className="flex items-center gap-2.5 rounded-xl border-2 border-[#1d1815] bg-[#f4eee3] px-3.5 py-2.5 shadow-[3px_3px_0_#1d1815]">
                <EarnAvatar
                  className="size-8 rounded-md object-contain"
                  id={sponsorName}
                  avatar={sponsor?.logo}
                />
                <div className="flex items-center gap-1.5">
                  <span className="font-secondary max-w-[160px] truncate text-[12px] font-bold tracking-[0.06em] text-[#1d1815] uppercase">
                    {sponsorName}
                  </span>
                  {!!sponsor?.isVerified && (
                    <VerifiedBadgeLarge className="text-[#123a33]" />
                  )}
                </div>
              </div>
            )}

            {inviteButton}
          </div>
        </div>

        {/* controls */}
        <div className="mb-5 flex flex-wrap items-center gap-3">
          <span className="font-secondary rounded-full border border-[#1d1815]/20 bg-[#ECE2D2] px-3.5 py-1.5 text-[11px] font-bold tracking-[0.1em] text-[#6b5e50] uppercase">
            {totalMembers} member{totalMembers === 1 ? '' : 's'}
          </span>
          <div className="flex-1" />
          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-[#6b5e50]" />
            <input
              className="font-secondary h-10 w-full rounded-full border border-[#1d1815]/25 bg-[#FBF7EE] pr-4 pl-10 text-[13px] text-[#1d1815] transition-colors placeholder:text-[#6b5e50] focus:border-[#ce4a2b] focus:ring-2 focus:ring-[#ce4a2b]/25 focus:outline-none"
              onChange={(e) => {
                debouncedSetSearchTextRef.current?.(e.target.value);
              }}
              placeholder="Search members…"
              type="text"
            />
          </div>
        </div>

        {/* loading */}
        {isMembersLoading && <MembersTableSkeleton rows={4} />}

        {/* empty */}
        {!isMembersLoading && !members?.length && (
          <div className="mt-12 flex flex-col items-center rounded-xl border-2 border-dashed border-[#1d1815]/30 py-16 text-center">
            <p className="font-serif text-[22px] font-semibold text-[#1d1815]">
              {searchText ? 'No members match that search' : 'No members yet'}
            </p>
            <p className="mt-1.5 text-[#6b5e50]">
              {searchText
                ? 'Try a different name or username.'
                : 'Invite teammates to help manage your listings.'}
            </p>
            {!searchText && isAdminLoggedIn && (
              <button
                type="button"
                onClick={() => {
                  posthog.capture('invite member_sponsor');
                  onOpen();
                }}
                className="ph-no-capture font-secondary mt-6 flex items-center gap-2 rounded-md border-2 border-[#1d1815] bg-[#ce4a2b] px-5 py-2.5 text-[12px] font-bold tracking-[0.08em] text-[#f4eee3] uppercase shadow-[3px_3px_0_#1d1815] transition-all duration-150 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0_#1d1815]"
              >
                <Plus className="size-4" />
                Invite members
              </button>
            )}
          </div>
        )}

        {/* ledger */}
        {!isMembersLoading && !!members?.length && (
          <div className="overflow-hidden rounded-xl border-2 border-[#1d1815] bg-[#f4eee3] shadow-[5px_5px_0_#1d1815]">
            {/* header row */}
            <div
              className={cn(
                'font-secondary grid items-center gap-4 border-b-2 border-[#1d1815] bg-[#ECE2D2] px-5 py-3 text-[10px] font-bold tracking-[0.14em] text-[#6b5e50] uppercase',
                COLS,
              )}
            >
              <span>Member</span>
              <span>Role</span>
              <span>Email</span>
              <span className="w-8" />
            </div>

            {members.map((member: UserSponsor, i: number) => {
              const isCurrentUser =
                member.userId === user?.id ||
                member.user?.email === user?.email;
              return (
                <div
                  key={member?.userId}
                  className={cn(
                    'grid items-center gap-4 px-5 py-4 transition-colors hover:bg-[#1d1815]/[0.03]',
                    COLS,
                    i !== members.length - 1 &&
                      'border-b border-dashed border-[#1d1815]/25',
                  )}
                >
                  {/* member */}
                  <div className="flex min-w-0 items-center gap-3">
                    <EarnAvatar
                      className="size-9 shrink-0 rounded-md"
                      id={member?.user?.id}
                      avatar={member?.user?.photo}
                    />
                    <div className="min-w-0">
                      <p className="flex items-center gap-1.5 truncate text-[14px] font-bold text-[#1d1815]">
                        <span className="truncate">
                          {`${member?.user?.firstName ?? ''} ${member?.user?.lastName ?? ''}`.trim() ||
                            '—'}
                        </span>
                        {isCurrentUser && (
                          <span className="font-secondary shrink-0 rounded bg-[#E6A12B] px-1.5 py-0.5 text-[9px] font-bold tracking-[0.1em] text-[#1d1815] uppercase">
                            You
                          </span>
                        )}
                      </p>
                      <p className="truncate text-[12px] text-[#6b5e50]">
                        @{member?.user?.username}
                      </p>
                    </div>
                  </div>

                  {/* role */}
                  <div>
                    <RoleChip role={member?.role} />
                  </div>

                  {/* email */}
                  <div className="min-w-0 text-[13px] text-[#1d1815]">
                    <CopyButton
                      text={member?.user?.email || ''}
                      contentProps={{ side: 'right' }}
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="truncate">{member?.user?.email}</span>
                        <Copy className="size-3.5 shrink-0 cursor-pointer text-[#6b5e50]" />
                      </div>
                    </CopyButton>
                  </div>

                  {/* actions */}
                  <MemberActionsMenu
                    member={member}
                    isAdminLoggedIn={isAdminLoggedIn}
                    onRemoveMember={onRemoveMember}
                    onChangeMemberRole={onChangeMemberRole}
                    isRemovingMember={
                      removeMemberMutation.isPending &&
                      removeMemberMutation.variables === member.userId
                    }
                    isUpdatingMemberRole={
                      updateMemberRoleMutation.isPending &&
                      updateMemberRoleMutation.variables?.userId ===
                        member.userId
                    }
                  />
                </div>
              );
            })}
          </div>
        )}

        {/* pagination */}
        {!isMembersLoading && !!members?.length && (
          <div className="mt-7 flex items-center justify-end">
            <p className="mr-4 text-sm text-[#6B5E50]">
              <span className="font-bold text-[#1D1815]">{skip + 1}</span> -{' '}
              <span className="font-bold text-[#1D1815]">
                {Math.min(skip + length, totalMembers)}
              </span>{' '}
              of <span className="font-bold text-[#1D1815]">{totalMembers}</span>{' '}
              members
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                size="sm"
                disabled={skip <= 0}
                onClick={() =>
                  skip >= length ? setSkip(skip - length) : setSkip(0)
                }
                className="rounded-full border-[#1d181522] bg-[#FBF7EE] text-[#1D1815] hover:bg-[#ECE2D2]"
              >
                <ChevronLeft className="mr-1 size-4" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={
                  totalMembers <= skip + length ||
                  (skip > 0 && skip % length !== 0)
                }
                onClick={() => skip % length === 0 && setSkip(skip + length)}
                className="rounded-full border-[#1d181522] bg-[#FBF7EE] text-[#1D1815] hover:bg-[#ECE2D2]"
              >
                Next
                <ChevronRight className="ml-1 size-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </SponsorLayout>
  );
};

const MemberActionsMenu = ({
  member,
  isAdminLoggedIn,
  onRemoveMember,
  onChangeMemberRole,
  isRemovingMember,
  isUpdatingMemberRole,
}: {
  member: UserSponsor;
  isAdminLoggedIn: boolean;
  onRemoveMember: (userId: string) => Promise<void>;
  onChangeMemberRole: (userId: string, role: Role) => Promise<void>;
  isRemovingMember: boolean;
  isUpdatingMemberRole: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useUser();
  const currentRole = member.role ?? 'MEMBER';

  const isCurrentUser = useMemo(
    () => member.userId === user?.id || member.user?.email === user?.email,
    [member.user?.email, member.userId, user?.email, user?.id],
  );

  const canManageMember = isAdminLoggedIn && !isCurrentUser;

  const handleRemoveMember = async () => {
    if (!member.userId) return;

    try {
      await onRemoveMember(member.userId);
      setIsOpen(false);
    } catch {
      return;
    }
  };

  const handleRoleChange = async (role: Role) => {
    if (!member.userId || role === currentRole) return;

    try {
      await onChangeMemberRole(member.userId, role);
      setIsOpen(false);
    } catch {
      return;
    }
  };

  return (
    <div className="flex w-8 items-center justify-end">
      {canManageMember && (
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="size-8 rounded-md text-[#6b5e50] hover:bg-[#1d1815]/5 hover:text-[#1d1815]"
              aria-label={`Manage ${member.user?.email ?? 'member'}`}
            >
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-48 border-[#1d1815]/15"
          >
            <DropdownMenuItem
              disabled={isRemovingMember || isUpdatingMemberRole}
              className="text-[#a6371c] focus:text-[#a6371c]"
              onSelect={(event) => {
                event.preventDefault();
                void handleRemoveMember();
              }}
            >
              {isRemovingMember ? 'Removing...' : 'Remove from team'}
            </DropdownMenuItem>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger
                disabled={isUpdatingMemberRole || isRemovingMember}
              >
                Change role
              </DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent className="w-40 border-[#1d1815]/15">
                  {ROLE_OPTIONS.map((roleOption) => (
                    <DropdownMenuItem
                      key={roleOption.value}
                      disabled={isUpdatingMemberRole}
                      className="justify-between"
                      onSelect={(event) => {
                        event.preventDefault();
                        void handleRoleChange(roleOption.value);
                      }}
                    >
                      <span>{roleOption.label}</span>
                      {currentRole === roleOption.value && (
                        <Check className="size-4 text-[#6b5e50]" />
                      )}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
};

export default Index;
