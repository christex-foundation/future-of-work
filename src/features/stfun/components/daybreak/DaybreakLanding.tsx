'use client';

import Link from 'next/link';
import { useEffect } from 'react';

import { DaybreakBountyCard, type LiveBounty } from './DaybreakBountyCard';

export type { LiveBounty };

/**
 * The "Future ◑f Work" wordmark — kept from the existing brand
 * (the rising sun is the "o" of "of"), retuned for the light
 * Daybreak paper background: ink text + ink horizon line.
 */
function Wordmark() {
  return (
    <span className="flex items-center font-serif text-[22px] leading-none font-medium tracking-[-0.01em] text-[#221A14] select-none">
      <span>Future</span>
      <svg
        className="mx-[3px] mb-[2px]"
        width="18"
        height="18"
        viewBox="0 0 74 74"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="dbSunWordmark" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0" stopColor="#A6371C" />
            <stop offset=".5" stopColor="#CE4A2B" />
            <stop offset="1" stopColor="#E6A12B" />
          </linearGradient>
        </defs>
        <circle cx="37" cy="40" r="22" fill="url(#dbSunWordmark)" />
        <rect x="8" y="40" width="58" height="4" fill="#221A14" />
        <g stroke="#C4502E" strokeWidth="3.4" strokeLinecap="round">
          <line x1="37" y1="6" x2="37" y2="13" />
          <line x1="14" y1="15" x2="19" y2="20" />
          <line x1="60" y1="15" x2="55" y2="20" />
        </g>
      </svg>
      <span>f</span>
      <span className="ml-[7px]">Work</span>
    </span>
  );
}

