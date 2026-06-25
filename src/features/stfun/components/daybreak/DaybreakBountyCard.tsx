import Link from 'next/link';

/**
 * The single canonical bounty card (Daybreak · Cover Stories).
 * Used on the marketing homepage AND the /earn board — do not duplicate it.
 * A `featured` instance renders the large art-plate "cover" variant; every other
 * instance is the standard masonry card. Bounties read as a contest (prize pool,
 * submissions, elapsed meter); projects read as a hire (compensation,
 * applications, apply-by). Styles live under `.bounty-card` in
 * src/styles/st-globals.css.
 */
export type LiveBounty = {
  title: string;
  slug: string;
  sponsor: string;
  /** Sponsor logo URL; falls back to the sponsor initial when absent. */
  sponsorLogo?: string | null;
  cat: string;
  reward: number | null;
  /** Preformatted prize string (e.g. "1.5K", "Variable"); overrides `reward`. */
  prizeLabel?: string;
  token: string;
  tags: string[];
  daysLeft: number | null;
  /** Top-right status pill. Defaults to "Open". */
  status?: string;
  /** When set, replaces the computed deadline meta (e.g. "Winners announced"). */
  dueLabel?: string;
  /** 'project' switches the card to the hire framing. Defaults to 'bounty'. */
  type?: 'bounty' | 'project';
  /** Submission count (bounty) or application count (project); null hides it. */
  submissions?: number | null;
  /** 0–100 elapsed-time meter for bounties; null hides the meter. */
  elapsedPct?: number | null;
  /** Formatted apply-by date for projects (e.g. "Jul 2"). */
  applyBy?: string | null;
};

const initialOf = (name: string) => (name?.trim()?.[0] ?? '·').toUpperCase();

function SponsorMark({ bounty: b }: { bounty: LiveBounty }) {
  if (b.sponsorLogo) {
    return (
      <span className="bc-logo">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={b.sponsorLogo} alt={b.sponsor} loading="lazy" />
      </span>
    );
  }
  return <span className="bc-logo bc-logo-initial">{initialOf(b.sponsor)}</span>;
}

export function DaybreakBountyCard({
  bounty: b,
  featured = false,
}: {
  bounty: LiveBounty;
  featured?: boolean;
}) {
  const isProject = b.type === 'project';
  const prize =
    b.prizeLabel ??
    (b.reward != null ? `$${Number(b.reward).toLocaleString()}` : '—');
  const countLabel = isProject ? 'applications' : 'submissions';

  const due = b.dueLabel
    ? b.dueLabel
    : isProject
      ? b.applyBy
        ? `Apply by ${b.applyBy}`
        : b.daysLeft != null
          ? `${b.daysLeft}d left to apply`
          : 'Rolling deadline'
      : b.daysLeft != null
        ? `${b.daysLeft}d left`
        : 'Rolling deadline';

  if (featured) {
    return (
      <Link
        href={`/earn/listing/${b.slug}`}
        className={`bounty-card cover ${isProject ? 'project' : 'bounty'}`}
      >
        <span className="plate" aria-hidden="true" />
        <span className="lines" aria-hidden="true" />
        <span className="type-flag">
          Cover · {isProject ? 'Project' : 'Bounty'}
        </span>
        <span className="clock">{due}</span>
        <div className="cv-body">
          <div className="cv-spon">
            <SponsorMark bounty={b} />
            <span className="nm">{b.sponsor}</span>
          </div>
          <h2>{b.title}</h2>
          {b.tags.length > 0 && (
            <div className="tags">
              {b.tags.map((t) => (
                <span key={t}>{t}</span>
              ))}
            </div>
          )}
          <div className="cv-reward">
            <div>
              <div className="k">
                {isProject ? 'Compensation' : 'Prize pool'} · {b.token}
              </div>
              <div className="big">{prize}</div>
            </div>
            <div className="right">
              {b.submissions != null && (
                <>
                  {b.submissions} {countLabel}
                  <br />
                </>
              )}
              {isProject ? 'Hiring one' : 'Open to all'}
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={`/earn/listing/${b.slug}`}
      className={`bounty-card ${isProject ? 'project' : 'bounty'}`}
    >
      <div className="sc-top">
        <div className="sc-spon">
          <SponsorMark bounty={b} />
          <div className="sc-id">
            <div className="nm">{b.sponsor}</div>
            <div className="cat">
              {b.cat} · {isProject ? 'Project' : 'Bounty'}
            </div>
          </div>
        </div>
        <span className={`type-pill ${isProject ? 'project' : 'bounty'}`}>
          {isProject ? 'Hire' : 'Contest'}
        </span>
      </div>

      <h3>{b.title}</h3>

      <div className={`sc-reward ${isProject ? 'proj' : ''}`}>
        {prize}
        <span className="u">{isProject ? b.token : `${b.token} pool`}</span>
      </div>

      {b.tags.length > 0 && (
        <div className="tags">
          {b.tags.map((t) => (
            <span key={t} className="tag">
              {t}
            </span>
          ))}
        </div>
      )}

      {!isProject && b.elapsedPct != null && (
        <div className="meter-row">
          <div className="meter">
            <i style={{ width: `${b.elapsedPct}%` }} />
          </div>
          <span className="meter-lbl">{b.elapsedPct}% elapsed</span>
        </div>
      )}

      <div className="sc-foot">
        <span>
          {b.submissions != null
            ? `${b.submissions} ${countLabel}`
            : (b.status ?? 'Open')}
        </span>
        <span className={`due ${isProject ? 'proj' : ''}`}>{due}</span>
      </div>
    </Link>
  );
}
