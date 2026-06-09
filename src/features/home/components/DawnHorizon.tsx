import Link from 'next/link';

import { FowMark } from '@/components/shared/FowLogo';

/**
 * Dawn Horizon — the approved Future of Work landing hero.
 * A figure before a rising sun. The headline sits on the DARK sky; the warm
 * dawn glow is a soft, contained band low on the horizon (not a dome over the
 * text) so "Opportunity" stays readable. (fow-design-system.pdf · Landing hero.)
 */
export function DawnHorizon() {
  return (
    <section className="relative isolate flex min-h-screen flex-col overflow-hidden bg-[#0d1310] text-[#f4eee3]">
      {/* night sky */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(130% 80% at 50% -8%, #2b2333 0%, #1a212e 34%, #0d1310 72%)',
        }}
      />
      {/* stars (upper sky only) */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'radial-gradient(1.4px 1.4px at 12% 16%, rgba(255,255,255,.8) 50%, transparent),radial-gradient(1.2px 1.2px at 28% 9%, rgba(255,255,255,.55) 50%, transparent),radial-gradient(1.5px 1.5px at 47% 20%, rgba(255,255,255,.7) 50%, transparent),radial-gradient(1.1px 1.1px at 63% 11%, rgba(255,255,255,.5) 50%, transparent),radial-gradient(1.5px 1.5px at 80% 22%, rgba(255,255,255,.65) 50%, transparent),radial-gradient(1.2px 1.2px at 90% 8%, rgba(255,255,255,.55) 50%, transparent),radial-gradient(1.2px 1.2px at 36% 30%, rgba(255,255,255,.4) 50%, transparent),radial-gradient(1.1px 1.1px at 6% 34%, rgba(255,255,255,.4) 50%, transparent)',
          maskImage:
            'linear-gradient(to bottom, #000 0%, #000 32%, transparent 52%)',
        }}
      />
      {/* sunrise glow — a soft, contained band low on the horizon (~76%) */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(44% 26% at 50% 78%, rgba(247,201,93,.85) 0%, rgba(226,120,52,.55) 26%, rgba(186,63,34,.28) 46%, rgba(120,45,28,.12) 62%, transparent 74%)',
        }}
      />
      {/* perspective floor */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[24%]"
        style={{ perspective: '500px' }}
      >
        <div
          className="absolute inset-0 origin-bottom"
          style={{
            transform: 'rotateX(74deg)',
            backgroundImage:
              'linear-gradient(rgba(231,211,193,.16) 1px, transparent 1px),linear-gradient(90deg, rgba(231,211,193,.16) 1px, transparent 1px)',
            backgroundSize: '52px 52px',
            maskImage:
              'radial-gradient(130% 90% at 50% 0%, #000 28%, transparent 72%)',
          }}
        />
      </div>
      {/* the figure, standing on the glowing horizon */}
      <div
        className="pointer-events-none absolute left-1/2 -translate-x-1/2"
        style={{ top: '70%' }}
        aria-hidden
      >
        <svg width="22" height="56" viewBox="0 0 26 64" fill="#0c0907">
          <circle cx="13" cy="9" r="7" />
          <path d="M5 22h16l-2 26h-4l-1 16h-2l-1-16H7z" />
        </svg>
      </div>
      {/* vignette */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(120% 95% at 50% 42%, transparent 52%, rgba(6,8,7,.6) 100%)',
        }}
      />

      {/* ===== content ===== */}
      <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <Link
          href="/"
          className="flex items-center gap-2 text-[#f4eee3] hover:no-underline"
        >
          <FowMark className="text-[#f4eee3]" />
          <span className="font-serif text-lg font-semibold tracking-tight">
            Future <em className="text-[#e6a12b] not-italic">of</em> Work
          </span>
        </Link>
        <nav className="hidden items-center gap-8 text-sm font-medium text-[#e7d3c1] md:flex">
          <Link href="/earn" className="hover:text-white hover:no-underline">
            Find work
          </Link>
          <Link
            href="/earn/sponsor"
            className="hover:text-white hover:no-underline"
          >
            For business
          </Link>
          <a
            href="#how-it-works"
            className="hover:text-white hover:no-underline"
          >
            How it works
          </a>
        </nav>
      </header>

      {/* headline + CTAs live in the top half, on the dark sky */}
      <div className="relative z-10 mx-auto flex w-full max-w-4xl flex-col items-center px-6 pt-[12vh] text-center">
        <p className="font-label text-[11px] tracking-[0.24em] text-[#e6a12b] uppercase">
          A new day for work
        </p>
        <h1 className="font-serif mt-6 text-4xl leading-[1.1] font-semibold tracking-tight text-[#f7f1e6] sm:text-5xl md:text-[3.5rem]">
          Talent is everywhere.
          <br />
          <em className="font-medium text-[#f08a5d] italic">
            Opportunity
          </em>{' '}
          shouldn&apos;t be the gap.
        </h1>

        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/earn"
            className="inline-flex items-center gap-2 rounded-full bg-[#ce4a2b] px-7 py-3 text-sm font-bold tracking-wide text-[#fff6ef] uppercase shadow-[0_10px_34px_rgba(206,74,43,.5)] transition-transform hover:translate-y-[-1px] hover:bg-[#b83f22] hover:no-underline"
          >
            Find work →
          </Link>
          <Link
            href="/earn/sponsor"
            className="inline-flex items-center gap-2 rounded-full border border-[#e7d3c1]/30 bg-[#f4eee3]/95 px-7 py-3 text-sm font-bold tracking-wide text-[#1d1815] uppercase transition-colors hover:bg-white hover:no-underline"
          >
            Post a task
          </Link>
        </div>
      </div>
    </section>
  );
}
