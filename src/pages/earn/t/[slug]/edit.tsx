import { zodResolver } from '@hookform/resolvers/zod';
import { usePrivy } from '@privy-io/react-auth';
import { Edit, Info, Loader2, Plus, Trash } from 'lucide-react';
import type { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import posthog from 'posthog-js';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { ImageUploader } from '@/components/shared/ImageUploader';
import { RegionCombobox } from '@/components/shared/RegionCombobox';
import { SkillsSelect } from '@/components/shared/SkillsSelectNew';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { FormFieldWrapper } from '@/components/ui/form-field-wrapper';
import { Input } from '@/components/ui/input';
import { MultiSelect, type Option } from '@/components/ui/multi-select';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip } from '@/components/ui/tooltip';
import { useDisclosure } from '@/hooks/use-disclosure';
import type { PoW } from '@/interface/pow';
import { Default } from '@/layouts/Default';
import { Meta } from '@/layouts/Meta';
import { api } from '@/lib/api';
import { prisma } from '@/prisma';
import { useUser } from '@/store/user';
import { cn } from '@/utils/cn';

import {
  GitHub,
  Linkedin,
  Twitter,
  Website,
} from '@/features/social/components/SocialIcons';
import { SocialInputAll } from '@/features/social/components/SocialInput';
import { extractSocialUsername } from '@/features/social/utils/extractUsername';
import { AddProject } from '@/features/talent/components/AddProject';
import { EarnAvatar } from '@/features/talent/components/EarnAvatar';
import { UpdateLocationConfirmModal } from '@/features/talent/components/UpdateLocationConfirmModal';
import {
  CommunityList,
  IndustryList,
  web3Exp,
  workExp,
  workType,
} from '@/features/talent/constants';
import { type ProfileFormData, profileSchema } from '@/features/talent/schema';
import { hasDevSkills } from '@/features/talent/utils/skills';
import { useUsernameValidation } from '@/features/talent/utils/useUsernameValidation';

const interestDropdown: Option[] = IndustryList.map((i) => ({
  value: i,
  label: i,
}));

// Daybreak paper-grain overlay
const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.82' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.4'/%3E%3C/svg%3E\")";

// Daybreak field styling, scoped to this page (shared UI components stay untouched)
const fieldCls =
  'h-11 rounded-xl border-[#E6DCC9] bg-[#F2EAD9] px-4 text-[15px] text-[#221A14] shadow-none transition-colors placeholder:text-[#a99e8d] hover:border-[#d9ccb2] focus-visible:border-[#C4502E] focus-visible:bg-[#F2EAD9] focus-visible:ring-2 focus-visible:ring-[#C4502E]/15 focus-visible:ring-offset-0';
const projThumb = [
  'radial-gradient(120% 90% at 20% 10%,rgba(143,163,126,.92),transparent 60%),linear-gradient(135deg,#C4502E,#7a2c18)',
  'radial-gradient(120% 90% at 80% 10%,rgba(44,58,46,.92),transparent 60%),linear-gradient(135deg,#C4502E,#8c3520)',
  'radial-gradient(120% 90% at 50% 10%,rgba(143,163,126,.85),transparent 60%),linear-gradient(135deg,#2C3A2E,#1c2820)',
];

function SectionHeading({
  num,
  note,
  first,
  className,
  children,
}: {
  num?: string;
  note?: string;
  first?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        'mb-5 flex flex-wrap items-baseline gap-x-3.5 gap-y-1',
        first ? 'mt-1' : 'mt-10 border-t border-[#E6DCC9] pt-7',
        className,
      )}
    >
      {num && (
        <span className="font-serif text-[15px] text-[#C4502E] italic">
          {num}
        </span>
      )}
      <h2 className="font-serif text-[26px] leading-none font-normal tracking-[-0.01em] text-[#221A14]">
        {children}
      </h2>
      {note && (
        <span className="ml-auto text-[12.5px] text-[#5C5147]">{note}</span>
      )}
    </div>
  );
}

