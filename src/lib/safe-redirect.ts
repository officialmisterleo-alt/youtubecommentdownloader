/**
 * Returns `next` only if it's a same-site path like "/pricing?x=1"; otherwise the
 * fallback. Blocks javascript: URLs, other origins, and protocol-relative tricks
 * ("//evil.com", "/\evil.com") so a crafted ?next= link can't redirect or run script.
 */
export function safeNextPath(next: string | null | undefined, fallback = '/dashboard'): string {
  if (!next) return fallback
  if (!next.startsWith('/') || next.startsWith('//')) return fallback
  if (/[\\\u0000-\u001f]/.test(next)) return fallback
  return next
}
