import { z } from 'zod';

import { URL_REGEX } from '@/constants/URL_REGEX';

import {
  telegramUsernameSchema,
  twitterUsernameSchema,
} from '@/features/social/utils/schema';

const noHtmlDelimiters = (value: string) => !/[<>]/.test(value);
const noHtmlMessage = 'HTML characters are not allowed';

// Optional handle for company socials (facebook / instagram / tiktok).
// Stored as-is and turned into full URLs on submit.
const socialHandle = z
  .string()
  .refine(noHtmlDelimiters, noHtmlMessage)
  .optional()
  .or(z.literal(''));

export const companySocialsSchema = z
  .object({
    facebook: socialHandle,
    instagram: socialHandle,
    tiktok: socialHandle,
  })
  .partial()
  .optional();

export const sponsorBaseSchema = z.object({
  name: z
    .string()
    .min(1, 'Company name is required')
    .refine(noHtmlDelimiters, noHtmlMessage),
  slug: z
    .string()
    .min(1, 'Company username is required')
    .regex(
      /^[a-zA-Z0-9-]+$/,
      `Slug can only contain lowercase letters, numbers, '_', and '-'`,
    )
    .toLowerCase(),
  bio: z
    .string()
    .min(1, 'Company bio is required')
    .max(180, 'Bio must be less than 180 characters')
    .refine(noHtmlDelimiters, noHtmlMessage),
  logo: z.string().min(1, 'Company logo is required'),
  industry: z.string().min(1, 'At least one industry must be selected'),
  url: z
    .string()
    .min(1, 'Company URL is required')
    .regex(URL_REGEX, 'Invalid URL'),
  // X is optional — many Sierra Leonean companies use Facebook/Instagram/TikTok instead.
  twitter: z.union([z.literal(''), twitterUsernameSchema]).optional(),
  socials: companySocialsSchema,
  // Entity name is no longer collected; defaults to the company name on submit.
  entityName: z
    .string()
    .refine(noHtmlDelimiters, noHtmlMessage)
    .optional()
    .or(z.literal('')),
});

export const userSponsorDetailsSchema = z.object({
  firstName: z
    .string()
    .min(1, 'First name is required')
    .max(100, 'First name must be less than 100 characters'),
  lastName: z
    .string()
    .min(1, 'Last name is required')
    .max(100, 'Last name must be less than 100 characters'),
  username: z
    .string()
    .min(1, 'Username is required')
    .max(40, 'Username must be less than 40 characters')
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      'Only letters, numbers, underscores, and hyphens are allowed',
    ),
  photo: z.string().optional(),
  // Telegram is hidden in the sponsor flow but kept optional for back-compat.
  // `.nullish()` because the API extracts the username and yields null when empty.
  telegram: z.union([z.literal(''), telegramUsernameSchema]).nullish(),
});

export const sponsorFormSchema = z.object({
  sponsor: sponsorBaseSchema,
  user: userSponsorDetailsSchema.optional(),
});

export type SponsorBase = z.infer<typeof sponsorBaseSchema>;
export type UserSponsorDetails = z.infer<typeof userSponsorDetailsSchema>;
export type SponsorFormValues = z.infer<typeof sponsorFormSchema>;

const SOCIAL_PREFIX: Record<keyof NonNullable<SponsorBase['socials']>, string> =
  {
    facebook: 'https://facebook.com/',
    instagram: 'https://instagram.com/',
    tiktok: 'https://tiktok.com/@',
  };

// Turn raw handles into full profile URLs, dropping any blanks.
const buildSocials = (socials: SponsorBase['socials']) => {
  if (!socials) return undefined;
  const out: Record<string, string> = {};
  (Object.keys(SOCIAL_PREFIX) as Array<keyof typeof SOCIAL_PREFIX>).forEach(
    (key) => {
      const handle = socials[key]?.trim();
      if (handle) {
        out[key] = handle.startsWith('http')
          ? handle
          : `${SOCIAL_PREFIX[key]}${handle.replace(/^@/, '')}`;
      }
    },
  );
  return Object.keys(out).length > 0 ? out : undefined;
};

export const transformFormToApiData = (data: SponsorFormValues) => {
  const sponsorData: SponsorBase = {
    name: data.sponsor.name,
    slug: data.sponsor.slug.toLowerCase(),
    bio: data.sponsor.bio,
    logo: data.sponsor.logo,
    industry: data.sponsor.industry,
    url: data.sponsor.url,
    twitter: data.sponsor.twitter || '',
    socials: buildSocials(data.sponsor.socials),
    // No entity-name field anymore — fall back to the company name.
    entityName: data.sponsor.entityName || data.sponsor.name,
  };

  const userData = data.user
    ? {
        firstName: data.user.firstName,
        lastName: data.user.lastName,
        username: data.user.username,
        photo: data.user.photo,
        telegram: data.user.telegram,
      }
    : null;

  return {
    sponsorData,
    userData,
  };
};

export const shouldUpdateUser = (
  formData: UserSponsorDetails,
  currentUser: any,
) => {
  return (
    formData.firstName !== currentUser?.firstName ||
    formData.lastName !== currentUser?.lastName ||
    formData.username !== currentUser?.username ||
    formData.photo !== currentUser?.photo ||
    formData.telegram !== currentUser?.telegram
  );
};
