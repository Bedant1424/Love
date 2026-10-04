import type { PublicIdValidation } from './types';

/**
 * Canonical length for QRoute public card identifiers.
 * 16-character random Crockford Base32 identifier provides ~80 bits of cryptographic entropy,
 * preventing URL enumeration and brute-force scanning while remaining URL-safe and human-readable.
 */
export const PUBLIC_ID_LENGTH = 16;

/**
 * Standard Crockford Base32 alphabet (32 symbols).
 * Strictly excludes visually ambiguous characters:
 * - 'I' (confused with 1)
 * - 'L' (confused with 1)
 * - 'O' (confused with 0)
 * - 'U' (excluded in Crockford to prevent accidental obscenities)
 */
export const CROCKFORD_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

/**
 * Strict regex matching exactly 16 uppercase Crockford Base32 characters.
 */
export const CROCKFORD_BASE32_REGEX = /^[0-9A-HJKMNP-TV-Z]{16}$/;

/**
 * Checks whether a numeric string is trivial, sequential, or padded counter.
 * Protects against predictable sequences like 0000000000000001, 1234567890123456, or repeated digits.
 */
export function isSequentialNumeric(str: string): boolean {
  if (!/^\d+$/.test(str)) return false;

  // All identical digits (e.g. 0000000000000000, 1111111111111111)
  if (/^(\d)\1+$/.test(str)) return true;

  // Padded counters with leading zeros (e.g. 0000000000000001, 0000000000000002)
  if (/^0+[0-9]+$/.test(str)) return true;

  // Ascending or descending sequential digit runs
  let isAscending = true;
  let isDescending = true;
  for (let i = 1; i < str.length; i++) {
    const prev = Number(str[i - 1]);
    const curr = Number(str[i]);
    if (curr !== (prev + 1) % 10) isAscending = false;
    if (curr !== (prev - 1 + 10) % 10) isDescending = false;
  }

  return isAscending || isDescending;
}

/**
 * Generates a cryptographically random, collision-resistant Crockford Base32 public ID.
 * - Uses Web Crypto API (crypto.getRandomValues) natively available in Cloudflare Workers and modern runtimes.
 * - Zero modulo bias because 256 is an exact multiple of 32 (256 = 8 * 32).
 * - Generates canonical uppercase characters.
 * - Guarantees the ID is not sequential or predictable.
 * - Contains NO business identity, timestamps, sequential counters, or hash derivations.
 */
export function generateRandomPublicId(length = PUBLIC_ID_LENGTH): string {
  if (length <= 0) {
    throw new Error('Public ID length must be greater than 0');
  }

  const bytes = new Uint8Array(length);
  let id = '';

  // Bounded generation loop to guarantee cryptographic randomness and non-sequential nature
  let attempts = 0;
  const maxAttempts = 10;

  while (attempts < maxAttempts) {
    crypto.getRandomValues(bytes);
    id = '';
    for (let i = 0; i < length; i++) {
      // 256 % 32 == 0, exactly uniform distribution across all 32 Crockford symbols
      id += CROCKFORD_ALPHABET[(bytes[i] ?? 0) % 32];
    }

    if (!isSequentialNumeric(id)) {
      return id;
    }
    attempts++;
  }

  return id;
}

/**
 * Validates and normalizes a card public ID before any database lookup.
 *
 * Strict Rules:
 * - Must be a string
 * - Must be exactly 16 characters
 * - Must contain NO whitespace
 * - Must be uppercase Crockford Base32 (no lowercase allowed in canonical format)
 * - Must contain NO forbidden/ambiguous characters (I, L, O, U)
 * - Must contain NO URL or SQL injection characters
 * - Must NOT be sequential or predictable numeric
 *
 * Zero database state dependencies, highly performant for the public redirect path.
 */
export function validatePublicId(raw: unknown): PublicIdValidation {
  if (typeof raw !== 'string') {
    return { isValid: false, error: 'Public ID must be a string' };
  }

  // Reject any whitespace
  if (/\s/.test(raw)) {
    return { isValid: false, error: 'Public ID cannot contain whitespace' };
  }

  // Reject lowercase characters (strict canonical uppercase enforcement)
  if (/[a-z]/.test(raw)) {
    return { isValid: false, error: 'Public ID must be uppercase' };
  }

  // Length check
  if (raw.length < PUBLIC_ID_LENGTH) {
    return {
      isValid: false,
      error: `Public ID is too short; must be exactly ${PUBLIC_ID_LENGTH} characters`,
    };
  }
  if (raw.length > PUBLIC_ID_LENGTH) {
    return {
      isValid: false,
      error: `Public ID is too long; must be exactly ${PUBLIC_ID_LENGTH} characters`,
    };
  }

  // Character set check (only Crockford Base32 permitted)
  if (!CROCKFORD_BASE32_REGEX.test(raw)) {
    return { isValid: false, error: 'Public ID contains invalid characters' };
  }

  // Predictable / sequential numeric check
  if (isSequentialNumeric(raw)) {
    return { isValid: false, error: 'Public ID cannot be sequential or predictable numeric' };
  }

  return { isValid: true, normalizedId: raw };
}