const workPreferenceLabel = (wp?: string): string | null => {
  if (!wp || wp === 'Not looking for Work') return null;
  if (/fulltime/i.test(wp)) return 'Fulltime Roles';
  if (/freelance/i.test(wp)) return 'Freelance Opportunities';
  if (/internship/i.test(wp)) return 'Internship Opportunities';
  return wp;
};

function LivePreview({
  values,
  userId,
  photo,
}: {
  values: Partial<ProfileFormData>;
  userId?: string;
  photo?: string;
}) {
  const fullName = `${values.firstName ?? ''} ${values.lastName ?? ''}`.trim();
  const wpText = workPreferenceLabel(values.workPrefernce as string | undefined);
  const skills: any[] = Array.isArray(values.skills) ? values.skills : [];
  const socials = [
    { Icon: Twitter, link: values.twitter },
    { Icon: GitHub, link: values.github },
    { Icon: Linkedin, link: values.linkedin },
    { Icon: Website, link: values.website },
  ];

  const subskills: string[] = skills
    .flatMap((s: any) => s?.subskills ?? [])
    .slice(0, 8);
  const hasSocial = socials.some(({ link }) => link);

  return (
    <div>
      <p className="mb-3 flex items-center gap-2 text-[11.5px] font-semibold tracking-[0.14em] text-[#6B7A4F] uppercase">
        <span className="size-[7px] rounded-full bg-[#C4502E] shadow-[0_0_0_3px_rgba(196,80,46,0.16)]" />
        Live preview — what they&apos;ll see
      </p>
      <div className="overflow-hidden rounded-[18px] border border-[#E6DCC9] bg-white shadow-[0_22px_60px_-34px_rgba(54,38,22,0.5)]">
        {/* cover art-plate */}
        <div className="relative h-24 overflow-hidden">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                'radial-gradient(120% 90% at 14% 14%,rgba(143,163,126,.92),transparent 54%),radial-gradient(120% 120% at 90% 92%,rgba(44,58,46,.92),transparent 54%),linear-gradient(125deg,#C4502E,#7a2c18)',
            }}
          />
          <div
            className="absolute inset-0 opacity-[0.42]"
            style={{
              backgroundImage:
                'repeating-linear-gradient(115deg,rgba(255,255,255,.12) 0 1px,transparent 1px 24px)',
            }}
          />
        </div>
        <div className="px-[22px] pb-[22px]">
          <div className="-mt-[38px] inline-flex size-[74px] overflow-hidden rounded-[18px] border-4 border-white shadow-[0_12px_34px_-22px_rgba(54,38,22,0.45)]">
            <EarnAvatar
              className="size-full rounded-[14px]"
              id={userId}
              avatar={photo}
            />
          </div>

          <h3 className="mt-3 font-serif text-[26px] leading-[1.04] tracking-[-0.01em] text-[#221A14]">
            {fullName || 'Your name'}
          </h3>
          <p className="mt-1.5 text-[13px] text-[#5C5147]">
            @{values.username || 'username'}
          </p>

          {wpText && (
            <p className="mt-3 font-serif text-[15px] leading-snug text-[#C4502E] italic">
              Looking for {wpText}
            </p>
          )}

          <p className="mt-3 text-[13.5px] leading-relaxed text-[#332b23]">
            {values.bio || 'Add a one-line bio so sponsors know who you are.'}
          </p>

          {(values.currentEmployer || values.location) && (
            <p className="mt-3 flex flex-wrap items-center gap-2 text-[12.5px] text-[#5C5147]">
              {values.location && <span>{values.location}</span>}
              {values.location && values.currentEmployer && (
                <span className="opacity-40">·</span>
              )}
              {values.currentEmployer && <span>{values.currentEmployer}</span>}
            </p>
          )}

          {subskills.length > 0 && (
            <>
              <div className="mt-[18px] mb-2.5 text-[11px] font-semibold tracking-[0.14em] text-[#5C5147] uppercase">
                Skills
              </div>
              <div className="flex flex-wrap gap-1.5">
                {subskills.map((sub, i) => (
                  <span
                    key={i}
                    className="rounded-full border border-[#E6DCC9] px-[11px] py-[5px] text-[11.5px] font-medium text-[#5C5147]"
                  >
                    {sub}
                  </span>
                ))}
              </div>
            </>
          )}

          {hasSocial && (
            <>
              <div className="mt-[18px] mb-2.5 text-[11px] font-semibold tracking-[0.14em] text-[#5C5147] uppercase">
                Find me
              </div>
              <div className="flex flex-wrap gap-2">
                {socials.map(({ Icon, link }, i) =>
                  link ? (
                    <span
                      key={i}
                      className="grid size-8 place-items-center rounded-[10px] border border-[#E6DCC9] bg-[#FBF7EF] text-[#5C5147]"
                    >
                      <Icon link="#" className="h-[15px] w-[15px]" />
                    </span>
                  ) : null,
                )}
              </div>
            </>
          )}
        </div>
      </div>
      <p className="mt-3.5 flex items-center justify-center gap-2 text-[11.5px] text-[#5C5147]">
        <span className="size-1.5 rounded-full bg-[#8FA37E]" />
        Updates as you type
      </p>
    </div>
  );
}

