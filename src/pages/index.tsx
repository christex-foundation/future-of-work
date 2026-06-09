import Link from 'next/link';

import { ASSET_URL } from '@/constants/ASSET_URL';
import { Meta } from '@/layouts/Meta';

import { DawnHorizon } from '@/features/home/components/DawnHorizon';
import { Footer } from '@/features/navbar/components/Footer';

const STEPS = [
  {
    n: '01',
    title: 'Post a task',
    body: 'Businesses break work into clear, scoped tasks — no gatekeepers, no long hiring cycles.',
  },
  {
    n: '02',
    title: 'Talent submits',
    body: 'Skilled people anywhere take on the work and submit real results, building a verified track record.',
  },
  {
    n: '03',
    title: 'Pick a winner, pay out',
    body: 'Review submissions, choose the best, and pay — every payout recorded and trusted.',
  },
];

const VALUES = [
  {
    title: 'Built to be trusted',
    body: 'Escrowed prizes and a transparent record turn informal gig work into a credible profession.',
  },
  {
    title: 'Opportunity, not gatekeepers',
    body: 'Work is matched to skill — not to who you know. Talent is everywhere; the gap is access.',
  },
  {
    title: 'Made for the real world',
    body: 'Fast, mobile-first and light on data, so it works on the connections people actually have.',
  },
];

export default function Home() {
  return (
    <main className="bg-background text-foreground min-h-screen">
      <Meta
        title="Future of Work — A new day for work"
        description="A digital marketplace for paid work. Talent is everywhere; opportunity shouldn't be the gap. Post a task, get matched, get paid."
        canonical="https://cf-future-of-work.vercel.app/"
        og={`${ASSET_URL}/st/og/og-home.png`}
      />

      <DawnHorizon />

      {/* How it works */}
      <section id="how-it-works" className="mx-auto max-w-6xl px-6 py-20">
        <p className="font-label text-primary text-[11px] tracking-[0.18em] uppercase">
          How it works
        </p>
        <h2 className="font-serif mt-3 max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
          Post a task, get matched, get paid — without the gatekeepers.
        </h2>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {STEPS.map((step) => (
            <div
              key={step.n}
              className="border-input bg-card flex flex-col gap-3 border-2 p-6 shadow-[5px_5px_0_var(--fow-shadow)]"
            >
              <span className="font-pixel text-primary text-base">
                {step.n}
              </span>
              <h3 className="font-serif text-xl font-semibold">{step.title}</h3>
              <p className="text-muted-foreground leading-relaxed">
                {step.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Values band */}
      <section className="bg-fow-pine text-fow-clay">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-20 md:grid-cols-3">
          {VALUES.map((value) => (
            <div key={value.title}>
              <h3 className="font-serif text-2xl font-semibold text-[#f4eee3]">
                {value.title}
              </h3>
              <p className="mt-3 leading-relaxed text-[#e7d3c1]/85">
                {value.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Closing CTA */}
      <section className="mx-auto max-w-6xl px-6 py-24 text-center">
        <h2 className="font-serif mx-auto max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">
          Find work that builds your future.
        </h2>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/earn"
            className="bg-primary text-primary-foreground inline-flex items-center gap-2 border-2 border-[#1d1815] px-7 py-3 text-sm font-bold tracking-wide uppercase shadow-[4px_4px_0_var(--fow-shadow)] transition-transform hover:translate-x-[1px] hover:translate-y-[1px] hover:no-underline"
          >
            Find work →
          </Link>
          <Link
            href="/earn/sponsor"
            className="bg-card text-foreground inline-flex items-center gap-2 border-2 border-[#1d1815] px-7 py-3 text-sm font-bold tracking-wide uppercase shadow-[4px_4px_0_var(--fow-shadow)] transition-transform hover:translate-x-[1px] hover:translate-y-[1px] hover:no-underline"
          >
            Post a task
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  );
}
