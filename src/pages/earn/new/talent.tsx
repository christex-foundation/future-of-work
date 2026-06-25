import { zodResolver } from '@hookform/resolvers/zod';
import { usePrivy } from '@privy-io/react-auth';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/router';
import posthog from 'posthog-js';
import React, { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { ImageUploader } from '@/components/shared/ImageUploader';
import { RegionCombobox } from '@/components/shared/RegionCombobox';
import { SkillsSelect } from '@/components/shared/SkillsSelectNew';
import { countries } from '@/constants/country';
import { api } from '@/lib/api';
import { Default } from '@/layouts/Default';
import { Meta } from '@/layouts/Meta';
import { useUser } from '@/store/user';
import { cn } from '@/utils/cn';

import { SignIn } from '@/features/auth/components/SignIn';
import { extractSocialUsername } from '@/features/social/utils/extractUsername';
import { socials, type SocialType } from '@/features/social/utils/constants';
import { usernameRandomQuery } from '@/features/talent/queries/random-username';
import {
  type NewTalentFormData,
  newTalentSchema,
  socialSuperRefine,
} from '@/features/talent/schema';
import { hasDevSkills } from '@/features/talent/utils/skills';
import { useUsernameValidation } from '@/features/talent/utils/useUsernameValidation';

const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.82' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.4'/%3E%3C/svg%3E\")";

// Optional socials a freelancer can add beyond the one required field.
const OPTIONAL_SOCIALS: SocialType[] = [
  'twitter',
  'github',
  'discord',
  'linkedin',
  'telegram',
  'website',
];

const socialMeta = (name: SocialType) => {
  const s = socials.find((p) => p.name === name);
  return {
    prefix: s?.label ?? '',
    placeholder: s?.placeholder ?? '',
  };
};

const prettySocial = (name: SocialType) =>
  name === 'website'
    ? 'Website'
    : name === 'twitter'
      ? 'X'
      : name.charAt(0).toUpperCase() + name.slice(1);

export default function Talent() {
  const router = useRouter();
  const params = useSearchParams();
  const { ready, authenticated } = usePrivy();
  const { user, refetchUser } = useUser();

  const [step, setStep] = useState(0);
  const [loginStep, setLoginStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedPhotoUrl, setUploadedPhotoUrl] = useState<string | null>(null);
  const [isGooglePhoto, setIsGooglePhoto] = useState<boolean>(
    user?.photo?.includes('googleusercontent.com') || false,
  );
  const [activeSocials, setActiveSocials] = useState<Set<SocialType>>(
    new Set(),
  );

  const [referralCode, setReferralCode] = useState<string>('');
  const [isReferralValid, setIsReferralValid] = useState<boolean | null>(null);
  const [isReferralChecking, setIsReferralChecking] = useState<boolean>(false);

  const form = useForm<NewTalentFormData>({
    resolver: zodResolver(
      newTalentSchema.superRefine((data, ctx) => socialSuperRefine(data, ctx)),
    ),
    mode: 'onBlur',
    defaultValues: {
      username: '',
      firstName: '',
      lastName: '',
      location: '',
      photo: '',
    },
  });

  const {
    setUsername,
    isInvalid: isUsernameInvalid,
    validationErrorMessage: usernameErrorMessage,
    username,
  } = useUsernameValidation(user?.username);

  const skills = form.watch('skills');
  const requiredSocial: SocialType = useMemo(
    () => (hasDevSkills(skills) ? 'github' : 'twitter'),
    [skills],
  );

  // Hydrate existing user data into the form.
  useEffect(() => {
    if (!user) return;
    if (user.username) setUsername(user.username);
    form.reset({
      username: user.username || '',
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      skills: newTalentSchema.shape.skills.safeParse(user.skills).data,
      photo: user.photo || '',
      location:
        newTalentSchema.shape.location.safeParse(user.location).data || '',
      discord: user.discord || undefined,
      github: extractSocialUsername('github', user.github || '') || undefined,
      twitter: extractSocialUsername('twitter', user.twitter || '') || undefined,
      linkedin:
        extractSocialUsername('linkedin', user.linkedin || '') || undefined,
      telegram:
        extractSocialUsername('telegram', user.telegram || '') || undefined,
      website: user.website || undefined,
    });
  }, [user]);

  // Suggest a random handle for brand-new users.
  const { data: randomUsername } = useQuery({
    ...usernameRandomQuery(user?.firstName),
    enabled: !!user && !user.username,
    refetchOnWindowFocus: false,
  });
  useEffect(() => {
    if (user && !user.username && randomUsername?.username) {
      setUsername(randomUsername.username);
      form.setValue('username', randomUsername.username);
    }
  }, [randomUsername]);

  // Auto-detect location once, if not already set.
  useEffect(() => {
    const fetchLocation = async () => {
      try {
        if (form.getValues('location')) return;
        const response = await api.get('/api/location');
        const code = response.data?.country_code;
        if (!code) return;
        const country = countries.find(
          (ct) => ct.code.toLowerCase() === code.toLowerCase(),
        );
        if (country) {
          form.setValue(
            'location',
            newTalentSchema.shape.location.safeParse(country.name).data || '',
          );
        }
      } catch (error) {
        console.error('Failed to fetch location:', error);
      }
    };
    fetchLocation();
  }, []);

  // Lock referral code if provided via query param.
  const hasLockedReferralCode = useMemo(() => {
    const queryCode = router.query.code;
    return typeof queryCode === 'string' && queryCode.trim().length > 0;
  }, [router.query.code]);
  useEffect(() => {
    const queryCode = router.query.code;
    if (typeof queryCode === 'string' && queryCode.trim().length > 0) {
      setReferralCode(queryCode.trim().toUpperCase());
    }
  }, [router.query.code]);
  useEffect(() => {
    if (!referralCode) {
      setIsReferralValid(null);
      return;
    }
    setIsReferralChecking(true);
    let ignore = false;
    const timeout = setTimeout(async () => {
      try {
        const res = await api.get('/api/user/referral/verify', {
          params: { code: referralCode },
        });
        if (!ignore) setIsReferralValid(!!res.data?.valid);
      } catch {
        if (!ignore) setIsReferralValid(false);
      } finally {
        if (!ignore) setIsReferralChecking(false);
      }
    }, 400);
    return () => {
      ignore = true;
      clearTimeout(timeout);
    };
  }, [referralCode]);

  // Redirect out once the profile is complete.
  useEffect(() => {
    if (authenticated && user?.isTalentFilled) {
      const originUrl = params?.get('originUrl');
      router.push(originUrl && typeof originUrl === 'string' ? originUrl : '/earn');
    }
  }, [user, authenticated]);

  const onSubmit = async (data: NewTalentFormData) => {
    if (isLoading) return;
    if (username !== '' && isUsernameInvalid) {
      setStep(steps.findIndex((s) => s.id === 'username'));
      toast.error('Please pick an available username.');
      return;
    }
    setIsLoading(true);
    posthog.capture('finish profile_talent');

    return toast.promise(
      async () => {
        try {
          const photoUrl =
            uploadedPhotoUrl || (isGooglePhoto ? user?.photo : data.photo);
          await api.post('/api/user/complete-profile/', {
            ...data,
            referralCode: referralCode || undefined,
            photo: photoUrl,
          });
          if (user) posthog.identify(user.email);
          await refetchUser();
          const originUrl = params?.get('originUrl');
          router.push(
            originUrl && typeof originUrl === 'string' ? originUrl : '/earn',
          );
          return true;
        } catch (error) {
          console.error('Error:', error);
          throw error;
        } finally {
          setIsLoading(false);
        }
      },
      {
        loading: 'Creating your profile...',
        success: 'Your profile has been created successfully!',
        error: 'Failed to create your profile.',
      },
    );
  };

  const onInvalid = (errors: Record<string, unknown>) => {
    const stepFor = (field?: string) => {
      if (field === 'firstName' || field === 'lastName') return 'name';
      if (field === 'username') return 'username';
      if (field === 'location') return 'location';
      if (field === 'skills') return 'skills';
      if (
        ['twitter', 'github', 'discord', 'linkedin', 'telegram', 'website'].includes(
          field || '',
        )
      )
        return 'socials';
      return 'review';
    };
    const targetId = stepFor(Object.keys(errors)[0]);
    const idx = steps.findIndex((s) => s.id === targetId);
    if (idx >= 0) setStep(idx);
    toast.error('Some details need fixing — please review.');
  };

  const toggleSocial = (key: SocialType) => {
    setActiveSocials((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
        form.setValue(key as any, '');
      } else {
        next.add(key);
      }
      return next;
    });
  };

  // ---- step definitions ----
  const steps = useMemo(
    () => [
      { id: 'welcome' },
      {
        id: 'name',
        guard: async () =>
          form.trigger(['firstName', 'lastName'] as any),
      },
      {
        id: 'username',
        guard: async () => {
          const ok = await form.trigger('username' as any);
          return ok && !isUsernameInvalid && username !== '';
        },
      },
      { id: 'photo' },
      { id: 'location', guard: async () => !!form.getValues('location') },
      {
        id: 'skills',
        guard: async () => (form.getValues('skills')?.length ?? 0) > 0,
      },
      {
        id: 'socials',
        guard: async () => {
          const ok = await form.trigger(requiredSocial as any);
          return ok && !!form.getValues(requiredSocial as any);
        },
      },
      {
        id: 'referral',
        guard: async () => !(referralCode && isReferralValid === false),
      },
      { id: 'review' },
    ],
    [form, isUsernameInvalid, username, requiredSocial, referralCode, isReferralValid],
  );

  const totalSteps = steps.length - 2;
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
      if (current === 'review') form.handleSubmit(onSubmit, onInvalid)();
      else if (current !== 'welcome') goNext();
    }
  };

  if (!ready) return <></>;

  const progressPct =
    step === 0 ? 4 : Math.round((step / (steps.length - 1)) * 100);

  const skillSummary =
    (form.watch('skills') || []).map((s) => s.skills).join(', ') || '—';
  const activeSocialSummary =
    [requiredSocial, ...[...activeSocials].filter((s) => s !== requiredSocial)]
      .map(prettySocial)
      .join(', ') || '—';

  return (
    <Default
      className="bg-[#FBF7EF]"
      hideFooter
      meta={
        <Meta
          title="Create your profile | Future of Work"
          description="Set up your freelancer profile on Future of Work — Sierra Leone's marketplace for work."
          canonical="https://future-of-work-lovat.vercel.app/earn/new/talent/"
        />
      }
    >
      {!authenticated ? (
        <div className="relative flex w-full flex-1 items-center justify-center px-4 py-16">
          <div
            aria-hidden="true"
            className="pointer-events-none fixed inset-0 z-[5] opacity-[0.42] mix-blend-multiply"
            style={{ backgroundImage: GRAIN }}
          />
          <div className="w-full max-w-[30rem] rounded-[18px] border border-[#E6DCC9] bg-white p-8 text-center shadow-[0_12px_34px_-22px_rgba(54,38,22,0.45)]">
            <p className="text-[11px] font-semibold tracking-[0.2em] text-[#C4502E] uppercase">
              Future of Work / Freelancer
            </p>
            <h1 className="font-serif mt-3 mb-1 text-3xl font-normal text-[#221A14]">
              You&apos;re one step away
            </h1>
            <p className="mb-6 text-[#5C5147]">
              Sign in to set up your freelancer profile.
            </p>
            <SignIn loginStep={loginStep} setLoginStep={setLoginStep} />
          </div>
        </div>
      ) : (
        <div
          className="relative flex w-full flex-1 flex-col"
          onKeyDown={handleKeyDown}
        >
          <div
            aria-hidden="true"
            className="pointer-events-none fixed inset-0 z-[5] opacity-[0.42] mix-blend-multiply"
            style={{ backgroundImage: GRAIN }}
          />
          {/* progress */}
          <div className="h-1.5 shrink-0 bg-[#221A14]/10">
            <div
              className="h-full bg-[#C4502E] transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          {/* top bar */}
          <div className="flex shrink-0 items-center gap-3 px-6 py-3.5 sm:px-10">
            <span className="font-serif text-base font-semibold text-[#221A14]">
              Future of Work
            </span>
            <span className="ml-auto text-[11px] font-semibold tracking-[0.16em] text-[#5C5147] uppercase">
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
                  kicker="Freelancer setup"
                  title={
                    <>
                      Let&apos;s set up your{' '}
                      <em className="text-[#C4502E] italic">profile.</em>
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
                      First, what&apos;s your{' '}
                      <em className="text-[#C4502E] italic">name?</em>
                    </>
                  }
                  help="This is how companies will see you across Future of Work."
                >
                  <div className="flex flex-wrap gap-5">
                    <BigInput
                      placeholder="First name"
                      className="min-w-[180px] flex-1"
                      maxLength={100}
                      {...form.register('firstName')}
                    />
                    <BigInput
                      placeholder="Last name"
                      className="min-w-[180px] flex-1"
                      maxLength={100}
                      {...form.register('lastName')}
                    />
                  </div>
                  <FieldError
                    msg={
                      form.formState.errors.firstName?.message ||
                      form.formState.errors.lastName?.message
                    }
                  />
                  <NavRow onNext={goNext} onBack={goBack} />
                </Screen>
              )}

              {current === 'username' && (
                <Screen
                  kicker="About you"
                  title={
                    <>
                      Pick a{' '}
                      <em className="text-[#C4502E] italic">username.</em>
                    </>
                  }
                  help="Your personal handle on Future of Work."
                >
                  <PrefixInput
                    prefix="@"
                    placeholder="aminata"
                    value={username}
                    maxLength={40}
                    onChange={(e) => {
                      const value = e.target.value
                        .toLowerCase()
                        .replace(/\s+/g, '-');
                      setUsername(value);
                      form.setValue('username', value);
                    }}
                  />
                  <FieldError
                    msg={isUsernameInvalid ? usernameErrorMessage : undefined}
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
                      <em className="text-[#C4502E] italic">profile photo.</em>
                    </>
                  }
                  help="Optional, but it helps companies recognise who they're hiring."
                >
                  <ImageUploader
                    source="user"
                    variant="avatar"
                    defaultValue={user?.photo || undefined}
                    onChange={(result) => {
                      setIsGooglePhoto(false);
                      setUploadedPhotoUrl(result.secureUrl);
                      form.setValue('photo', result.secureUrl);
                    }}
                    onReset={() => {
                      setIsGooglePhoto(false);
                      setUploadedPhotoUrl(null);
                      form.setValue('photo', '');
                    }}
                  />
                  <NavRow
                    onNext={goNext}
                    onBack={goBack}
                    nextLabel="Skip / Next →"
                  />
                </Screen>
              )}

              {current === 'location' && (
                <Screen
                  kicker="About you"
                  title={
                    <>
                      Where are you{' '}
                      <em className="text-[#C4502E] italic">based?</em>
                    </>
                  }
                  help="We use this to show you the most relevant work."
                >
                  <RegionCombobox
                    className="h-11 w-full max-w-[26rem] border-2 border-[#d9ccb2] bg-transparent"
                    value={form.watch('location')}
                    onChange={(e) => form.setValue('location', e)}
                    classNames={{
                      popoverContent: 'w-[var(--radix-popper-anchor-width)]',
                    }}
                  />
                  <NavRow onNext={goNext} onBack={goBack} />
                </Screen>
              )}

              {current === 'skills' && (
                <Screen
                  kicker="Your work"
                  title={
                    <>
                      What are your{' '}
                      <em className="text-[#C4502E] italic">skills?</em>
                    </>
                  }
                  help="Pick all that apply — we'll notify you of matching work."
                >
                  <SkillsSelect
                    defaultValue={form.getValues('skills') || []}
                    onChange={(value) => {
                      form.setValue('skills', value);
                      form.trigger('skills');
                    }}
                    maxSuggestions={5}
                  />
                  <NavRow onNext={goNext} onBack={goBack} />
                </Screen>
              )}

              {current === 'socials' && (
                <Screen
                  kicker="Your work"
                  title={
                    <>
                      Where can people{' '}
                      <em className="text-[#C4502E] italic">find you?</em>
                    </>
                  }
                  help={
                    requiredSocial === 'github'
                      ? 'GitHub is required for dev roles. Add any others you use.'
                      : 'Your X handle is required. Add any others you use.'
                  }
                >
                  {/* required social */}
                  <SocialRow
                    name={requiredSocial}
                    required
                    register={form.register}
                  />
                  <FieldError
                    msg={
                      (form.formState.errors as any)?.[requiredSocial]?.message
                    }
                  />

                  {/* optional social chips */}
                  <div className="mt-6 flex flex-wrap gap-2.5">
                    {OPTIONAL_SOCIALS.filter((s) => s !== requiredSocial).map(
                      (s) => {
                        const on = activeSocials.has(s);
                        return (
                          <button
                            type="button"
                            key={s}
                            onClick={() => toggleSocial(s)}
                            className={cn(
                              'flex items-center gap-2 rounded-full border border-[#E6DCC9] px-3.5 py-2 text-sm font-medium transition-transform hover:-translate-y-0.5',
                              on
                                ? 'bg-[#C4502E] text-white border-[#C4502E]'
                                : 'bg-white text-[#221A14]',
                            )}
                          >
                            <span
                              className={cn(
                                'inline-block h-2.5 w-2.5 rounded-full border-2',
                                on
                                  ? 'border-white bg-[#FBF7EF]'
                                  : 'border-[#d9ccb2] bg-white',
                              )}
                            />
                            {prettySocial(s)}
                          </button>
                        );
                      },
                    )}
                  </div>

                  <div className="mt-5 flex flex-col gap-3">
                    {[...activeSocials]
                      .filter((s) => s !== requiredSocial)
                      .map((s) => (
                        <SocialRow key={s} name={s} register={form.register} />
                      ))}
                  </div>

                  <NavRow onNext={goNext} onBack={goBack} />
                </Screen>
              )}

              {current === 'referral' && (
                <Screen
                  kicker="Almost there"
                  title={
                    <>
                      Got a{' '}
                      <em className="text-[#C4502E] italic">referral code?</em>
                    </>
                  }
                  help="Optional. Enter it if someone invited you — otherwise skip ahead."
                >
                  <div className="relative max-w-[20rem]">
                    <PrefixInput
                      prefix="#"
                      placeholder="CODE"
                      value={referralCode}
                      maxLength={10}
                      readOnly={hasLockedReferralCode}
                      onChange={(e) =>
                        setReferralCode(e.target.value.toUpperCase())
                      }
                    />
                    {referralCode && isReferralChecking && (
                      <Loader2 className="absolute top-2 right-1 h-4 w-4 animate-spin text-[#5C5147]" />
                    )}
                  </div>
                  {referralCode && isReferralValid === true && (
                    <p className="mt-2 text-sm font-semibold text-[#C4502E]">
                      Code applied ✓
                    </p>
                  )}
                  {referralCode && isReferralValid === false && (
                    <FieldError msg="That code isn't valid." />
                  )}
                  <NavRow
                    onNext={goNext}
                    onBack={goBack}
                    nextLabel={referralCode ? 'Next →' : 'Skip / Next →'}
                  />
                </Screen>
              )}

              {current === 'review' && (
                <Screen kicker="Almost done" title={<>Look good?</>}>
                  <div className="overflow-hidden rounded-[14px] border border-[#E6DCC9] bg-white">
                    <ReviewRow label="Name">
                      {`${form.watch('firstName') || ''} ${form.watch('lastName') || ''}`.trim() ||
                        '—'}
                    </ReviewRow>
                    <ReviewRow label="Username">
                      {username ? `@${username}` : '—'}
                    </ReviewRow>
                    <ReviewRow label="Location">
                      {form.watch('location') || '—'}
                    </ReviewRow>
                    <ReviewRow label="Skills">{skillSummary}</ReviewRow>
                    <ReviewRow label="Socials">{activeSocialSummary}</ReviewRow>
                    <ReviewRow label="Referral" last>
                      {referralCode || '—'}
                    </ReviewRow>
                  </div>

                  <div className="mt-6 flex items-center gap-4">
                    <button
                      type="button"
                      onClick={() => form.handleSubmit(onSubmit, onInvalid)()}
                      disabled={isLoading}
                      className="flex items-center gap-2 rounded-full bg-[#C4502E] px-6 py-3 text-[14.5px] font-semibold text-white transition-all duration-200 hover:-translate-y-px hover:bg-[#A83F22] hover:shadow-[0_12px_34px_-22px_rgba(54,38,22,0.45)] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        'Create profile →'
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={goBack}
                      className="text-[13px] font-medium text-[#5C5147] hover:text-[#C4502E]"
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
}

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
    <span className="flex items-center gap-2.5 text-[11px] font-semibold tracking-[0.2em] text-[#C4502E] uppercase">
      <span className="inline-block h-0.5 w-5 bg-[#C4502E]" />
      {kicker}
    </span>
    <h2 className="font-serif mt-4 text-[clamp(28px,4.4vw,46px)] leading-[1.05] font-normal tracking-[-0.02em] text-[#221A14]">
      {title}
    </h2>
    {help && (
      <p className="mt-3 max-w-[34rem] text-[15px] leading-relaxed text-[#5C5147]">
        {help}
      </p>
    )}
    <div className="mt-8">{children}</div>
  </div>
);

