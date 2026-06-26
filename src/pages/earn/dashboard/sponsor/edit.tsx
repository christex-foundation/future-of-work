import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Info, Loader2 } from 'lucide-react';
import { useRouter } from 'next/router';
import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { ImageUploader } from '@/components/shared/ImageUploader';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { FormFieldWrapper } from '@/components/ui/form-field-wrapper';
import { Input } from '@/components/ui/input';
import { MultiSelect } from '@/components/ui/multi-select';
import { Tooltip } from '@/components/ui/tooltip';
import { SponsorLayout } from '@/layouts/Sponsor';
import { api } from '@/lib/api';
import { useUser } from '@/store/user';
import { cn } from '@/utils/cn';

import { SocialInput } from '@/features/social/components/SocialInput';
import { extractSocialUsername } from '@/features/social/utils/extractUsername';
import { sponsorQuery } from '@/features/sponsor-dashboard/queries/sponsor';
import { useSlugValidation } from '@/features/sponsor/hooks/useSlugValidation';
import { useSponsorNameValidation } from '@/features/sponsor/hooks/useSponsorNameValidation';
import {
  type SponsorBase,
  sponsorBaseSchema,
} from '@/features/sponsor/utils/sponsorFormSchema';
import { IndustryList } from '@/features/talent/constants';

const fieldCls =
  'h-11 rounded-xl border-[#E6DCC9] bg-[#F2EAD9] px-4 text-[15px] text-[#221A14] shadow-none transition-colors placeholder:text-[#a99e8d] hover:border-[#d9ccb2] focus-visible:border-[#C4502E] focus-visible:bg-[#F2EAD9] focus-visible:ring-2 focus-visible:ring-[#C4502E]/15 focus-visible:ring-offset-0';

function SectionHeading({
  num,
  note,
  first,
  children,
}: {
  num: string;
  note?: string;
  first?: boolean;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        'mb-5 flex flex-wrap items-baseline gap-x-3.5 gap-y-1',
        first ? 'mt-1' : 'mt-10 border-t border-[#E6DCC9] pt-7',
      )}
    >
      <span className="font-serif text-[15px] text-[#C4502E] italic">
        {num}
      </span>
      <h2 className="font-serif text-[26px] leading-none font-normal tracking-[-0.01em] text-[#221A14]">
        {children}
      </h2>
      {note && (
        <span className="ml-auto text-[12.5px] text-[#5C5147]">{note}</span>
      )}
    </div>
  );
}