export default function DaybreakLanding({
  bounties = [],
}: {
  bounties?: LiveBounty[];
}) {
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('in');
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.14 },
    );
    document.querySelectorAll('.daybreak .reveal').forEach((el) => io.observe(el));

    function animateCount(el: HTMLElement) {
      const target = parseFloat(el.dataset.count || '0');
      const suffix = el.dataset.suffix || '';
      const prefix = el.dataset.prefix || '';
      const isFloat = target % 1 !== 0;
      const dur = 1400;
      const start = performance.now();
      function tick(now: number) {
        let p = Math.min((now - start) / dur, 1);
        p = 1 - Math.pow(1 - p, 3);
        const val = target * p;
        const out = isFloat
          ? val.toFixed(1)
          : Math.round(val).toLocaleString();
        el.textContent = prefix + out + suffix;
        if (p < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    }
    const cio = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            animateCount(e.target as HTMLElement);
            cio.unobserve(e.target);
          }
        });
      },
      { threshold: 0.5 },
    );
    document
      .querySelectorAll<HTMLElement>('.daybreak [data-count]')
      .forEach((el) => cio.observe(el));

    const plate = document.querySelector<HTMLElement>('.daybreak .plate');
    const onScroll = () => {
      const y = window.scrollY;
      if (plate && y < 700) plate.style.transform = `translateY(${y * 0.035}px)`;
    };
    window.addEventListener('scroll', onScroll, { passive: true });

    // keep the "paid out today" figure ticking up so the panel feels live
    const ticker = setInterval(() => {
      const el = document.getElementById('db-payout');
      if (!el) return;
      const n = parseInt((el.textContent || '').replace(/[^0-9]/g, ''), 10);
      if (!Number.isFinite(n) || n === 0) return; // skip while count-up runs
      const next = n + 30 + Math.floor(Math.random() * 220);
      el.textContent = '$' + next.toLocaleString();
    }, 2600);

    return () => {
      io.disconnect();
      cio.disconnect();
      window.removeEventListener('scroll', onScroll);
      clearInterval(ticker);
    };
  }, []);

  return (
    <div className="daybreak min-h-screen">
      {/* NAV */}
      <header className="dbnav">
        <div className="wrap nav-in">
          <Link href="/" aria-label="Future of Work">
            <Wordmark />
          </Link>
          <nav className="links">
            <Link href="/earn">Browse Bounties</Link>
            <a href="#builders">For Builders</a>
            <a href="#companies">For Companies</a>
          </nav>
          <div className="nav-cta">
            <Link href="/earn/new/sponsor" className="btn btn-ghost">
              Post a bounty
            </Link>
            <Link href="/earn" className="btn btn-solid">
              Start earning
            </Link>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="hero">
        <div className="wrap">
          <div className="hero-grid">
            <div className="reveal in">
              <span className="kicker">A new day for paid work</span>
              <h1 className="serif">
                Where good work
                <br />
                meets <em>fair pay</em>,
                <br />
                every <span className="leaf">morning.</span>
              </h1>
              <p className="lead">
                Sierra Leone&apos;s open marketplace — connecting local companies
                who need work done with talent who want to earn. Fast,
                transparent, paid in USDC.
              </p>
              <div className="hero-actions">
                <Link href="/earn" className="btn btn-terra">
                  Find work &amp; get paid →
                </Link>
                <Link href="/earn/new/sponsor" className="btn btn-ghost">
                  Post a bounty
                </Link>
              </div>
              <p className="tiny-note">
                <span className="av">
                  <span>AM</span>
                  <span>DS</span>
                  <span>PN</span>
                </span>
                <span>
                  <b>$2.4M+</b> paid to <b>14,200</b> builders — you only pay for
                  results.
                </span>
              </p>
            </div>

            <div className="reveal in" style={{ transitionDelay: '.12s' }}>
              <div className="plate sunrise">
                <div className="art" />
                <div className="grain" />

                {/* sky: live data */}
                <div className="paid-kicker">
                  <i />
                  312 bounties live
                </div>
                <div className="payout">
                  <div className="cap">Paid out today</div>
                  <div className="big serif">
                    <span id="db-payout" data-count="18420" data-prefix="$">
                      $0
                    </span>
                    <span className="up">↑</span>
                  </div>
                  <svg
                    className="spark"
                    viewBox="0 0 124 38"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M2,30 L20,25 L38,27 L56,16 L74,19 L92,9 L110,12 L122,4 L122,38 L2,38 Z"
                      fill="#FBF7EF"
                      fillOpacity=".15"
                    />
                    <polyline
                      points="2,30 20,25 38,27 56,16 74,19 92,9 110,12 122,4"
                      stroke="#FBF7EF"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <circle
                      className="dot"
                      cx="122"
                      cy="4"
                      r="6"
                      fill="none"
                      stroke="#FBF7EF"
                      strokeOpacity=".5"
                    />
                    <circle cx="122" cy="4" r="3" fill="#FBF7EF" />
                  </svg>
                </div>

                {/* the rising sun on the horizon */}
                <svg
                  className="sundial"
                  viewBox="0 0 160 96"
                  fill="none"
                  aria-hidden="true"
                >
                  <defs>
                    <linearGradient id="dbSun" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0" stopColor="#FCEBCF" />
                      <stop offset="1" stopColor="#F1C385" />
                    </linearGradient>
                  </defs>
                  {/* sun's data-path arc (dotted) */}
                  <path
                    d="M16,94 A64,64 0 0 1 144,94"
                    stroke="#FBF7EF"
                    strokeOpacity=".45"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeDasharray="1.5 7"
                  />
                  <circle cx="52" cy="41" r="2" fill="#FBF7EF" fillOpacity=".7" />
                  <circle cx="80" cy="33" r="2" fill="#FBF7EF" fillOpacity=".7" />
                  <circle cx="108" cy="41" r="2" fill="#FBF7EF" fillOpacity=".7" />
                  {/* rays */}
                  <g stroke="#FBF7EF" strokeWidth="2.4" strokeLinecap="round" strokeOpacity=".85">
                    <line x1="80" y1="56" x2="80" y2="46" />
                    <line x1="56" y1="62" x2="50" y2="53" />
                    <line x1="104" y1="62" x2="110" y2="53" />
                    <line x1="40" y1="76" x2="32" y2="70" />
                    <line x1="120" y1="76" x2="128" y2="70" />
                  </g>
                  {/* sun disc rising over the horizon */}
                  <path d="M52,96 A28,28 0 0 1 108,96 Z" fill="url(#dbSun)" />
                </svg>

                <div className="horizon" />

                {/* ground: featured bounty + winner */}
                <div className="float">
                  Ava M. just won
                  <br />
                  <span className="amt serif">$3,000</span>
                </div>
                <div className="label">
                  <div className="k">Featured bounty</div>
                  <div className="t">
                    Design a mobile-banking
                    <br />
                    landing page
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* TRUST FIGURE ROW */}
          <div className="figrow reveal">
            <div className="fig">
              <div
                className="n serif"
                data-count="2.4"
                data-suffix="M+"
                data-prefix="$"
              >
                $0
              </div>
              <div className="l">Paid to builders</div>
            </div>
            <div className="fig">
              <div className="n serif" data-count="14200">
                0
              </div>
              <div className="l">Builders earning</div>
            </div>
            <div className="fig">
              <div className="n serif" data-count="680">
                0
              </div>
              <div className="l">Companies hiring</div>
            </div>
            <div className="fig">
              <div className="n serif" data-count="9400">
                0
              </div>
              <div className="l">Bounties completed</div>
            </div>
          </div>
        </div>
      </section>

      {/* LOGO STRIP */}
      <section className="logos reveal">
        <div className="wrap">
          <div className="eyebrow">Trusted by Sierra Leone&apos;s boldest teams</div>
          <div className="marks">
            <span>Lion Mountain</span>
            <span>Rokel Pay</span>
            <span>Bai Bureh</span>
            <span>Sweet Salone</span>
            <span>Cotton Tree</span>
            <span>Bintumani</span>
          </div>
        </div>
      </section>

      {/* DUAL PATHS */}
      <section className="sec" id="builders" style={{ paddingBottom: '54px' }}>
        <div className="wrap">
          <div className="sec-head reveal">
            <span className="kicker">Built for both sides</span>
            <h2 className="serif">
              Whether you came to earn
              <br />
              or to <em>hire</em>.
            </h2>
            <p>Same marketplace, written for you. Pick the side you&apos;re on.</p>
          </div>
          <div className="spreads reveal">
            <div className="spread builders">
              <div className="authored">For Builders</div>
              <h3 className="serif">
                Find work, get paid,
                <br />
                build a <em>reputation</em>.
              </h3>
              <p className="body">
                Browse paid bounties from vetted companies. Submit your best work,
                win the prize, and watch your name climb the leaderboard.
              </p>
              <ul>
                <li>
                  <span className="dot" />
                  Real payouts in USDC — no invoices, no chasing.
                </li>
                <li>
                  <span className="dot" />A public profile that proves what you can
                  do.
                </li>
                <li>
                  <span className="dot" />
                  New work every morning across six disciplines.
                </li>
              </ul>
              <Link href="/earn" className="btn btn-terra">
                Browse open bounties →
              </Link>
            </div>
            <div className="spread companies" id="companies">
              <div className="authored">For Companies</div>
              <h3 className="serif">
                Post a bounty,
                <br />
                only pay for <em>results</em>.
              </h3>
              <p className="body">
                Describe the work, set the prize, and receive dozens of finished
                submissions from vetted Sierra Leonean talent. Pay the winners —
                that&apos;s it.
              </p>
              <ul>
                <li>
                  <span className="dot" />
                  Dozens of real submissions, not résumés.
                </li>
                <li>
                  <span className="dot" />
                  Verified talent, ranked by proven track record.
                </li>
                <li>
                  <span className="dot" />
                  You only pay when work meets the brief.
                </li>
              </ul>
              <Link
                href="/earn/new/sponsor"
                className="btn btn-ghost"
                style={{ borderColor: 'var(--forest)', color: 'var(--forest)' }}
              >
                Post a bounty →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CASE STUDY BAND (Sierra Leone) — leads into the proof board */}
      <div className="wrap" style={{ paddingTop: '54px' }}>
        <section className="casestudy reveal">
          <div className="sungrad" />
          <div className="cs-grid">
            <div>
              <div className="cs-logo serif">
                Lion Mountain Labs <span className="vrf">Verified</span>
              </div>
              <div className="cs-metrics">
                <div className="cm">
                  <div className="v serif">6 days</div>
                  <div className="k">Brief to delivered</div>
                </div>
                <div className="cm">
                  <div className="v serif">$5K paid · $40K quote</div>
                  <div className="k">Paid vs. agency estimate</div>
                </div>
                <div className="cm">
                  <div className="v serif">47 submissions</div>
                  <div className="k">Finished concepts received</div>
                </div>
              </div>
            </div>
            <div className="cs-quote">
              <blockquote className="serif">
                We got our landing page redesigned in{' '}
                <em>six days for $5,000</em>. A Freetown agency quoted us $40,000
                and eight weeks.
              </blockquote>
              <div className="who">
                <div className="avatar serif">AK</div>
                <div>
                  <div className="nm">Aminata Kamara</div>
                  <div className="rl">Head of Product, Lion Mountain Labs</div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* OPEN BOUNTIES — live from the database */}
      {bounties.length > 0 && (
        <section
          className="sec"
          style={{ paddingTop: '72px', paddingBottom: '54px' }}
        >
          <div className="wrap">
            <div className="board-head reveal">
              <div className="sec-head">
                <span className="kicker">Open bounties</span>
                <h2 className="serif">
                  Open on the board
                  <br />
                  right <em>now</em>.
                </h2>
              </div>
              <Link href="/earn" className="browse">
                Browse all bounties →
              </Link>
            </div>
            <div className="gallery reveal">
              {bounties.map((b) => (
                <DaybreakBountyCard bounty={b} key={b.slug} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FEATURED BOUNTY — spotlight */}
      <section className="sec" style={{ paddingTop: '54px' }}>
        <div className="wrap">
          <div className="sec-head reveal">
            <span className="kicker">In the spotlight</span>
            <h2 className="serif">
              The most-watched bounty
              <br />
              on the board right now.
            </h2>
          </div>
          <div className="lead-bounty reveal">
            <div className="copy">
              <div className="tagline">Featured · Design</div>
              <h3 className="serif">Design our mobile-banking landing page</h3>
              <p className="by">
                Posted by <b>Lion Mountain Labs</b> · Verified sponsor · 4 days
                ago
              </p>
              <div className="tags">
                <span className="tag">Figma</span>
                <span className="tag">Web</span>
                <span className="tag">Branding</span>
              </div>
              <div className="metarow">
                <div className="m">
                  <div className="v serif" style={{ color: 'var(--terra)' }}>
                    $5,000
                  </div>
                  <div className="k">Total prize</div>
                </div>
                <div className="m">
                  <div className="v serif">47</div>
                  <div className="k">Submissions</div>
                </div>
                <div className="m">
                  <div className="v serif" style={{ color: 'var(--forest)' }}>
                    2d 14h
                  </div>
                  <div className="k">Left to enter</div>
                </div>
              </div>
              <Link href="/earn" className="btn btn-solid">
                Read the brief &amp; submit →
              </Link>
            </div>
            <div className="art2">
              <div className="lines" />
              <div className="clock">⏱ 2d 14h left</div>
              <div className="prize">
                <div className="k">First place</div>
                <div className="v serif">$3,000</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS — for companies */}
      <section className="sec" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="sec-head reveal">
            <span className="kicker">How it works</span>
            <h2 className="serif">
              From brief to done
              <br />
              in <em>four steps</em>.
            </h2>
          </div>
          <div className="steps reveal">
            {[
              ['1', 'Post the brief', 'Describe the work, set the prize. Ten minutes.'],
              ['2', 'Receive real work', 'Dozens of finished submissions arrive, not résumés.'],
              ['3', 'Pick the winners', 'Shortlist and choose what fits. We help you compare.'],
              ['4', 'Pay only for results', 'USDC & escrow handled for you. IP transfers on payout.'],
            ].map(([no, st, sb]) => (
              <div className="step" key={no}>
                <div className="no serif">{no}</div>
                <div className="st serif">{st}</div>
                <div className="sb">{sb}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TRUST & SAFETY ROW */}
      <section className="sec" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="sec-head reveal">
            <span className="kicker">Built to be safe to buy on</span>
            <h2 className="serif">
              Hiring here is
              <br />
              low-risk by <em>design</em>.
            </h2>
          </div>
          <div className="trust reveal">
            {[
              ['IP is yours', 'Full rights transfer the moment you pay.'],
              ['No wallet needed', 'We handle USDC, escrow and payouts for you.'],
              ['Vetted talent', 'Every sponsor and winner is verified.'],
              ['Zero downside', "If nothing meets the brief, you don't pay."],
            ].map(([tt, tb]) => (
              <div className="trustcard" key={tt}>
                <div className="ic" />
                <div className="tt serif">{tt}</div>
                <div className="tb">{tb}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="sec" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="sec-head reveal">
            <span className="kicker">Browse by craft</span>
            <h2 className="serif">
              Six disciplines,
              <br />
              refreshed daily.
            </h2>
          </div>
          <div className="cats reveal">
            {[
              ['Design', '84 open', '$312K live'],
              ['Development', '112 open', '$580K live'],
              ['Content', '46 open', '$94K live'],
              ['Video', '23 open', '$61K live'],
              ['Marketing', '37 open', '$88K live'],
              ['Research', '18 open', '$44K live'],
            ].map(([name, open, live]) => (
              <Link className="cat" href="/earn" key={name}>
                <div className="cn serif">{name}</div>
                <div className="cm">
                  <b>{open}</b> · {live}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* PULL QUOTES */}
      <section className="sec" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="sec-head reveal">
            <span className="kicker">From both sides</span>
            <h2 className="serif">What people say.</h2>
          </div>
          <div className="quotes reveal">
            <div className="quote">
              <div className="mark serif">“</div>
              <blockquote className="serif">
                I went from zero clients to <em>$48,200 earned</em> and a global
                rank of #12 — all from work I was proud to publish.
              </blockquote>
              <div className="who">
                <div
                  className="avatar"
                  style={{
                    background:
                      'linear-gradient(135deg,var(--terra),#E8B48E)',
                  }}
                >
                  AM
                </div>
                <div>
                  <div className="nm">Ava Mercer</div>
                  <div className="rl">
                    Product Designer &amp; Frontend Dev · Builder
                  </div>
                </div>
              </div>
            </div>
            <div className="quote alt">
              <div className="mark serif">“</div>
              <blockquote className="serif">
                We posted one bounty and got <em>47 finished concepts</em> in a
                week. We paid for the three we loved. Nothing else compares.
              </blockquote>
              <div className="who">
                <div
                  className="avatar"
                  style={{
                    background:
                      'linear-gradient(135deg,var(--sage),var(--olive))',
                  }}
                >
                  LM
                </div>
                <div>
                  <div className="nm">Lion Mountain Labs</div>
                  <div className="rl">Verified sponsor · Freetown</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <div className="wrap">
        <section className="cta reveal">
          <div className="sungrad" />
          <div className="cta-grid">
            <div>
              <span className="kicker" style={{ color: 'var(--sage)' }}>
                Sunrise on your next chapter
              </span>
              <h2 className="serif" style={{ marginTop: '16px' }}>
                Open the day.
                <br />
                Start <em>this morning</em>.
              </h2>
              <p>
                Join 14,200 builders and 680 companies already trading work for
                fair, transparent pay.
              </p>
            </div>
            <div className="cta-actions">
              <Link href="/earn" className="btn btn-terra">
                I want to earn →
              </Link>
              <Link href="/earn/new/sponsor" className="btn btn-paper">
                I want to hire →
              </Link>
            </div>
          </div>
        </section>
      </div>

      {/* FOOTER */}
      <footer className="dbfoot">
        <div className="wrap">
          <div className="foot-grid">
            <div>
              <Link href="/" aria-label="Future of Work">
                <Wordmark />
              </Link>
              <p className="foot-blurb">
                Sierra Leone&apos;s marketplace for paid work — connecting local
                companies with talent, settled in USDC.
              </p>
            </div>
            <div>
              <h4>Explore</h4>
              <Link href="/earn">Browse bounties</Link>
              <Link href="/earn/leaderboard">Leaderboard</Link>
              <Link href="/earn/leaderboard">Talent profiles</Link>
              <Link href="/earn">Categories</Link>
            </div>
            <div>
              <h4>For Companies</h4>
              <Link href="/earn/new/sponsor">Post a bounty</Link>
              <Link href="/earn/dashboard">Dashboard</Link>
              <Link href="/earn/new/sponsor">Verified sponsors</Link>
              <Link href="/earn/new/sponsor">Pricing</Link>
            </div>
            <div>
              <h4>Company</h4>
              <a href="#builders">How it works</a>
              <a href="mailto:eng@christex.foundation">Get in touch</a>
              <a href="https://christex.foundation">Christex Foundation</a>
            </div>
          </div>
          <div className="foot-bottom">
            <span>© 2026 Future of Work — built by Christex Foundation.</span>
            <span>Paid in USDC · Remote, worldwide</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
