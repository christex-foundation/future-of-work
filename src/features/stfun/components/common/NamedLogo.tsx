// Future of Work wordmark: "Future ◑f Work" — the rising sun is the "o" of "of".
// Rendered on dark backgrounds (header), so the horizon line is bone.
export default function NamedLogo() {
  return (
    <span className="font-serif flex items-center text-[20px] leading-none font-semibold tracking-[-0.02em] text-white select-none">
      <span>Future</span>
      <svg
        className="mx-[3px] mb-[2px]"
        width="17"
        height="17"
        viewBox="0 0 74 74"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="fowSunWordmark" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0" stopColor="#A6371C" />
            <stop offset=".5" stopColor="#CE4A2B" />
            <stop offset="1" stopColor="#E6A12B" />
          </linearGradient>
        </defs>
        <circle cx="37" cy="40" r="22" fill="url(#fowSunWordmark)" />
        <rect x="8" y="40" width="58" height="4" fill="#F4EEE3" />
        <g stroke="#E6A12B" strokeWidth="3.4" strokeLinecap="round">
          <line x1="37" y1="6" x2="37" y2="13" />
          <line x1="14" y1="15" x2="19" y2="20" />
          <line x1="60" y1="15" x2="55" y2="20" />
        </g>
      </svg>
      <span className="font-primary">f</span>
      <span className="ml-[7px]">Work</span>
    </span>
  );
}
