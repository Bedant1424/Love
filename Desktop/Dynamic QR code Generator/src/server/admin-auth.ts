import type { Context, MiddlewareHandler } from 'hono';
import type { Env, AppVariables } from './types';
import { createErrorResponse } from '../shared/utils';

/**
 * Validates that a string has standard email syntax.
 */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Extracts and verifies the authenticated administrative identity.
 * Evaluates Cloudflare Access Zero Trust headers exclusively.
 * Never trusts client request bodies for actor identification.
 */
export function extractAdminEmail(
  c: Context<{ Bindings: Env; Variables: AppVariables }>
): string | null {
  // 1. Cloudflare Access Zero Trust Identity Header
  const cfAccessEmail = c.req.header('cf-access-authenticated-user-email')?.trim().toLowerCase();
  if (cfAccessEmail && isValidEmail(cfAccessEmail)) {
    return cfAccessEmail;
  }

  // 2. Non-production development/test bypass header
  if (c.env.ENVIRONMENT !== 'production') {
    const devEmail = c.req.header('x-admin-email')?.trim().toLowerCase();
    if (devEmail && isValidEmail(devEmail)) {
      return devEmail;
    }
  }

  return null;
}

/**
 * Cloudflare Access Administrator Authentication Middleware
 * Enforces zero-trust identity boundary for all /api/admin/* endpoints.
 * Fails closed with HTTP 401 when authentication headers are missing or invalid.
 */
export const adminAuthMiddleware: MiddlewareHandler<{
  Bindings: Env;
  Variables: AppVariables;
}> = async (c, next) => {
  const adminEmail = extractAdminEmail(c);

  if (!adminEmail) {
    return c.json(
      createErrorResponse('UNAUTHORIZED', 'Cloudflare Access authentication required'),
      401
    );
  }

  // Optional allowlist check if configured in environment
  if (c.env.ADMIN_ALLOWED_EMAILS) {
    const allowed = c.env.ADMIN_ALLOWED_EMAILS.split(',').map((e) => e.trim().toLowerCase());
    if (!allowed.includes(adminEmail)) {
      return c.json(
        createErrorResponse('FORBIDDEN', 'Insufficient administrator permissions'),
        403
      );
    }
  }

  c.set('adminEmail', adminEmail);
  await next();
};
