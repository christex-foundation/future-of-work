import posthog from 'posthog-js';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { api } from '@/lib/api';
import { useUser } from '@/store/user';

interface AlertOptionProps {
  title: string;
  category: string;
  selectedCategories: string[];
  onCategoryChange: (category: string) => void;
}

const AlertOption = ({
  title,
  category,
  selectedCategories,
  onCategoryChange,
}: AlertOptionProps) => (
  <div className="flex items-center justify-between">
    <p className="mt-1 font-primary font-medium text-[#6b5e50]">{title}</p>
    <Switch
      autoFocus={false}
      className="mt-0.5"
      checked={selectedCategories.includes(category)}
      onCheckedChange={() => onCategoryChange(category)}
    />
  </div>
);

export const EmailSettingsModal = ({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) => {
  const { user, refetchUser } = useUser();

  const emailSettings = user?.emailSettings || [];
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    emailSettings.map((setting) => setting.category),
  );
  const [isUpdating, setIsUpdating] = useState(false);

  const handleCategoryChange = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category],
    );
  };

  const updateEmailSettings = async () => {
    try {
      posthog.capture('confirm_email preferences');
      setIsUpdating(true);
      await api.post('/api/user/update-email-settings', {
        categories: selectedCategories,
      });

      await refetchUser();
      setIsUpdating(false);
      onClose();
      toast.success('Email preferences updated');
    } catch (error) {
      console.error('Error updating email preferences:', error);
      toast.error('Failed to update email preferences.');
      setIsUpdating(false);
    }
  };

  const showSponsorAlerts = user?.currentSponsorId;
  const showTalentAlerts = user?.isTalentFilled;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="rounded-none border-2 border-[#1d1815] bg-[#FBF7EE] p-2 shadow-[6px_6px_0_#1d1815]">
        <div className="px-3 py-6 sm:px-6">
          <h2 className="font-serif text-2xl font-semibold text-[#1d1815]">
            Update Email Preferences
          </h2>
          <p className="mt-1 font-primary font-medium text-[#6b5e50]">
            Tell us which emails you would like to receive!
          </p>
          {showSponsorAlerts && (
            <div className="mt-6">
              <p className="font-secondary mt-6 mb-1 text-[11px] font-bold tracking-[0.2em] text-[#6b5e50] uppercase">
                SPONSOR ALERTS
              </p>
              <AlertOption
                title="New submissions received for your listing"
                category="submissionSponsor"
                selectedCategories={selectedCategories}
                onCategoryChange={handleCategoryChange}
              />
              <AlertOption
                title="Comments Received on your listing"
                category="commentSponsor"
                selectedCategories={selectedCategories}
                onCategoryChange={handleCategoryChange}
              />
              <AlertOption
                title="Deadline related reminders"
                category="deadlineSponsor"
                selectedCategories={selectedCategories}
                onCategoryChange={handleCategoryChange}
              />
            </div>
          )}
          {showTalentAlerts && (
            <div className="mt-6">
              <p className="font-secondary mt-6 mb-1 text-[11px] font-bold tracking-[0.2em] text-[#6b5e50] uppercase">
                TALENT ALERTS
              </p>
              <AlertOption
                title="Weekly Roundup of new listings"
                category="weeklyListingRoundup"
                selectedCategories={selectedCategories}
                onCategoryChange={handleCategoryChange}
              />
              <AlertOption
                title="New listings added for my skills"
                category="createListing"
                selectedCategories={selectedCategories}
                onCategoryChange={handleCategoryChange}
              />
              <AlertOption
                title="Likes and comments on my submissions"
                category="commentOrLikeSubmission"
                selectedCategories={selectedCategories}
                onCategoryChange={handleCategoryChange}
              />
              <AlertOption
                title="Sponsor Invitation Emails (Scout)"
                category="scoutInvite"
                selectedCategories={selectedCategories}
                onCategoryChange={handleCategoryChange}
              />
            </div>
          )}
          {(showTalentAlerts || showSponsorAlerts) && (
            <div className="mt-6">
              <p className="font-secondary mt-6 mb-1 text-[11px] font-bold tracking-[0.2em] text-[#6b5e50] uppercase">
                GENERAL ALERTS
              </p>
              <AlertOption
                title="Comment replies and tags"
                category="replyOrTagComment"
                selectedCategories={selectedCategories}
                onCategoryChange={handleCategoryChange}
              />
              <AlertOption
                title="Product updates and newsletters"
                category="productAndNewsletter"
                selectedCategories={selectedCategories}
                onCategoryChange={handleCategoryChange}
              />
            </div>
          )}
        </div>

        <div className="px-2 sm:px-4">
          <Button
            className="ph-no-capture mb-3 w-full rounded-none border-2 border-[#1d1815] bg-[#e6a12b] text-[#1d1815] shadow-[3px_3px_0_#1d1815] hover:translate-x-[1px] hover:translate-y-[1px] hover:bg-[#e6a12b] hover:shadow-[1px_1px_0_#1d1815]"
            disabled={isUpdating}
            onClick={updateEmailSettings}
          >
            {isUpdating ? (
              <span>Updating Preferences..</span>
            ) : (
              <span>Update Preferences →</span>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
