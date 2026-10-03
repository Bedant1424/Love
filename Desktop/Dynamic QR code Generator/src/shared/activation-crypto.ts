import type { ActivationCodeValidationResult } from './types';

/**
 * Crockford Base32 Alphabet excluding ambiguous characters I, L, O, U.
 * 12 characters total for activation codes (grouped XXXX-XXXX-XXXX).
 */
export const ACTIVATION_CODE_REGEX = /^[0-9A-HJKMNP-TV-Z]{12}$/;
export const AMBIGUOUS_ACTIVATION_CHARS = /[ILOU]/i;

/**
 * Normalizes a raw activation code string:
 * - Trims outer whitespace
 * - Strips all hyphens and inner whitespace
 * - Converts to uppercase
 */
export function normalizeActivationCode(raw: string): string {
  if (typeof raw !== 'string') {
    return '';
  }
  return raw.replace(/[-\s]/g, '').toUpperCase();
}

/**
 * Formats a 12-character normalized Crockford code into the canonical XXXX-XXXX-XXXX pattern.
 */
export function formatActivationCode(normalized: string): string {
  const clean = normalizeActivationCode(normalized);
  if (clean.length !== 12) {
    return clean;
  }
  return `${clean.slice(0, 4)}-${clean.slice(4, 8)}-${clean.slice(8, 12)}`;
}

/**
 * Validates whether an activation code meets format and character requirements.
 */
export function validateActivationCodeFormat(raw: string): ActivationCodeValidationResult {
  if (typeof raw !== 'string') {
    return { isValid: false, error: 'Activation code must be a string' };
  }

  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    return { isValid: false, error: 'Activation code cannot be empty' };
  }

  if (AMBIGUOUS_ACTIVATION_CHARS.test(trimmed)) {
    return {
      isValid: false,
      error: 'Activation code contains ambiguous characters (I, L, O, U are excluded)',
    };
  }

  const normalized = normalizeActivationCode(trimmed);

  if (normalized.length !== 12) {
    return {
      isValid: false,
      error: `Activation code must contain exactly 12 characters (received ${normalized.length})`,
    };
  }

  if (!ACTIVATION_CODE_REGEX.test(normalized)) {
    return {
      isValid: false,
      error: 'Activation code contains invalid characters for Crockford Base32',
    };
  }

  return {
    isValid: true,
    normalizedCode: normalized,
  };
}

/**
 * Constant-time comparison for two hexadecimal strings to prevent side-channel timing attacks.
 * Never short-circuits early when characters differ.
 */
export function timingSafeEqualHex(a: string, b: string): boolean {
  if (typeof a !== 'string' || typeof b !== 'string') {
    return false;
  }

  const aLower = a.toLowerCase();
  const bLower = b.toLowerCase();

  const lenA = aLower.length;
  const lenB = bLower.length;

  let diff = lenA ^ lenB;
  const maxLen = Math.max(lenA, lenB);

  for (let i = 0; i < maxLen; i++) {
    const charA = i < lenA ? aLower.charCodeAt(i) : 0;
    const charB = i < lenB ? bLower.charCodeAt(i) : 0;
    diff |= charA ^ charB;
  }

  return diff === 0;
}

/**
 * Computes the HMAC-SHA256 hex digest of a normalized activation code.
 * Fails closed if the secret is missing or empty.
 */
export async function hashActivationCode(code: string, secret: string): Promise<string> {
  if (!secret || typeof secret !== 'string' || secret.trim().length === 0) {
    throw new Error('ACTIVATION_SECRET is not configured or invalid');
  }

  const validation = validateActivationCodeFormat(code);
  if (!validation.isValid || !validation.normalizedCode) {
    throw new Error(validation.error ?? 'Invalid activation code format');
  }

  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const msgData = encoder.encode(validation.normalizedCode);

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', cryptoKey, msgData);
  const hashBytes = new Uint8Array(signature);

  return Array.from(hashBytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Verifies a submitted activation code against an existing stored HMAC-SHA256 hex digest
 * in constant time.
 */
export async function verifyActivationCode(
  submittedCode: string,
  storedHash: string,
  secret: string
): Promise<boolean> {
  if (!secret || !storedHash || !submittedCode) {
    return false;
  }

  try {
    const computedHash = await hashActivationCode(submittedCode, secret);
    return timingSafeEqualHex(computedHash, storedHash);
  } catch {
    return false;
  }
}

/**
 * Generates a cryptographically secure 12-character Crockford Base32 activation code
 * formatted as XXXX-XXXX-XXXX.
 */
export function generateActivationCode(): string {
  const CROCKFORD_CHARS = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  let code = '';
  for (let i = 0; i < 12; i++) {
    code += CROCKFORD_CHARS[(bytes[i] ?? 0) % 32];
  }
  return formatActivationCode(code);
}
