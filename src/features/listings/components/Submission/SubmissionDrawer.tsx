import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Loader2, Lock, X } from 'lucide-react';
import { useRouter } from 'next/router';
import posthog from 'posthog-js';
import {
  type KeyboardEvent,
  type ReactNode,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { type z } from 'zod';

import { VerifiedXIcon } from '@/components/icons/VerifiedXIcon';
import { RichEditor } from '@/components/shared/RichEditor';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { FormFieldWrapper } from '@/components/ui/form-field-wrapper';
import { Input } from '@/components/ui/input';
import { useDisclosure } from '@/hooks/use-disclosure';
import { useServerTimeSync } from '@/hooks/use-server-time';
import { api } from '@/lib/api';
import { useUser } from '@/store/user';
import { cn } from '@/utils/cn';

import { usePopupAuth } from '@/features/auth/hooks/use-popup-auth';
import { chaptersQuery } from '@/features/chapters/queries/chapters';
import { CreditIcon } from '@/features/credits/icon/credit';
import { SocialInput } from '@/features/social/components/SocialInput';
import { XVerificationModal } from '@/features/social/components/XVerificationModal';
import {
  extractXHandle,
  INVALID_X_STATUS_LINK_MESSAGE,
  isHandleVerified,
  isXInternalStatusUrl,
  isXUrl,
} from '@/features/social/utils/x-verification';

import { submissionCountQuery } from '../../queries/submission-count';
import { userSubmissionQuery } from '../../queries/user-submission-status';
import { type Listing } from '../../types';
import { getCombinedRegion } from '../../utils/region';
import { submissionSchema } from '../../utils/submissionFormSchema';
import { SubmissionTerms } from './SubmissionTerms';

interface Props {
  id: string | undefined;
  isOpen: boolean;
  onClose: () => void;
  editMode: boolean;
  listing: Listing;
  isTemplate?: boolean;
  isSubmitDisabled: boolean;
  showEasterEgg: () => void;
  onSurveyOpen: () => void;
}

type FormData = z.infer<ReturnType<typeof submissionSchema>>;

// One typeform step: kicker + serif question + helper, then its field & nav.
function StepScreen({
  show,
  kicker,
  title,
  help,
  children,
}: {
  show: boolean;
  kicker: string;
  title: ReactNode;
  help?: string;
  children: ReactNode;
}) {
  if (!show) return null;
  return (
    <div className="animate-in fade-in slide-in-from-bottom-3 duration-300">
      <span className="text-[11px] font-semibold tracking-[0.2em] text-[#C4502E] uppercase">
        {kicker}
      </span>
      <h2 className="font-serif mt-3 mb-2 text-[clamp(24px,3.4vw,30px)] leading-[1.12] font-normal tracking-[-0.01em] text-[#221A14]">
        {title}
      </h2>
      {help && <p className="max-w-[46ch] text-sm text-[#5C5147]">{help}</p>}
      <div className="mt-6">{children}</div>
    </div>
  );
}

function StepNav({
  onNext,
  onBack,
  nextLabel = 'OK',
  optional,
}: {
  onNext: () => void;
  onBack?: () => void;
  nextLabel?: string;
  optional?: boolean;
}) {
  return (
    <div className="mt-7 flex items-center gap-4">
      <Button
        type="button"
        onClick={onNext}
        className="h-11 rounded-xl bg-[#2C3A2E] px-6 text-[15px] font-semibold text-[#FBF7EF] shadow-none hover:bg-[#3C4D3D] hover:text-[#FBF7EF]"
      >
        {nextLabel}
      </Button>
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="text-sm font-semibold text-[#5C5147] transition-colors hover:text-[#221A14]"
        >
          &larr; Back
        </button>
      )}
      <span className="ml-auto text-xs text-[#5C5147]">
        {optional ? 'Optional · ' : ''}press{' '}
        <b className="text-[#221A14]">Enter &#8629;</b>
      </span>
    </div>
  );
}

