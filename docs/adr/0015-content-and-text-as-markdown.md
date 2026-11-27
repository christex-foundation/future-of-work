# ADR-0015: Course content and employer text as Markdown files and textareas; no WYSIWYG in March

- Status: Proposed.
- Date: 2026-11-27
- Deciders: David Ogoo (Christex), CTO, SLDTP tech lead
- Supersedes / relates to: engineering-plan ADR-006 (content part); GAP-16

## Context and problem statement

Courses arrive from the content team as Markdown/JSON plus MP4 masters and WebVTT captions, loaded by an import script (COU-06, QUZ-05). In-app authoring is a known gap (GAP-16). The repo ships TipTap 3 (14 packages plus prosemirror) for listing descriptions, and `marked` + DOMPurify for rendering.

## Decision drivers

- Accessible input (screen readers, keyboard)
- Small bundles on low-end phones
- No content editor to build or secure in March

## Considered options

1. Keep TipTap for employer descriptions
2. Plain textarea, Markdown optional, rendered server-side with `marked` + DOMPurify (chosen)

## Decision outcome

Option 2. Course content is Markdown in the repo-independent content folder, imported by script. Employer and opportunity descriptions are textareas; line breaks and simple Markdown render. TipTap and its 14 packages are deleted.

### Consequences

- Good: smaller bundle, accessible by default, one renderer for course and job text.
- Bad: employers can't paste rich formatting; revisit if UAT shows it hurts.

### Confirmation

No `@tiptap/*` or `prosemirror-*` in `package.json`; axe passes on the opportunity form.
