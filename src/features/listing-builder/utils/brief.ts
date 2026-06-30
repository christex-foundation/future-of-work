/**
 * Shared helpers for the guided bounty brief.
 *
 * A good brief covers three sections — Overview, Requirements and Judging
 * Criteria. These helpers are the single source of truth shared by the editor
 * scaffold (pre-seeded headings), the sidebar checklist, and the warn-before-
 * publish check so all three stay in sync.
 */

export type BriefSectionKey = 'overview' | 'requirements' | 'judging';

export interface BriefSection {
  key: BriefSectionKey;
  /** Heading text used in the scaffold and shown in the checklist. */
  label: string;
  /** Lowercase keywords matched against a heading's text. */
  keywords: string[];
}

// Keywords are intentionally broad so the checklist recognises not just the
// scaffold headings but also the AI Auto-Generate output (e.g. "Mission",
// "Scope of Work", "Submission Requirements", "Evaluation Criteria") and the
// older DB templates, which use varied section titles for the same idea.
export const BRIEF_SECTIONS: BriefSection[] = [
  {
    key: 'overview',
    label: 'Overview',
    keywords: ['overview', 'about', 'mission', 'scope', 'summary', 'background'],
  },
  {
    key: 'requirements',
    label: 'Requirements',
    keywords: ['requirement', 'deliverable', 'qualification'],
  },
  {
    key: 'judging',
    label: 'Judging Criteria',
    keywords: ['judging', 'criteria', 'evaluation'],
  },
];

/**
 * Editor seed for a brand-new brief: the three section headings, each followed
 * by an empty paragraph. Headings only — no boilerplate body text, so nothing
 * junky is ever published if a section is left blank.
 */
export const BRIEF_SCAFFOLD_HTML =
  '<h2>Overview</h2><p></p>' +
  '<h2>Requirements</h2><p></p>' +
  '<h2>Judging Criteria</h2><p></p>';

export type BriefAnalysis = Record<BriefSectionKey, boolean>;

const headingMatchesSection = (text: string, section: BriefSection) => {
  const normalized = text.trim().toLowerCase();
  return section.keywords.some((keyword) => normalized.includes(keyword));
};

/**
 * A section counts as done when a heading matching its keywords exists AND
 * there is real (non-whitespace) text between that heading and the next
 * heading.
 *
 * Uses the DOM on the client; falls back to a lightweight keyword/length
 * heuristic during SSR (no `DOMParser`).
 */
export const analyzeBrief = (html?: string | null): BriefAnalysis => {
  const empty: BriefAnalysis = {
    overview: false,
    requirements: false,
    judging: false,
  };

  if (!html) return empty;

  if (typeof window === 'undefined' || typeof DOMParser === 'undefined') {
    return analyzeBriefFallback(html, empty);
  }

  try {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const nodes = Array.from(doc.body.children);
    const result: BriefAnalysis = { ...empty };

    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      if (!node || !/^h[1-6]$/i.test(node.tagName)) continue;

      const section = BRIEF_SECTIONS.find((s) =>
        headingMatchesSection(node.textContent || '', s),
      );
      if (!section) continue;

      // Gather text until the next heading.
      let body = '';
      for (let j = i + 1; j < nodes.length; j++) {
        const next = nodes[j];
        if (!next) continue;
        if (/^h[1-6]$/i.test(next.tagName)) break;
        body += next.textContent || '';
      }

      if (body.trim().length > 0) result[section.key] = true;
    }

    return result;
  } catch {
    return analyzeBriefFallback(html, empty);
  }
};

const analyzeBriefFallback = (
  html: string,
  empty: BriefAnalysis,
): BriefAnalysis => {
  const text = html.replace(/<[^>]*>/g, ' ').toLowerCase();
  const hasBody = text.replace(/\s+/g, ' ').trim().length > 0;
  return BRIEF_SECTIONS.reduce((acc, section) => {
    const headingPresent = section.keywords.some((k) => text.includes(k));
    acc[section.key] = headingPresent && hasBody;
    return acc;
  }, { ...empty });
};

export const missingBriefSections = (analysis: BriefAnalysis) =>
  BRIEF_SECTIONS.filter((s) => !analysis[s.key]);