export const SubmissionDrawer = ({
  isOpen,
  onClose,
  editMode,
  listing,
  isTemplate = false,
  isSubmitDisabled,
  showEasterEgg,
  onSurveyOpen,
}: Props) => {
  const {
    id,
    type,
    eligibility,
    compensationType,
    token,
    minRewardAsk,
    maxRewardAsk,
    isFndnPaying,
    region,
    isPro,
  } = listing;
  const { data: chapters = [] } = useQuery(chaptersQuery);

  const queryClient = useQueryClient();
  const isProject = type === 'project';
  const isBounty = type === 'bounty';
  const isHackathon = type === 'hackathon';
  const [isLoading, setIsLoading] = useState(false);
  const [isTOSModalOpen, setIsTOSModalOpen] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [kycAcknowledged, setKycAcknowledged] = useState(false);
  const {
    isOpen: isVerificationModalOpen,
    onOpen: onVerificationModalOpen,
    onClose: onVerificationModalClose,
  } = useDisclosure();
  const [verificationStatus, setVerificationStatus] = useState<
    'loading' | 'error'
  >('loading');
  const [verificationHandle, setVerificationHandle] = useState<string | null>(
    null,
  );

  const { user, refetchUser } = useUser();
  const isNotEligibleForPro = isPro && !user?.isPro;

  const form = useForm<FormData>({
    resolver: zodResolver(
      submissionSchema(listing, minRewardAsk || 0, maxRewardAsk || 0, user),
    ),
    defaultValues: {
      telegram: user?.telegram || '',
      eligibilityAnswers:
        Array.isArray(listing.eligibility) && listing.eligibility.length > 0
          ? listing.eligibility.map((q) => ({
              question: q.question,
              answer: '',
            }))
          : [],
    },
  });

  const router = useRouter();
  const { query } = router;

  const tweetValue = form.watch('tweet');
  const linkValue = form.watch('link');
  const hasInvalidTweetStatusFormat =
    isBounty && !!tweetValue && isXInternalStatusUrl(tweetValue);
  const hasInvalidLinkStatusFormat =
    isBounty && !!linkValue && isXInternalStatusUrl(linkValue);

  const needsXVerification = useMemo(() => {
    if (hasInvalidTweetStatusFormat) {
      return false;
    }

    if (!tweetValue || !isXUrl(tweetValue)) {
      return false;
    }

    const handle = extractXHandle(tweetValue);
    if (!handle) {
      return false;
    }

    const verifiedHandles = user?.linkedTwitter || [];
    return !isHandleVerified(handle, verifiedHandles);
  }, [hasInvalidTweetStatusFormat, tweetValue, user?.linkedTwitter]);

  const needsLinkVerification = useMemo(() => {
    if (hasInvalidLinkStatusFormat) {
      return false;
    }

    if (!linkValue || !isXUrl(linkValue)) {
      return false;
    }

    const handle = extractXHandle(linkValue);
    if (!handle) {
      return false;
    }

    const verifiedHandles = user?.linkedTwitter || [];
    return !isHandleVerified(handle, verifiedHandles);
  }, [hasInvalidLinkStatusFormat, linkValue, user?.linkedTwitter]);

  const isTweetVerified = useMemo(() => {
    if (!tweetValue || !isXUrl(tweetValue)) {
      return false;
    }

    const handle = extractXHandle(tweetValue);
    if (!handle) {
      return false;
    }

    const verifiedHandles = user?.linkedTwitter || [];
    return isHandleVerified(handle, verifiedHandles);
  }, [tweetValue, user?.linkedTwitter]);

  const isLinkVerified = useMemo(() => {
    if (!linkValue || !isXUrl(linkValue)) {
      return false;
    }

    const handle = extractXHandle(linkValue);
    if (!handle) {
      return false;
    }

    const verifiedHandles = user?.linkedTwitter || [];
    return isHandleVerified(handle, verifiedHandles);
  }, [linkValue, user?.linkedTwitter]);

  const regionAckCopy = useMemo(() => {
    if (!region || region === 'Global') {
      return `I acknowledge that if I win, I will have to complete KYC verification to receive my prize money.`;
    }
    const regionObject = getCombinedRegion(region, false, chapters);
    const regionDisplayName =
      regionObject?.displayValue || regionObject?.name || region;
    return `I acknowledge that if I win, I will have to complete KYC verification that proves I am from ${regionDisplayName}`;
  }, [chapters, region]);

  useEffect(() => {
    if (hasInvalidTweetStatusFormat) {
      form.setError('tweet', {
        type: 'manual',
        message: INVALID_X_STATUS_LINK_MESSAGE,
      });
    } else if (needsXVerification) {
      form.setError('tweet', {
        type: 'manual',
        message: 'We need to verify that you own this X account',
      });
    } else {
      form.clearErrors('tweet');
    }

    if (hasInvalidLinkStatusFormat) {
      form.setError('link', {
        type: 'manual',
        message: INVALID_X_STATUS_LINK_MESSAGE,
      });
    } else if (needsLinkVerification) {
      form.setError('link', {
        type: 'manual',
        message: 'We need to verify that you own this X account',
      });
    } else {
      form.clearErrors('link');
    }
  }, [
    hasInvalidTweetStatusFormat,
    hasInvalidLinkStatusFormat,
    needsXVerification,
    needsLinkVerification,
    form,
  ]);

  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  const handleClose = () => {
    form.reset({
      link: '',
      tweet: '',
      otherInfo: '',
      ask: null,
      telegram: user?.telegram || '',
      eligibilityAnswers: Array.isArray(listing.eligibility)
        ? listing.eligibility.map((q) => ({
            question: q.question,
            answer: '',
          }))
        : [],
    });
    setTermsAccepted(false);
    setKycAcknowledged(false);
    onClose();
  };

  useEffect(() => {
    const fetchData = async () => {
      if (editMode && id) {
        try {
          const response = await api.get('/api/submission/get/', {
            params: { id },
          });

          const { link, tweet, otherInfo, eligibilityAnswers, ask, telegram } =
            response.data;

          const reconciledAnswers =
            Array.isArray(listing.eligibility) && listing.eligibility.length > 0
              ? listing.eligibility.map((currentQuestion, index) => {
                  const savedAnswersArray = Array.isArray(eligibilityAnswers)
                    ? (eligibilityAnswers as Array<{
                        question: string;
                        answer: string;
                      }>)
                    : [];

                  const matchByText = savedAnswersArray.find(
                    (saved) => saved.question === currentQuestion.question,
                  );

                  if (matchByText) {
                    return {
                      question: currentQuestion.question,
                      answer: matchByText.answer || '',
                    };
                  }

                  const matchByIndex = savedAnswersArray[index];
                  if (matchByIndex?.answer) {
                    return {
                      question: currentQuestion.question,
                      answer: matchByIndex.answer,
                    };
                  }

                  return {
                    question: currentQuestion.question,
                    answer: '',
                  };
                })
              : [];

          form.reset({
            link,
            tweet,
            otherInfo,
            ask,
            telegram: telegram || user?.telegram || '',
            eligibilityAnswers: reconciledAnswers,
          });
        } catch (error) {
          console.error('Failed to fetch submission data', error);
          toast.error('Failed to load submission data');
        }
      }
    };

    fetchData();
  }, [id, editMode, form.reset, listing.eligibility, user?.telegram]);

  const isDisabled = useMemo(
    () =>
      Boolean(
        isSubmitDisabled ||
        isTemplate ||
        !!query['preview'] ||
        (isHackathon && !editMode && !termsAccepted) ||
        (isFndnPaying && !editMode && !kycAcknowledged) ||
        isLoading ||
        form.formState.isSubmitting ||
        hasInvalidTweetStatusFormat ||
        hasInvalidLinkStatusFormat ||
        needsXVerification ||
        needsLinkVerification ||
        (isPro && !user?.isPro),
      ),

    [
      isSubmitDisabled,
      isTemplate,
      query,
      isHackathon,
      editMode,
      termsAccepted,
      isFndnPaying,
      kycAcknowledged,
      isLoading,
      form.formState.isSubmitting,
      hasInvalidTweetStatusFormat,
      hasInvalidLinkStatusFormat,
      needsXVerification,
      needsLinkVerification,
      isPro,
      user?.isPro,
    ],
  );

  const { signIn: popupSignIn } = usePopupAuth();

  const { manualSync } = useServerTimeSync();

  const handleVerifyClick = async (fieldName: 'tweet' | 'link') => {
    const fieldValue = fieldName === 'tweet' ? tweetValue : linkValue;
    if (!fieldValue) return;

    const handle = extractXHandle(fieldValue);
    if (!handle) return;

    try {
      setVerificationStatus('loading');
      setVerificationHandle(handle);
      onVerificationModalOpen();

      const success = await popupSignIn('twitter');

      if (success) {
        let attempts = 0;
        const maxAttempts = 5;
        const pollForUpdate = async (): Promise<boolean> => {
          const { data: freshUser } = await refetchUser();

          const currentVerifiedHandles = freshUser?.linkedTwitter || [];
          const isNowVerified = isHandleVerified(
            handle,
            currentVerifiedHandles,
          );

          if (isNowVerified) {
            form.trigger(fieldName);
            setVerificationHandle(null);
            onVerificationModalClose();
            return true;
          }

          attempts++;
          if (attempts >= maxAttempts) {
            setVerificationStatus('error');
            return false;
          }

          const delay = Math.min(500 * Math.pow(2, attempts - 1), 5000);
          await new Promise((resolve) => setTimeout(resolve, delay));
          return pollForUpdate();
        };

        await pollForUpdate();
      } else {
        setVerificationStatus('error');
      }
    } catch (error: any) {
      console.error('X verification failed:', error);
      setVerificationStatus('error');
    }
  };

  const onSubmit = async (data: FormData) => {
    if (isLoading) return;
    if (isDisabled) return;

    posthog.capture('confirmed_submission');
    setIsLoading(true);
    try {
      await manualSync();
    } catch {}
    try {
      const submissionEndpoint = editMode
        ? '/api/submission/update/'
        : '/api/submission/create/';

      await api.post(submissionEndpoint, {
        listingId: id,
        link: data.link || '',
        tweet: data.tweet || '',
        otherInfo: data.otherInfo || '',
        ask: data.ask || null,
        eligibilityAnswers: data.eligibilityAnswers || [],
        telegram: data.telegram || user?.telegram || '',
      });

      form.reset();
      await queryClient.invalidateQueries({
        queryKey: userSubmissionQuery(id!, user!.id).queryKey,
      });

      await refetchUser();

      if (!editMode) {
        await queryClient.invalidateQueries({
          queryKey: submissionCountQuery(id!).queryKey,
        });
        await queryClient.invalidateQueries({
          queryKey: ['creditBalance', user!.id],
        });
        await queryClient.invalidateQueries({
          queryKey: ['creditHistory', user!.id],
        });
      }

      const latestSubmissionNumber = (user?.Submission?.length ?? 0) + 1;
      if (!editMode) showEasterEgg();
      if (!editMode && latestSubmissionNumber % 3 !== 0) onSurveyOpen();

      toast.success(
        editMode
          ? 'Submission updated successfully'
          : 'Submission created successfully',
      );
      handleClose();

      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
      if (axios.isAxiosError(error)) {
        if (error.status === 401) {
          toast.error(
            'Error occurred during submission. Please re-log in and try again.',
          );
        } else if (
          String(error?.response?.data.error)
            .toLowerCase()
            .includes('submissions closed')
        ) {
          toast.error(
            `Unfortunately, you ${isProject ? 'application' : 'submission'} couldn't be added because the deadline of the listing has passed.`,
          );
        } else {
          toast.error('Failed to submit. Please try again or contact support.');
        }
      } else {
        toast.error('Failed to submit. Please try again or contact support.');
      }
    }
  };

  // ---- typeform steps ----
  const stepIds = useMemo(() => {
    const ids: string[] = ['welcome'];
    if (!isProject) ids.push('link', 'tweet');
    (eligibility ?? []).forEach((_e, i) => ids.push(`elig-${i}`));
    if (compensationType !== 'fixed') ids.push('ask');
    if (isProject) ids.push('telegram');
    ids.push('otherInfo', 'review');
    return ids;
  }, [isProject, eligibility, compensationType]);

  const [step, setStep] = useState(0);
  useEffect(() => {
    if (isOpen) setStep(editMode ? 1 : 0);
  }, [isOpen, editMode]);

  const current = stepIds[Math.min(step, stepIds.length - 1)] ?? 'review';
  const totalSteps = stepIds.length - 2;
  const stepIndexLabel =
    current === 'welcome'
      ? 'Start'
      : current === 'review'
        ? 'Review'
        : `Step ${step} / ${totalSteps}`;
  const progressPct =
    step === 0 ? 6 : Math.round((step / (stepIds.length - 1)) * 100);

  const guardFor = async (id: string): Promise<boolean> => {
    if (id === 'link') return form.trigger('link' as never);
    if (id === 'ask') return form.trigger('ask' as never);
    if (id === 'telegram') return form.trigger('telegram' as never);
    if (id.startsWith('elig-')) {
      const idx = Number(id.split('-')[1]);
      const e = eligibility?.[idx];
      if (e && !e.optional)
        return form.trigger(`eligibilityAnswers.${idx}.answer` as never);
    }
    return true;
  };
  const goNext = async () => {
    if (!(await guardFor(current))) return;
    setStep((s) => Math.min(s + 1, stepIds.length - 1));
  };
  const goBack = () => setStep((s) => Math.max(s - 1, 0));
  const handleStepKeyDown = (e: KeyboardEvent) => {
    if (e.key !== 'Enter') return;
    const t = e.target as HTMLElement;
    if (t.closest('textarea, [contenteditable="true"], .ProseMirror, .tiptap'))
      return;
    e.preventDefault();
    if (current !== 'welcome' && current !== 'review') goNext();
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) handleClose();
      }}
    >
      <DialogContent
        hideCloseIcon
        className="flex max-h-[88vh] w-[min(680px,calc(100vw-2rem))] flex-col gap-0 overflow-hidden p-0"
      >
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex max-h-[88vh] min-h-0 flex-col"
          >
            {/* progress */}
            <div className="h-1.5 shrink-0 bg-[#221A14]/10">
              <div
                className="h-full bg-[#C4502E] transition-all duration-300"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            {/* top bar */}
            <div className="flex shrink-0 items-center gap-3 border-b border-[#E6DCC9] px-6 py-3.5 sm:px-8">
              <span className="font-serif text-base font-semibold text-[#221A14]">
                {listing?.sponsor?.name ?? 'Submission'}
              </span>
              <span className="ml-auto text-[11px] font-semibold tracking-[0.16em] text-[#5C5147] uppercase">
                {stepIndexLabel}
              </span>
              <button
                type="button"
                onClick={handleClose}
                aria-label="Close"
                className="flex size-9 flex-none items-center justify-center rounded-full text-[#5C5147] transition-colors hover:bg-[#F2EAD9] hover:text-[#221A14]"
              >
                <X className="size-5" />
              </button>
            </div>
            {/* stepped body */}
            <div
              className="flex min-h-0 flex-1 items-start overflow-y-auto px-6 py-10 sm:px-10"
              onKeyDown={handleStepKeyDown}
            >
              <div key={step} className="mx-auto w-full max-w-[34rem]">
                <StepScreen
                  show={current === 'welcome'}
                  kicker={isProject ? 'Application' : 'Submission'}
                  title={
                    <>
                      Let&apos;s get your{' '}
                      <em className="text-[#C4502E] italic">
                        {isProject ? 'application in.' : 'entry in.'}
                      </em>
                    </>
                  }
                  help="A few quick steps — about a minute. Press Enter to move through each one."
                >
                  <StepNav onNext={goNext} nextLabel="Start →" />
                </StepScreen>

                <StepScreen
                  show={current === 'link'}
                  kicker="Your work"
                  title={
                    <>
                      Where&apos;s your{' '}
                      <em className="text-[#C4502E] italic">submission?</em>
                    </>
                  }
                  help="A public link to your work — make sure anyone can open it."
                >
                  <FormField
                    control={form.control}
                    name={'link'}
                    render={({ field }) => (
                      <FormItem className={cn('flex flex-col gap-2')}>
                        <FormControl>
                          <div className="flex">
                            <div className="flex items-center gap-1 border border-r-0 border-[#E6DCC9] bg-[#F2EAD9] px-3 text-sm font-medium text-[#5C5147]">
                              https://
                            </div>
                            <div className="relative flex-1">
                              <Input
                                {...field}
                                maxLength={500}
                                placeholder="Add a link"
                                className={cn(
                                  'rounded-l-none',
                                  (needsLinkVerification || isLinkVerified) &&
                                    'pr-10',
                                )}
                                autoComplete="off"
                              />
                              {needsLinkVerification && (
                                <Button
                                  type="button"
                                  onClick={() => handleVerifyClick('link')}
                                  size="sm"
                                  className="absolute top-1/2 right-1 h-7 -translate-y-1/2 rounded-md bg-[#C4502E] px-3 text-xs text-[#FBF7EF] hover:bg-[#A83F22]"
                                >
                                  Verify
                                </Button>
                              )}
                              {isLinkVerified && <VerifiedXIcon />}
                            </div>
                          </div>
                        </FormControl>
                        <FormMessage className="pt-1" />
                      </FormItem>
                    )}
                  />
                  <StepNav onNext={goNext} onBack={goBack} />
                </StepScreen>

                <StepScreen
                  show={current === 'tweet'}
                  kicker="Optional"
                  title={
                    <>
                      Got a <em className="text-[#C4502E] italic">tweet</em> to
                      share?
                    </>
                  }
                  help="Helps sponsors discover and repost your work on X. Skip if it doesn't apply."
                >
                  <FormField
                    control={form.control}
                    name={'tweet'}
                    render={({ field }) => (
                      <FormItem className={cn('flex flex-col gap-2')}>
                        <FormControl>
                          <div className="flex">
                            <div className="flex items-center gap-1 border border-r-0 border-[#E6DCC9] bg-[#F2EAD9] px-3 text-sm font-medium text-[#5C5147]">
                              https://
                            </div>
                            <div className="relative flex-1">
                              <Input
                                {...field}
                                maxLength={500}
                                placeholder="Add a tweet's link"
                                className={cn(
                                  'rounded-l-none',
                                  (needsXVerification || isTweetVerified) &&
                                    'pr-10',
                                )}
                                autoComplete="off"
                              />
                              {needsXVerification && (
                                <Button
                                  type="button"
                                  onClick={() => handleVerifyClick('tweet')}
                                  size="sm"
                                  className="absolute top-1/2 right-1 h-7 -translate-y-1/2 rounded-md bg-[#C4502E] px-3 text-xs text-[#FBF7EF] hover:bg-[#A83F22]"
                                >
                                  Verify
                                </Button>
                              )}
                              {isTweetVerified && <VerifiedXIcon />}
                            </div>
                          </div>
                        </FormControl>
                        <FormMessage className="pt-1" />
                      </FormItem>
                    )}
                  />
                  <StepNav onNext={goNext} onBack={goBack} optional />
                </StepScreen>
                {eligibility?.map((e, index) => (
                  <StepScreen
                    key={e.order}
                    show={current === `elig-${index}`}
                    kicker={`Question ${index + 1}`}
                    title={e.question}
                    help={e.optional ? 'Optional' : undefined}
                  >
                    <FormField
                      control={form.control}
                      name={`eligibilityAnswers.${index}.answer`}
                      render={({ field }) => (
                        <FormItem className={cn('flex flex-col gap-2')}>
                          <FormControl>
                            {e.isLink || e.type === 'link' ? (
                              <div className="flex">
                                <div className="flex items-center gap-1 border border-r-0 border-[#E6DCC9] bg-[#F2EAD9] px-3 text-sm font-medium text-[#5C5147]">
                                  https://
                                </div>
                                <Input
                                  {...field}
                                  placeholder="Add a link..."
                                  className="rounded-l-none"
                                  autoComplete="off"
                                />
                              </div>
                            ) : (
                              <RichEditor
                                {...field}
                                id={`eligibilityAnswers.${index}.answer`}
                                value={field.value || ''}
                                error={false}
                                placeholder={'Write something...'}
                                isPro={isPro}
                              />
                            )}
                          </FormControl>
                          <FormMessage className="pt-1" />
                        </FormItem>
                      )}
                    />
                    <StepNav
                      onNext={goNext}
                      onBack={goBack}
                      optional={e.optional}
                    />
                  </StepScreen>
                ))}

                {compensationType !== 'fixed' && (
                  <StepScreen
                    show={current === 'ask'}
                    kicker="Compensation"
                    title={
                      <>
                        What&apos;s your{' '}
                        <em className="text-[#C4502E] italic">rate?</em>
                      </>
                    }
                    help="The compensation you'd need to complete this fully."
                  >
                    <FormFieldWrapper
                      control={form.control}
                      name="ask"
                      label=""
                      isRequired
                      isTokenInput
                      token={token}
                      isPro={isPro}
                    />
                    <StepNav onNext={goNext} onBack={goBack} />
                  </StepScreen>
                )}

                {isProject && (
                  <StepScreen
                    show={current === 'telegram'}
                    kicker="Contact"
                    title={
                      <>
                        Your <em className="text-[#C4502E] italic">Telegram</em>
                      </>
                    }
                    help="So the sponsor can reach you about this project."
                  >
                    <SocialInput
                      name="telegram"
                      socialName={'telegram'}
                      placeholder="Telegram username"
                      required
                      formLabel=""
                      control={form.control}
                      height="h-9"
                      isPro={isPro}
                    />
                    <StepNav onNext={goNext} onBack={goBack} />
                  </StepScreen>
                )}

                <StepScreen
                  show={current === 'otherInfo'}
                  kicker="Anything else"
                  title={
                    <>
                      Want to add{' '}
                      <em className="text-[#C4502E] italic">context?</em>
                    </>
                  }
                  help="Notes, extra links, or anything you'd like the sponsor to know."
                >
                  <FormFieldWrapper
                    control={form.control}
                    name="otherInfo"
                    label=""
                    isRichEditor
                    richEditorPlaceholder="Add info or link"
                    isPro={isPro}
                  />
                  <StepNav onNext={goNext} onBack={goBack} optional />
                </StepScreen>

                <StepScreen
                  show={current === 'review'}
                  kicker="Almost there"
                  title={
                    <>
                      Look good?{' '}
                      <em className="text-[#C4502E] italic">
                        {isProject ? 'Apply.' : 'Submit.'}
                      </em>
                    </>
                  }
                >
                  {isHackathon && !editMode && (
                    <div className="mb-4 flex items-start space-x-3">
                      <Checkbox
                        id="terms"
                        className="mt-1 border border-[#E6DCC9] data-[state=checked]:border-[#C4502E] data-[state=checked]:bg-[#C4502E] data-[state=checked]:text-[#FBF7EF]"
                        checked={termsAccepted}
                        onCheckedChange={(checked) =>
                          setTermsAccepted(checked as boolean)
                        }
                      />
                      <label
                        htmlFor="terms"
                        className="text-sm leading-snug text-[#5C5147]"
                      >
                        I confirm that I have reviewed the scope of this track
                        and that my submission adheres to the specified
                        requirements. Submitting a project that does not meet the
                        submission requirements, including potential spam, may
                        result in restrictions on future submissions.
                      </label>
                    </div>
                  )}

                  {isFndnPaying && !editMode && (
                    <div className="mb-4 flex items-center space-x-3">
                      <Checkbox
                        id="kyc-acknowledgement"
                        className="border border-[#E6DCC9] data-[state=checked]:border-[#C4502E] data-[state=checked]:bg-[#C4502E] data-[state=checked]:text-[#FBF7EF]"
                        checked={kycAcknowledged}
                        onCheckedChange={(checked) =>
                          setKycAcknowledged(checked as boolean)
                        }
                      />
                      <label
                        htmlFor="kyc-acknowledgement"
                        className="text-sm leading-snug text-[#5C5147]"
                      >
                        {regionAckCopy}
                      </label>
                    </div>
                  )}

                  <div className="flex items-center gap-4">
                    <Button
                      className={cn(
                        'ph-no-capture h-11 gap-3 rounded-xl px-6',
                        isNotEligibleForPro
                          ? 'disabled:opacity-100'
                          : 'disabled:cursor-default disabled:opacity-70',
                        isNotEligibleForPro
                          ? 'bg-[#e7d3c1] text-[#221A14]'
                          : 'bg-[#C4502E] text-[#FBF7EF] hover:bg-[#A83F22]',
                        editMode &&
                          'border border-[#E6DCC9] bg-[#FBF7EF] text-[#221A14] hover:bg-[#F2EAD9] hover:text-[#221A14]',
                      )}
                      disabled={isDisabled}
                      type="submit"
                      variant={editMode ? 'outline' : 'default'}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          <span>
                            {editMode ? 'Updating...' : 'Submitting...'}
                          </span>
                        </>
                      ) : isNotEligibleForPro ? (
                        <span className="flex items-center gap-2">
                          <Lock className="h-4 w-4" />
                          <span>Not Eligible</span>
                        </span>
                      ) : isProject ? (
                        <span className="flex items-center gap-2">
                          {editMode
                            ? 'Update'
                            : user?.isPro && isPro
                              ? 'Apply'
                              : 'Apply using 1 credit'}
                          {!editMode && !(user?.isPro && isPro) && (
                            <CreditIcon className="ml-1 size-6" />
                          )}
                        </span>
                      ) : isBounty ? (
                        <span className="flex items-center gap-2">
                          {editMode
                            ? 'Update'
                            : user?.isPro && isPro
                              ? 'Submit'
                              : 'Submit using 1 credit'}
                          {!editMode && !(user?.isPro && isPro) && (
                            <CreditIcon className="ml-1 size-6" />
                          )}
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          {editMode ? 'Update' : 'Submit'}
                        </span>
                      )}
                    </Button>
                    <button
                      type="button"
                      onClick={goBack}
                      className="text-sm font-semibold text-[#5C5147] transition-colors hover:text-[#221A14]"
                    >
                      &larr; Back
                    </button>
                  </div>
                  <p className="mt-3 text-xs text-[#5C5147]">
                    By submitting/applying to this listing, you agree to our{' '}
                    <button
                      type="button"
                      onClick={() => setIsTOSModalOpen(true)}
                      className="cursor-pointer text-[#C4502E] underline underline-offset-2"
                      rel="noopener noreferrer"
                    >
                      Terms of Use
                    </button>
                    .
                  </p>
                </StepScreen>
              </div>
            </div>
          </form>
        </Form>
        {listing?.sponsor?.name && (
          <SubmissionTerms
            entityName={listing.sponsor.entityName}
            isOpen={isTOSModalOpen}
            onClose={() => setIsTOSModalOpen(false)}
            sponsorName={listing.sponsor.name}
          />
        )}
        <XVerificationModal
          isOpen={isVerificationModalOpen}
          onClose={() => {
            setVerificationHandle(null);
            onVerificationModalClose();
          }}
          status={verificationStatus}
          handle={verificationHandle}
        />
      </DialogContent>
    </Dialog>
  );
};
