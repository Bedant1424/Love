import type { D1Database, Fetcher } from '@cloudflare/workers-types/2023-07-01';

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
  /** Server secret for Turnstile validation */
  TURNSTILE_SECRET_KEY?: string;
  /** Environment indicator */
  ENVIRONMENT?: 'development' | 'staging' | 'production';
}