const BigInput = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    type="text"
    autoComplete="off"
    className={cn(
      'font-serif w-full border-b-2 border-[#d9ccb2] bg-transparent py-2 text-2xl text-[#221A14] outline-none placeholder:text-[#221A14]/25 focus:border-[#C4502E]',
      className,
    )}
    {...props}
  />
));
BigInput.displayName = 'BigInput';

const PrefixInput = ({
  prefix,
  ...props
}: { prefix: string } & React.InputHTMLAttributes<HTMLInputElement>) => (
  <div className="flex items-baseline gap-1.5 border-b-2 border-[#d9ccb2] focus-within:border-[#C4502E]">
    <span className="text-sm font-medium whitespace-nowrap text-[#5C5147]">
      {prefix}
    </span>
    <input
      type="text"
      autoComplete="off"
      className="font-serif w-full bg-transparent py-2 text-2xl text-[#221A14] outline-none placeholder:text-[#221A14]/25"
      {...props}
    />
  </div>
);

const SocialRow = ({
  name,
  required,
  register,
}: {
  name: SocialType;
  required?: boolean;
  register: any;
}) => {
  const { prefix, placeholder } = socialMeta(name);
  return (
    <div className="flex items-baseline gap-1.5 border-b-2 border-[#d9ccb2] focus-within:border-[#C4502E]">
      <span className="whitespace-nowrap text-xs font-medium text-[#5C5147]">
        {prefix || `${prettySocial(name).toLowerCase()}/`}
        {required && <span className="ml-0.5 text-[#C4502E]">*</span>}
      </span>
      <input
        type="text"
        autoComplete="off"
        placeholder={placeholder}
        className="font-serif w-full bg-transparent py-1.5 text-lg text-[#221A14] outline-none placeholder:text-[#221A14]/25"
        {...register(name)}
      />
    </div>
  );
};

const FieldError = ({ msg }: { msg?: string }) =>
  msg ? <p className="mt-2 text-sm text-[#C4502E]">{msg}</p> : null;

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
      className="rounded-full bg-[#C4502E] px-6 py-3 text-[14.5px] font-semibold text-white transition-all duration-200 hover:-translate-y-px hover:bg-[#A83F22] hover:shadow-[0_12px_34px_-22px_rgba(54,38,22,0.45)]"
    >
      {nextLabel}
    </button>
    <span className="text-[11px] font-medium text-[#5C5147]">
      press{' '}
      <span className="rounded bg-[#221A14] px-1.5 py-0.5 text-[10px] tracking-[0.08em] text-[#FBF7EF]">
        Enter ↵
      </span>
    </span>
    {onBack && (
      <button
        type="button"
        onClick={onBack}
        className="ml-auto text-[13px] font-medium text-[#5C5147] hover:text-[#C4502E]"
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
      !last && 'border-b border-[#E6DCC9]',
    )}
  >
    <span className="text-[11px] font-semibold tracking-[0.14em] text-[#5C5147] uppercase">
      {label}
    </span>
    <span className="text-right text-sm text-[#221A14]">{children}</span>
  </div>
);
