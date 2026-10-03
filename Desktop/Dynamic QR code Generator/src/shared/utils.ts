import type { ApiSuccessResponse, ApiErrorResponse, PublicIdValidation } from './types';

/**
 * Crockford Base32 pattern for 10-character card public IDs.
 * Strictly permits 0-9 and A-Z excluding ambiguous letters I, L, O, U.
 */
export const CROCKFORD_BASE32_REGEX = /^[0-9A-HJKMNP-TV-Z]{10}$/;

/**
 * Validates and normalizes a card public ID before any database lookup.
 * - Bounded input checking
 * - Deterministic, cheap execution
 * - Case-insensitive with whitespace trimming
 * - Zero database state dependencies
 */
export function validatePublicId(raw: unknown): PublicIdValidation {
  if (typeof raw !== 'string') {
    return { isValid: false, error: 'Public ID must be a string' };
  }

  // Bounded length guard to avoid CPU spikes on oversized inputs
  if (raw.length < 10 || raw.length > 30) {
    return { isValid: false, error: 'Invalid identifier length' };
  }

  const normalized = raw.trim().toUpperCase();

  if (normalized.length !== 10) {
    return { isValid: false, error: 'Public ID must be exactly 10 characters' };
  }

  if (!CROCKFORD_BASE32_REGEX.test(normalized)) {
    return { isValid: false, error: 'Public ID contains invalid characters' };
  }

  return { isValid: true, normalizedId: normalized };
}

/**
 * Creates a standard API success response object.
 */
export function createSuccessResponse<T>(data: T): ApiSuccessResponse<T> {
  return {
    success: true,
    data,
  };
}

/**
 * Creates a standard API error response object.
 */
export function createErrorResponse(
  code: string,
  message: string,
  details?: unknown
): ApiErrorResponse {
  return {
    success: false,
    error: {
      code,
      message,
      ...(details !== undefined ? { details } : {}),
    },
  };
}

/**
 * Safe string normalization helper.
 */
export function sanitizeString(val: string): string {
  return val.trim().replace(/[<>]/g, '');
}

/**
 * Standard Crockford Base32 alphabet (32 symbols, excluding I, L, O, U).
 */
export const CROCKFORD_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

/**
 * Generates a cryptographically secure, collision-resistant Crockford Base32 identifier.
 * Uses modulo 32 across 256 byte range (zero modulo bias because 256 = 8 * 32).
 */
export function generateCrockfordPublicId(length = 10): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  let id = '';
  for (let i = 0; i < length; i++) {
    id += CROCKFORD_ALPHABET[(bytes[i] ?? 0) % 32];
  }
  return id;
}

/**
 * Parses and bounds pagination parameters to prevent resource exhaustion.
 */
export function parsePagination(
  rawPage?: string | null,
  rawLimit?: string | null,
  defaultLimit = 20,
  maxLimit = 100
): { page: number; limit: number; offset: number } {
  let page = rawPage ? parseInt(rawPage, 10) : 1;
  let limit = rawLimit ? parseInt(rawLimit, 10) : defaultLimit;

  if (isNaN(page) || page < 1) {
    page = 1;
  }
  if (isNaN(limit) || limit < 1) {
    limit = defaultLimit;
  }
  if (limit > maxLimit) {
    limit = maxLimit;
  }

  const offset = (page - 1) * limit;
  return { page, limit, offset };
}
