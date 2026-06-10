import { cn } from '@/utils/cn';

interface IllustrationCardProps {
  text: string;
  description?: string;
  className?: string;
  onClick?: () => void;
  /** Hex color for the card's dawn glow. */
  accent?: string;
  /** Small uppercase cue shown at the bottom. */
  cue?: string;
}

export default function IllustrationCard({
  text,
  description,
  className,
  onClick,
  accent = '#E6A12B',
  cue = 'Explore',
}: IllustrationCardProps) {
  const sunId = `card-sun-${text.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <div
      className={cn(
        'image-with-text group z-1 cursor-pointer rounded-2xl',
        className,
      )}
      onClick={onClick}
    >
      <div className="image-with-text-content relative flex min-h-[298px] flex-col justify-between overflow-hidden rounded-2xl p-7 text-left">
        {/* dawn glow */}
        <div
          className="pointer-events-none absolute -bottom-1/3 left-1/2 h-[78%] w-[150%] -translate-x-1/2 rounded-[50%] opacity-50 blur-2xl transition-opacity duration-500 group-hover:opacity-80"
          style={{
            background: `radial-gradient(ellipse at 50% 100%, ${accent} 0%, #CE4A2B 36%, rgba(166,55,28,0) 70%)`,
          }}
        />

        {/* title + description */}
        <div className="relative z-10">
          <h3 className="font-serif text-[24px] font-semibold tracking-[-0.01em] text-[#F4EEE3] md:text-[28px]">
            {text}
          </h3>
          {description && (
            <p className="font-primary mt-3 max-w-[34ch] text-[14px] leading-[1.5] text-[#e7d3c1]/85 md:text-[15px]">
              {description}
            </p>
          )}
        </div>

        {/* cue + rising-sun mark */}
        <div className="relative z-10 mt-6 flex items-end justify-between">
          <span className="font-secondary text-[11px] font-bold tracking-[0.18em] text-[#E7D3C1]/70 uppercase">
            {cue} &rarr;
          </span>
          <svg
            className="h-9 w-9 opacity-90 transition-transform duration-500 group-hover:-translate-y-1"
            viewBox="0 0 74 74"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id={sunId} x1="0" y1="1" x2="0" y2="0">
                <stop offset="0" stopColor="#A6371C" />
                <stop offset=".5" stopColor="#CE4A2B" />
                <stop offset="1" stopColor="#E6A12B" />
              </linearGradient>
            </defs>
            <circle cx="37" cy="40" r="20" fill={`url(#${sunId})`} />
            <rect x="10" y="40" width="54" height="3.4" fill="#F4EEE3" />
          </svg>
        </div>
      </div>
    </div>
  );
}
