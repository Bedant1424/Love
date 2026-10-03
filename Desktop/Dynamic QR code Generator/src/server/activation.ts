import type { Context } from 'hono';
import type { Env } from './types';
import type {
  ActivationRequest,
  ActivationResponseData,
  CardPublicStatusData,
  CardStatus,
} from '../shared/types';
import { createErrorResponse, createSuccessResponse, validatePublicId } from '../shared/utils';
import {
  hashActivationCode,
  timingSafeEqualHex,
  validateActivationCodeFormat,
} from '../shared/activation-crypto';
import { validateGoogleReviewUrl } from '../shared/google-url-validator';

interface CardActivationRecord {
  id: string;
  status: CardStatus;
  activation_code_hash: string;
}

/**
 * Validates Cloudflare Turnstile token if secret key is present in environment.
 * In local dev or tests without TURNSTILE_SECRET_KEY, returns true.
 */
async function verifyTurnstileToken(
  token: string | undefined,
  secretKey: string | undefined,
  ip: string
): Promise<boolean> {
  if (!secretKey || secretKey.trim().length === 0) {
    // If Turnstile is not configured (e.g. test harness / dev), permit request
    return true;
  }

  if (!token || token.trim().length === 0) {
    return false;
  }

  try {
    const formData = new FormData();
    formData.append('secret', secretKey);
    formData.append('response', token);
    formData.append('remoteip', ip);

    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      return false;
    }

    const data = (await response.json()) as { success?: boolean };
    return data.success === true;
  } catch {
    return false;
  }
}

/**
 * Sanitizes business name input:
 * - Trims whitespace
 * - Strips `<` and `>` to mitigate stored HTML/XSS injection
 */
function sanitizeBusinessName(name: string): string {
  if (typeof name !== 'string') return '';
  return name.replace(/[<>]/g, '').trim();
}

/**
 * GET /api/public/card/:publicId/status
 * Public, privacy-preserving endpoint to check card activation readiness.
 * Never leaks business name, destination URL, or activation secrets.
 */
export async function handleCardStatusRequest(c: Context<{ Bindings: Env }>) {
  const rawId = c.req.param('publicId');
  const validation = validatePublicId(rawId);

  if (!validation.isValid || !validation.normalizedId) {
    return c.json(createErrorResponse('INVALID_ID', 'Invalid card identifier format'), 400);
  }

  try {
    const card = await c.env.DB.prepare('SELECT status FROM cards WHERE public_id = ?')
      .bind(validation.normalizedId)
      .first<{ status: CardStatus }>();

    if (!card) {
      return c.json(createErrorResponse('NOT_FOUND', 'Card not found'), 404);
    }

    const responseData: CardPublicStatusData = {
      publicId: validation.normalizedId,
      status: card.status,
    };

    return c.json(createSuccessResponse(responseData), 200);
  } catch (error) {
    console.error('[Card Status Error]', error instanceof Error ? error.message : 'Database error');
    return c.json(createErrorResponse('SERVER_ERROR', 'Internal service error'), 500);
  }
}

/**
 * POST /api/public/activate
 * Atomic, cryptographic card activation endpoint.
 */
