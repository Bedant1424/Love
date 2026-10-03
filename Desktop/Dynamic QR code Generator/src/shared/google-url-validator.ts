import type { GoogleUrlValidationResult } from './types';

/**
 * Approved exact Google hostnames for Google Review destinations.
 * No wildcard or substring matches are permitted.
 */
export const APPROVED_GOOGLE_HOSTNAMES = new Set([
  'search.google.com',
  'g.page',
  'maps.app.goo.gl',
  'maps.google.com',
  'www.google.com',
]);

/**
 * Validates whether an input URL is a legitimate Google Review destination URL.
 * Side-effect free, synchronous, and performs zero network calls (No SSRF).
 */
export function validateGoogleReviewUrl(inputUrl: string): GoogleUrlValidationResult {
  if (typeof inputUrl !== 'string' || inputUrl.trim().length === 0) {
    return { isValid: false, error: 'URL must be a non-empty string.' };
  }

  const trimmed = inputUrl.trim();

  // 1. Guard against CR/LF characters (Header injection / splitting)
  if (/[\r\n]/.test(trimmed)) {
    return { isValid: false, error: 'URL contains illegal control or newline characters.' };
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { isValid: false, error: 'Malformed or unparseable URL.' };
  }

  // 2. Protocol must strictly be HTTPS
  if (parsed.protocol !== 'https:') {
    return { isValid: false, error: 'HTTPS protocol is strictly required.' };
  }

  // 3. Reject credentials in URL (e.g. https://user:pass@google.com)
  if (parsed.username || parsed.password) {
    return { isValid: false, error: 'URL credentials (userinfo) are not permitted.' };
  }

  // 4. Normalize and check exact hostname against allowlist
  const hostname = parsed.hostname.toLowerCase();
  if (!APPROVED_GOOGLE_HOSTNAMES.has(hostname)) {
    return {
      isValid: false,
      error: 'Destination must be an approved Google Review domain.',
    };
  }

  // 5. Hostname-specific path and parameter validation
  if (hostname === 'search.google.com') {
    // Canonical Place ID link: /local/writereview?placeid=...
    const placeId = parsed.searchParams.get('placeid')?.trim();
    if (parsed.pathname === '/local/writereview' && placeId && placeId.length > 0) {
      return { isValid: true, normalizedUrl: parsed.toString() };
    }
    return {
      isValid: false,
      error:
        'search.google.com URLs must point to /local/writereview with a valid placeid parameter.',
    };
  }

  if (hostname === 'g.page') {
    // Business profile short link: /r/{code}/review or /{slug}/review
    const path = parsed.pathname;
    if (path.endsWith('/review') && path.length > '/review'.length) {
      return { isValid: true, normalizedUrl: parsed.toString() };
    }
    return {
      isValid: false,
      error: 'g.page URLs must end with /review (e.g., https://g.page/r/{id}/review).',
    };
  }

  if (hostname === 'maps.app.goo.gl') {
    // Official Google Maps mobile share link: /{id}
    if (parsed.pathname.length > 1) {
      return { isValid: true, normalizedUrl: parsed.toString() };
    }
    return {
      isValid: false,
      error: 'maps.app.goo.gl URL path must contain a valid share identifier.',
    };
  }

  if (hostname === 'maps.google.com') {
    // Maps place or CID link: /maps/...
    if (parsed.pathname === '/maps' || parsed.pathname.startsWith('/maps/')) {
      return { isValid: true, normalizedUrl: parsed.toString() };
    }
    return {
      isValid: false,
      error: 'maps.google.com URLs must start with /maps path.',
    };
  }

  if (hostname === 'www.google.com') {
    // Must be maps link, explicitly NOT redirectors like /url
    if (parsed.pathname === '/maps' || parsed.pathname.startsWith('/maps/')) {
      return { isValid: true, normalizedUrl: parsed.toString() };
    }
    return {
      isValid: false,
      error: 'www.google.com URLs are only permitted for Google Maps paths (/maps).',
    };
  }

  return { isValid: false, error: 'Unrecognized Google Review link pattern.' };
}
