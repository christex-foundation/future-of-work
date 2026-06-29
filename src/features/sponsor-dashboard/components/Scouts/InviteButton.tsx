import { useMutation } from '@tanstack/react-query';
import { Check, Plus } from 'lucide-react';
import posthog from 'posthog-js';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { cn } from '@/utils/cn';

interface Props {
  bountyId: string;
  userId: string;
  invited: boolean;
  setInvited: (value: string) => void;
  maxInvitesReached: boolean;
  invitesLeft: number;
}

export function InviteButton({
  bountyId,
  userId,
  invited,
  setInvited,
  maxInvitesReached,
  invitesLeft,
}: Props) {
  const inviteMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post(
        `/api/sponsor-dashboard/listing/${bountyId}/scout/invite/${userId}`,
      );
      return response.data;
    },
    onSuccess: () => {
      setInvited(userId);
      posthog.capture('invited talent_scout', {
        invitedUser: userId,
      });
      const invites = invitesLeft - 1;
      toast.success(
        `Invite sent. ${invites} Invite${invites === 1 ? '' : 's'} Remaining`,
      );
    },
    onError: (error) => {
      console.error('Invite error:', error);
      toast.error('Invite failed, please try again later');
    },
  });

  const handleInvite = () => {
    inviteMutation.mutate();
  };

  return (
    <Button
      onClick={handleInvite}
      disabled={invited || maxInvitesReached}
      className={cn(
        'ph-no-capture h-full gap-2 rounded-md text-xs font-semibold',
        'bg-[#2C3A2E] text-[#FBF7EF] hover:bg-[#3C4D3D]',
        'disabled:cursor-not-allowed disabled:bg-[#F2EAD9] disabled:text-[#5C5147]',
      )}
      {...(inviteMutation.isPending && { 'aria-disabled': true })}
    >
      {invited ? (
        <>
          <Check strokeLinecap="square" strokeWidth={3} />
          <span>Invited</span>
        </>
      ) : (
        <>
          <Plus strokeLinecap="square" strokeWidth={3} />
          <span>Invite</span>
        </>
      )}
    </Button>
  );
}
