import { type ReactNode } from 'react';

/**
 * Hand-drawn SVG illustrations for the "Browse Templates" picker, keyed by the
 * template `slug` we seed (see scripts/seed-bounty-templates.mjs and
 * scripts/seed-project-templates.mjs).
 *
 * The DB has no column for artwork — only `emoji` + `color` — so the picker
 * looks art up by slug here and falls back to the stored emoji for any template
 * that isn't mapped. All pieces share one line-art language: a 64×64 canvas,
 * dark Daybreak strokes (#2C3A2E) with sage accents (#8FA37E).
 */

const STROKE = '#2C3A2E';
const ACCENT = '#8FA37E';

interface ArtProps {
  className?: string;
}

const Svg = ({ children, className }: ArtProps & { children: ReactNode }) => (
  <svg
    viewBox="0 0 64 64"
    fill="none"
    stroke={STROKE}
    strokeWidth={2.5}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    {children}
  </svg>
);

// Bounty — short-form video: a vertical phone with a play button.
const VideoArt = (p: ArtProps) => (
  <Svg {...p}>
    <rect x="21" y="6" width="22" height="52" rx="5" />
    <path d="M28 11h8" />
    <path d="M29 25v16l13-8z" fill={ACCENT} />
  </Svg>
);

// Bounty — brand & logo design: a paintbrush with a paint stroke + sparkle.
const BrandLogoArt = (p: ArtProps) => (
  <Svg {...p}>
    <path d="M44 12 30 26" />
    <path d="M30 24l4 4-12 12-4-4z" fill={ACCENT} />
    <path d="M22 40l-5 4" />
    <path d="M14 52q7-4 14 0t14 0" />
    <path d="M48 30l1.4 4 4 1.4-4 1.4-1.4 4-1.4-4-4-1.4 4-1.4z" fill={ACCENT} />
  </Svg>
);

// Bounty — written article: a page with a folded corner and text lines.
const ArticleArt = (p: ArtProps) => (
  <Svg {...p}>
    <path d="M16 8h22l10 10v38H16z" />
    <path d="M38 8v10h10" />
    <path d="M23 28h18" />
    <path d="M23 36h18" />
    <path d="M23 44h11" />
  </Svg>
);

// Bounty — development task: a code window with < / >.
const CodeArt = (p: ArtProps) => (
  <Svg {...p}>
    <rect x="8" y="14" width="48" height="36" rx="4" />
    <path d="M8 24h48" />
    <circle cx="14" cy="19" r="1.4" fill={STROKE} />
    <circle cx="20" cy="19" r="1.4" fill={STROKE} />
    <path d="M27 32l-5 5 5 5" />
    <path d="M37 32l5 5-5 5" />
    <path d="M33 30l-2 14" stroke={ACCENT} />
  </Svg>
);

// Project — website build: a browser window with a sidebar + content blocks.
const WebsiteArt = (p: ArtProps) => (
  <Svg {...p}>
    <rect x="8" y="12" width="48" height="40" rx="4" />
    <path d="M8 22h48" />
    <circle cx="14" cy="17" r="1.4" fill={STROKE} />
    <circle cx="20" cy="17" r="1.4" fill={STROKE} />
    <rect x="14" y="28" width="13" height="18" rx="2" fill={ACCENT} />
    <path d="M33 30h13" />
    <path d="M33 37h13" />
    <path d="M33 44h8" />
  </Svg>
);

// Project — brand identity & design system: geometric marks on a baseline.
const IdentityArt = (p: ArtProps) => (
  <Svg {...p}>
    <circle cx="20" cy="24" r="9" />
    <rect x="32" y="15" width="17" height="17" rx="2" />
    <path d="M20 50 31 33 42 50z" fill={ACCENT} />
    <path d="M12 54h40" />
  </Svg>
);

// Project — content & social management: a speech bubble with message dots.
const SocialArt = (p: ArtProps) => (
  <Svg {...p}>
    <path d="M20 12h22a6 6 0 0 1 6 6v12a6 6 0 0 1-6 6H28l-8 8v-8a6 6 0 0 1-6-6V18a6 6 0 0 1 6-6z" />
    <circle cx="24" cy="24" r="2" fill={ACCENT} />
    <circle cx="31" cy="24" r="2" fill={ACCENT} />
    <circle cx="38" cy="24" r="2" fill={ACCENT} />
  </Svg>
);

// Project — growth / marketing campaign: a rising line chart with an arrow.
const GrowthArt = (p: ArtProps) => (
  <Svg {...p}>
    <path d="M12 10v40h42" />
    <path d="M16 42l11-11 7 6 16-16" stroke={ACCENT} />
    <path d="M42 21h12v12" stroke={ACCENT} />
  </Svg>
);

const ART_BY_SLUG: Record<string, (p: ArtProps) => ReactNode> = {
  'template-short-form-video': VideoArt,
  'template-brand-logo-design': BrandLogoArt,
  'template-written-content-article': ArticleArt,
  'template-development-task': CodeArt,
  'template-project-website-build': WebsiteArt,
  'template-project-brand-identity': IdentityArt,
  'template-project-content-social': SocialArt,
  'template-project-growth-campaign': GrowthArt,
};

// Loose keyword fallbacks so close variants still get art instead of an emoji.
const pickByKeyword = (slug: string): ((p: ArtProps) => ReactNode) | null => {
  if (slug.includes('video')) return VideoArt;
  if (slug.includes('logo')) return BrandLogoArt;
  if (slug.includes('identity') || slug.includes('design-system'))
    return IdentityArt;
  if (slug.includes('article') || slug.includes('content-writing'))
    return ArticleArt;
  if (slug.includes('development') || slug.includes('dev-task')) return CodeArt;
  if (slug.includes('website') || slug.includes('web-app')) return WebsiteArt;
  if (slug.includes('social') || slug.includes('community')) return SocialArt;
  if (slug.includes('growth') || slug.includes('marketing')) return GrowthArt;
  return null;
};

interface TemplateArtProps {
  slug?: string | null;
  emoji?: string | null;
  className?: string;
}

export function TemplateArt({ slug, emoji, className }: TemplateArtProps) {
  const Art = slug ? ART_BY_SLUG[slug] || pickByKeyword(slug) : null;

  if (Art) return <Art className={className ?? 'size-16'} />;

  return <span className="text-4xl">{emoji}</span>;
}
