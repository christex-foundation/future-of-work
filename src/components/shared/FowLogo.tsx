import { cn } from '@/utils/cn';

/**
 * Future of Work brand mark — the rising sun used as the "o".
 * Lowercase `f` + the sun does the work; no container.
 * (Matches fow-design-system.pdf · "The mark & wordmark".)
 */

let gradId = 0;

/** The standalone rising-sun glyph (gradient disc, horizon line, three rays). */
export function SunGlyph({
  className,
  title,
}: {
  className?: string;
  title?: string;
}) {
  // Unique gradient id per instance so multiple suns can render together.
  const id = `fow-sun-${(gradId += 1)}`;
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      role={title ? 'img' : 'presentation'}
      aria-hidden={title ? undefined : true}
    >
      {title ? <title>{title}</title> : null}
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#F2A23C" />
          <stop offset="0.5" stopColor="#DE6A30" />
          <stop offset="1" stopColor="#C0301A" />
        </linearGradient>
      </defs>
      <g stroke="#E0843A" strokeWidth="7" strokeLinecap="round">
        <line x1="50" y1="3" x2="50" y2="19" />
        <line x1="25" y1="11" x2="34" y2="26" />
        <line x1="75" y1="11" x2="66" y2="26" />
      </g>
      <circle cx="50" cy="60" r="30" fill={`url(#${id})`} />
      <line
        x1="11"
        y1="58"
        x2="89"
        y2="58"
        stroke="#F7E9D2"
        strokeWidth="6.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * Compact mark: lowercase `f` + the sun beside it.
 * For navbars, app icons, avatars, favicons.
 */
export function FowMark({
  className,
  title = 'Future of Work',
}: {
  className?: string;
  title?: string;
}) {
  return (
    <span
      className={cn('inline-flex items-end leading-none', className)}
      aria-label={title}
      role="img"
    >
      <span className="font-sans text-[1.15em] leading-[0.8] font-bold">f</span>
      <SunGlyph className="ml-[-0.06em] mb-[0.12em] h-[0.5em] w-[0.5em]" />
    </span>
  );
}

/**
 * Full wordmark lockup: "Future ☉f Work" in Fraunces, the sun as the "o".
 * Inherits text color via currentColor — pass a text-* class for light/dark.
 */
export function FowWordmark({
  className,
}: {
  className?: string;
}) {
  return (
    <span
      className={cn(
        'font-serif inline-flex items-center font-semibold tracking-tight whitespace-nowrap',
        className,
      )}
      aria-label="Future of Work"
      role="img"
    >
      Future
      <span className="mx-[0.12em] inline-flex items-center">
        <SunGlyph className="mr-[-0.04em] mb-[0.1em] h-[0.62em] w-[0.62em]" />
        f
      </span>
      Work
    </span>
  );
}
