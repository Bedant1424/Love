import type { ApiSuccessResponse, ApiErrorResponse } from './types';
import { generateRandomPublicId } from './public-id';

export {
  PUBLIC_ID_LENGTH,
  CROCKFORD_ALPHABET,
  CROCKFORD_BASE32_REGEX,
  isSequentialNumeric,
  generateRandomPublicId,
  validatePublicId,
} from './public-id';

/**
 * Backward compatibility alias for generateRandomPublicId.
 */
export const generateCrockfordPublicId = generateRandomPublicId;

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