export async function handleActivationRequest(c: Context<{ Bindings: Env }>) {
  // 1. Ensure body is JSON
  let body: Partial<ActivationRequest>;
  try {
    body = await c.req.json();
  } catch {
    return c.json(createErrorResponse('INVALID_BODY', 'Invalid JSON request body'), 400);
  }

  const { publicId, businessName, reviewUrl, activationCode, turnstileToken } = body;

  // 2. Validate Public ID in memory
  const idValidation = validatePublicId(publicId);
  if (!idValidation.isValid || !idValidation.normalizedId) {
    return c.json(createErrorResponse('INVALID_ID', 'Invalid card identifier format'), 400);
  }
  const normalizedPublicId = idValidation.normalizedId;

  // 3. Validate Business Name (2-100 characters, sanitize XSS)
  if (!businessName || typeof businessName !== 'string') {
    return c.json(createErrorResponse('INVALID_BUSINESS_NAME', 'Business name is required'), 400);
  }
  const cleanBusinessName = sanitizeBusinessName(businessName);
  if (cleanBusinessName.length < 2 || cleanBusinessName.length > 100) {
    return c.json(
      createErrorResponse(
        'INVALID_BUSINESS_NAME',
        'Business name must be between 2 and 100 characters'
      ),
      400
    );
  }

  // 4. Validate Activation Code Format
  if (!activationCode || typeof activationCode !== 'string') {
    return c.json(createErrorResponse('INVALID_CODE', 'Activation code is required'), 400);
  }
  const codeValidation = validateActivationCodeFormat(activationCode);
  if (!codeValidation.isValid || !codeValidation.normalizedCode) {
    return c.json(
      createErrorResponse('INVALID_CODE', codeValidation.error ?? 'Invalid activation code format'),
      400
    );
  }

  // 5. Validate Review Destination URL with Centralized Validator
  if (!reviewUrl || typeof reviewUrl !== 'string') {
    return c.json(createErrorResponse('INVALID_URL', 'Google Review URL is required'), 400);
  }
  const urlValidation = validateGoogleReviewUrl(reviewUrl);
  if (!urlValidation.isValid || !urlValidation.normalizedUrl) {
    return c.json(
      createErrorResponse(
        'INVALID_URL',
        urlValidation.error ?? 'Invalid Google Review destination URL'
      ),
      400
    );
  }

  // 6. Turnstile Bot Defense Verification
  const clientIp =
    c.req.header('cf-connecting-ip') ?? c.req.header('x-forwarded-for') ?? '127.0.0.1';

  const isTurnstileValid = await verifyTurnstileToken(
    turnstileToken,
    c.env.TURNSTILE_SECRET_KEY,
    clientIp
  );
  if (!isTurnstileValid) {
    return c.json(
      createErrorResponse('TURNSTILE_FAILED', 'Security verification challenge failed'),
      403
    );
  }

  // 7. Verify Activation Secret Configuration (Fail Closed)
  const secret = c.env.ACTIVATION_SECRET;
  if (!secret || typeof secret !== 'string' || secret.trim().length === 0) {
    console.error('[Activation] ACTIVATION_SECRET environment variable is missing');
    return c.json(
      createErrorResponse('CONFIGURATION_ERROR', 'Activation service is temporarily unavailable'),
      500
    );
  }

  // 8. Compute HMAC-SHA256 of normalized activation code
  let computedHash: string;
  try {
    computedHash = await hashActivationCode(codeValidation.normalizedCode, secret);
  } catch {
    return c.json(createErrorResponse('INVALID_CODE', 'Invalid activation code'), 400);
  }

  try {
    // 9. Lookup card by public_id using indexed query
    const card = await c.env.DB.prepare(
      'SELECT id, status, activation_code_hash FROM cards WHERE public_id = ?'
    )
      .bind(normalizedPublicId)
      .first<CardActivationRecord>();

    if (!card) {
      return c.json(
        createErrorResponse('ACTIVATION_FAILED', 'Invalid activation code or card ID'),
        400
      );
    }

    // 10. Check that card is currently UNACTIVATED
    if (card.status !== 'UNACTIVATED') {
      return c.json(
        createErrorResponse('CARD_ALREADY_ACTIVE', 'Card is already active or in an invalid state'),
        400
      );
    }

    // 11. Constant-time comparison between computed hash and stored hash
    const isCodeMatch = timingSafeEqualHex(computedHash, card.activation_code_hash);
    if (!isCodeMatch) {
      return c.json(
        createErrorResponse('ACTIVATION_FAILED', 'Invalid activation code or card ID'),
        400
      );
    }

    // 12. Atomic conditional state mutation (UNACTIVATED -> ACTIVE)
    const nowIso = new Date().toISOString();
    const updateResult = await c.env.DB.prepare(
      `UPDATE cards
         SET status = 'ACTIVE',
             business_name = ?,
             destination_url = ?,
             activated_at = ?,
             updated_at = ?
         WHERE public_id = ?
           AND status = 'UNACTIVATED'
           AND activation_code_hash = ?`
    )
      .bind(
        cleanBusinessName,
        urlValidation.normalizedUrl,
        nowIso,
        nowIso,
        normalizedPublicId,
        card.activation_code_hash
      )
      .run();

    // Verify race condition: exactly 1 row must have been mutated
    if (updateResult.meta.changes !== 1) {
      return c.json(
        createErrorResponse(
          'ACTIVATION_FAILED',
          'Card activation failed or card was concurrently activated'
        ),
        409
      );
    }

    // 13. Write immutable audit log entry (CARD_ACTIVATED)
    const auditId = crypto.randomUUID();
    const actorIdentifier = clientIp === '127.0.0.1' ? 'localhost' : 'public_activation';

    await c.env.DB.prepare(
      `INSERT INTO audit_logs (
           id, card_id, action, actor_type, actor_identifier,
           previous_state, new_state, metadata, created_at
         ) VALUES (?, ?, 'CARD_ACTIVATED', 'PUBLIC', ?, ?, ?, ?, ?)`
    )
      .bind(
        auditId,
        card.id,
        actorIdentifier,
        JSON.stringify({ status: 'UNACTIVATED' }),
        JSON.stringify({ status: 'ACTIVE', businessName: cleanBusinessName }),
        JSON.stringify({ userAgent: c.req.header('user-agent') ?? 'unknown' }),
        nowIso
      )
      .run();

    // 14. Return documented success response
    const responseData: ActivationResponseData = {
      publicId: normalizedPublicId,
      status: 'ACTIVE',
      businessName: cleanBusinessName,
      destinationUrl: urlValidation.normalizedUrl,
      activatedAt: nowIso,
    };

    return c.json(createSuccessResponse(responseData), 200);
  } catch (error) {
    console.error('[Activation Error]', error instanceof Error ? error.message : 'Database error');
    return c.json(
      createErrorResponse('SERVER_ERROR', 'Internal service error during activation'),
      500
    );
  }
}
