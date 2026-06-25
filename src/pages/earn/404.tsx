import Head from 'next/head';
import Link from 'next/link';

import { Default } from '@/layouts/Default';
import { Meta } from '@/layouts/Meta';

const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.82' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.4'/%3E%3C/svg%3E\")";

export default function Custom404() {
  return (
    <Default
      className="bg-[#FBF7EF]"
      meta={
        <>
          <Meta
            title="Not Found | Future of Work"
            description="404 - Page Not Found"
          />
          <Head>
            <meta name="robots" content="noindex, nofollow" />
            <meta name="googlebot" content="noindex, nofollow" />
          </Head>
        </>
      }
    >
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.42] mix-blend-multiply"
        style={{ backgroundImage: GRAIN }}
      />
      <div className="relative z-[1] flex min-h-[70vh] w-full grow items-center justify-center px-5 py-16">
        <div className="relative mx-auto w-full max-w-[640px] text-center">
          {/* oversized faint numeral backdrop */}
          <span
            aria-hidden="true"
            style={{ fontFamily: 'var(--font-fraunces), serif' }}
            className="pointer-events-none absolute -top-[7vw] left-1/2 -z-[1] -translate-x-1/2 text-[clamp(180px,34vw,420px)] leading-none font-normal tracking-[-0.04em] text-[#221A14]/[0.05] select-none"
          >
            404
          </span>

          <span className="inline-flex items-center gap-2.5 text-[12px] font-semibold tracking-[0.2em] text-[#C4502E] uppercase">
            <span className="inline-block h-[1.5px] w-[18px] bg-[#C4502E]" />
            Error 404 — off the map
          </span>

          <h1
            style={{ fontFamily: 'var(--font-fraunces), serif' }}
            className="mx-auto mt-5 max-w-[16ch] text-[clamp(34px,5.5vw,58px)] leading-[1.04] font-normal tracking-[-0.02em] text-[#221A14]"
          >
            This page <em className="text-[#C4502E] italic">wandered off</em>.
          </h1>

          <p className="mx-auto mt-4 max-w-[46ch] text-[16.5px] leading-[1.55] text-[#5C5147]">
            The link may be broken or the opportunity has moved on. No harm
            done — let&apos;s point you back toward the work.
          </p>

          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/earn/all"
              className="inline-flex h-11 items-center rounded-full bg-[#C4502E] px-6 text-[14.5px] font-semibold text-[#FBF7EF] transition-colors hover:bg-[#A83F22]"
            >
              Browse opportunities
            </Link>
            <Link
              href="/earn"
              className="inline-flex h-11 items-center rounded-full border border-[#E6DCC9] bg-white px-6 text-[14.5px] font-semibold text-[#221A14] transition-colors hover:border-[#c9a98f]"
            >
              Back to Earn
            </Link>
          </div>
        </div>
      </div>
    </Default>
  );
}
