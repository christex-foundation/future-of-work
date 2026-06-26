import { useMutation } from '@tanstack/react-query';
import { CheckCircle2, Send } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { FormLabel } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { api } from '@/lib/api';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const validateEmail = (email: string) => {
  return String(email)
    .toLowerCase()
    .match(
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
    );
};

export function InviteMembers({ isOpen, onClose }: Props) {
  const [email, setEmail] = useState<string>('');
  const [memberType, setMemberType] = useState<string>('MEMBER');

  const inviteMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post('/api/member-invites/send/', {
        email,
        memberType,
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Invite sent successfully');
    },
    onError: (error) => {
      console.error('Invite error:', error);
      toast.error('Failed to send invite. Please try again.');
    },
  });

  const handleInput = (emailString: string) => {
    const isEmail = validateEmail(emailString);
    if (isEmail) {
      setEmail(emailString.toLowerCase());
    } else {
      setEmail('');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="m-0 border border-[#E6DCC9] bg-[#FFFDF8] p-0 shadow-[0_28px_80px_-58px_rgba(54,38,22,0.55)]"
        hideCloseIcon
      >
        <DialogTitle className="text-md font-serif -mb-1 px-6 pt-4 font-semibold text-[#221A14]">
          Invite Member
        </DialogTitle>
        <Separator />

        {inviteMutation.isSuccess ? (
          <div className="px-6 pb-6 text-[0.95rem]">
            <div className="py-6 text-center">
              <CheckCircle2 className="mx-auto mb-3 h-12 w-12 text-[#2C3A2E]" />
              <h3 className="font-serif mb-2 text-lg font-semibold text-[#221A14]">
                Invite Sent!
              </h3>
              <p className="text-sm text-[#5C5147]">
                Your team member will receive an email with a link to join
                Superteam Earn.
              </p>
            </div>
            <div className="flex justify-end">
              <Button variant="ghost" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        ) : (
          <div className="px-6 pb-6 text-[0.95rem]">
            <div className="mb-6 space-y-4">
              <div>
                <FormLabel className="font-medium">Add Email Address</FormLabel>
                <Input
                  className="mt-1 border-[#E6DCC9] bg-[#FFFDF8] text-[#221A14] placeholder-[#5C5147] focus-visible:border-[#8FA37E] focus-visible:ring-[#8FA37E]"
                  onChange={(e) => handleInput(e.target.value)}
                  type="email"
                  placeholder="Enter email address"
                />
                {inviteMutation.isError && (
                  <p className="mt-1 text-sm text-[#C4502E]">
                    Sorry! Error occurred while sending invite.
                  </p>
                )}
              </div>
              <div className="mt-6">
                <FormLabel>Member Type</FormLabel>
                <RadioGroup
                  value={memberType}
                  onValueChange={(value) => setMemberType(value)}
                  className="mt-1"
                >
                  <Label
                    htmlFor="member"
                    className="flex cursor-pointer items-center space-x-2 rounded-md px-2 py-1 hover:bg-[#F2EAD9]"
                  >
                    <RadioGroupItem
                      value="MEMBER"
                      id="member"
                      className="text-[#2C3A2E]"
                    />
                    <div className="ml-2">
                      <p className="text-sm font-medium text-[#221A14]">
                        Member
                      </p>
                      <p className="text-xs">
                        Members can manage listings, submissions, winner
                        announcements and payments.
                      </p>
                    </div>
                  </Label>

                  <Label
                    htmlFor="admin"
                    className="flex cursor-pointer items-center space-x-2 rounded-md px-2 py-1 hover:bg-[#F2EAD9]"
                  >
                    <RadioGroupItem
                      value="ADMIN"
                      id="admin"
                      className="text-[#2C3A2E]"
                    />
                    <div className="ml-2">
                      <p className="text-sm font-medium text-[#221A14]">
                        Member Admin
                      </p>
                      <p className="text-xs">
                        Admins can add or remove anyone from the team, in
                        addition to having all Member privileges.
                      </p>
                    </div>
                  </Label>
                </RadioGroup>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="w-1/2" />
              <Button
                variant="ghost"
                onClick={onClose}
                disabled={inviteMutation.isPending}
                className="rounded-full text-[#5C5147] hover:bg-[#F2EAD9] hover:text-[#221A14]"
              >
                Close
              </Button>
              <Button
                disabled={!email || inviteMutation.isPending}
                onClick={() => inviteMutation.mutate()}
                className="rounded-full bg-[#2C3A2E] text-[#FBF7EF] hover:bg-[#3C4D3D]"
              >
                {inviteMutation.isPending ? (
                  <>
                    <span className="loading loading-spinner mr-2" />
                    <span>Inviting...</span>
                  </>
                ) : (
                  <>
                    <Send className="mr-2 size-4" />
                    Send Invite
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
