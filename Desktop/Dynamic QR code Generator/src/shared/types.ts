/**
 * Shared Type Definitions for QRoute Platform
 */

/**
 * Standard API Success Envelope
 */
export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

/**
 * Standard API Error Envelope
 */
export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

/**
 * Generic API Response
 */
export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * Health Endpoint Response
 */
export interface HealthResponse {
  status: 'ok';
  timestamp?: string;
  environment?: string;
}
