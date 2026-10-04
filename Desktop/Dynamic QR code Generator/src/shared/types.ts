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

/**
 * Bounded Pagination Parameters
 */
export interface PaginationMetadata {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  totalItems?: number;
}

export interface PaginatedResult<T> {
  items: T[];
  pagination: PaginationMetadata;
}

/**
 * Admin Operational Card Summary
 */
export interface AdminCardSummary {
  id: string;
  publicId: string;
  batchId: string;
  batchName?: string | null;
  status: CardStatus;
  businessName: string | null;
  destinationUrl: string | null;
  codeRotationCounter: number;
  activatedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Admin Audit Log Event
 */
export interface AdminAuditLogEntry {
  id: string;
  cardId: string;
  publicId?: string | null;
  action:
    | 'CARD_CREATED'
    | 'CARD_ACTIVATED'
    | 'DESTINATION_CHANGED'
    | 'CARD_DISABLED'
    | 'CARD_RESTORED'
    | 'CARD_RETIRED'
    | 'CARD_METADATA_UPDATED';
  actorType: 'SYSTEM' | 'PUBLIC' | 'ADMIN';
  actorIdentifier: string;
  actor?: string;
  previousState: string | null;
  newState: string | null;
  metadata: string | null;
  createdAt: string;
}

/**
 * Admin Card Detailed View with Audit History
 */
export interface AdminCardDetail extends AdminCardSummary {
  card?: AdminCardSummary;
  auditLogs: AdminAuditLogEntry[];
}

/**
 * Admin Batch Summary
 */
export interface AdminBatchSummary {
  id: string;
  name: string;
  cardCount: number;
  notes: string | null;
  createdAt: string;
}

/**
 * Admin Dashboard Operational Statistics
 */
export interface AdminDashboardStats {
  totalCards: number;
  activeCards?: number;
  unactivatedCards?: number;
  disabledCards?: number;
  retiredCards?: number;
  cardsByStatus: {
    UNACTIVATED: number;
    ACTIVE: number;
    DISABLED: number;
    RETIRED: number;
  };
  totalBatches: number;
  adminEmail?: string;
}

/**
 * Create Batch Request
 */
export interface CreateBatchRequest {
  name: string;
  cardCount: number;
  notes?: string;
}

/**
 * Generated Card in Provisioning Output (Shown only once for supplier manifest)
 */
export interface ProvisionedCard {
  id: string;
  publicId: string;
  activationCode: string; // Plaintext Crockford Base32 XXXX-XXXX-XXXX
  nfcUrl: string;
}

/**
 * Create Batch Response with One-Time Provisioning Output
 */
export interface CreateBatchResponse {
  batch: AdminBatchSummary;
  cards: ProvisionedCard[];
}

export type { CardEnvironment, CardUrlOptions } from './url';
export type { NfcPayloadInfo } from './nfc';
export type { BatchPackageOptions } from './fulfillment';
export type { QrSheetOptions } from './pdf-sheet';
