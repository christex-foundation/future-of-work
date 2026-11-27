import IsoDomPurify, { type Config } from 'isomorphic-dompurify';

/**
 * Sanitizes HTML and always returns a string.
 *
 * Bundler resolution types `sanitize` as `TrustedHTML` when the config is
 * spread. `RETURN_TRUSTED_TYPE: false` selects the string overload.
 */
export function domPurify(dirty: string | Node, cfg?: Config): string {
  return IsoDomPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['a', 'p', 'br', 'strong', 'em'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
    ...cfg,
    RETURN_TRUSTED_TYPE: false,
  }) as string;
}
