import { zodResolver } from '@hookform/resolvers/zod';
import { usePrivy } from '@privy-io/react-auth';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/router';
import posthog from 'posthog-js';
import React, { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { ImageUploader } from '@/components/shared/ImageUploader';
import { api } from '@/lib/api';
import { Default } from '@/layouts/Default';
import { Meta } from '@/layouts/Meta';
import { useUser } from '@/store/user';
import { cn } from '@/utils/cn';

import { SignIn } from '@/features/auth/components/SignIn';
import { useSlugValidation } from '@/features/sponsor/hooks/useSlugValidation';
import { useSponsorNameValidation } from '@/features/sponsor/hooks/useSponsorNameValidation';
import {
  shouldUpdateUser,
  sponsorFormSchema,
  type SponsorFormValues,
  transformFormToApiData,
} from '@/features/sponsor/utils/sponsorFormSchema';
import { SLIndustryList, ONBOARDING_KEY } from '@/features/talent/constants';
import { useUsernameValidation } from '@/features/talent/utils/useUsernameValidation';

type SocialKey = 'twitter' | 'facebook' | 'instagram' | 'tiktok';

const SOCIAL_PLATFORMS: {
  key: SocialKey;
  label: string;
  prefix: string;
  field: string;
  activeClass: string;
}[] = [
  {
    key: 'facebook',
    label: 'Facebook',
    prefix: 'facebook.com/',
    field: 'sponsor.socials.facebook',
    activeClass: 'bg-[#1877f2]',
  },
  {
    key: 'instagram',
    label: 'Instagram',
    prefix: 'instagram.com/',
    field: 'sponsor.socials.instagram',
    activeClass: 'bg-[#d62976]',
  },
  {
    key: 'tiktok',
    label: 'TikTok',
    prefix: 'tiktok.com/@',
    field: 'sponsor.socials.tiktok',
    activeClass: 'bg-[#1d1815]',
  },
  {
    key: 'twitter',
    label: 'X',
    prefix: 'x.com/',
    field: 'sponsor.twitter',
    activeClass: 'bg-black',
  },
];

const CreateSponsor = () => {
  const router = useRouter();
  const { ready, authenticated } = usePrivy();
  const { user, refetchUser } = useUser();

  const [step, setStep] = useState(0);
  const [uploadedUserPhotoUrl, setUploadedUserPhotoUrl] = useState<
    string | null
  >(null);
  const [uploadedLogoUrl, setUploadedLogoUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [loginStep, setLoginStep] = useState(0);
  const [acknowledgementAccepted, setAcknowledgementAccepted] = useState(false);
  const [activeSocials, setActiveSocials] = useState<Set<SocialKey>>(new Set());
  const [industries, setIndustries] = useState<string[]>([]);

  const form = useForm<SponsorFormValues>({
    resolver: zodResolver(sponsorFormSchema),
    mode: 'onBlur',
    defaultValues: {
      sponsor: {
        name: '',
        slug: '',
        bio: '',
        logo: '',
        industry: '',
        url: '',
        twitter: '',
        socials: { facebook: '', instagram: '', tiktok: '' },
        entityName: '',
      },
      user: {
        firstName: user?.firstName || '',
        lastName: user?.lastName || '',
        username: user?.username || '',
        photo: user?.photo || '',
        telegram: user?.telegram || '',
      },
    },
  });

  useEffect(() => {
    if (user) {
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      user.username && setUsername(user.username);
      form.reset({
        user: {
          firstName: user?.firstName || '',
          lastName: user?.lastName || '',
          username: user?.username || '',
          photo: user?.photo || '',
          telegram: user?.telegram || '',
        },
      });
    }
  }, [user]);

  const {
    setSponsorName,
    isInvalid: isSponsorNameInvalid,
    validationErrorMessage: sponsorNameValidationErrorMessage,
    sponsorName,
  } = useSponsorNameValidation();

  const {
    setSlug,
    isInvalid: isSlugInvalid,
    validationErrorMessage: validationSlugErrorMessage,
    slug,
  } = useSlugValidation();

  const {
    setUsername,
    isInvalid: isUsernameInvalid,
    validationErrorMessage: validationUsernameErrorMessage,
    username,
  } = useUsernameValidation(user?.username);

  useEffect(() => {
    if (user?.currentSponsorId && user?.role !== 'GOD') {
      router.push('/earn/dashboard/listings?open=1');
    }
  }, [user?.currentSponsorId, router]);

  // keep the industry string in sync with the chip selection
  useEffect(() => {
    form.setValue('sponsor.industry', industries.join(', '));
  }, [industries]);

  const {
    mutateAsync: createSponsor,
    isPending,
    isError,
  } = useMutation({
    mutationFn: async (data: SponsorFormValues) => {
      router.prefetch('/earn/dashboard/listings?open=1');

      if (uploadedUserPhotoUrl && data.user) {
        data.user.photo = uploadedUserPhotoUrl;
      }

      const { sponsorData, userData } = transformFormToApiData(data);

      try {
        if (uploadedLogoUrl) {
          sponsorData.logo = uploadedLogoUrl;
        }

        await api.post('/api/sponsors/create', sponsorData);

        if (userData && shouldUpdateUser(userData, user)) {
          await api.post('/api/sponsors/usersponsor-details/', userData);
        }

        await api.post('/api/email/manual/welcome-sponsor');

        localStorage.removeItem(ONBOARDING_KEY);
        return 'Success';
      } catch (error) {
        console.error('Error in createSponsor:', error);
        throw error;
      }
    },
    onSuccess: async () => {
      toast.success('Your company has been created!', {
        description: 'Redirecting to dashboard...',
      });
      await refetchUser();
      router.push('/earn/dashboard/listings?open=1');
    },
    onError: (error) => {
      console.log('Failed to create sponsor', error);
      if (axios.isAxiosError(error)) {
        if (
          (error.response?.data?.error as string)
            ?.toLowerCase()
            ?.includes('unique constraint failed')
        ) {
          setErrorMessage('Company name or username already exists');
          toast.error('Sorry! Company name or username already exists.');
        } else {
          toast.error(
            `Failed to create company: ${error.response?.data?.message || error.message}`,
          );
        }
      } else {
        toast.error('An unexpected error occurred while creating the company.');
      }
    },
  });

  const submit = async () => {
    if (!acknowledgementAccepted) {
      toast.error('Please confirm the acknowledgement to continue.');
      return;
    }
    if (!uploadedLogoUrl) {
      toast.error('A company logo is required.');
      return;
    }
    // Sync values that are driven by the availability hooks before validating.
    form.setValue('sponsor.name', sponsorName);
    form.setValue('sponsor.slug', slug);
    form.setValue('user.username', username);
    form.setValue('sponsor.industry', industries.join(', '));
    const valid = await form.trigger();
    if (!valid) {
      toast.error('Some details need fixing — please review.');
      return;
    }
    try {
      posthog.capture('complete profile_sponsor');
      await createSponsor(form.getValues());
      if (user) posthog.identify(user.email);
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  const toggleSocial = (key: SocialKey) => {
    setActiveSocials((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
        const field = SOCIAL_PLATFORMS.find((p) => p.key === key)?.field;
        if (field) form.setValue(field as any, '');
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const toggleIndustry = (name: string) => {
    setIndustries((prev) =>
      prev.includes(name) ? prev.filter((i) => i !== name) : [...prev, name],
    );
  };

  // ---- step definitions ----
  const steps = useMemo(
    () => [
      { id: 'welcome' },
      {
        id: 'name',
        guard: async () =>
          form.trigger(['user.firstName', 'user.lastName'] as any),
      },
      {
        id: 'username',
        guard: async () => {
          const ok = await form.trigger('user.username' as any);
          return ok && !isUsernameInvalid && username !== '';
        },
      },
      { id: 'photo' },
      {
        id: 'company',
        guard: async () => {
          const ok = await form.trigger('sponsor.name' as any);
          return ok && !isSponsorNameInvalid && sponsorName !== '';
        },
      },
      {
        id: 'slug',
        guard: async () => {
          const ok = await form.trigger('sponsor.slug' as any);
          return ok && !isSlugInvalid && slug !== '';
        },
      },
      { id: 'url', guard: async () => form.trigger('sponsor.url' as any) },
      { id: 'socials' },
      { id: 'industry', guard: async () => industries.length > 0 },
      { id: 'logo', guard: async () => !!uploadedLogoUrl },
      { id: 'bio', guard: async () => form.trigger('sponsor.bio' as any) },
      { id: 'review' },
    ],
    [
      form,
      isUsernameInvalid,
      username,
      isSponsorNameInvalid,
      sponsorName,
      isSlugInvalid,
      slug,
      industries.length,
      uploadedLogoUrl,
    ],
  );

  const totalSteps = steps.length - 2; // exclude welcome + review-as-last from count base
  const current = steps[step]?.id;

  const goNext = async () => {
    const guard = (steps[step] as any)?.guard;
    if (guard) {
      const ok = await guard();
      if (!ok) return;
    }
    setStep((s) => Math.min(s + 1, steps.length - 1));
  };
  const goBack = () => setStep((s) => Math.max(s - 1, 0));

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !(e.target as HTMLElement).closest('textarea')) {
      e.preventDefault();
      if (current === 'review') submit();
      else if (current !== 'welcome') goNext();
    }
  };

  if (!ready) return <></>;

  const progressPct =
    step === 0 ? 4 : Math.round((step / (steps.length - 1)) * 100);

  return (
    <Default
      className="bg-[#f4eee3]"
      hideFooter
      meta={
        <Meta
          title="Create your company | Future of Work"
          description="Set up your company on Future of Work — Sierra Leone's marketplace for work."
          canonical="https://future-of-work-lovat.vercel.app/earn/new/sponsor/"
        />
      }
    >
      {!authenticated ? (
        <div className="flex w-full flex-1 items-center justify-center px-4 py-16">
          <div className="w-full max-w-[30rem] border-2 border-[#1d1815] bg-[#f4eee3] p-8 text-center">
            <p className="font-secondary text-[11px] font-extrabold tracking-[0.2em] text-[#6b5e50] uppercase">
              Future of Work / Company
            </p>
            <h1 className="font-serif mt-3 mb-1 text-3xl font-semibold text-[#1d1815]">
              You&apos;re one step away
            </h1>
            <p className="mb-6 text-[#6b5e50]">
              Sign in to set up your company.
            </p>
            <SignIn loginStep={loginStep} setLoginStep={setLoginStep} />
          </div>
        </div>
      ) : (
        <div
          className="flex w-full flex-1 flex-col"
          onKeyDown={handleKeyDown}
        >
          {/* progress */}
          <div className="h-1.5 shrink-0 bg-[#1d1815]/15">
            <div
              className="h-full bg-[#ce4a2b] transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          {/* top bar */}
          <div className="flex shrink-0 items-center gap-3 px-6 py-3.5 sm:px-10">
            <span className="font-serif text-base font-semibold text-[#1d1815]">
              Future of Work
            </span>
            <span className="font-secondary ml-auto text-[11px] font-bold tracking-[0.16em] text-[#6b5e50] uppercase">
              {step === 0
                ? 'Welcome'
                : current === 'review'
                  ? 'Review'
                  : `Step ${step} / ${totalSteps}`}
            </span>
          </div>

          {/* screen */}
          <div className="flex flex-1 items-center px-6 py-12 sm:px-12 lg:px-20">
            <div
              key={step}
              className="animate-in fade-in slide-in-from-bottom-3 mx-auto w-full max-w-[44rem] duration-300"
            >
                {step === 0 && (
                  <Screen
                    kicker="Company setup"
                    title={
                      <>
                        Let&apos;s get your company{' '}
                        <em className="text-[#ce4a2b] italic">set up.</em>
                      </>
                    }
                    help="A few quick questions — about a minute. Press Enter to move through each one."
                  >
                    <NavRow onNext={goNext} nextLabel="Start →" />
                  </Screen>
                )}

                {current === 'name' && (
                  <Screen
                    kicker="About you"
                    title={
                      <>
                        First, who are{' '}
                        <em className="text-[#ce4a2b] italic">you?</em>
                      </>
                    }
                    help="You're creating this company account. We'll keep these on your personal profile."
                  >
                    <div className="flex flex-wrap gap-5">
                      <BigInput
                        placeholder="First name"
                        className="min-w-[180px] flex-1"
                        {...form.register('user.firstName')}
                      />
                      <BigInput
                        placeholder="Last name"
                        className="min-w-[180px] flex-1"
                        {...form.register('user.lastName')}
                      />
                    </div>
                    <FieldError msg={form.formState.errors.user?.firstName?.message} />
                    <NavRow onNext={goNext} onBack={goBack} />
                  </Screen>
                )}

                {current === 'username' && (
                  <Screen
                    kicker="About you"
                    title={
                      <>
                        Pick a{' '}
                        <em className="text-[#ce4a2b] italic">username.</em>
                      </>
                    }
                    help="Your personal handle on Future of Work."
                  >
                    <PrefixInput
                      prefix="@"
                      placeholder="aminata"
                      value={username}
                      onChange={(e) => {
                        const value = e.target.value
                          .toLowerCase()
                          .replace(/\s+/g, '-');
                        setUsername(value);
                        form.setValue('user.username', value);
                      }}
                    />
                    <FieldError
                      msg={
                        isUsernameInvalid
                          ? validationUsernameErrorMessage
                          : undefined
                      }
                    />
                    <NavRow onNext={goNext} onBack={goBack} />
                  </Screen>
                )}

                {current === 'photo' && (
                  <Screen
                    kicker="About you"
                    title={
                      <>
                        Add a{' '}
                        <em className="text-[#ce4a2b] italic">profile photo.</em>
                      </>
                    }
                    help="Optional, but it helps freelancers recognise who they're working with."
                  >
                    <ImageUploader
                      source="user"
                      defaultValue={user?.photo || undefined}
                      onChange={(result) => {
                        setUploadedUserPhotoUrl(result.secureUrl);
                        form.setValue('user.photo', result.secureUrl);
                      }}
                      onReset={() => {
                        setUploadedUserPhotoUrl(null);
                        form.setValue('user.photo', '');
                      }}
                    />
                    <NavRow onNext={goNext} onBack={goBack} nextLabel="Skip / Next →" />
                  </Screen>
                )}

                {current === 'company' && (
                  <Screen
                    kicker="Your company"
                    title={
                      <>
                        What&apos;s your company{' '}
                        <em className="text-[#ce4a2b] italic">called?</em>
                      </>
                    }
                    help="The name freelancers will see on your listings."
                  >
                    <BigInput
                      placeholder="Salone Digital Ltd"
                      value={sponsorName}
                      onChange={(e) => {
                        setSponsorName(e.target.value);
                        form.setValue('sponsor.name', e.target.value);
                      }}
                    />
                    <FieldError
                      msg={
                        isSponsorNameInvalid
                          ? sponsorNameValidationErrorMessage
                          : undefined
                      }
                    />
                    <NavRow onNext={goNext} onBack={goBack} />
                  </Screen>
                )}

                {current === 'slug' && (
                  <Screen
                    kicker="Your company"
                    title={
                      <>
                        Claim your company{' '}
                        <em className="text-[#ce4a2b] italic">handle.</em>
                      </>
                    }
                    help="Your public company page lives here."
                  >
                    <PrefixInput
                      prefix="futureofwork.sl/s/"
                      placeholder="salone-digital"
                      value={slug}
                      onChange={(e) => {
                        const value = e.target.value
                          .toLowerCase()
                          .replace(/\s+/g, '-');
                        setSlug(value);
                        form.setValue('sponsor.slug', value);
                      }}
                    />
                    <FieldError
                      msg={isSlugInvalid ? validationSlugErrorMessage : undefined}
                    />
                    <NavRow onNext={goNext} onBack={goBack} />
                  </Screen>
                )}

                {current === 'url' && (
                  <Screen
                    kicker="Your company"
                    title={
                      <>
                        Where can people{' '}
                        <em className="text-[#ce4a2b] italic">find you?</em>
                      </>
                    }
                    help="Your company website."
                  >
                    <BigInput
                      placeholder="https://salonedigital.sl"
                      {...form.register('sponsor.url')}
                    />
                    <FieldError msg={form.formState.errors.sponsor?.url?.message} />
                    <NavRow onNext={goNext} onBack={goBack} />
                  </Screen>
                )}

                {current === 'socials' && (
                  <Screen
                    kicker="Your company"
                    title={
                      <>
                        Which socials is your company{' '}
                        <em className="text-[#ce4a2b] italic">on?</em>
                      </>
                    }
                    help="Tap the ones you use, then drop your handle. All optional."
                  >
                    <div className="flex flex-wrap gap-2.5">
                      {SOCIAL_PLATFORMS.map((p) => {
                        const on = activeSocials.has(p.key);
                        return (
                          <button
                            type="button"
                            key={p.key}
                            onClick={() => toggleSocial(p.key)}
                            className={cn(
                              'font-secondary flex items-center gap-2 border-2 border-[#1d1815] px-3.5 py-2 text-sm font-bold transition-transform hover:-translate-y-0.5',
                              on
                                ? `${p.activeClass} text-[#f4eee3]`
                                : 'bg-[#f4eee3] text-[#1d1815]',
                            )}
                          >
                            <span
                              className={cn(
                                'inline-block h-2.5 w-2.5 border-2',
                                on
                                  ? 'border-[#f4eee3] bg-[#e6a12b]'
                                  : 'border-[#1d1815] bg-[#f4eee3]',
                              )}
                            />
                            {p.label}
                          </button>
                        );
                      })}
                    </div>
                    <div className="mt-5 flex flex-col gap-3">
                      {SOCIAL_PLATFORMS.filter((p) => activeSocials.has(p.key)).map(
                        (p) => (
                          <div
                            key={p.key}
                            className="flex items-baseline gap-1.5 border-b-2 border-[#1d1815]"
                          >
                            <span className="font-secondary text-xs font-bold whitespace-nowrap text-[#6b5e50]">
                              {p.prefix}
                            </span>
                            <input
                              className="font-serif w-full bg-transparent py-1.5 text-lg text-[#1d1815] outline-none placeholder:text-[#1d1815]/25"
                              placeholder="salonedigital"
                              {...form.register(p.field as any)}
                            />
                          </div>
                        ),
                      )}
                    </div>
                    <NavRow
                      onNext={goNext}
                      onBack={goBack}
                      nextLabel={activeSocials.size ? 'Next →' : 'Skip / Next →'}
                    />
                  </Screen>
                )}

                {current === 'industry' && (
                  <Screen
                    kicker="Your company"
                    title={
                      <>
                        What{' '}
                        <em className="text-[#ce4a2b] italic">industry</em> are
                        you in?
                      </>
                    }
                    help="Pick all that apply."
                  >
                    <div className="flex flex-wrap gap-2.5">
                      {SLIndustryList.map((name) => {
                        const on = industries.includes(name);
                        return (
                          <button
                            type="button"
                            key={name}
                            onClick={() => toggleIndustry(name)}
                            className={cn(
                              'font-secondary border-2 border-[#1d1815] px-3.5 py-2 text-[13px] font-bold transition-transform hover:-translate-y-0.5',
                              on
                                ? 'bg-[#123a33] text-[#f4eee3]'
                                : 'bg-[#f4eee3] text-[#1d1815]',
                            )}
                          >
                            {name}
                          </button>
                        );
                      })}
                    </div>
                    <NavRow onNext={goNext} onBack={goBack} />
                  </Screen>
                )}

                {current === 'logo' && (
                  <Screen
                    kicker="Your company"
                    title={
                      <>
                        Upload your company{' '}
                        <em className="text-[#ce4a2b] italic">logo.</em>
                      </>
                    }
                    help="A square logo looks best on listings."
                  >
                    <ImageUploader
                      source="sponsor"
                      crop="square"
                      onChange={(result) => {
                        setUploadedLogoUrl(result.secureUrl);
                        form.setValue('sponsor.logo', result.secureUrl);
                      }}
                      onReset={() => {
                        setUploadedLogoUrl(null);
                        form.setValue('sponsor.logo', '');
                      }}
                    />
                    <NavRow onNext={goNext} onBack={goBack} />
                  </Screen>
                )}

                {current === 'bio' && (
                  <Screen
                    kicker="Your company"
                    title={
                      <>
                        Describe your company in{' '}
                        <em className="text-[#ce4a2b] italic">one line.</em>
                      </>
                    }
                    help="What do you do? Max 180 characters."
                  >
                    <BigInput
                      maxLength={180}
                      placeholder="We build mobile money tools for small traders."
                      {...form.register('sponsor.bio')}
                    />
                    <p className="font-secondary mt-2 text-xs font-semibold text-[#6b5e50]">
                      {180 - (form.watch('sponsor.bio')?.length || 0)} characters
                      left
                    </p>
                    <FieldError msg={form.formState.errors.sponsor?.bio?.message} />
                    <NavRow onNext={goNext} onBack={goBack} />
                  </Screen>
                )}

                {current === 'review' && (
                  <Screen kicker="Almost done" title={<>Look good?</>}>
                    <div className="border-2 border-[#1d1815] bg-[#fbf7ef]">
                      <ReviewRow label="Your name">
                        {`${form.watch('user.firstName') || ''} ${form.watch('user.lastName') || ''}`.trim() ||
                          '—'}
                      </ReviewRow>
                      <ReviewRow label="Company">
                        {sponsorName || '—'}
                      </ReviewRow>
                      <ReviewRow label="Handle">
                        {slug ? `futureofwork.sl/s/${slug}` : '—'}
                      </ReviewRow>
                      <ReviewRow label="Website">
                        {form.watch('sponsor.url') || '—'}
                      </ReviewRow>
                      <ReviewRow label="Socials">
                        {[...activeSocials]
                          .map(
                            (k) =>
                              SOCIAL_PLATFORMS.find((p) => p.key === k)?.label,
                          )
                          .join(', ') || '—'}
                      </ReviewRow>
                      <ReviewRow label="Industry">
                        {industries.join(', ') || '—'}
                      </ReviewRow>
                      <ReviewRow label="Bio" last>
                        {form.watch('sponsor.bio') || '—'}
                      </ReviewRow>
                    </div>

                    {isError && (
                      <p className="mt-3 text-center text-sm text-[#ce4a2b]">
                        {errorMessage ||
                          'Something went wrong. Please try again.'}
                      </p>
                    )}

                    <label className="mt-5 flex cursor-pointer items-start gap-3 text-sm text-[#6b5e50]">
                      <input
                        type="checkbox"
                        className="mt-0.5 h-4 w-4 accent-[#ce4a2b]"
                        checked={acknowledgementAccepted}
                        onChange={(e) =>
                          setAcknowledgementAccepted(e.target.checked)
                        }
                      />
                      <span>
                        I confirm I&apos;m authorised to create this company
                        account on Future of Work, and that the details above are
                        accurate.
                      </span>
                    </label>

                    <div className="mt-6 flex items-center gap-4">
                      <button
                        type="button"
                        onClick={submit}
                        disabled={isPending}
                        className="font-secondary flex items-center gap-2 border-2 border-[#1d1815] bg-[#1d1815] px-6 py-3 text-sm font-bold tracking-[0.06em] text-[#f4eee3] uppercase transition-colors hover:bg-[#123a33] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isPending ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Creating...
                          </>
                        ) : (
                          'Create company →'
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={goBack}
                        className="font-secondary text-[11px] font-bold tracking-[0.14em] text-[#6b5e50] uppercase hover:text-[#ce4a2b]"
                      >
                        ← Back
                      </button>
                    </div>
                  </Screen>
                )}
            </div>
          </div>
        </div>
      )}
    </Default>
  );
};

export default CreateSponsor;

// ---- presentational helpers ----

const Screen = ({
  kicker,
  title,
  help,
  children,
}: {
  kicker: string;
  title: React.ReactNode;
  help?: string;
  children: React.ReactNode;
}) => (
  <div>
    <span className="font-secondary flex items-center gap-2.5 text-[11px] font-extrabold tracking-[0.2em] text-[#ce4a2b] uppercase">
      <span className="inline-block h-0.5 w-5 bg-[#ce4a2b]" />
      {kicker}
    </span>
    <h2 className="font-serif mt-4 text-[clamp(28px,4.4vw,46px)] leading-[1.05] font-semibold tracking-[-0.02em] text-[#1d1815]">
      {title}
    </h2>
    {help && (
      <p className="mt-3 max-w-[34rem] text-[15px] leading-relaxed text-[#6b5e50]">
        {help}
      </p>
    )}
    <div className="mt-8">{children}</div>
  </div>
);

const BigInput = ({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input
    type="text"
    autoComplete="off"
    className={cn(
      'font-serif w-full border-b-2 border-[#1d1815] bg-transparent py-2 text-2xl text-[#1d1815] outline-none placeholder:text-[#1d1815]/25 focus:border-[#ce4a2b]',
      className,
    )}
    {...props}
  />
);

const PrefixInput = ({
  prefix,
  ...props
}: { prefix: string } & React.InputHTMLAttributes<HTMLInputElement>) => (
  <div className="flex items-baseline gap-1.5 border-b-2 border-[#1d1815] focus-within:border-[#ce4a2b]">
    <span className="font-secondary text-sm font-bold whitespace-nowrap text-[#6b5e50]">
      {prefix}
    </span>
    <input
      type="text"
      autoComplete="off"
      className="font-serif w-full bg-transparent py-2 text-2xl text-[#1d1815] outline-none placeholder:text-[#1d1815]/25"
      {...props}
    />
  </div>
);

const FieldError = ({ msg }: { msg?: string }) =>
  msg ? <p className="mt-2 text-sm text-[#ce4a2b]">{msg}</p> : null;

const NavRow = ({
  onNext,
  onBack,
  nextLabel = 'OK →',
}: {
  onNext: () => void;
  onBack?: () => void;
  nextLabel?: string;
}) => (
  <div className="mt-9 flex items-center gap-4">
    <button
      type="button"
      onClick={onNext}
      className="font-secondary border-2 border-[#1d1815] bg-[#1d1815] px-6 py-3 text-sm font-bold tracking-[0.06em] text-[#f4eee3] uppercase transition-colors hover:bg-[#ce4a2b]"
    >
      {nextLabel}
    </button>
    <span className="font-secondary text-[11px] font-semibold text-[#6b5e50]">
      press{' '}
      <span className="bg-[#1d1815] px-1.5 py-0.5 text-[10px] tracking-[0.08em] text-[#f4eee3]">
        Enter ↵
      </span>
    </span>
    {onBack && (
      <button
        type="button"
        onClick={onBack}
        className="font-secondary ml-auto text-[11px] font-bold tracking-[0.14em] text-[#6b5e50] uppercase hover:text-[#ce4a2b]"
      >
        ← Back
      </button>
    )}
  </div>
);

const ReviewRow = ({
  label,
  children,
  last,
}: {
  label: string;
  children: React.ReactNode;
  last?: boolean;
}) => (
  <div
    className={cn(
      'flex items-start justify-between gap-4 px-4 py-3',
      !last && 'border-b-2 border-[#1d1815]/15',
    )}
  >
    <span className="font-secondary text-[11px] font-extrabold tracking-[0.14em] text-[#6b5e50] uppercase">
      {label}
    </span>
    <span className="text-right text-sm text-[#1d1815]">{children}</span>
  </div>
);
