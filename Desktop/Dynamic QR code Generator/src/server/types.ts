import type { D1Database, Fetcher } from '@cloudflare/workers-types/2023-07-01';
import type { CardStatus } from '../shared/types';

/**
 * Cloudflare Worker Environment Bindings
 */
export interface Env {
  /** Cloudflare D1 Database binding */
  DB: D1Database;
  /** Cloudflare Workers Static Assets binding */
  ASSETS: Fetcher;
  /** Server secret for HMAC-SHA256 activation code derivation */
  ACTIVATION_SECRET?: string;
  /** Server secret for AES-GCM activation key vault encryption */
  ACTIVATION_ENCRYPTION_KEY?: string;
  /** Server secret for Turnstile validation */
  TURNSTILE_SECRET_KEY?: string;
  /** Environment indicator */
  ENVIRONMENT?: 'development' | 'staging' | 'production';
  /** Optional allowed admin emails list */
  ADMIN_ALLOWED_EMAILS?: string;
}

/**
 * Request-scoped Context Variables
 */
export interface AppVariables {
  adminEmail?: string;
}

/**
 * Minimal D1 database row returned by the redirect indexed lookup.
 * Selects strictly (status, destination_url).
 */
export interface RedirectCardRecord {
  status: CardStatus;
  destination_url: string | null;
}

/**
 * Resolved outcome of the redirect state machine.
 */
export type RedirectResolution =
  | { type: 'ACTIVE'; destinationUrl: string }
  | { type: 'UNACTIVATED'; publicId: string }
  | { type: 'DISABLED' }
  | { type: 'RETIRED' }
  | { type: 'NOT_FOUND' }
  | { type: 'INVALID_ID' }
  | { type: 'SERVER_ERROR' };
