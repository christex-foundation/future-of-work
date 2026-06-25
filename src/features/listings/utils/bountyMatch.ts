/**
 * Bounty ↔ user matching for personalized feeds and the "good first bounty" rail.
 *
 * Pure, data-only — works off fields we already store:
 *  - user.skills / bounty.skills (JSON, Superteam shape `[{ skills, subskills }]`)
 *  - submission count (competition), reward, and listing type.
 * No new schema or features required.
 */

/** Normalize any of our skill JSON shapes into a lowercase Set of skill names. */
export function parseSkills(raw: unknown): Set<string> {
  const out = new Set<string>();
  const add = (v: unknown) => {
    if (typeof v === 'string' && v.trim()) out.add(v.trim().toLowerCase());
  };
  const walk = (v: unknown) => {
    if (!v) return;
    if (Array.isArray(v)) {
      v.forEach(walk);
    } else if (typeof v === 'string') {
      add(v);
    } else if (typeof v === 'object') {
      const o = v as Record<string, unknown>;
      add(o.skills); // `{ skills: 'Frontend', subskills: [...] }`
      walk(o.skills); // tolerate `{ skills: [...] }`
      walk(o.subskills);
    }
  };
  walk(raw);
  return out;
}

export interface ScorableBounty {
  skills: unknown;
  type?: string | null;
  rewardAmount?: number | null;
  usdValue?: number | null;
  submissionCount: number;
}

export interface MatchResult {
  /** Higher = better fit for this user. */
  score: number;
  /** How many of the bounty's skills the user shares. */
  overlap: number;
}

/**
 * Score a bounty for a user. Skill overlap dominates; low competition and
 * self-contained bounties get a nudge. When the user has no skills yet,
 * everything scores equally on the non-skill signals (graceful cold start).
 */
export function scoreBounty(
  bounty: ScorableBounty,
  userSkills: Set<string>,
): MatchResult {
  const bSkills = parseSkills(bounty.skills);
  let overlap = 0;
  for (const s of bSkills) if (userSkills.has(s)) overlap += 1;

  let score = overlap * 10;
  // good odds: fewer submissions ranks higher (caps at 0)
  score += Math.max(0, 6 - (bounty.submissionCount ?? 0));
  // self-contained bounties are friendlier than open-ended projects
  if ((bounty.type ?? 'bounty') === 'bounty') score += 1;
  return { score, overlap };
}

/** Personalized ordering: best fit first (stable for equal scores). */
export function personalize<T extends ScorableBounty>(
  bounties: T[],
  userSkills: Set<string>,
): T[] {
  return bounties
    .map((b, i) => ({ b, i, s: scoreBounty(b, userSkills).score }))
    .sort((a, b) => b.s - a.s || a.i - b.i)
    .map((x) => x.b);
}

/**
 * "Good first bounties": low competition, reasonable prize, and — if the user
 * has skills — at least one matching skill. Returns the best few.
 */
export function goodFirstBounties<T extends ScorableBounty>(
  bounties: T[],
  userSkills: Set<string>,
  take = 4,
  { maxSubmissions = 8, maxReward = 4000 }: { maxSubmissions?: number; maxReward?: number } = {},
): T[] {
  const hasSkills = userSkills.size > 0;
  return bounties
    .map((b) => ({ b, m: scoreBounty(b, userSkills) }))
    .filter(({ b, m }) => {
      const lowComp = (b.submissionCount ?? 0) <= maxSubmissions;
      const reward = b.rewardAmount ?? b.usdValue ?? 0;
      const affordable = reward <= maxReward;
      const matched = !hasSkills || m.overlap > 0;
      return lowComp && affordable && matched;
    })
    .sort((a, b) => b.m.score - a.m.score)
    .slice(0, take)
    .map((x) => x.b);
}
