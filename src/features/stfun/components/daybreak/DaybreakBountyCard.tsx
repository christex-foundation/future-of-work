import Link from 'next/link';

/**
 * The single canonical bounty card (Editorial / Daybreak style).
 * Used on the marketing homepage AND the /earn board — do not duplicate it.
 * Styles live under `.daybreak .bounty-card` in src/styles/st-globals.css.
 */
export type LiveBounty = {
  title: string;
  slug: string;
  sponsor: string;
  cat: string;
  reward: number | null;
  /** Preformatted prize string (e.g. "1.5K", "Variable"); overrides `reward` when set. */
  prizeLabel?: string;
  token: string;
  tags: string[];
  daysLeft: number | null;
  /** Top-right status pill. Defaults to "Open". */
  status?: string;
  /** When set, replaces the "<n> days / left to enter" meta block (e.g. "Winners / announced"). */
  dueLabel?: string;
};

export function DaybreakBountyCard({ bounty: b }: { bounty: LiveBounty }) {
  const prize =
    b.prizeLabel ??
    (b.reward != null ? `$${Number(b.reward).toLocaleString()}` : '—');

  return (
    <Link href={`/earn/listing/${b.slug}`} className="bounty-card">
      <div className="over">
        <span>
          {b.cat} · <b>{b.sponsor}</b>
        </span>
        <span>{b.status ?? 'Open'}</span>
      </div>
      <h3>{b.title}</h3>
      <p className="lead">{b.tags.length ? b.tags.join(' · ') : 'Open bounty'}</p>
      <div className="figline">
        <div className="amt">
          {prize}
          <small>Prize · {b.token}</small>
        </div>
        <div className="meta">
          {b.dueLabel ? (
            <b>{b.dueLabel}</b>
          ) : b.daysLeft != null ? (
            <>
              <b>{b.daysLeft} days</b>
              <br />
              left to enter
            </>
          ) : (
            <>
              Rolling
              <br />
              deadline
            </>
          )}
        </div>
      </div>
    </Link>
  );
}
