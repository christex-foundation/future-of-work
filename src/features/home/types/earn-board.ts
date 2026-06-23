/** A live bounty shaped for the Daybreak /earn board (ticker, spotlight, sidebar). */
export interface EarnBounty {
  title: string;
  slug: string;
  sponsor: string;
  /** Discipline / category label, e.g. "Design". */
  cat: string;
  /** Preformatted prize, e.g. "$6k". */
  prizeLabel: string;
  token: string;
  tags: string[];
  daysLeft: number | null;
  /** Short deadline label, e.g. "6d" or "2d 14h". */
  dueShort: string;
  submissions: number;
  verified: boolean;
}
