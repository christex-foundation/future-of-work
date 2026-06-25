'use client';

import { usePrivy } from '@privy-io/react-auth';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useState } from 'react';

import { Meta } from '@/layouts/Meta';
import { api } from '@/lib/api';
import { useUpdateUser, useUser } from '@/store/user';
import { formatNumberWithSuffix } from '@/utils/formatNumberWithSuffix';

import {
  goodFirstBounties,
  parseSkills,
  personalize,
  type ScorableBounty,
} from '@/features/listings/utils/bountyMatch';

// Friendly crafts → the real parent-skill names used on bounties, so matching works.
const CRAFTS: { label: string; skills: string[] }[] = [
  { label: 'Design', skills: ['Design'] },
  { label: 'Development', skills: ['Frontend', 'Backend'] },
  { label: 'Content & Writing', skills: ['Content'] },
  { label: 'Growth & Marketing', skills: ['Growth'] },
  { label: 'Community', skills: ['Community'] },
  { label: 'Still figuring it out', skills: [] },
];

const LEVELS = [
  { label: 'Just starting out', value: 'fresher', icon: '🌱', d: 'New to paid work — I want to learn and build a portfolio.' },
  { label: 'Some experience', value: 'mid', icon: '🌤️', d: "I've done a few projects and want to earn more." },
  { label: 'Seasoned pro', value: 'senior', icon: '🔥', d: 'I know my craft — point me at the big ones.' },
];

const GOALS = [
  { label: 'Earn extra income', icon: '💸', d: 'Get paid for real work, on my own schedule.' },
  { label: 'Build a portfolio', icon: '🎨', d: "Win work I'm proud to show off." },
  { label: 'Go full-time freelance', icon: '🚀', d: 'Replace my income, one bounty at a time.' },
  { label: 'Learn a new skill', icon: '📚', d: 'Practice and level up while I earn.' },
];

type Listing = {
  title: string;
  slug: string;
  rewardAmount?: number | null;
  usdValue?: number | null;
  token?: string | null;
  type?: string | null;
  skills?: unknown;
  sponsor?: { name?: string | null } | null;
  _count?: { Submission?: number } | null;
};

const STEPS = ['welcome', 'skills', 'level', 'goal', 'result', 'practice', 'done'] as const;
type Step = (typeof STEPS)[number];

