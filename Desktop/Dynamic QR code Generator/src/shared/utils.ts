import type { ApiSuccessResponse, ApiErrorResponse } from './types';

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
