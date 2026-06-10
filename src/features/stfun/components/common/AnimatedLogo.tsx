'use client';

import { useEffect, useRef } from 'react';

import { gsap } from '@/lib/gsap';

// Future of Work mark: lowercase "f" + the rising sun as the "o".
// The sun rises into place on mount, echoing the brand motif.
export default function AnimatedLogo() {
  const containerRef = useRef<HTMLDivElement>(null);
  const sunRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        containerRef.current,
        { opacity: 0, y: 24 },
        { opacity: 1, y: 0, duration: 1.4, ease: 'power3.out', delay: 0.2 },
      );
      gsap.fromTo(
        sunRef.current,
        { y: 16, opacity: 0 },
        { y: 0, opacity: 1, duration: 1.6, ease: 'power2.out', delay: 0.5 },
      );
    });

    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={containerRef}
      className="flex items-end justify-center text-white select-none"
    >
      <span className="font-secondary text-[40px] leading-[0.8] font-semibold tracking-[-0.04em] md:text-[52px]">
        f
      </span>
      <svg
        ref={sunRef}
        className="mb-[6px] ml-[1px] h-[21px] w-[21px] md:mb-[8px] md:h-[26px] md:w-[26px]"
        viewBox="0 0 74 74"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="fowSunMark" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0" stopColor="#A6371C" />
            <stop offset=".5" stopColor="#CE4A2B" />
            <stop offset="1" stopColor="#E6A12B" />
          </linearGradient>
        </defs>
        <circle cx="37" cy="40" r="22" fill="url(#fowSunMark)" />
        <rect x="8" y="40" width="58" height="4" fill="#F4EEE3" />
        <g stroke="#E6A12B" strokeWidth="3.4" strokeLinecap="round">
          <line x1="37" y1="6" x2="37" y2="13" />
          <line x1="14" y1="15" x2="19" y2="20" />
          <line x1="60" y1="15" x2="55" y2="20" />
        </g>
      </svg>
    </div>
  );
}