export default function Welcome() {
  const router = useRouter();
  const { authenticated } = usePrivy();
  const { user } = useUser();
  const updateUser = useUpdateUser();

  const [step, setStep] = useState<Step>('welcome');
  const [crafts, setCrafts] = useState<Set<string>>(new Set());
  const [level, setLevel] = useState<string | null>(null);
  const [goals, setGoals] = useState<Set<string>>(new Set());
  const [practiceDone, setPracticeDone] = useState(false);
  const [peek, setPeek] = useState(false);

  const firstName = (authenticated && user?.firstName) || 'there';

  // First-time users only: send returning/established users to the board.
  useEffect(() => {
    if (step !== 'welcome') return;
    if (user && (user.surveysShown?.onboarding || user.isTalentFilled)) {
      router.replace('/earn');
    }
  }, [user, router, step]);

  const selectedSkillNames = useMemo(
    () =>
      Array.from(
        new Set(
          CRAFTS.filter((c) => crafts.has(c.label)).flatMap((c) => c.skills),
        ),
      ),
    [crafts],
  );
  const userSkillSet = useMemo(
    () => parseSkills(selectedSkillNames),
    [selectedSkillNames],
  );

  const progress =
    step === 'skills' ? 33 : step === 'level' ? 66 : step === 'goal' ? 100 : ['result', 'practice', 'done'].includes(step) ? 100 : 0;

  const goTo = (s: Step) => {
    setStep(s);
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  function finishQuiz() {
    // Persist the lightweight profile (skills as the standard [{skills,subskills}] shape) + level.
    if (authenticated) {
      const skillsPayload = selectedSkillNames.map((s) => ({
        skills: s,
        subskills: [],
      }));
      updateUser.mutate({ skills: skillsPayload, experience: level ?? undefined } as never);
      api.post('/api/user/update-survey', { surveyId: 'onboarding' }).catch(() => {});
    }
    goTo('result');
  }

  // Personalized result — fetch open listings and score them with our matcher.
  const { data: listings = [] } = useQuery<Listing[]>({
    queryKey: ['onboarding-listings'],
    queryFn: async () => (await api.get('/api/listings')).data,
    enabled: step === 'result',
    staleTime: 1000 * 60 * 5,
  });

  const { starter, matches, matchCount } = useMemo(() => {
    const scorable: (ScorableBounty & { _l: Listing })[] = (listings || []).map(
      (l) => ({
        skills: l.skills,
        type: l.type,
        rewardAmount: l.rewardAmount,
        usdValue: l.usdValue,
        submissionCount: l._count?.Submission ?? 0,
        _l: l,
      }),
    );
    const first = goodFirstBounties(scorable, userSkillSet, 1)[0]?._l;
    const ranked = personalize(scorable, userSkillSet).map((x) => x._l);
    const ms = ranked.filter((l) => l.slug !== first?.slug).slice(0, 2);
    return { starter: first, matches: ms, matchCount: ranked.length };
  }, [listings, userSkillSet]);

  const prize = (l?: Listing) => {
    const r = l?.rewardAmount ?? l?.usdValue ?? null;
    return r != null ? `$${formatNumberWithSuffix(r)}` : '';
  };

  return (
    <>
      <Meta
        title="Welcome — Future of Work"
        description="Let's get to know you and line up work that fits."
      />
      <div className="ob">
        <div className="bar">
          <div className="brand">
            <span className="sun" />
            Future of Work
          </div>
          <button className="skip" onClick={() => router.push('/earn')}>
            Skip for now
          </button>
        </div>
        <div className="progress">
          <i style={{ width: `${progress}%` }} />
        </div>

        <div className="stage">
          {/* WELCOME */}
          {step === 'welcome' && (
            <section className="stepc">
              <div className="welcome">
                <div>
                  <span className="kicker">
                    <span className="dot" />Welcome to Future of Work
                  </span>
                  <h1 className="q">
                    Good morning.<br />
                    Let&apos;s get to <em>know you</em>.
                  </h1>
                  <p className="sub">
                    Two minutes now, and every morning we&apos;ll line up paid
                    work that actually fits you — no endless scrolling.
                  </p>
                  <div className="actions">
                    <button className="btn btn-terra" onClick={() => goTo('skills')}>
                      Let&apos;s begin →
                    </button>
                    <button className="btn-link" onClick={() => router.push('/earn')}>
                      I&apos;d rather explore on my own
                    </button>
                  </div>
                </div>
                <div className="viz">
                  <div className="lines" />
                  <div className="float">
                    A builder just earned<br />
                    <span className="amt">$3,000</span>
                  </div>
                  <div className="label">
                    <div className="k">Today on the board</div>
                    <div className="t">Paid bounties,<br />refreshed every morning</div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* SKILLS */}
          {step === 'skills' && (
            <section className="stepc">
              <span className="kicker"><span className="dot" />Step 1 of 3</span>
              <h1 className="q">What kind of work do you do?</h1>
              <p className="sub">Pick all that apply — we&apos;ll match bounties to your crafts.</p>
              <div className="chips">
                {CRAFTS.map((c) => (
                  <button
                    key={c.label}
                    className={`chip${crafts.has(c.label) ? ' sel' : ''}`}
                    onClick={() => {
                      const n = new Set(crafts);
                      if (n.has(c.label)) n.delete(c.label);
                      else n.add(c.label);
                      setCrafts(n);
                    }}
                  >
                    <span className="tick">✓</span>
                    {c.label}
                  </button>
                ))}
              </div>
              <div className="nav">
                <button className="btn btn-ghost" onClick={() => goTo('welcome')}>← Back</button>
                <button className="btn btn-solid" disabled={crafts.size === 0} onClick={() => goTo('level')}>
                  Continue →
                </button>
              </div>
            </section>
          )}

          {/* LEVEL */}
          {step === 'level' && (
            <section className="stepc">
              <span className="kicker"><span className="dot" />Step 2 of 3</span>
              <h1 className="q">Where are you in your journey?</h1>
              <p className="sub">So we set the right expectations — and the right odds.</p>
              <div className="cards three">
                {LEVELS.map((l) => (
                  <button
                    key={l.value}
                    className={`scard${level === l.value ? ' sel' : ''}`}
                    onClick={() => setLevel(l.value)}
                  >
                    <span className="tick">✓</span>
                    <div className="ic">{l.icon}</div>
                    <div className="t">{l.label}</div>
                    <div className="d">{l.d}</div>
                  </button>
                ))}
              </div>
              <div className="nav">
                <button className="btn btn-ghost" onClick={() => goTo('skills')}>← Back</button>
                <button className="btn btn-solid" disabled={!level} onClick={() => goTo('goal')}>
                  Continue →
                </button>
              </div>
            </section>
          )}

          {/* GOAL */}
          {step === 'goal' && (
            <section className="stepc">
              <span className="kicker"><span className="dot" />Step 3 of 3</span>
              <h1 className="q">What brings you here?</h1>
              <p className="sub">Pick what matters most right now.</p>
              <div className="cards">
                {GOALS.map((g) => (
                  <button
                    key={g.label}
                    className={`scard${goals.has(g.label) ? ' sel' : ''}`}
                    onClick={() => {
                      const n = new Set(goals);
                      if (n.has(g.label)) n.delete(g.label);
                      else n.add(g.label);
                      setGoals(n);
                    }}
                  >
                    <span className="tick">✓</span>
                    <div className="ic">{g.icon}</div>
                    <div className="t">{g.label}</div>
                    <div className="d">{g.d}</div>
                  </button>
                ))}
              </div>
              <div className="nav">
                <button className="btn btn-ghost" onClick={() => goTo('level')}>← Back</button>
                <button className="btn btn-solid" disabled={goals.size === 0} onClick={finishQuiz}>
                  See my matches →
                </button>
              </div>
            </section>
          )}

          {/* RESULT */}
          {step === 'result' && (
            <section className="stepc">
              <span className="kicker"><span className="dot" />You&apos;re all set</span>
              <h1 className="q">
                Welcome aboard, <em>{firstName}</em>.
              </h1>
              <p className="sub">
                Based on what you told us, here&apos;s where to start. We&apos;ll
                keep this fresh every morning.
              </p>
              <div className="summary">
                <span><b>{Array.from(crafts)[0] ?? 'Exploring'}</b></span>
                <span>{LEVELS.find((l) => l.value === level)?.label ?? 'Just starting'}</span>
                <span>{Array.from(goals)[0] ?? 'Earn income'}</span>
              </div>

              <div className="match-head">
                <span className="h">
                  <b>{matchCount || '—'}</b> bounties match you
                </span>
                <Link href="/earn" className="see">See all matches →</Link>
              </div>
              <div className="bgrid">
                {starter ? (
                  <Link href={`/earn/listing/${starter.slug}`} className="bcard starter">
                    <div className="star">★ Good first bounty</div>
                    <div className="top">
                      <div className="sp">{starter.sponsor?.name ?? 'Sponsor'}</div>
                      <div className="prize">{prize(starter)}</div>
                    </div>
                    <h3>{starter.title}</h3>
                    <div className="foot">
                      <span>Clear brief · good odds</span>
                      <span className="easy">{starter._count?.Submission ?? 0} entries</span>
                    </div>
                  </Link>
                ) : (
                  <div className="bcard">
                    <h3>Fresh bounties are posted every morning.</h3>
                    <div className="foot"><span>Check the board</span></div>
                  </div>
                )}
                {matches[0] && (
                  <Link href={`/earn/listing/${matches[0].slug}`} className="bcard">
                    <div className="top">
                      <div className="sp">{matches[0].sponsor?.name ?? 'Sponsor'}</div>
                      <div className="prize">{prize(matches[0])}</div>
                    </div>
                    <h3>{matches[0].title}</h3>
                    <div className="foot">
                      <span>{matches[0]._count?.Submission ?? 0} submissions</span>
                    </div>
                  </Link>
                )}
              </div>
              <div className="nav">
                <button className="btn btn-terra" onClick={() => goTo('practice')}>
                  Try a quick practice run first →
                </button>
                <button className="btn-link" onClick={() => router.push('/earn')}>
                  Take me straight to the board
                </button>
              </div>
            </section>
          )}

          {/* PRACTICE */}
          {step === 'practice' && (
            <section className="stepc">
              <span className="kicker"><span className="dot" />Practice run · no pressure, no competition</span>
              <h1 className="q">Warm up with a <em>practice</em> brief.</h1>
              <p className="sub">
                A real-feeling brief so you learn how submitting works — then
                compare against a winning example. Nothing here is public.
              </p>
              <div className="practice">
                <div className="brief">
                  <div className="ptag">Practice · Design</div>
                  <h3>Design a landing hero section</h3>
                  <ul>
                    <li><span className="d" />A headline, one line of supporting copy, and a clear button.</li>
                    <li><span className="d" />Warm, friendly, trustworthy — think &quot;morning.&quot;</li>
                    <li><span className="d" />Any tool. Export a PNG or paste a link.</li>
                  </ul>
                  <button className="peek" onClick={() => setPeek((p) => !p)}>
                    👀 {peek ? 'Hide the' : 'Peek at a'} winning example
                  </button>
                  {peek && (
                    <div className="peekbox">
                      A clean hero: a bold serif headline, one supporting line, a
                      single terracotta button, generous whitespace.
                    </div>
                  )}
                </div>
                <div>
                  <button className="drop" onClick={() => setPracticeDone(true)}>
                    <b>Drop your work or paste a link</b>
                    Click to simulate a submission
                  </button>
                  {practiceDone && (
                    <div className="feedback">
                      <div className="fh">Nice — you&apos;ve got the hang of it.</div>
                      <p>That&apos;s exactly the flow for a real bounty. You&apos;re ready.</p>
                    </div>
                  )}
                  <div className={`rubric${practiceDone ? ' done' : ''}`}>
                    <h4>What we look for</h4>
                    <div className="r"><span className="tick">✓</span>A clear, single headline</div>
                    <div className="r"><span className="tick">✓</span>Obvious call-to-action</div>
                    <div className="r"><span className="tick">✓</span>On-brand, warm tone</div>
                    <div className="r"><span className="tick">✓</span>Submitted on time</div>
                  </div>
                </div>
              </div>
              <div className="nav" style={{ marginTop: 30 }}>
                <button className="btn btn-ghost" onClick={() => goTo('result')}>← Back</button>
                <button className="btn btn-solid" onClick={() => goTo('done')}>
                  I&apos;m ready — find my first bounty →
                </button>
              </div>
            </section>
          )}

          {/* DONE */}
          {step === 'done' && (
            <section className="stepc">
              <div className="done-grid">
                <div>
                  <span className="kicker"><span className="dot" />You&apos;re ready</span>
                  <h1 className="q">
                    Let&apos;s get you that <em>first win</em>, {firstName}.
                  </h1>
                  <p className="sub">
                    You&apos;re set up. Knock out the last two and your name&apos;s
                    on the board — most builders land their first within a week.
                  </p>
                  <button className="btn btn-terra" onClick={() => router.push('/earn')}>
                    Browse my matched bounties →
                  </button>
                </div>
                <div className="checklist">
                  <div className="ch cdone"><span className="tick">✓</span><span className="t">Create your account</span></div>
                  <div className="ch cdone"><span className="tick">✓</span><span className="t">Tell us about you</span></div>
                  <div className={`ch${practiceDone ? ' cdone' : ''}`}><span className="tick">✓</span><span className="t">Practice run</span><span className="meta">+10 XP</span></div>
                  <div className="ch"><span className="tick">✓</span><span className="t">Submit your first real bounty</span></div>
                  <div className="ch"><span className="tick">✓</span><span className="t">Set up USDC payout</span></div>
                </div>
              </div>
            </section>
          )}
        </div>
      </div>

      <style jsx global>{`
        .ob{--paper:#FBF7EF;--paper-2:#F2EAD9;--paper-3:#E9E0CD;--ink:#221A14;--ink-soft:#5C5147;
          --terra:#C4502E;--terra-deep:#A83F22;--sage:#8FA37E;--forest:#2C3A2E;--forest-soft:#3C4D3D;--olive:#6B7A4F;--hair:#E6DCC9;
          --serif:var(--font-fraunces),serif;--sans:var(--font-hanken),'Hanken Grotesk',sans-serif;
          --shadow:0 22px 60px -34px rgba(54,38,22,.5);--shadow-sm:0 12px 34px -22px rgba(54,38,22,.45);
          min-height:100vh;background:var(--paper);color:var(--ink);font-family:var(--sans);font-size:16px;line-height:1.55;display:flex;flex-direction:column}
        .ob *{box-sizing:border-box}
        .ob .bar{display:flex;align-items:center;gap:20px;padding:20px 32px;max-width:1080px;margin:0 auto;width:100%}
        .ob .brand{display:flex;align-items:center;gap:10px;font-family:var(--serif);font-weight:500;font-size:20px}
        .ob .sun{width:26px;height:26px;border-radius:50%;background:radial-gradient(circle at 50% 62%,#E8B48E,var(--terra))}
        .ob .skip{margin-left:auto;font-size:14px;color:var(--ink-soft);font-weight:500;background:none;border:0;cursor:pointer}
        .ob .skip:hover{color:var(--ink)}
        .ob .progress{height:3px;background:var(--paper-3);border-radius:3px;overflow:hidden;max-width:1016px;margin:0 auto;width:calc(100% - 64px)}
        .ob .progress i{display:block;height:100%;background:linear-gradient(90deg,var(--olive),var(--sage));border-radius:3px;transition:width .5s cubic-bezier(.2,.7,.2,1)}
        .ob .stage{flex:1;display:flex;align-items:center;justify-content:center;padding:32px}
        .ob .stepc{width:100%;max-width:880px;animation:obUp .5s cubic-bezier(.2,.7,.2,1)}
        @keyframes obUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
        .ob .kicker{font-size:12px;letter-spacing:.2em;text-transform:uppercase;font-weight:600;color:var(--terra);display:inline-flex;align-items:center;gap:9px;margin-bottom:16px}
        .ob .kicker .dot{width:7px;height:7px;border-radius:50%;background:var(--sage)}
        .ob h1.q{font-family:var(--serif);font-weight:400;font-size:clamp(30px,4.4vw,46px);line-height:1.06;letter-spacing:-.02em;margin-bottom:12px}
        .ob h1.q em{font-style:italic;color:var(--terra)}
        .ob .sub{color:var(--ink-soft);font-size:17px;max-width:46ch;margin-bottom:34px}
        .ob .welcome{display:grid;grid-template-columns:1.05fr .95fr;gap:48px;align-items:center}
        .ob .welcome .actions{display:flex;flex-direction:column;gap:14px;align-items:flex-start;margin-top:8px}
        .ob .viz{border-radius:20px;overflow:hidden;border:1px solid var(--hair);box-shadow:var(--shadow);aspect-ratio:4/3.4;position:relative;
          background:radial-gradient(120% 80% at 20% 6%,rgba(143,163,126,.9),transparent 55%),radial-gradient(120% 100% at 92% 96%,rgba(44,58,46,.92),transparent 55%),linear-gradient(150deg,#C4502E,#7a2c18)}
        .ob .viz .lines{position:absolute;inset:0;opacity:.32;background-image:repeating-linear-gradient(115deg,rgba(255,255,255,.12) 0 1px,transparent 1px 24px)}
        .ob .viz .float{position:absolute;left:22px;top:22px;background:var(--paper);border:1px solid var(--hair);border-radius:13px;padding:13px 16px;font-size:13px;line-height:1.3;box-shadow:var(--shadow-sm);animation:obBob 6s ease-in-out infinite}
        .ob .viz .float .amt{font-family:var(--serif);font-size:20px;color:var(--forest)}
        .ob .viz .label{position:absolute;left:24px;right:24px;bottom:24px;color:#fff}
        .ob .viz .label .k{font-size:11px;letter-spacing:.2em;text-transform:uppercase;opacity:.85;font-weight:600}
        .ob .viz .label .t{font-family:var(--serif);font-size:24px;line-height:1.1;margin-top:6px}
        @keyframes obBob{50%{transform:translateY(-8px)}}
        .ob .chips{display:flex;flex-wrap:wrap;gap:12px;margin-bottom:38px}
        .ob .chip{display:inline-flex;align-items:center;gap:10px;border:1px solid var(--hair);background:#fff;color:var(--ink);font-size:15.5px;font-weight:500;padding:13px 20px;border-radius:40px;cursor:pointer;transition:.18s}
        .ob .chip:hover{border-color:#d3a98f}
        .ob .chip .tick{width:18px;height:18px;border-radius:50%;border:1.5px solid var(--hair);display:grid;place-items:center;color:transparent;font-size:11px;transition:.18s}
        .ob .chip.sel{border-color:var(--terra);box-shadow:0 0 0 1px var(--terra)}
        .ob .chip.sel .tick{background:var(--terra);border-color:var(--terra);color:#fff}
        .ob .cards{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:38px}
        .ob .cards.three{grid-template-columns:repeat(3,1fr)}
        .ob .scard{text-align:left;border:1px solid var(--hair);background:#fff;border-radius:16px;padding:22px;cursor:pointer;transition:.18s;position:relative}
        .ob .scard:hover{border-color:#d3a98f;transform:translateY(-2px)}
        .ob .scard.sel{border-color:var(--terra);box-shadow:0 0 0 1px var(--terra)}
        .ob .scard .ic{width:40px;height:40px;border-radius:11px;background:var(--paper-2);display:grid;place-items:center;font-size:20px;margin-bottom:14px}
        .ob .scard .t{font-family:var(--serif);font-size:20px;margin-bottom:6px}
        .ob .scard .d{font-size:13.5px;color:var(--ink-soft);line-height:1.5}
        .ob .scard .tick{position:absolute;top:16px;right:16px;width:20px;height:20px;border-radius:50%;border:1.5px solid var(--hair);display:grid;place-items:center;color:transparent;font-size:12px;transition:.18s}
        .ob .scard.sel .tick{background:var(--terra);border-color:var(--terra);color:#fff}
        .ob .nav{display:flex;align-items:center;gap:14px}
        .ob .btn{display:inline-flex;align-items:center;gap:8px;font-weight:600;font-size:15px;padding:13px 26px;border-radius:40px;border:1px solid transparent;cursor:pointer;transition:.2s;font-family:var(--sans)}
        .ob .btn-solid{background:var(--forest);color:var(--paper)}
        .ob .btn-solid:hover{background:var(--forest-soft)}
        .ob .btn-solid:disabled{opacity:.45;cursor:not-allowed}
        .ob .btn-terra{background:var(--terra);color:#fff}
        .ob .btn-terra:hover{background:var(--terra-deep)}
        .ob .btn-ghost{background:transparent;color:var(--ink);border-color:var(--hair)}
        .ob .btn-ghost:hover{background:var(--paper-2)}
        .ob .btn-link{background:none;border:0;color:var(--ink-soft);font-weight:500;cursor:pointer;font-size:14.5px;padding:8px 4px}
        .ob .btn-link:hover{color:var(--ink)}
        .ob .summary{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:22px}
        .ob .summary span{font-size:13px;background:var(--paper-2);border:1px solid var(--hair);border-radius:30px;padding:6px 14px;color:var(--ink-soft)}
        .ob .summary span b{color:var(--ink);font-weight:600}
        .ob .match-head{display:flex;align-items:baseline;justify-content:space-between;gap:16px;margin:6px 0 16px}
        .ob .match-head .h{font-family:var(--serif);font-size:22px}
        .ob .match-head .see{font-size:13.5px;color:var(--olive);font-weight:600;text-decoration:none}
        .ob .bgrid{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:30px}
        .ob .bcard{display:block;text-decoration:none;color:inherit;border:1px solid var(--hair);background:#fff;border-radius:14px;padding:22px;position:relative;transition:.2s}
        .ob .bcard:hover{transform:translateY(-3px);box-shadow:var(--shadow-sm)}
        .ob .bcard.starter{border-color:var(--terra);box-shadow:0 0 0 1px var(--terra)}
        .ob .bcard .star{position:absolute;top:-11px;left:20px;background:var(--terra);color:#fff;font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;padding:5px 12px;border-radius:30px}
        .ob .bcard .top{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px}
        .ob .bcard .sp{font-size:12.5px;color:var(--olive);font-weight:600}
        .ob .bcard .prize{font-family:var(--serif);font-size:24px;color:var(--terra)}
        .ob .bcard h3{font-family:var(--serif);font-weight:400;font-size:21px;line-height:1.15;margin-bottom:14px}
        .ob .bcard .foot{display:flex;justify-content:space-between;font-size:12.5px;color:var(--ink-soft);padding-top:12px;border-top:1px solid rgba(34,26,20,.08)}
        .ob .bcard .foot .easy{color:var(--forest);font-weight:600}
        .ob .practice{display:grid;grid-template-columns:1fr 1fr;gap:30px;align-items:start}
        .ob .brief{border:1px solid var(--hair);background:#fff;border-radius:16px;padding:26px 28px}
        .ob .brief .ptag{font-size:12.5px;color:var(--olive);font-weight:600}
        .ob .brief h3{font-family:var(--serif);font-weight:400;font-size:24px;margin:6px 0 14px}
        .ob .brief ul{list-style:none;display:grid;gap:11px;margin-bottom:20px;padding:0}
        .ob .brief li{display:flex;gap:11px;font-size:14.5px;color:var(--ink-soft)}
        .ob .brief li .d{width:7px;height:7px;border-radius:50%;background:var(--terra);margin-top:8px;flex:0 0 auto}
        .ob .brief .peek{font-size:13.5px;color:var(--olive);font-weight:600;cursor:pointer;background:none;border:0;padding:0}
        .ob .peekbox{margin-top:14px;font-size:13.5px;color:var(--ink-soft);background:var(--paper-2);border:1px solid var(--hair);border-radius:12px;padding:14px 16px}
        .ob .rubric{border:1px solid var(--hair);background:var(--paper-2);border-radius:16px;padding:26px 28px}
        .ob .rubric h4{font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:var(--ink-soft);font-weight:600;margin-bottom:16px}
        .ob .rubric .r{display:flex;gap:11px;align-items:center;padding:9px 0;font-size:14.5px}
        .ob .rubric .r .tick{width:20px;height:20px;border-radius:50%;border:1.5px solid var(--hair);display:grid;place-items:center;color:transparent;font-size:12px;transition:.3s;flex:0 0 auto}
        .ob .rubric.done .r .tick{background:var(--sage);border-color:var(--sage);color:#fff}
        .ob .drop{display:block;width:100%;border:1.5px dashed #d3c5ab;border-radius:14px;padding:26px;text-align:center;color:var(--ink-soft);font-size:14px;margin-bottom:18px;background:var(--paper);cursor:pointer;font-family:var(--sans)}
        .ob .drop:hover{border-color:var(--terra);color:var(--ink)}
        .ob .drop b{display:block;font-family:var(--serif);font-size:18px;color:var(--ink);margin-bottom:4px}
        .ob .feedback{border:1px solid var(--sage);background:rgba(143,163,126,.12);border-radius:14px;padding:18px 20px;margin-bottom:18px;animation:obUp .4s}
        .ob .feedback .fh{font-family:var(--serif);font-size:19px;color:var(--forest);margin-bottom:4px}
        .ob .feedback p{font-size:14px;color:var(--ink-soft)}
        .ob .done-grid{display:grid;grid-template-columns:1fr .85fr;gap:40px;align-items:center}
        .ob .checklist{border:1px solid var(--hair);background:#fff;border-radius:18px;padding:28px;box-shadow:var(--shadow-sm)}
        .ob .checklist .ch{display:flex;align-items:center;gap:14px;padding:13px 0;border-bottom:1px solid rgba(34,26,20,.08)}
        .ob .checklist .ch:last-child{border-bottom:0}
        .ob .checklist .ch .tick{width:24px;height:24px;border-radius:50%;border:1.5px solid var(--hair);display:grid;place-items:center;color:transparent;font-size:13px;flex:0 0 auto}
        .ob .checklist .ch.cdone .tick{background:var(--forest);border-color:var(--forest);color:#fff}
        .ob .checklist .ch .t{font-size:15px;font-weight:500}
        .ob .checklist .ch.cdone .t{color:var(--ink-soft)}
        .ob .checklist .ch .meta{margin-left:auto;font-size:12px;color:var(--olive);font-weight:600}
        @media(max-width:820px){
          .ob .welcome,.ob .practice,.ob .done-grid{grid-template-columns:1fr}
          .ob .cards,.ob .cards.three,.ob .bgrid{grid-template-columns:1fr}
          .ob .viz{order:-1}
        }
      `}</style>
    </>
  );
}
