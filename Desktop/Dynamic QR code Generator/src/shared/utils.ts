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
