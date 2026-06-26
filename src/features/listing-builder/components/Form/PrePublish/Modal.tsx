import { useIsFetching, useQuery } from '@tanstack/react-query';
import { useAtomValue, useSetAtom } from 'jotai';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/router';
import posthog from 'posthog-js';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Tooltip } from '@/components/ui/tooltip';
import { useUser } from '@/store/user';

import { isCreateListingAllowedQuery } from '@/features/listing-builder/queries/is-create-allowed';

import {
  confirmModalAtom,
  isDraftSavingAtom,
  isEditingAtom,
  isSTAtom,
  listingStatusAtom,
  showFirstPublishSurveyAtom,
  submitListingMutationAtom,
} from '../../../atoms';
import { useListingForm } from '../../../hooks';

export function PrePublish() {
  const isST = useAtomValue(isSTAtom);
  const form = useListingForm();
  const status = useAtomValue(listingStatusAtom);

  const isSlugLoading = useIsFetching({ queryKey: ['slug'] }) > 0;

  const isDraftSaving = useAtomValue(isDraftSavingAtom);
  const setConfirmModal = useSetAtom(confirmModalAtom);
  const setShowFirstPublishSurvey = useSetAtom(showFirstPublishSurveyAtom);

  const isEditing = useAtomValue(isEditingAtom);
  const submitListingMutation = useAtomValue(submitListingMutationAtom);

  const router = useRouter();

  const { user } = useUser();

  const {
    data: isCreateListingAllowed,
    refetch: isCreateListingAllowedRefetch,
  } = useQuery(isCreateListingAllowedQuery);

  useEffect(() => {
    isCreateListingAllowedRefetch();
  }, [user]);

  const isDisabledHard = useMemo(
    () =>
      (isCreateListingAllowed !== undefined &&
        isCreateListingAllowed === false &&
        user?.role !== 'GOD' &&
        !isEditing) ||
      status === 'verification failed' ||
      status === 'blocked',
    [isCreateListingAllowed, isEditing, status],
  );

  const [isDisabledSoft, setIsDisabledSoft] = useState(true);

  useEffect(() => {
    if (router.pathname.includes('/earn/dashboard/new')) {
      form.setValue('isPrivate', false);
      form.setValue('agentAccess', 'HUMAN_ONLY');
      form.setValue('region', 'Sierra Leone');
      form.setValue('isFndnPaying', false);
      form.setValue('isPro', false);
    }
  }, [isST, router.pathname]);

  useEffect(() => {
    const shouldBeDisabled =
      isDraftSaving ||
      submitListingMutation.isPending ||
      isDisabledHard ||
      submitListingMutation.isSuccess ||
      isSlugLoading;

    if (shouldBeDisabled) {
      setIsDisabledSoft(true);
    } else {
      const timer = setTimeout(() => {
        setIsDisabledSoft(false);
      }, 500);
      return () => clearTimeout(timer);
    }
    return () => null;
  }, [
    isDraftSaving,
    submitListingMutation.isPending,
    submitListingMutation.isSuccess,
    isDisabledHard,
    isSlugLoading,
  ]);

  const isDisabledSoftForButtons = useMemo(
    () => !!form.formState.errors.slug || isDisabledSoft,
    [form.formState.errors.slug, isDisabledSoft],
  );

  const isUpdate = useMemo(
    () => !!isEditing || status === 'verifying',
    [isEditing, status],
  );

  const submitWithFixedSettings = async () => {
    posthog.capture('basics_sponsor');
    form.setValue('isPrivate', false, { shouldDirty: true });
    form.setValue('agentAccess', 'HUMAN_ONLY', { shouldDirty: true });
    form.setValue('region', 'Sierra Leone', {
      shouldDirty: true,
      shouldValidate: true,
    });
    form.setValue('isFndnPaying', false, { shouldDirty: true });
    form.setValue('isPro', false, { shouldDirty: true });

    if (!(await form.validateBasics()) || !(await form.trigger())) {
      toast.warning('Please resolve all errors to continue');
      return;
    }

    try {
      setShowFirstPublishSurvey(false);
      const data = await form.submitListing();
      if (isEditing) {
        posthog.capture('update listing_sponsor');
        router.push('/earn/dashboard/listings');
        toast.success('Listing Updated Successfully', {
          description: 'Redirecting to dashboard',
        });
      } else {
        if (isUpdate) posthog.capture('update listing_sponsor');
        else posthog.capture('publish listing_sponsor');
        if (data.status === 'VERIFYING') {
          setShowFirstPublishSurvey(false);
          setConfirmModal('VERIFICATION_SHOW_FORM');
        } else {
          setShowFirstPublishSurvey(!!data.isFirstPublishedListing);
          setConfirmModal('SUCCESS');
        }
      }
    } catch (error) {
      console.log(error);
      toast.error('Failed to create listing, please try again later', {});
    }
  };

  return (
    <Tooltip
      content={
        status === 'verification failed' || status === 'blocked' ? (
          <p>Editing this listing is blocked</p>
        ) : (
          <p>
            Creating a new listing has been temporarily locked for you since you
            have 5 listings which are &quot;In Review&quot;. Please announce the
            winners for such listings to create new listings.
          </p>
        )
      }
      disabled={!isDisabledHard}
    >
      <Button
        className="ph-no-capture bg-[#2C3A2E] px-6 text-white hover:bg-[#3C4D3D]"
        disabled={isDisabledSoftForButtons}
        onClick={submitWithFixedSettings}
      >
        {submitListingMutation.isPending || submitListingMutation.isSuccess ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : isUpdate ? (
          <span>Update</span>
        ) : (
          <span>Publish</span>
        )}
      </Button>
    </Tooltip>
  );
}
