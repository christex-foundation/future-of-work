import { useEffect, useState } from 'react';

interface SunGaugeProps {
  /** progress as a 0..1 fraction */
  value: number;
  size?: number;
  stroke?: number;
  label?: string;
}

/**
 * The Future of Work rising-sun mark, rendered as an animated radial gauge.
 * Used as the hero metric on the sponsor dashboard ("Daybreak Desk").
 */
export function SunGauge({
  value,
  size = 104,
  stroke = 9,
  label = 'Done',
}: SunGaugeProps) {
  const radius = (size - stroke) / 2 - 4;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(1, value || 0));

  const [offset, setOffset] = useState(circumference);
  const [pct, setPct] = useState(0);

  useEffect(() => {
    const id = window.setTimeout(
      () => setOffset(circumference - circumference * clamped),
      60,
    );
    const start = performance.now();
    const duration = 1200;
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setPct(Math.round(clamped * 100 * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      window.clearTimeout(id);
      cancelAnimationFrame(raf);
    };
  }, [clamped, circumference]);

  return (
    <div className="relative flex-none" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(231,211,193,0.16)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#E6A12B"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{
            transition: 'stroke-dashoffset 1.2s cubic-bezier(0.2,0.8,0.2,1)',
          }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <p className="font-serif text-[24px] leading-none font-semibold text-[#FBF7EE]">
            {pct}%
          </p>
          <p className="font-secondary mt-1 text-[8px] font-bold tracking-[0.16em] text-[#E7D3C1] uppercase">
            {label}
          </p>
        </div>
      </div>
    </div>
  );
}
