import { validatePublicId, PUBLIC_ID_LENGTH } from './utils';

export type CardEnvironment = 'pilot' | 'production' | 'development';

export interface CardUrlOptions {
  environment?: CardEnvironment;
  customDomain?: string;
  pilotHost?: string;
  devHost?: string;
}

/**
 * Default hostnames per environment
 */
export const DEFAULT_PILOT_HOST = 'qroute.workers.dev';
export const DEFAULT_DEV_HOST = 'localhost:8787';

/**
 * Domain validation regex matching RFC 1123 compliant fully-qualified hostnames.
 * Labels must be 1-63 chars of alphanumeric or hyphens (not starting/ending with hyphen).
 * Requires at least two labels (e.g. example.com, qr.brand.co.uk) or localhost for dev.
 */
const HOSTNAME_REGEX =
  /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,63}$|^localhost(?::\d{1,5})?$/;

/**
 * Validates and normalizes a custom hostname for production QR/NFC routing.
 * Ensures:
 * - No protocol prefix (http://, https://)
 * - No trailing slashes or path segments
 * - No query strings or fragment identifiers
 * - No dangerous characters or spaces
 * - RFC 1123 compliant domain structure
 */
export function validateCustomDomain(raw: unknown): {
  isValid: boolean;
  normalizedDomain?: string;
  error?: string;
} {
  if (typeof raw !== 'string') {
    return { isValid: false, error: 'Domain must be a string' };
  }

  let cleaned = raw.trim().toLowerCase();

  // Strip protocol if user accidentally typed it
  if (cleaned.startsWith('https://')) {
    cleaned = cleaned.slice(8);
  } else if (cleaned.startsWith('http://')) {
    cleaned = cleaned.slice(7);
  }

  // Strip trailing slashes or paths
  if (cleaned.includes('/')) {
    const parts = cleaned.split('/');
    cleaned = parts[0] ?? '';
  }

  // Strip query parameters or fragments
  if (cleaned.includes('?')) {
    cleaned = cleaned.split('?')[0] ?? '';
  }
  if (cleaned.includes('#')) {
    cleaned = cleaned.split('#')[0] ?? '';
  }

  if (!cleaned) {
    return { isValid: false, error: 'Domain cannot be empty' };
  }

  if (cleaned.length > 253) {
    return { isValid: false, error: 'Domain name exceeds maximum length of 253 characters' };
  }

  if (!HOSTNAME_REGEX.test(cleaned)) {
    return {
      isValid: false,
      error:
        'Invalid domain format. Must be a valid hostname (e.g., qr.example.com or review.mybusiness.org)',
    };
  }

  return { isValid: true, normalizedDomain: cleaned };
}

/**
 * Builds the canonical routing URL for a physical review card.
 *
 * Sacred Physical Invariant:
 * The resulting URL is strictly https://<HOST>/c/<publicId>.
 * It NEVER encodes Google review URLs, activation secrets, or mutable parameters.
 */
export function buildCardUrl(publicId: string, options: CardUrlOptions = {}): string {
  const validation = validatePublicId(publicId);
  if (!validation.isValid || !validation.normalizedId) {
    throw new Error(validation.error || 'Invalid card public ID');
  }

  const environment = options.environment ?? 'pilot';

  let host: string;
  let protocol = 'https';

  switch (environment) {
    case 'production': {
      if (!options.customDomain) {
        throw new Error('Custom domain is required for production environment');
      }
      const domainVal = validateCustomDomain(options.customDomain);
      if (!domainVal.isValid || !domainVal.normalizedDomain) {
        throw new Error(domainVal.error || 'Invalid production domain');
      }
      host = domainVal.normalizedDomain;
      break;
    }

    case 'development': {
      host = options.devHost ?? DEFAULT_DEV_HOST;
      protocol = host.startsWith('localhost') || host.startsWith('127.0.0.1') ? 'http' : 'https';
      break;
    }

    case 'pilot':
    default: {
      host = options.pilotHost ?? DEFAULT_PILOT_HOST;
      // Strip potential scheme if provided in pilotHost
      if (host.startsWith('https://')) host = host.slice(8);
      if (host.startsWith('http://')) host = host.slice(7);
      if (host.endsWith('/')) host = host.slice(0, -1);
      break;
    }
  }

  return `${protocol}://${host}/c/${validation.normalizedId}`;
}

/**
 * Extracts and validates a Crockford Base32 public ID from a full card URL or path.
 * Supports:
 * - https://example.com/c/A7K92P4X8Q
 * - /c/A7K92P4X8Q
 * - A7K92P4X8Q
 */
export function parseCardPublicIdFromUrl(input: string): string | null {
  if (!input || typeof input !== 'string') return null;

  const trimmed = input.trim();

  // If already a 16-char string, validate directly
  if (trimmed.length === PUBLIC_ID_LENGTH) {
    const val = validatePublicId(trimmed);
    return val.isValid ? val.normalizedId! : null;
  }

  // Look for /c/:publicId pattern
  const match = trimmed.match(/\/c\/([0-9a-zA-Z]{16})(?:[/?#]|$)/);
  if (match && match[1]) {
    const val = validatePublicId(match[1]);
    return val.isValid ? val.normalizedId! : null;
  }

  return null;
}