interface EditProfilePageProps {
  slug: string;
  chapterNames: string[];
}

export default function EditProfilePage({
  slug,
  chapterNames,
}: EditProfilePageProps) {
  const { user, refetchUser } = useUser();
  const { authenticated, ready } = usePrivy();
  const communityDropdown: Option[] = [...chapterNames, ...CommunityList].map(
    (name) => ({
      value: name,
      label: name,
    }),
  );

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    mode: 'onBlur',
  });
  const { control, handleSubmit, watch, setError, clearErrors, trigger } = form;

  const skills = watch('skills');

  const values = watch();
  const completion = [
    !!(values.firstName && values.lastName && values.username),
    !!(
      values.twitter ||
      values.github ||
      values.linkedin ||
      values.website ||
      values.telegram
    ),
    !!(values.location || values.workPrefernce || values.experience),
    !!(Array.isArray(values.skills) && values.skills.length),
  ];

  const userRef = useRef(user);
  userRef.current = user;

  const [isLoading, setIsLoading] = useState(false);
  const [uploadedPhotoUrl, setUploadedPhotoUrl] = useState<string | null>(null);

  const router = useRouter();

  const [pow, setPow] = useState<PoW[]>([]);
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [skillsRefreshKey, setSkillsRefreshKey] = useState<number>(0);
  const [pendingProfileSubmit, setPendingProfileSubmit] =
    useState<ProfileFormData | null>(null);

  const { isOpen, onOpen, onClose } = useDisclosure();

  const { setUsername, isInvalid, validationErrorMessage, validating } =
    useUsernameValidation();

  useEffect(() => {
    if (isInvalid && validationErrorMessage) {
      setError('username', {
        message: validationErrorMessage,
      });
    } else if (!isInvalid) {
      form.clearErrors('username');
    }
  }, [validationErrorMessage, isInvalid, setError, form]);

  useEffect(() => {
    const currentUser = userRef.current;
    if (currentUser) {
      form.reset({
        username: currentUser.username || undefined,
        bio: currentUser.bio || undefined,
        photo: currentUser.photo || undefined,
        location:
          profileSchema._def.schema.shape.location.safeParse(
            currentUser?.location,
          ).data || undefined,
        skills:
          profileSchema._def.schema.shape.skills.safeParse(currentUser.skills)
            .data || undefined,
        private: currentUser.private || undefined,
        firstName: currentUser.firstName || undefined,
        lastName: currentUser.lastName || undefined,
        discord: currentUser.discord || undefined,
        github: currentUser.github
          ? extractSocialUsername('github', currentUser.github) || undefined
          : undefined,
        twitter: currentUser.twitter
          ? extractSocialUsername('twitter', currentUser.twitter) || undefined
          : undefined,
        linkedin: currentUser.linkedin
          ? extractSocialUsername('linkedin', currentUser.linkedin) || undefined
          : undefined,
        telegram: currentUser.telegram
          ? extractSocialUsername('telegram', currentUser.telegram) || undefined
          : undefined,
        website: currentUser.website || undefined,
        workPrefernce:
          profileSchema._def.schema.shape.workPrefernce.safeParse(
            currentUser.workPrefernce,
          ).data || undefined,
        experience:
          profileSchema._def.schema.shape.experience.safeParse(
            currentUser.experience,
          ).data || undefined,
        cryptoExperience:
          profileSchema._def.schema.shape.cryptoExperience.safeParse(
            currentUser.cryptoExperience,
          ).data || undefined,
        community: currentUser.community
          ? profileSchema._def.schema.shape.community.safeParse(
              JSON.parse(currentUser.community),
            ).data || []
          : [],
        interests: currentUser.interests
          ? profileSchema._def.schema.shape.interests.safeParse(
              JSON.parse(currentUser.interests),
            ).data || []
          : [],
        currentEmployer: currentUser.currentEmployer || undefined,
      });
      setSkillsRefreshKey((s) => s + 1);
    }
  }, [user?.id, form]);

  useEffect(() => {
    let ignore = false;
    const fetchPoW = async () => {
      try {
        const response = await api.get('/api/pow/get', {
          params: {
            userId: user?.id,
          },
        });
        if (!ignore) setPow(response.data);
      } catch (error) {
        if (!ignore) console.log(error);
      }
    };

    if (user?.id) {
      fetchPoW();
    }
    return () => {
      ignore = true;
    };
  }, [user?.id]);

  const onSubmit = async (data: ProfileFormData) => {
    if (validating) {
      toast.error('Please wait for username validation');
      return false;
    }
    if (isInvalid) {
      if (!!validationErrorMessage) {
        setError('username', {
          message: validationErrorMessage,
        });
      } else clearErrors('username');
      form.setFocus('username');
      return false;
    }
    const socialFields = [
      'twitter',
      'github',
      'linkedin',
      'website',
      'telegram',
    ];
    const filledSocials = socialFields.filter(
      (field) => data[field as keyof ProfileFormData],
    );

    if (filledSocials.length === 0) {
      toast.error(
        'At least one additional social link (apart from Discord) is required',
      );
      return;
    }

    const previousLocation = user?.location || '';
    const nextLocation = data.location || '';
    if (previousLocation && previousLocation !== nextLocation) {
      setPendingProfileSubmit(data);
      return;
    }

    return submitProfile(data);
  };

  const submitProfile = async (data: ProfileFormData) => {
    setIsLoading(true);
    posthog.capture('confirm_edit profile');
    try {
      await toast
        .promise(
          async () => {
            if (uploadedPhotoUrl) {
              data.photo = uploadedPhotoUrl;
            }

            const finalUpdatedData = Object.keys(data).reduce((acc, key) => {
              const fieldKey = key as keyof ProfileFormData;
              const newValue = data[fieldKey];
              const oldValue = user?.[fieldKey];

              if (newValue === undefined && oldValue === undefined) return acc;
              if (newValue === undefined && oldValue === null) return acc;
              if (newValue === undefined && oldValue === '') return acc;
              if (newValue === null && oldValue === null) return acc;

              try {
                let normalizedOldValue: any = oldValue;
                const normalizedNewValue: any = newValue;

                if (
                  typeof oldValue === 'string' &&
                  (oldValue.startsWith('{') || oldValue.startsWith('['))
                ) {
                  try {
                    normalizedOldValue = JSON.parse(oldValue);
                  } catch {
                    // If parsing fails, keep original string value
                    normalizedOldValue = oldValue;
                  }
                }

                const oldValueStr =
                  typeof normalizedOldValue === 'object'
                    ? JSON.stringify(normalizedOldValue)
                    : String(normalizedOldValue);

                const newValueStr =
                  typeof normalizedNewValue === 'object'
                    ? JSON.stringify(normalizedNewValue)
                    : String(normalizedNewValue);

                if (oldValueStr !== newValueStr) {
                  acc[fieldKey] = newValue as any;
                }
              } catch (error) {
                if (oldValue !== newValue) {
                  acc[fieldKey] = newValue as any;
                }
              }

              return acc;
            }, {} as Partial<ProfileFormData>);

            await api.post('/api/pow/edit', {
              pows: pow,
            });

            await api.post('/api/user/edit', { ...finalUpdatedData });

            await refetchUser();

            setTimeout(() => {
              router.push(`/earn/t/${data.username}`);
            }, 500);
          },
          {
            loading: 'Updating your profile...',
            success: 'Your profile has been updated successfully!',
            error: 'Failed to update profile.',
          },
        )
        .unwrap();
      return true;
    } catch (error: any) {
      console.error('Error edit profile - ', error);
      toast.error('Failed to update profile.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (ready && !authenticated) {
      router.push('/earn');
      return;
    }
    if (user && slug !== user?.username) {
      router.push(`/earn/t/${slug}`);
    }
  }, [ready, authenticated, user?.username, slug]);

  return (
    <Default
      className="bg-[#FBF7EF]"
      meta={
        <Meta
          title="Edit Profile | Future of Work"
          description="Update your Future of Work talent profile."
        />
      }
    >
      <UpdateLocationConfirmModal
        isOpen={!!pendingProfileSubmit}
        newRegion={pendingProfileSubmit?.location || ''}
        onCancel={() => setPendingProfileSubmit(null)}
        onConfirm={() => {
          const data = pendingProfileSubmit;
          setPendingProfileSubmit(null);
          if (data) void submitProfile(data);
        }}
      />
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.42] mix-blend-multiply"
        style={{ backgroundImage: GRAIN }}
      />
      <div className="relative z-[1] w-full grow bg-[#FBF7EF] px-4 py-10 md:px-6 md:py-14">
        <div className="mx-auto max-w-[1200px]">
          <div className="mb-1">
            <p className="text-[12px] font-semibold tracking-[0.16em] text-[#6B7A4F] uppercase">
              Edit profile
            </p>
            <h1 className="mt-3.5 font-serif text-[clamp(30px,4vw,42px)] leading-[1.05] font-normal tracking-[-0.02em] text-[#221A14]">
              Edit your profile.
            </h1>
            <p className="mt-2.5 max-w-[54ch] text-[15.5px] text-[#5C5147]">
              Work on the left, watch it build on the right. Everything you
              change is mirrored in your public profile — nothing goes live
              until you save.
            </p>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-y-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start lg:gap-x-14">
            <div className="order-2 min-w-0 lg:order-1">
              <Form {...form}>
                <form
                  onSubmit={handleSubmit(onSubmit)}
                  className="[&_[data-slot=form-description]]:text-[#5C5147] [&_[data-slot=form-label]]:text-[13.5px] [&_[data-slot=form-label]]:font-semibold [&_[data-slot=form-label]]:text-[#221A14]"
                >
                  <SectionHeading
                    num="01"
                    note="Shown at the top of your profile"
                    first
                  >
                    Identity
                  </SectionHeading>
              <FormField
                name="photo"
                control={control}
                render={({ field }) => (
                  <FormItem className="mb-4">
                    <FormLabel className="mb-1 pb-0">Profile Picture</FormLabel>
                    <FormControl>
                      <ImageUploader
                        source="user"
                        defaultValue={field.value || undefined}
                        onChange={(result) => {
                          setUploadedPhotoUrl(result.secureUrl);
                          field.onChange(result.secureUrl);
                        }}
                        onReset={() => {
                          setUploadedPhotoUrl(null);
                          field.onChange('');
                        }}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormFieldWrapper
                label="Username"
                name="username"
                control={control}
                isRequired
                className="mb-5"
                onChange={(e) => {
                  const value = e.target.value.replace(/\s+/g, '-'); // Replace spaces with dashes
                  setUsername(value);
                  form.setValue('username', value);
                }}
              >
                <Input
                  maxLength={40}
                  placeholder="Username"
                  className={fieldCls}
                />
              </FormFieldWrapper>

              <div className="mb-5 grid grid-cols-1 gap-x-4 gap-y-5 sm:grid-cols-2">
                <FormFieldWrapper
                  label="First Name"
                  name="firstName"
                  control={control}
                  isRequired
                >
                  <Input placeholder="First Name" className={fieldCls} />
                </FormFieldWrapper>

                <FormFieldWrapper
                  label="Last Name"
                  name="lastName"
                  control={control}
                  isRequired
                >
                  <Input placeholder="Last Name" className={fieldCls} />
                </FormFieldWrapper>
              </div>

              <FormField
                control={control}
                name={'bio'}
                render={({ field }) => (
                  <FormItem className={cn('mb-5 flex flex-col gap-2')}>
                    <div>
                      <FormLabel>Your One-Line Bio</FormLabel>
                    </div>
                    <div>
                      <FormControl>
                        <Textarea
                          {...field}
                          maxLength={180}
                          placeholder="One line bio"
                          className={cn(
                            fieldCls,
                            'h-auto min-h-[88px] py-3 leading-relaxed',
                          )}
                        />
                      </FormControl>
                      <p
                        className={cn(
                          'mt-1 text-right text-xs',
                          (watch('bio')?.length || 0) > 160
                            ? 'text-[#C4502E]'
                            : 'text-[#5C5147]',
                        )}
                      >
                        {180 - (watch('bio')?.length || 0)} characters left
                      </p>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />

              <SectionHeading num="02" note="At least one required">
                Socials
              </SectionHeading>

              <div className="[&_.bg-slate-50]:border-[#E6DCC9] [&_.bg-slate-50]:bg-[#E9E0CD] [&_.bg-slate-50]:text-[#5C5147] [&_.border-slate-300]:border-[#E6DCC9] [&_input]:h-11 [&_input]:border-[#E6DCC9] [&_input]:bg-[#F2EAD9] [&_input]:text-[15px] [&_input]:text-[#221A14] [&_input:focus-visible]:border-[#C4502E] [&_input:focus-visible]:ring-2 [&_input:focus-visible]:ring-[#C4502E]/15">
                <SocialInputAll
                  control={control}
                  required={hasDevSkills(skills) ? ['github'] : ['twitter']}
                />
              </div>

              <SectionHeading num="03" note="Helps sponsors find you">
                Work
              </SectionHeading>

              <FormField
                name="interests"
                control={control}
                render={({ field }) => (
                  <FormItem className="mb-5 w-full">
                    <FormLabel>
                      What areas of Web3 are you most interested in?
                    </FormLabel>
                    <FormControl>
                      <MultiSelect
                        className="mt-2 rounded-xl border-[#E6DCC9] bg-[#F2EAD9]"
                        value={
                          field.value?.map((elm) => ({
                            label: elm,
                            value: elm,
                          })) || []
                        }
                        options={interestDropdown}
                        onChange={(e) => field.onChange(e.map((r) => r.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                name="community"
                control={control}
                render={({ field }) => (
                  <FormItem className="mb-5 w-full">
                    <FormLabel>Community Affiliations</FormLabel>
                    <FormControl>
                      <MultiSelect
                        className="mt-2 rounded-xl border-[#E6DCC9] bg-[#F2EAD9]"
                        value={
                          field.value?.map((elm) => ({
                            label: elm,
                            value: elm,
                          })) || []
                        }
                        options={communityDropdown}
                        onChange={(e) => field.onChange(e.map((r) => r.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="mb-5 grid grid-cols-1 gap-x-4 gap-y-5 sm:grid-cols-2">
                <FormField
                  name="experience"
                  control={control}
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormLabel>Work Experience</FormLabel>
                      <FormControl>
                        <Select
                          key={skillsRefreshKey}
                          onValueChange={field.onChange}
                          defaultValue={field.value || undefined}
                        >
                          <SelectTrigger className={fieldCls}>
                            <SelectValue placeholder="Pick Your Experience" />
                          </SelectTrigger>
                          <SelectContent>
                            {workExp.map((option) => (
                              <SelectItem key={option} value={option}>
                                {option}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  name="cryptoExperience"
                  control={control}
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormLabel>How familiar are you with Web3?</FormLabel>
                      <FormControl>
                        <Select
                          key={skillsRefreshKey}
                          onValueChange={field.onChange}
                          defaultValue={field.value || undefined}
                        >
                          <SelectTrigger className={fieldCls}>
                            <SelectValue placeholder="Pick your Experience" />
                          </SelectTrigger>
                          <SelectContent>
                            {web3Exp.map((option) => (
                              <SelectItem key={option} value={option}>
                                {option}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="mb-5 grid grid-cols-1 gap-x-4 gap-y-5 sm:grid-cols-2">
                <FormField
                  name="location"
                  control={control}
                  render={({ field }) => (
                    <FormItem className="w-full gap-2">
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <RegionCombobox
                          className={cn('w-full', fieldCls)}
                          value={field.value}
                          onChange={(e) => {
                            field.onChange(e);
                          }}
                          classNames={{
                            popoverContent:
                              'w-[var(--radix-popper-anchor-width)]',
                          }}
                        />
                      </FormControl>
                      <FormMessage className="mt-1" />
                    </FormItem>
                  )}
                />

                <FormField
                  name="workPrefernce"
                  control={control}
                  render={({ field }) => (
                    <FormItem className="w-full gap-2">
                      <FormLabel>Work Preference</FormLabel>
                      <FormControl>
                        <Select
                          key={skillsRefreshKey}
                          onValueChange={field.onChange}
                          defaultValue={field.value || undefined}
                        >
                          <SelectTrigger className={fieldCls}>
                            <SelectValue placeholder="Type of Work" />
                          </SelectTrigger>
                          <SelectContent>
                            {workType.map((option) => (
                              <SelectItem key={option} value={option}>
                                {option}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormFieldWrapper
                className="mb-5"
                label="Current Employer"
                name="currentEmployer"
                control={control}
              >
                <Input placeholder="Employer" className={fieldCls} />
              </FormFieldWrapper>

              <SectionHeading num="04" note="Your portfolio &amp; toolkit">
                Proof &amp; Skills
              </SectionHeading>

              <p className="mb-2 text-[13.5px] font-semibold text-[#221A14]">
                Projects
              </p>
              {pow.length > 0 && (
                <div className="mb-2.5 overflow-hidden rounded-2xl border border-[#E6DCC9] bg-white">
                  {pow.map((data, idx) => (
                    <div
                      className="flex items-center gap-3.5 border-b border-[#E6DCC9] px-4 py-3.5 last:border-b-0"
                      key={data.id}
                    >
                      <span
                        className="size-[30px] shrink-0 rounded-[9px]"
                        style={{ backgroundImage: projThumb[idx % 3] }}
                      />
                      <p className="min-w-0 flex-1 truncate font-serif text-[16.5px] text-[#221A14]">
                        {data.title}
                      </p>
                      <div className="flex shrink-0 items-center gap-1.5">
                        <button
                          type="button"
                          aria-label="Edit project"
                          onClick={() => {
                            setSelectedProject(idx);
                            onOpen();
                          }}
                          className="grid size-8 place-items-center rounded-[9px] border border-[#E6DCC9] bg-white text-[#5C5147] transition hover:border-[#C4502E] hover:bg-[#fdf3ec] hover:text-[#C4502E]"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          aria-label="Delete project"
                          onClick={() => {
                            setPow((prevPow) =>
                              prevPow.filter((_ele, id) => idx !== id),
                            );
                          }}
                          className="grid size-8 place-items-center rounded-[9px] border border-[#E6DCC9] bg-white text-[#5C5147] transition hover:border-[#C4502E] hover:bg-[#fdf3ec] hover:text-[#C4502E]"
                        >
                          <Trash className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <button
                type="button"
                onClick={() => {
                  onOpen();
                }}
                className="mb-8 inline-flex items-center gap-2 text-[14px] font-semibold text-[#C4502E] transition-colors hover:text-[#A83F22]"
              >
                <Plus className="h-4 w-4" />
                Add project
              </button>

              <FormField
                name="skills"
                control={control}
                render={({ field }) => {
                  return (
                    <FormItem className="mb-5 gap-2">
                      <div>
                        <span className="flex items-center gap-2">
                          <FormLabel isRequired>Skills</FormLabel>
                          <Tooltip content="Select all that apply">
                            <Info className="h-3 w-3 text-[#6B7A4F]" />
                          </Tooltip>
                        </span>
                        <FormDescription>
                          We&apos;ll email you new listings that match your
                          selected skills
                        </FormDescription>
                      </div>
                      <FormControl>
                        <SkillsSelect
                          key={skillsRefreshKey}
                          defaultValue={field.value || []}
                          onChange={(e) => {
                            field.onChange(e);
                            trigger('skills');
                          }}
                        />
                      </FormControl>
                    </FormItem>
                  );
                }}
              />

              <FormField
                name="private"
                control={control}
                render={({ field }) => (
                  <FormItem className="mb-2">
                    <div className="flex items-start gap-3 rounded-xl border border-[#E6DCC9] bg-[#F2EAD9] px-4 py-3.5">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={(checked) => {
                            if (typeof checked === 'boolean') {
                              field.onChange(checked);
                            }
                          }}
                          className="mt-0.5 data-[state=checked]:border-[#C4502E] data-[state=checked]:bg-[#C4502E]"
                        ></Checkbox>
                      </FormControl>
                      <FormLabel className="text-[14px] leading-relaxed">
                        Keep my info private — hide my profile from public search
                        and the talent directory
                      </FormLabel>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="sticky bottom-0 z-30 mt-8 flex flex-wrap items-center gap-x-4 gap-y-3 border-t border-[#E6DCC9] bg-[#FBF7EF]/90 py-4 backdrop-blur">
                <div className="flex items-center gap-2.5">
                  <span className="flex items-center gap-1.5">
                    {completion.map((done, i) => (
                      <span
                        key={i}
                        className={cn(
                          'size-2 rounded-full border',
                          done
                            ? 'border-[#C4502E] bg-[#C4502E]'
                            : 'border-[#E6DCC9] bg-transparent',
                        )}
                      />
                    ))}
                  </span>
                  <span className="text-[13px] text-[#5C5147]">
                    Changes stay private until you save
                  </span>
                </div>
                <div className="ml-auto flex items-center gap-2.5">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => router.push(`/earn/t/${user?.username}`)}
                    className="rounded-full border border-[#E6DCC9] bg-transparent px-5 text-[14px] font-semibold text-[#221A14] hover:bg-[#F2EAD9]"
                  >
                    View profile
                  </Button>
                  <Button
                    className={cn(
                      'ph-no-capture rounded-full bg-[#C4502E] px-6 text-[14px] font-semibold whitespace-nowrap text-white transition hover:bg-[#A83F22]',
                      isLoading && 'pointer-events-none opacity-50',
                    )}
                    type="submit"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Saving…</span>
                      </span>
                    ) : (
                      <span>Save changes</span>
                    )}
                  </Button>
                </div>
              </div>
                </form>
              </Form>
            </div>
            <aside className="order-1 lg:order-2 lg:sticky lg:top-24">
              <LivePreview
                values={values}
                userId={user?.id}
                photo={uploadedPhotoUrl || (values.photo as string | undefined)}
              />
            </aside>
          </div>
        </div>
      </div>
      <AddProject
        key={`${pow.length}project`}
        {...{
          isOpen,
          onClose,
          pow,
          setPow,
          selectedProject,
          setSelectedProject,
        }}
      />
    </Default>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { slug } = context.query;
  const chapters = await prisma.chapter.findMany({
    where: { active: true },
    select: {
      name: true,
    },
    orderBy: {
      name: 'asc',
    },
  });

  return {
    props: {
      slug,
      chapterNames: chapters.map((chapter) => chapter.name),
    },
  };
};
