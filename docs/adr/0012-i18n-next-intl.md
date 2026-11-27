# ADR-0012: Internationalisation with next-intl, English complete, Krio on learner screens, no locale in URLs

- Status: Accepted (next-intl, English + Krio learner screens). Proposed: no locale routing.
- Date: 2026-11-27
- Deciders: David Ogoo (Christex), CTO, SLDTP tech lead
- Supersedes / relates to: engineering-plan ADR-009; I18N-01 to I18N-03

## Context and problem statement

The bid promises English UI with externalised strings and a Krio language pack (tech.txt §3.7). March scope: English complete, Krio on learner screens, content team supplies translations.

## Decision drivers

- Externalised strings from day one
- Avoid URL and routing complexity
- Krio (`kri`) has no CLDR data in `Intl`

## Considered options

1. next-intl with locale-prefixed routes (`/kri/...`)
2. next-intl, locale from `User.locale` or a cookie, no URL prefix (chosen)
3. Hand-rolled `t()`

## Decision outcome

Option 2. Messages in `src/sldtp/platform/i18n/messages/{en,kri}.json`, loaded in `_app` via `NextIntlClientProvider` for the Pages Router. Locale comes from `User.locale`, or a `locale` cookie for signed-out visitors; a language switch writes both. Missing Krio keys fall back to English. Dates and numbers are formatted with `en` rules for both locales, because `Intl` has no Krio data. Email templates use the same catalogue.

### Consequences

- Good: one routing tree; translators edit one JSON file; no broken links when switching language.
- Bad: Krio pages are not separately indexable by search engines, which doesn't matter here.

### Confirmation

CI check: every key in `en.json` exists in `kri.json` for the learner namespace, or is listed in an allowed-fallback file.
