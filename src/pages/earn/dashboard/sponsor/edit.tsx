import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Info, Loader2 } from 'lucide-react';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useState } from 'react';
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
        <div className="mx-auto max-w-[760px]">
          {/* header */}
          <div className="font-secondary flex items-center gap-2.5 text-[11px] font-bold tracking-[0.26em] text-[#CE4A2B] uppercase">
            <span className="inline-block h-0.5 w-6 bg-[#CE4A2B]" />
            Sponsor Profile
          </div>
          <h1 className="font-serif mt-3.5 text-[clamp(28px,3.2vw,40px)] leading-[1.02] font-semibold tracking-[-0.02em] text-[#1D1815]">
            Edit profile
          </h1>
          <p className="mt-2.5 max-w-[480px] text-[15px] leading-relaxed text-[#6B5E50]">
            Update how your organization shows up across Future of Work.
          </p>

          {/* form card */}
          <div className="mt-8 rounded-2xl border-2 border-[#1d1815] bg-[#f4eee3] p-6 shadow-[5px_5px_0_#1d1815] sm:p-8 [&_input]:border-[#1d1815]/25 [&_input]:bg-[#FBF7EE] [&_input]:text-[#1d1815] [&_input]:placeholder:text-[#6b5e50] [&_input]:focus-visible:ring-[#ce4a2b] [&_label]:text-[#1d1815]">
            <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              style={{ width: '100%' }}
            >
              <div className="flex w-full justify-between gap-4">
                <FormFieldWrapper
                  control={form.control}
                  name="name"
                  label="Company Name"
                  isRequired
                  onChange={(e) => {
                    setSponsorName(e.target.value);
                  }}
                >
                  <Input placeholder="Stark Industries" value={sponsorName} />
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
                  <Input placeholder="starkindustries" value={slug} />
                </FormFieldWrapper>
              </div>
              <div className="my-6 flex w-full justify-between gap-4">
                <FormFieldWrapper
                  control={form.control}
                  name="url"
                  label="Company URL"
                  isRequired
                >
                  <Input placeholder="https://starkindustries.com" />
                </FormFieldWrapper>

                <SocialInput
                  name="twitter"
                  socialName={'twitter'}
                  formLabel="Company X"
                  placeholder="@StarkIndustries"
                  required
                  control={form.control}
                  height="h-9"
                />
              </div>

              <div className="flex w-full">
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
                        <Info className="mt-1 ml-1 hidden h-3 w-3 text-slate-500 md:block" />
                      </Tooltip>
                    </>
                  }
                  isRequired
                >
                  <Input placeholder="Full Entity Name" />
                </FormFieldWrapper>
              </div>

              <div className="mt-6 mb-3 w-full">
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

              <div className="mt-6 flex w-full justify-between">
                <FormField
                  control={form.control}
                  name="industry"
                  render={({ field }) => (
                    <FormItem>
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
                          className="mt-2"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="my-6">
                <FormFieldWrapper
                  control={form.control}
                  name="bio"
                  label="Company Short Bio"
                  isRequired
                >
                  <Input
                    maxLength={180}
                    placeholder="What does your company do?"
                  />
                </FormFieldWrapper>
                <div className="text-right text-xs text-[#6b5e50]">
                  {180 - (form.watch('bio')?.length || 0)} characters left
                </div>
              </div>
              <div className="mt-8">
                <button
                  type="submit"
                  disabled={isSubmitDisabled}
                  className="font-secondary flex w-full items-center justify-center gap-2 rounded-md border-2 border-[#1d1815] bg-[#ce4a2b] px-5 py-3.5 text-[13px] font-bold tracking-[0.08em] text-[#f4eee3] uppercase shadow-[3px_3px_0_#1d1815] transition-all duration-150 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0_#1d1815] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-x-0 disabled:hover:translate-y-0 disabled:hover:shadow-[3px_3px_0_#1d1815]"
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
