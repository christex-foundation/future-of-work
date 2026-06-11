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

function SectionHeading({
  num,
  children,
  className,
}: {
  num?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('mb-5 flex items-center gap-2.5', className)}>
      {num && (
        <span className="font-secondary text-[11px] font-bold text-[#ce4a2b]">
          {num}
        </span>
      )}
      <span className="inline-block size-[7px] shrink-0 bg-[#ce4a2b]" />
      <h2 className="font-secondary text-[13px] font-bold tracking-[0.18em] text-[#1d1815] uppercase">
        {children}
      </h2>
      <span className="h-px flex-1 bg-[#1d1815]/15" />
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

  return (
    <div>
      <p className="font-secondary mb-3 flex items-center gap-2 text-[10px] font-bold tracking-[0.18em] text-[#e7d3c1] uppercase">
        <span className="inline-block size-[7px] bg-[#e6a12b]" />
        Live preview — what they see
      </p>
      <div className="overflow-hidden rounded-xl border-2 border-[#1d1815] bg-[#f4eee3] shadow-[6px_6px_0_#1d1815]">
        <div className="flex items-center justify-between bg-[#1d1815] px-4 py-2">
          <span className="font-secondary text-[9px] font-bold tracking-[0.18em] text-[#c9b9a5] uppercase">
            Talent Dossier
          </span>
          <span className="font-secondary text-[9px] font-bold tracking-[0.18em] text-[#c9b9a5] uppercase">
            @{values.username || 'username'}
          </span>
        </div>
        <div className="p-4">
          <div className="flex items-start gap-3">
            <div className="inline-flex shrink-0 overflow-hidden rounded-lg border-2 border-[#1d1815] bg-[#1d1815] shadow-[3px_3px_0_#1d1815]">
              <EarnAvatar
                className="size-14 rounded-none"
                id={userId}
                avatar={photo}
              />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-secondary truncate text-[18px] leading-tight font-bold text-[#1d1815]">
                {fullName || 'Your Name'}
              </h3>
              <p className="font-secondary truncate text-[12px] font-semibold text-[#6b5e50]">
                @{values.username || 'username'}
              </p>
            </div>
          </div>

          {wpText && (
            <p className="font-serif mt-3 text-[15px] leading-snug font-semibold text-[#ce4a2b] italic">
              Looking for {wpText}
            </p>
          )}

          {values.bio && (
            <p className="mt-2 line-clamp-2 text-[12px] leading-relaxed text-[#3a322b]">
              {values.bio}
            </p>
          )}

          {(values.currentEmployer || values.location) && (
            <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-[#6b5e50]">
              {values.currentEmployer && (
                <span>
                  <span className="text-[#9a8b78]">@ </span>
                  <span className="font-medium text-[#3a322b]">
                    {values.currentEmployer}
                  </span>
                </span>
              )}
              {values.currentEmployer && values.location && (
                <span className="inline-block size-1 rounded-full bg-[#9a8b78]" />
              )}
              {values.location && (
                <span className="font-medium text-[#3a322b]">
                  {values.location}
                </span>
              )}
            </p>
          )}

          {skills.length > 0 && (
            <div className="mt-3.5 flex flex-wrap gap-1.5 border-t border-dashed border-[#1d1815]/15 pt-3.5">
              {skills
                .flatMap((s: any) => s?.subskills ?? [])
                .slice(0, 8)
                .map((sub: string, i: number) => (
                  <span
                    key={i}
                    className="rounded border border-[#1d1815]/15 bg-[#efe8da] px-2 py-0.5 text-[11px] font-medium text-[#3a322b]"
                  >
                    {sub}
                  </span>
                ))}
            </div>
          )}

          {socials.some(({ link }) => link) && (
            <div className="mt-3.5 flex items-center gap-4 border-t border-dashed border-[#1d1815]/15 pt-3.5">
              {socials.map(({ Icon, link }, i) => (
                <Icon
                  key={i}
                  link={link ? '#' : undefined}
                  className="h-[18px] w-[18px]"
                />
              ))}
            </div>
          )}
        </div>
      </div>
      <p className="mt-3 text-center text-[11px] text-[#e7d3c1]">
        Updates live as you edit.
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
      className="bg-[#6b5e50]"
      meta={
        <Meta
          title="Superteam Earn"
          description="Every Solana opportunity in one place!"
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
      <div className="w-full grow bg-[#6b5e50] px-4 py-8 md:px-6 md:py-12">
        <div className="mx-auto max-w-[1080px]">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
            <div className="dossier-form overflow-hidden rounded-xl border-2 border-[#1d1815] bg-[#f4eee3] shadow-[8px_8px_0_#1d1815]">
              <div className="flex items-center justify-between gap-3 bg-[#1d1815] px-4 py-2.5 md:px-7">
                <span className="font-secondary flex items-center gap-2 text-[10px] font-bold tracking-[0.18em] text-[#f4eee3] uppercase md:text-[11px]">
                  <span className="inline-block size-[7px] bg-[#e6a12b]" />
                  Editing Dossier
                </span>
                <span className="flex items-center gap-1.5">
                  {completion.map((done, i) => (
                    <span
                      key={i}
                      className={cn(
                        'inline-block size-2 rounded-full border border-[#f4eee3]/40',
                        done ? 'bg-[#e6a12b]' : 'bg-transparent',
                      )}
                    />
                  ))}
                </span>
              </div>
              <div className="p-5 md:p-8">
                <Form {...form}>
                  <h1 className="font-serif text-[32px] leading-none font-semibold text-[#1d1815] md:text-[38px]">
                    Edit Profile
                  </h1>
                  <p className="mt-2.5 text-[14px] text-[#6b5e50]">
                    Fill the left, watch your dossier build on the right.
                  </p>
                  <form onSubmit={handleSubmit(onSubmit)}>
                    <SectionHeading num="01" className="mt-9">
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
                <Input maxLength={40} placeholder="Username" />
              </FormFieldWrapper>

              <div className="mb-5 grid grid-cols-1 gap-x-4 gap-y-5 sm:grid-cols-2">
                <FormFieldWrapper
                  label="First Name"
                  name="firstName"
                  control={control}
                  isRequired
                >
                  <Input placeholder="First Name" />
                </FormFieldWrapper>

                <FormFieldWrapper
                  label="Last Name"
                  name="lastName"
                  control={control}
                  isRequired
                >
                  <Input placeholder="Last Name" />
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
                        />
                      </FormControl>
                      <p
                        className={cn(
                          'mt-1 text-right text-xs',
                          (watch('bio')?.length || 0) > 160
                            ? 'text-[#ce4a2b]'
                            : 'text-[#9a8b78]',
                        )}
                      >
                        {180 - (watch('bio')?.length || 0)} characters left
                      </p>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />

              <SectionHeading num="02" className="mt-10">
                Socials
              </SectionHeading>

              <SocialInputAll
                control={control}
                required={hasDevSkills(skills) ? ['github'] : ['twitter']}
              />

              <SectionHeading num="03" className="mt-10">
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
                        className="mt-2"
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
                        className="mt-2"
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
                          <SelectTrigger>
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
                          <SelectTrigger>
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
                          className="w-full"
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
                          <SelectTrigger>
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
                <Input placeholder="Employer" />
              </FormFieldWrapper>

              <SectionHeading num="04" className="mt-10">
                Proof &amp; Skills
              </SectionHeading>
              <div>
                {pow.map((data, idx) => {
                  return (
                    <div
                      className="mt-2 mb-1.5 flex items-center gap-3 rounded-lg border border-[#1d1815]/20 bg-[#efe8da] px-4 py-2.5 break-all"
                      key={data.id}
                    >
                      <p className="w-full text-sm font-medium text-[#3a322b]">
                        {data.title}
                      </p>
                      <div className="flex items-center gap-3 text-[#6b5e50]">
                        <Edit
                          onClick={() => {
                            setSelectedProject(idx);
                            onOpen();
                          }}
                          className="h-3.5 w-3.5 cursor-pointer transition-colors hover:text-[#1d1815]"
                        />
                        <Trash
                          onClick={() => {
                            setPow((prevPow) =>
                              prevPow.filter((_ele, id) => idx !== id),
                            );
                          }}
                          className="h-3.5 w-3.5 cursor-pointer transition-colors hover:text-[#ce4a2b]"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              <Button
                className="mb-8 w-full border-2 border-[#1d1815] bg-[#f4eee3] font-semibold text-[#1d1815] hover:bg-[#1d1815] hover:text-[#f4eee3]"
                onClick={() => {
                  onOpen();
                }}
                variant="outline"
                type="button"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Project
              </Button>

              <FormField
                name="skills"
                control={control}
                render={({ field }) => {
                  return (
                    <FormItem className="mb-5 gap-2">
                      <div>
                        <span className="flex items-center gap-2">
                          <FormLabel isRequired>Skills Needed</FormLabel>
                          <Tooltip content="Select all that apply">
                            <Info className="h-3 w-3 text-slate-500" />
                          </Tooltip>
                        </span>
                        <FormDescription>
                          We will send email notifications of new listings for
                          your selected skills
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
                  <FormItem className="mb-8">
                    <div className="flex items-center gap-2">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={(checked) => {
                            if (typeof checked === 'boolean') {
                              field.onChange(checked);
                            }
                          }}
                          className="mr-1 data-[state=checked]:border-[#1d1815] data-[state=checked]:bg-[#1d1815]"
                        ></Checkbox>
                      </FormControl>
                      <FormLabel className="font-medium text-[#6b5e50]">
                        Keep my info private
                      </FormLabel>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
                  <Button
                    className={cn(
                      'ph-no-capture mt-2 mb-2 h-11 w-full border-2 border-[#1d1815] bg-[#1d1815] px-6 text-[14px] font-semibold text-[#f4eee3] shadow-[3px_3px_0_#1d1815] transition hover:bg-[#1d1815] hover:text-[#f4eee3] hover:shadow-[1px_1px_0_#1d1815]',
                      isLoading && 'pointer-events-none opacity-50',
                    )}
                    type="submit"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        <span>Updating...</span>
                      </span>
                    ) : (
                      <span>Update Profile</span>
                    )}
                  </Button>
                </form>
              </Form>
            </div>
          </div>
          <aside className="lg:sticky lg:top-6">
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