export default function UpdateSponsor() {
  const router = useRouter();
  const { user, refetchUser } = useUser();

  const [uploadedLogoUrl, setUploadedLogoUrl] = useState<string | null>(null);
  const [initialLogo, setInitialLogo] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const form = useForm<SponsorBase>({
    resolver: zodResolver(sponsorBaseSchema),
    mode: 'onBlur',
    defaultValues: {
      name: '',
      slug: '',
      bio: '',
      logo: '',
      industry: '',
      url: '',
      twitter: '',
      entityName: '',
    },
  });

  const {
    setSponsorName,
    isInvalid: isSponsorNameInvalid,
    validationErrorMessage: sponsorNameValidationErrorMessage,
    sponsorName,
  } = useSponsorNameValidation();

  useEffect(() => {
    if (form.formState.touchedFields.name && sponsorName === '') {
      form.clearErrors('name');
    }
    if (!form.formState.errors?.name?.message) {
      if (isSponsorNameInvalid) {
        form.setError('name', {
          message: sponsorNameValidationErrorMessage,
        });
      }
    }
  }, [
    sponsorNameValidationErrorMessage,
    isSponsorNameInvalid,
    form.formState.errors.name?.message,
    sponsorName,
  ]);

  const {
    setSlug,
    isInvalid: isSlugInvalid,
    validationErrorMessage: slugValidationErrorMessage,
    slug,
  } = useSlugValidation();

  useEffect(() => {
    if (form.formState.touchedFields.slug && slug === '') {
      form.clearErrors('slug');
    }
    form.clearErrors('slug');
    if (isSlugInvalid && !form.formState.errors.slug?.message) {
      form.setError('slug', {
        message: slugValidationErrorMessage,
      });
    }
  }, [
    slugValidationErrorMessage,
    isSlugInvalid,
    form.formState.errors.slug?.message,
    slug,
  ]);

  const { data: sponsorData } = useQuery(sponsorQuery(user?.currentSponsorId));

  useEffect(() => {
    if (sponsorData) {
      const { bio, industry, name, slug, logo, twitter, url, entityName } =
        sponsorData;
      setSponsorName(name);
      setSlug(slug);
      setInitialLogo(logo || '');
      form.reset({
        name,
        slug,
        bio,
        logo,
        industry,
        url,
        twitter: twitter
          ? extractSocialUsername('twitter', twitter) || undefined
          : undefined,
        entityName,
      });
    }
  }, [sponsorData, form.reset, setSlug, setSponsorName]);

  const hasLogo = uploadedLogoUrl || initialLogo;
  const isSubmitDisabled = useMemo(
    () => !hasLogo || isLoading || isSlugInvalid || isSponsorNameInvalid,
    [hasLogo, isLoading, isSlugInvalid, isSponsorNameInvalid],
  );

  const onSubmit = async (data: SponsorBase) => {
    if (isSubmitDisabled) return;

    try {
      setIsLoading(true);

      const finalLogo = uploadedLogoUrl || initialLogo;

      await api.post('/api/sponsors/edit', {
        ...data,
        logo: finalLogo,
      });
      await refetchUser();
      toast.success('Sponsor profile updated successfully!');
      router.push('/earn/dashboard/listings');
    } catch (error) {
      console.error('Error updating sponsor:', error);
      if (
        axios.isAxiosError(error) &&
        error.response?.data?.error?.code === 'P2002'
      ) {
        toast.error('Sorry! Sponsor name or username already exists.');
      } else {
        toast.error('Failed to update sponsor profile. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SponsorLayout>
      <div className="px-4 pt-2 pb-14">
        <div className="mx-auto max-w-[920px]">
          {/* header */}
          <div className="font-secondary flex items-center gap-2.5 text-[11px] font-bold tracking-[0.26em] text-[#C4502E] uppercase">
            <span className="inline-block h-0.5 w-6 bg-[#C4502E]" />
            Sponsor Profile
          </div>
          <h1 className="mt-3.5 font-serif text-[clamp(30px,4vw,42px)] leading-[1.05] font-normal tracking-[-0.02em] text-[#221A14]">
            Edit your company profile.
          </h1>
          <p className="mt-2.5 max-w-[54ch] text-[15.5px] leading-relaxed text-[#5C5147]">
            Keep your public sponsor page current. These details shape how
            talent sees your organization across listings and grant pages.
          </p>

          <div className="mt-8">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="[&_[data-slot=form-description]]:text-[#5C5147] [&_[data-slot=form-label]]:text-[13.5px] [&_[data-slot=form-label]]:font-semibold [&_[data-slot=form-label]]:text-[#221A14]"
              >
                <SectionHeading
                  num="01"
                  note="Shown across listings and sponsor pages"
                  first
                >
                  Identity
                </SectionHeading>

                <div className="mb-5 grid grid-cols-1 gap-x-4 gap-y-5 sm:grid-cols-2">
                  <FormFieldWrapper
                    control={form.control}
                    name="name"
                    label="Company Name"
                    isRequired
                    onChange={(e) => {
                      setSponsorName(e.target.value);
                    }}
                  >
                    <Input
                      placeholder="Stark Industries"
                      value={sponsorName}
                      className={fieldCls}
                    />
                  </FormFieldWrapper>

                  <FormFieldWrapper
                    control={form.control}
                    name="slug"
                    label="Company Username"
                    isRequired
                    onChange={(e) => {
                      const value = e.target.value
                        .toLowerCase()
                        .replace(/\s+/g, '-');
                      form.setValue('slug', value);
                      setSlug(value);
                    }}
                  >
                    <Input
                      placeholder="starkindustries"
                      value={slug}
                      className={fieldCls}
                    />
                  </FormFieldWrapper>
                </div>

                <div className="mb-5">
                  <FormFieldWrapper
                    control={form.control}
                    name="entityName"
                    label={
                      <>
                        Entity Name
                        <Tooltip
                          content="Please mention the official entity name of your project. If you are a DAO, simply mention the name of the DAO. If you neither have an entity nor are a DAO, mention your full name."
                          contentProps={{ className: 'text-xs' }}
                        >
                          <Info className="mt-1 ml-1 hidden h-3 w-3 text-[#6B7A4F] md:block" />
                        </Tooltip>
                      </>
                    }
                    isRequired
                  >
                    <Input
                      placeholder="Full Entity Name"
                      className={fieldCls}
                    />
                  </FormFieldWrapper>
                </div>

                <div className="mb-5 w-full">
                  <FormLabel isRequired>Company Logo</FormLabel>
                  <ImageUploader
                    source="sponsor"
                    crop="square"
                    defaultValue={initialLogo || undefined}
                    onChange={(result) => {
                      setUploadedLogoUrl(result.secureUrl);
                      form.setValue('logo', result.secureUrl);
                    }}
                    onReset={() => {
                      setUploadedLogoUrl(null);
                      setInitialLogo(null);
                      form.setValue('logo', '');
                    }}
                  />
                </div>

                <SectionHeading num="02" note="Where talent can find you">
                  Public presence
                </SectionHeading>

                <div className="mb-5 grid grid-cols-1 gap-x-4 gap-y-5 sm:grid-cols-2">
                  <FormFieldWrapper
                    control={form.control}
                    name="url"
                    label="Company URL"
                    isRequired
                  >
                    <Input
                      placeholder="https://starkindustries.com"
                      className={fieldCls}
                    />
                  </FormFieldWrapper>

                  <div className="[&_.bg-slate-50]:border-[#E6DCC9] [&_.bg-slate-50]:bg-[#E9E0CD] [&_.bg-slate-50]:text-[#5C5147] [&_.border-slate-300]:border-[#E6DCC9] [&_input]:h-11 [&_input]:border-[#E6DCC9] [&_input]:bg-[#F2EAD9] [&_input]:text-[15px] [&_input]:text-[#221A14] [&_input:focus-visible]:border-[#C4502E] [&_input:focus-visible]:ring-2 [&_input:focus-visible]:ring-[#C4502E]/15">
                    <SocialInput
                      name="twitter"
                      socialName="twitter"
                      formLabel="Company X"
                      placeholder="@StarkIndustries"
                      required
                      control={form.control}
                      height="h-11"
                      classNames={{ input: fieldCls }}
                    />
                  </div>
                </div>

                <SectionHeading
                  num="03"
                  note="Helps contributors understand you"
                >
                  Company details
                </SectionHeading>

                <div className="mb-5 flex w-full justify-between">
                  <FormField
                    control={form.control}
                    name="industry"
                    render={({ field }) => (
                      <FormItem className="w-full">
                        <FormLabel isRequired>Industry</FormLabel>
                        <FormControl>
                          <MultiSelect
                            options={IndustryList.map((elm) => ({
                              label: elm,
                              value: elm,
                            }))}
                            value={field.value
                              ?.split(', ')
                              .map((value) => ({
                                label: value,
                                value: value,
                              }))
                              .filter(Boolean)}
                            onChange={(selected: any) => {
                              const values =
                                selected?.map((item: any) => item.value) || [];
                              field.onChange(values.join(', '));
                            }}
                            className="mt-2 rounded-xl border-[#E6DCC9] bg-[#F2EAD9]"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="mb-5">
                  <FormFieldWrapper
                    control={form.control}
                    name="bio"
                    label="Company Short Bio"
                    isRequired
                  >
                    <Input
                      maxLength={180}
                      placeholder="What does your company do?"
                      className={fieldCls}
                    />
                  </FormFieldWrapper>
                  <div
                    className={cn(
                      'mt-1 text-right text-xs',
                      (form.watch('bio')?.length || 0) > 160
                        ? 'text-[#C4502E]'
                        : 'text-[#5C5147]',
                    )}
                  >
                    {180 - (form.watch('bio')?.length || 0)} characters left
                  </div>
                </div>

                <div className="sticky bottom-0 z-30 mt-8 flex flex-wrap items-center gap-x-4 gap-y-3 border-t border-[#E6DCC9] bg-[#FBF7EF]/90 py-4 backdrop-blur">
                  <p className="text-[13px] text-[#5C5147]">
                    Changes go live after you save.
                  </p>
                  <button
                    type="submit"
                    disabled={isSubmitDisabled}
                    className="font-secondary ml-auto flex items-center justify-center gap-2 rounded-full bg-[#2C3A2E] px-6 py-3 text-[13px] font-bold tracking-[0.08em] text-[#FBF7EF] uppercase shadow-[0_14px_28px_-18px_rgba(44,58,46,0.75)] transition-all duration-150 hover:-translate-y-0.5 hover:bg-[#3C4D3D] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Updating…
                      </>
                    ) : (
                      <>Update profile &rarr;</>
                    )}
                  </button>
                </div>
              </form>
            </Form>
          </div>
        </div>
      </div>
    </SponsorLayout>
  );
}
