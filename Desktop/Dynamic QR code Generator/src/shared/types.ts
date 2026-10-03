/**
 * Shared Type Definitions for QRoute Platform
 */

/**
 * Canonical lifecycle state of a physical review card.
 */
export type CardStatus = 'UNACTIVATED' | 'ACTIVE' | 'DISABLED' | 'RETIRED';

/**
 * Public ID validation result.
 */
export interface PublicIdValidation {
  isValid: boolean;
  normalizedId?: string;
  error?: string;
}

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

/**
 * Public Card Status Query Result
 */
export interface CardPublicStatusData {
  publicId: string;
  status: CardStatus;
}

/**
 * Public Activation Payload
 */
export interface ActivationRequest {
  publicId: string;
  businessName: string;
  reviewUrl: string;
  activationCode: string;
  turnstileToken?: string;
}

/**
 * Successful Activation Response Data
 */
export interface ActivationResponseData {
  publicId: string;
  status: 'ACTIVE';
  businessName: string;
  destinationUrl: string;
  activatedAt: string;
}

/**
 * Result of Google Review URL Validation
 */
export interface GoogleUrlValidationResult {
  isValid: boolean;
  normalizedUrl?: string;
  error?: string;
}

/**
 * Result of Activation Code Format Validation
 */
export interface ActivationCodeValidationResult {
  isValid: boolean;
  normalizedCode?: string;
  error?: string;
}
