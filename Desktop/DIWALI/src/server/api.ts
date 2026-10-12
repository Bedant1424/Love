import {
  calculateTokenAmountPaise,
  calculateRemainingBalancePaise,
  TOKEN_TIER_THRESHOLD_PAISE,
  TOKEN_LOW_TIER_PAISE,
  TOKEN_HIGH_TIER_PAISE,
  MIN_ORDER_SUBTOTAL_PAISE,
} from '../utils/tokenPolicy';
import { verifyCloudflareAccessJwt } from './accessJwt';
import { generateSecureToken, hashPassword, verifyPassword } from './authCrypto';
import { getDb } from './db';
import { storeQrImageInR2, getQrImageFromR2 } from './qrStorage';
import {
  ApiResponse,
  CreateOrderRequest,
  CreatePaymentIssueRequest,
  DbOrder,
  DbOrderItem,
  OperationalStatus,
  PaymentConfig,
  PaymentIssueStatus,
  PaymentIssueType,
  SubmitUtrRequest,
  UpdateDemoPriceRequest,
  UpdateOrderStatusRequest,
  UploadQrRequest,
} from './types';

export const PAYMENT_COLLECTION_ENABLED = false;

export const DEFAULT_TOKEN_TIERS = {
  thresholdPaise: TOKEN_TIER_THRESHOLD_PAISE,
  lowTierPaise: TOKEN_LOW_TIER_PAISE,
  highTierPaise: TOKEN_HIGH_TIER_PAISE,
};

/**
 * Checks whether the request is in an authorized restricted testing environment.
 * STRICT SECURITY INVARIANT:
 * - Client-supplied headers (e.g. X-Restricted-Test-Mode) NEVER enable test mode.
 * - Production ALWAYS rejects test mode regardless of any client headers or caller input.
 * - Restricted testing is strictly gated by verified server-side environment configuration.
 * - Fails closed if the environment cannot be safely determined.
 */
export function isRestrictedEnvironment(request: Request, env?: any): boolean {
  // STRICT SECURITY INVARIANT:
  // - Client-supplied headers (e.g. X-Restricted-Test-Mode) NEVER enable test mode.
  // - Client-supplied query parameters (e.g. ?test=true) NEVER enable test mode.
  // - Production ALWAYS rejects test mode regardless of any client headers or caller input.
  // - Restricted testing is strictly gated by verified server-side environment configuration.
  // - Fails closed if the environment cannot be safely determined.

  // 1. Explicit production configuration checks: Production MUST fail closed and NEVER permit test mode.
  const isProduction =
    env?.ENVIRONMENT === 'production' ||
    env?.RESTRICTED_TEST_MODE === 'false' ||
    env?.RESTRICTED_TEST_MODE === false ||
    (!env?.ENVIRONMENT &&
      typeof process !== 'undefined' &&
      process.env?.NODE_ENV === 'production');

  if (isProduction) {
    return false;
  }

  // 2. Production hostnames fail closed (unless running inside unit test runner)
  try {
    const url = new URL(request.url);
    const isTestRunner =
      typeof process !== 'undefined' && process.env?.NODE_ENV === 'test';

    if (!isTestRunner) {
      if (
        url.hostname === 'nagarjuna-traders.pages.dev' ||
        url.hostname.endsWith('.nagarjuna-traders.pages.dev') ||
        url.hostname === 'nagarjuna-traders-owner.pages.dev' ||
        url.hostname.endsWith('.nagarjuna-traders-owner.pages.dev') ||
        url.hostname.includes('nagarjuna-traders') ||
        url.hostname === 'nagarjunatraders.in' ||
        url.hostname.endsWith('.nagarjunatraders.in')
      ) {
        return false;
      }
    }
  } catch {
    // If request URL cannot be safely parsed, fail closed
    return false;
  }

  // 3. Server-side explicit restricted test flag (strictly enabled by server configuration)
  if (
    (env?.RESTRICTED_TEST_MODE === 'true' ||
      env?.RESTRICTED_TEST_MODE === true) &&
    (env?.ENVIRONMENT === 'test' || env?.ENVIRONMENT === 'preview')
  ) {
    return true;
  }

  // 4. Automated test runner execution (Vitest / local test environment without explicit production config)
  if (
    typeof process !== 'undefined' &&
    process.env?.NODE_ENV === 'test' &&
    (!env?.ENVIRONMENT || env?.ENVIRONMENT === 'test')
  ) {
    return true;
  }

  // 5. Local development hostnames (strictly when NOT production)
  try {
    const url = new URL(request.url);
    if (
      (env?.ENVIRONMENT === 'development' || !env?.ENVIRONMENT) &&
      (url.hostname === 'localhost' ||
        url.hostname === '127.0.0.1' ||
        url.hostname === 'test.local')
    ) {
      return true;
    }
  } catch {
    // If request URL cannot be safely parsed, fail closed
    return false;
  }

  // 6. Fail closed for all other unconfirmed or public environments
  return false;
}

/**
 * Decodes and inspects a JWT payload without external libraries.
 */
export function parseJwtPayload(token: string): any | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonStr =
      typeof atob !== 'undefined'
        ? atob(base64)
        : Buffer.from(base64, 'base64').toString('utf8');
    return JSON.parse(jsonStr);
  } catch {
    return null;
  }
}

export interface AdminAuthResult {
  authorized: boolean;
  operatorId: string;
  adminId?: string;
  email?: string;
  mustChangePassword?: boolean;
  csrfToken?: string;
  error?: string;
  status?: number;
}

/**
 * Validates administrative requests.
 * Uses D1-backed session authentication with Secure, HttpOnly cookies and CSRF protection.
 * Replaces Cloudflare Access with single owner account authentication.
 */
export async function verifyAdminRequest(
  request: Request,
  env?: any
): Promise<AdminAuthResult> {
  const url = (() => {
    try {
      return new URL(request.url);
    } catch {
      return null;
    }
  })();

  const isHosted = Boolean(
    (url &&
      (url.hostname.includes('.pages.dev') ||
        url.hostname.includes('workers.dev'))) ||
      env?.IS_HOSTED === 'true' ||
      env?.IS_HOSTED === true ||
      env?.ENVIRONMENT === 'production' ||
      (!env?.ENVIRONMENT &&
        typeof process !== 'undefined' &&
        process.env?.NODE_ENV === 'production')
  );

  const authHeader = request.headers.get('Authorization') || '';
  const bearerToken = authHeader.startsWith('Bearer ')
    ? authHeader.slice(7).trim()
    : null;
  const cookieHeader = request.headers.get('Cookie') || '';
  const cookieMatch = cookieHeader.match(/admin_session=([^;]+)/);
  const cookieSession = cookieMatch ? decodeURIComponent(cookieMatch[1].trim()) : null;

  // STRICT INVARIANT: The compromised token from previous tests is banned everywhere
  if (
    bearerToken === 'admin-jwt-session-nagarjuna' ||
    cookieSession === 'admin-jwt-session-nagarjuna' ||
    request.headers.get('Cf-Access-Jwt-Assertion') === 'admin-jwt-session-nagarjuna'
  ) {
    return {
      authorized: false,
      operatorId: '',
      error: 'Compromised administrative session token is permanently revoked.',
      status: 401,
    };
  }

  // 1. D1-backed session validation (Primary authentication mechanism)
  const sessionToken =
    cookieSession ||
    (bearerToken && !bearerToken.includes('.') ? bearerToken : null);

  const db = getDb(env?.DB);

  if (sessionToken) {
    const sessionRecord = await db.getAdminSession(sessionToken);
    if (!sessionRecord) {
      return {
        authorized: false,
        operatorId: '',
        error: 'Invalid or expired administrative session.',
        status: 401,
      };
    }

    // CSRF protection for mutating HTTP methods
    const method = request.method?.toUpperCase();
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
      const csrfHeader = request.headers.get('X-CSRF-Token');
      if (!csrfHeader || csrfHeader !== sessionRecord.session.csrf_token) {
        return {
          authorized: false,
          operatorId: sessionRecord.user.email,
          error: 'CSRF token validation failed.',
          status: 403,
        };
      }
    }

    // Check mandatory password change status
    const pathname = url?.pathname || '';
    const isExemptPath =
      pathname === '/api/v1/admin/auth/change-password' ||
      pathname === '/api/v1/admin/auth/logout' ||
      pathname === '/api/v1/admin/auth/session' ||
      pathname === '/api/admin/auth/change-password' ||
      pathname === '/api/admin/auth/logout' ||
      pathname === '/api/admin/auth/session';

    if (sessionRecord.user.must_change_password === 1 && !isExemptPath) {
      return {
        authorized: false,
        operatorId: sessionRecord.user.email,
        adminId: sessionRecord.user.id,
        email: sessionRecord.user.email,
        mustChangePassword: true,
        csrfToken: sessionRecord.session.csrf_token,
        error:
          'PASSWORD_CHANGE_REQUIRED: You must change your temporary password before accessing administrative features.',
        status: 403,
      };
    }

    return {
      authorized: true,
      operatorId: sessionRecord.user.email,
      adminId: sessionRecord.user.id,
      email: sessionRecord.user.email,
      mustChangePassword: sessionRecord.user.must_change_password === 1,
      csrfToken: sessionRecord.session.csrf_token,
    };
  }

  // 2. Automated test runner legacy compatibility (vitest / local test mode only, NOT production)
  const isDevOrTest =
    (env?.ENVIRONMENT === 'test' ||
      (typeof process !== 'undefined' && process.env?.NODE_ENV === 'test')) &&
    env?.ENVIRONMENT !== 'production' &&
    !isHosted;

  if (isDevOrTest) {
    if (
      bearerToken === 'dev-admin-token' ||
      bearerToken === 'local-test-token'
    ) {
      return {
        authorized: true,
        operatorId: 'DEV-ADMIN',
      };
    }
  }

  // 3. Cloudflare Access assertion legacy support if JWT provided (for accessJwt unit tests)
  const cfAssertion = request.headers.get('Cf-Access-Jwt-Assertion');
  const jwtToken =
    cfAssertion ||
    (bearerToken && bearerToken.includes('.') ? bearerToken : null);

  if (jwtToken && (env?.CF_ACCESS_AUD || isDevOrTest)) {
    const teamDomain = env?.CF_ACCESS_TEAM_DOMAIN || 'bedant';
    const audience = env?.CF_ACCESS_AUD;
    const allowedAdminsRaw = env?.CF_ACCESS_ALLOWED_ADMINS;
    const allowedAdmins = Array.isArray(allowedAdminsRaw)
      ? allowedAdminsRaw
      : typeof allowedAdminsRaw === 'string'
      ? allowedAdminsRaw.split(',').map((s: string) => s.trim()).filter(Boolean)
      : undefined;

    const jwksUrl = env?.CF_ACCESS_JWKS_URL;
    const jwks = env?.CF_ACCESS_JWKS;

    const result = await verifyCloudflareAccessJwt(jwtToken, {
      teamDomain,
      audience,
      allowedAdmins,
      jwksUrl,
      jwks,
    });

    if (result.valid) {
      return {
        authorized: true,
        operatorId: result.operatorId || 'CF-ACCESS-OPERATOR',
      };
    }
  }

  return {
    authorized: false,
    operatorId: '',
    error: 'Administrator authentication required.',
    status: 401,
  };
}

export async function handleApiRequest(
  request: Request,
  env?: any
): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;
  const db = getDb(env?.DB);
  const isRestricted = isRestrictedEnvironment(request, env);

  const jsonResponse = <T>(
    data: ApiResponse<T>,
    status: number = 200,
    noStore: boolean = false,
    extraHeaders?: Record<string, string>
  ) => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
      'Access-Control-Allow-Headers':
        'Content-Type, Authorization, X-Order-Token, Cf-Access-Jwt-Assertion, X-CSRF-Token',
      ...(extraHeaders || {}),
    };

    if (noStore) {
      headers['Cache-Control'] = 'no-store, no-cache, must-revalidate';
      headers['Pragma'] = 'no-cache';
    }

    return new Response(JSON.stringify(data), {
      status,
      headers,
    });
  };

  if (method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
        'Access-Control-Allow-Headers':
          'Content-Type, Authorization, X-Order-Token, Cf-Access-Jwt-Assertion, X-CSRF-Token',
      },
    });
  }

  try {
    // ── PUBLIC ENDPOINTS ─────────────────────────────────────────────

    const isPaymentEnabled =
      env?.PAYMENT_COLLECTION_ENABLED !== undefined
        ? env.PAYMENT_COLLECTION_ENABLED === 'true' || env.PAYMENT_COLLECTION_ENABLED === true
        : PAYMENT_COLLECTION_ENABLED;

    // GET /api/v1/payment-config
    if (path === '/api/v1/payment-config' && method === 'GET') {
      // In restricted test environment: provide non-payable test fixture
      if (isRestricted) {
        const activeQr = await db.getActiveQrVersion();
        const vpa = activeQr?.vpa || 'test-fixture@nagarjunatraders';
        const accountName =
          activeQr?.account_name || 'NAGARJUNA TRADERS (TEST FIXTURE)';
        return jsonResponse<PaymentConfig>(
          {
            success: true,
            data: {
              paymentCollectionEnabled: false,
              isRestrictedEnv: true,
              vpa,
              accountName,
              message:
                'Payment collection is currently disabled. Test fixture provided for restricted workflow testing only.',
              testFixture: {
                qrPayload: `upi://pay?pa=${vpa}&pn=${encodeURIComponent(
                  accountName
                )}&am=0&tn=TEST%20FIXTURE%20ONLY`,
                vpa,
                accountName,
                isRestrictedEnv: true,
                notice:
                  'Payment collection is currently disabled. Test fixture provided for restricted workflow testing only.',
              },
              tokenTiers: DEFAULT_TOKEN_TIERS,
            },
          },
          200,
          true
        );
      }

      // When payment collection is explicitly disabled in environment,
      // return clean disabled state without exposing test fixtures.
      if (!isPaymentEnabled) {
        return jsonResponse<PaymentConfig>(
          {
            success: true,
            data: {
              paymentCollectionEnabled: false,
              isRestrictedEnv: false,
              message: 'Payment instructions are currently unavailable.',
              tokenTiers: DEFAULT_TOKEN_TIERS,
            },
          },
          200,
          true
        );
      }

      // Live genuine merchant payment configuration
      const vpa = env?.STORE_UPI_VPA || 'jena2005@slc';
      const accountName = env?.STORE_ACCOUNT_HOLDER || 'Mr Subham Jena';
      const qrImageUrl = env?.PAYMENT_QR_IMAGE_URL || '/images/nagarjuna-payment-qr.jpeg';

      return jsonResponse<PaymentConfig>(
        {
          success: true,
          data: {
            paymentCollectionEnabled: true,
            isRestrictedEnv: false,
            vpa,
            accountName,
            qrImageUrl,
            message: 'Scan the UPI QR code using any UPI app to pay the advance token amount.',
            tokenTiers: DEFAULT_TOKEN_TIERS,
          },
        },
        200,
        true
      );
    }

    // POST /api/v1/payment-issues
    if (path === '/api/v1/payment-issues' && method === 'POST') {
      // Reject complaints from arbitrary public visitors when public payment collection is disabled
      if (!isPaymentEnabled && !isRestricted) {
        return jsonResponse(
          {
            success: false,
            error: {
              code: 'PAYMENT_COLLECTION_DISABLED',
              message:
                'Public payment collection is currently disabled. Payment support ticket submission is unavailable.',
            },
          },
          403,
          true
        );
      }

      const body = (await request.json()) as CreatePaymentIssueRequest;

      const validIssueTypes: PaymentIssueType[] = [
        'QR_LIMIT_REACHED',
        'QR_NOT_SCANNING',
        'APP_CANNOT_OPEN',
        'PAYMENT_APP_ERROR',
        'UTR_SUBMISSION_FAILED',
        'OTHER',
      ];

      if (!body.issueType || !validIssueTypes.includes(body.issueType)) {
        return jsonResponse(
          {
            success: false,
            error: {
              code: 'INVALID_ISSUE_TYPE',
              message: 'Valid issue category type is required.',
            },
          },
          400
        );
      }

      if (!body.customerName || body.customerName.trim().length < 2) {
        return jsonResponse(
          {
            success: false,
            error: {
              code: 'INVALID_CUSTOMER_NAME',
              message: 'Customer name is required (minimum 2 characters).',
            },
          },
          400
        );
      }

      const mobileClean = (body.customerMobile || '').replace(/\D/g, '');
      if (!/^[6-9]\d{9}$/.test(mobileClean)) {
        return jsonResponse(
          {
            success: false,
            error: {
              code: 'INVALID_MOBILE_NUMBER',
              message: 'Valid 10-digit Indian mobile number is required.',
            },
          },
          400
        );
      }
      const descLower = (body.description || '').toLowerCase();
      if (
        /\b(mpin|upi pin|atm pin|cvv|cvc|otp|password|passcode)\b/i.test(descLower)
      ) {
        return jsonResponse(
          {
            success: false,
            error: {
              code: 'SENSITIVE_CREDENTIALS_REJECTED',
              message:
                'Never share UPI PINs, ATM PINs, OTPs, CVVs, or bank passwords. Nagarjuna Traders staff will never ask for payment secrets.',
            },
          },
          400
        );
      }

      const issue = await db.createPaymentIssue({
        orderReference: body.orderReference?.trim() || undefined,
        customerName: body.customerName.trim(),
        customerMobile: mobileClean,
        issueType: body.issueType,
        description: body.description?.trim().slice(0, 200),
      });

      return jsonResponse(
        {
          success: true,
          data: {
            issueReference: issue.issue_reference,
            message:
              'Your payment support ticket has been recorded. Store staff will assist during order verification or pickup.',
            status: issue.status,
          },
        },
        201
      );
    }

    // GET /api/v1/catalogue
    if (path === '/api/v1/catalogue' && method === 'GET') {
      const categories = await db.getCategories();
      return jsonResponse({
        success: true,
        data: {
          store: {
            name: 'Nagarjuna Traders',
            location: env?.STORE_LOCATION || 'Campus Pickup / Hostel Pickup',
            checkoutEnabled: true,
            paymentCollectionEnabled: isPaymentEnabled && !isRestricted,
            tokenTiers: DEFAULT_TOKEN_TIERS,
          },
          categories,
        },
      });
    }

    // POST /api/v1/orders
    if (path === '/api/v1/orders' && method === 'POST') {
      const body = (await request.json()) as CreateOrderRequest;

      // 1. Validate customer details
      if (!body.customer?.fullName || body.customer.fullName.trim().length < 2) {
        return jsonResponse(
          {
            success: false,
            error: {
              code: 'INVALID_CUSTOMER_NAME',
              message: 'Full name is required (minimum 2 characters).',
            },
          },
          400
        );
      }

      const mobileClean = (body.customer?.mobileNumber || '').replace(/\D/g, '');
      if (!/^[6-9]\d{9}$/.test(mobileClean)) {
        return jsonResponse(
          {
            success: false,
            error: {
              code: 'INVALID_MOBILE_NUMBER',
              message: 'Valid 10-digit Indian mobile number is required.',
            },
          },
          400
        );
      }

      // 2. Validate items
      if (!body.items || body.items.length === 0) {
        return jsonResponse(
          {
            success: false,
            error: {
              code: 'EMPTY_BASKET',
              message: 'At least one item is required in the order.',
            },
          },
          400
        );
      }

      let subtotalPaise = 0;
      const orderItemsToCreate: Omit<
        DbOrderItem,
        'id' | 'order_id' | 'created_at'
      >[] = [];

      for (const item of body.items) {
        if (!item.quantity || item.quantity <= 0 || item.quantity > 50) {
          return jsonResponse(
            {
              success: false,
              error: {
                code: 'INVALID_ITEM_QUANTITY',
                message: `Quantity for variant ${item.variantId} must be between 1 and 50.`,
              },
            },
            400
          );
        }

        const variant = await db.getVariantById(item.variantId);
        if (!variant) {
          return jsonResponse(
            {
              success: false,
              error: {
                code: 'VARIANT_NOT_FOUND',
                message: `Variant with ID ${item.variantId} was not found in the catalogue.`,
              },
            },
            404
          );
        }

        const pricePaise = variant.demoPricePaise ?? variant.pricePaise;
        if (pricePaise === null || pricePaise === undefined) {
          return jsonResponse(
            {
              success: false,
              error: {
                code: 'UNPRICED_ITEM_IN_ORDER',
                message: `Every item in your order must have a confirmed price. Item "${variant.name}" has an unconfirmed price range.`,
              },
            },
            400
          );
        }

        const lineSubtotalPaise = pricePaise * item.quantity;
        subtotalPaise += lineSubtotalPaise;

        orderItemsToCreate.push({
          product_id: variant.productId || '',
          variant_id: variant.id,
          product_name_snapshot: variant.name,
          variant_name_snapshot: variant.packInfo,
          unit_price_paise: pricePaise,
          quantity: item.quantity,
          line_subtotal_paise: lineSubtotalPaise,
        });
      }

      // 3. Server-side Tiered Token Calculation
      // Subtotal < ₹50: reject because required advance token exceeds subtotal.
      if (subtotalPaise < MIN_ORDER_SUBTOTAL_PAISE) {
        return jsonResponse(
          {
            success: false,
            error: {
              code: 'SUBTOTAL_BELOW_MINIMUM_TOKEN',
              message:
                'Order subtotal must be at least ₹50.00 because the required advance token is ₹50.00.',
            },
          },
          400
        );
      }

      // Below ₹200 -> ₹50. ₹200 or above -> ₹100.
      const tokenDuePaise = calculateTokenAmountPaise(subtotalPaise);
      const balanceDuePaise = calculateRemainingBalancePaise(
        subtotalPaise,
        tokenDuePaise
      );

      const orderId = `order_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const orderRef = `NT-${Math.floor(1000 + Math.random() * 9000)}`;
      const accessToken =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `token_${Date.now()}_${Math.random().toString(36).substring(2, 12)}`;

      const orderRecord: Omit<DbOrder, 'created_at' | 'updated_at'> = {
        id: orderId,
        order_reference: orderRef,
        customer_name: body.customer.fullName.trim(),
        customer_mobile: mobileClean,
        fulfilment_preference:
          body.customer.fulfilmentPreference === 'HOSTEL_PICKUP'
            ? 'SPECIAL_ENQUIRY'
            : 'COUNTER_PICKUP',
        operational_status: 'SUBMITTED',
        payment_status: 'UNPAID',
        subtotal_paise: subtotalPaise,
        token_amount_paise: tokenDuePaise,
        remaining_balance_paise: balanceDuePaise,
        access_token: accessToken,
        idempotency_key: body.idempotencyKey || null,
        customer_notes: body.customer.notes || null,
        payment_reference: null,
        payment_submitted_at: null,
        is_simulated_demo: 0,
      };

      const created = await db.createOrder(orderRecord, orderItemsToCreate);

      return jsonResponse(
        {
          success: true,
          data: {
            orderReference: created.order_reference,
            accessToken: created.access_token,
            operationalStatus: created.operational_status,
            paymentStatus: created.payment_status,
            subtotalPaise: created.subtotal_paise,
            tokenDuePaise: created.token_amount_paise,
            balanceDuePaise: created.remaining_balance_paise,
            paymentInstructions: isPaymentEnabled
              ? {
                  vpa: env?.STORE_UPI_VPA || 'jena2005@slc',
                  accountName: env?.STORE_ACCOUNT_HOLDER || 'Mr Subham Jena',
                  amountInr: (created.token_amount_paise / 100).toFixed(2),
                  transactionNote: created.order_reference,
                  qrImageUrl: env?.PAYMENT_QR_IMAGE_URL || '/images/nagarjuna-payment-qr.jpeg',
                  paymentCollectionEnabled: true,
                  notice:
                    'Scan the UPI QR code using any UPI app to pay the exact advance token amount. After paying, submit your 12-digit UTR.',
                }
              : isRestricted
              ? {
                  vpa: 'test-fixture@nagarjunatraders',
                  accountName: 'NAGARJUNA TRADERS (TEST FIXTURE)',
                  amountInr: (created.token_amount_paise / 100).toFixed(2),
                  transactionNote: created.order_reference,
                  paymentCollectionEnabled: false,
                  notice:
                    'Payment collection is currently disabled. Test fixture provided for restricted workflow testing only.',
                }
              : {
                  paymentCollectionEnabled: false,
                  notice: 'Payment instructions are currently unavailable.',
                },
          },
        },
        201,
        true // no-store on sensitive customer order creation
      );
    }

    // Match GET /api/v1/orders/:reference/status
    const orderStatusMatch = path.match(/^\/api\/v1\/orders\/([^/]+)\/status$/);
    if (orderStatusMatch && method === 'GET') {
      const reference = orderStatusMatch[1];
      // Require X-Order-Token header strictly. Query parameter ?token= is removed for IDOR protection.
      const token = request.headers.get('X-Order-Token');

      if (!token) {
        return jsonResponse(
          {
            success: false,
            error: {
              code: 'MISSING_ORDER_TOKEN',
              message:
                'Order access token must be provided via X-Order-Token header.',
            },
          },
          401,
          true
        );
      }

      try {
        const order = await db.getOrderByReference(reference, token);
        if (!order) {
          return jsonResponse(
            {
              success: false,
              error: {
                code: 'ORDER_NOT_FOUND',
                message: `Order with reference ${reference} was not found.`,
              },
            },
            404,
            true
          );
        }

        return jsonResponse(
          {
            success: true,
            data: {
              orderReference: order.order_reference,
              customerName: order.customer_name,
              operationalStatus: order.operational_status,
              paymentStatus: order.payment_status,
              paymentReference: order.payment_reference,
              paymentSubmittedAt: order.payment_submitted_at,
              subtotalPaise: order.subtotal_paise,
              tokenAmountPaise: order.token_amount_paise,
              remainingBalancePaise: order.remaining_balance_paise,
              createdAt: order.created_at,
              updatedAt: order.updated_at,
            },
          },
          200,
          true // no-store
        );
      } catch (err: any) {
        if (err.message === 'INVALID_ACCESS_TOKEN') {
          return jsonResponse(
            {
              success: false,
              error: {
                code: 'UNAUTHORIZED',
                message: 'Invalid access token for order status query.',
              },
            },
            403,
            true
          );
        }
        throw err;
      }
    }

    // Match GET /api/v1/orders/:reference
    const orderLookupMatch = path.match(/^\/api\/v1\/orders\/([^/]+)$/);
    if (orderLookupMatch && method === 'GET') {
      const reference = orderLookupMatch[1];
      // Require X-Order-Token header strictly. Query parameter ?token= is removed for IDOR protection.
      const token = request.headers.get('X-Order-Token');

      if (!token) {
        return jsonResponse(
          {
            success: false,
            error: {
              code: 'MISSING_ORDER_TOKEN',
              message:
                'Order access token must be provided via X-Order-Token header.',
            },
          },
          401,
          true
        );
      }

      try {
        const order = await db.getOrderByReference(reference, token);
        if (!order) {
          return jsonResponse(
            {
              success: false,
              error: {
                code: 'ORDER_NOT_FOUND',
                message: `Order with reference ${reference} was not found.`,
              },
            },
            404,
            true
          );
        }

        return jsonResponse(
          {
            success: true,
            data: order,
          },
          200,
          true // no-store
        );
      } catch (err: any) {
        if (err.message === 'INVALID_ACCESS_TOKEN') {
          return jsonResponse(
            {
              success: false,
              error: {
                code: 'UNAUTHORIZED',
                message: 'Invalid access token for order lookup.',
              },
            },
            403,
            true
          );
        }
        throw err;
      }
    }

    // Match POST /api/v1/orders/:reference/utr or /payment-reference
    const utrMatch =
      path.match(/^\/api\/v1\/orders\/([^/]+)\/utr$/) ||
      path.match(/^\/api\/v1\/orders\/([^/]+)\/payment-reference$/);

    if (utrMatch && method === 'POST') {
      const reference = utrMatch[1];

      // Gating: When public collection is disabled, block public UTR submission
      if (!isPaymentEnabled && !isRestricted) {
        return jsonResponse(
          {
            success: false,
            error: {
              code: 'PAYMENT_COLLECTION_DISABLED',
              message:
                'Public payment collection and UTR submission are currently disabled.',
            },
          },
          403,
          true
        );
      }

      const token = request.headers.get('X-Order-Token') || undefined;
      const body = (await request.json()) as SubmitUtrRequest;

      // UTR must be a string of exactly 12 numeric digits. Preserve leading zeroes. Never parse as number.
      if (
        typeof body.utr !== 'string' ||
        !/^\d{12}$/.test(body.utr.trim())
      ) {
        return jsonResponse(
          {
            success: false,
            error: {
              code: 'INVALID_UTR_FORMAT',
              message:
                'UTR payment reference must be a string of exactly 12 numeric digits.',
            },
          },
          400,
          true
        );
      }

      const utrString = body.utr.trim();

      try {
        const updated = await db.submitPaymentReference(
          reference,
          utrString,
          token
        );
        return jsonResponse(
          {
            success: true,
            data: {
              orderReference: updated.order_reference,
              paymentReference: updated.payment_reference,
              paymentStatus: updated.payment_status,
              message:
                '12-digit UTR payment reference recorded. Status is recorded as unverified.',
            },
          },
          200,
          true
        );
      } catch (err: any) {
        if (err.message === 'DUPLICATE_UTR') {
          return jsonResponse(
            {
              success: false,
              error: {
                code: 'DUPLICATE_UTR',
                message:
                  'This UTR reference has already been submitted for another order.',
              },
            },
            409,
            true
          );
        }
        if (err.message === 'INVALID_ACCESS_TOKEN') {
          return jsonResponse(
            {
              success: false,
              error: {
                code: 'UNAUTHORIZED',
                message: 'Invalid access token for UTR submission.',
              },
            },
            403,
            true
          );
        }
        if (err.message === 'ORDER_NOT_FOUND') {
          return jsonResponse(
            {
              success: false,
              error: {
                code: 'ORDER_NOT_FOUND',
                message: `Order with reference ${reference} was not found.`,
              },
            },
            404,
            true
          );
        }
        throw err;
      }
    }

    // GET /api/v1/qr-images/:id
    const qrImageMatch = path.match(/^\/api\/v1\/qr-images\/([^/]+)$/);
    if (qrImageMatch && method === 'GET') {
      const versionId = qrImageMatch[1];
      const qrRecord = await db.getQrVersionById(versionId);
      if (!qrRecord) {
        return new Response('QR image not found', { status: 404 });
      }

      const objectKey = qrRecord.r2_object_key || `qr-assets/${versionId}.png`;
      const asset = await getQrImageFromR2(objectKey, env);
      if (!asset) {
        return new Response('QR image asset not found in storage', { status: 404 });
      }

      return new Response(asset.bytes, {
        status: 200,
        headers: {
          'Content-Type': qrRecord.content_type || asset.contentType || 'image/png',
          'X-Content-Type-Options': 'nosniff',
          'Cache-Control': 'private, no-transform, max-age=86400',
          'Content-Security-Policy': "default-src 'none'",
        },
      });
    }

    // ── PROTECTED ADMIN ENDPOINTS ────────────────────────────────────

    // Auth gate for all /api/v1/admin/* and /api/admin/* endpoints
    const adminPath =
      path === '/api/admin'
        ? '/api/v1/admin/dashboard'
        : path.startsWith('/api/admin/')
        ? '/api/v1/admin/' + path.slice('/api/admin/'.length)
        : path;

    if (adminPath.startsWith('/api/v1/admin/')) {
      const isHosted = Boolean(
        (url &&
          (url.hostname.includes('.pages.dev') ||
            url.hostname.includes('workers.dev'))) ||
          env?.IS_HOSTED === 'true' ||
          env?.IS_HOSTED === true ||
          env?.ENVIRONMENT === 'production' ||
          (!env?.ENVIRONMENT &&
            typeof process !== 'undefined' &&
            process.env?.NODE_ENV === 'production')
      );
      const isSecure = isHosted || url.protocol === 'https:';
      const secureFlag = isSecure ? '; Secure' : '';

      // 1. One-time Setup Initializer: POST /api/v1/admin/auth/init
      if (adminPath === '/api/v1/admin/auth/init' && method === 'POST') {
        const count = await db.getAdminUserCount();
        if (count > 0) {
          return jsonResponse(
            {
              success: false,
              error: {
                code: 'SETUP_DISABLED',
                message:
                  'Initial admin setup is permanently disabled. Single admin account already exists.',
              },
            },
            403,
            true
          );
        }

        const body = (await request.json().catch(() => ({}))) as any;
        const email = (body.email || '').trim().toLowerCase();
        const password = body.password || '';

        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          return jsonResponse(
            {
              success: false,
              error: {
                code: 'INVALID_EMAIL',
                message: 'Valid email address is required.',
              },
            },
            400,
            true
          );
        }

        if (!password || typeof password !== 'string' || password.length < 8) {
          return jsonResponse(
            {
              success: false,
              error: {
                code: 'WEAK_PASSWORD',
                message: 'Initial password must be at least 8 characters.',
              },
            },
            400,
            true
          );
        }

        const passwordHash = await hashPassword(password);
        const adminId = 'admin_' + generateSecureToken(8);
        await db.createAdminUser({
          id: adminId,
          email,
          password_hash: passwordHash,
          must_change_password: 1,
        });

        return jsonResponse(
          {
            success: true,
            data: {
              message:
                'Initial administrator created successfully. Setup is permanently disabled.',
              email,
            },
          },
          201,
          true
        );
      }

      // 2. Login Endpoint: POST /api/v1/admin/auth/login
      if (adminPath === '/api/v1/admin/auth/login' && method === 'POST') {
        const body = (await request.json().catch(() => ({}))) as any;
        if (body.passphrase && !body.email) {
          return jsonResponse(
            {
              success: false,
              error: {
                code: 'PASSWORD_AUTH_DISABLED',
                message:
                  'Legacy passphrase authentication is permanently disabled.',
              },
            },
            403,
            true
          );
        }

        const email = (body.email || '').trim().toLowerCase();
        const password = body.password || '';

        if (!email || !password) {
          return jsonResponse(
            {
              success: false,
              error: {
                code: 'INVALID_CREDENTIALS',
                message: 'Email and password are required.',
              },
            },
            400,
            true
          );
        }

        const user = await db.getAdminUserByEmail(email);
        if (!user) {
          return jsonResponse(
            {
              success: false,
              error: {
                code: 'INVALID_CREDENTIALS',
                message: 'Invalid email or password.',
              },
            },
            401,
            true
          );
        }

        const isValid = await verifyPassword(password, user.password_hash);
        if (!isValid) {
          return jsonResponse(
            {
              success: false,
              error: {
                code: 'INVALID_CREDENTIALS',
                message: 'Invalid email or password.',
              },
            },
            401,
            true
          );
        }

        const sessionToken = generateSecureToken(32);
        const csrfToken = generateSecureToken(24);
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

        await db.createAdminSession({
          id: 'sess_' + generateSecureToken(8),
          admin_id: user.id,
          session_token: sessionToken,
          csrf_token: csrfToken,
          expires_at: expiresAt,
        });

        const cookieValue = `admin_session=${sessionToken}; HttpOnly${secureFlag}; SameSite=Lax; Path=/; Max-Age=86400`;

        return jsonResponse(
          {
            success: true,
            data: {
              authenticated: true,
              email: user.email,
              operatorId: user.email,
              mustChangePassword: user.must_change_password === 1,
              csrfToken,
              sessionToken,
            },
          },
          200,
          true,
          { 'Set-Cookie': cookieValue }
        );
      }

      // 3. Logout Endpoint: POST /api/v1/admin/auth/logout
      if (adminPath === '/api/v1/admin/auth/logout' && method === 'POST') {
        const cookieHeader = request.headers.get('Cookie') || '';
        const cookieMatch = cookieHeader.match(/admin_session=([^;]+)/);
        const cookieSession = cookieMatch
          ? decodeURIComponent(cookieMatch[1].trim())
          : null;
        const authHeader = request.headers.get('Authorization') || '';
        const bearerToken = authHeader.startsWith('Bearer ')
          ? authHeader.slice(7).trim()
          : null;
        const tokenToDelete = cookieSession || bearerToken;

        if (tokenToDelete) {
          await db.deleteAdminSession(tokenToDelete);
        }

        const clearCookie = `admin_session=; HttpOnly${secureFlag}; SameSite=Lax; Path=/; Max-Age=0`;

        return jsonResponse(
          {
            success: true,
            data: {
              message: 'Logged out successfully.',
            },
          },
          200,
          true,
          { 'Set-Cookie': clearCookie }
        );
      }

      // 4. Session Validation Endpoint: GET /api/v1/admin/auth/session
      if (
        (adminPath === '/api/v1/admin/auth/session' ||
          adminPath === '/api/v1/admin/auth/status') &&
        method === 'GET'
      ) {
        const auth = await verifyAdminRequest(request, env);
        if (auth.authorized) {
          return jsonResponse(
            {
              success: true,
              data: {
                authenticated: true,
                email: auth.email,
                operatorId: auth.operatorId,
                mustChangePassword: !!auth.mustChangePassword,
                csrfToken: auth.csrfToken,
              },
            },
            200,
            true
          );
        }

        return jsonResponse(
          {
            success: true,
            data: {
              authenticated: false,
              mustChangePassword: auth.mustChangePassword,
              error: auth.error,
            },
          },
          200,
          true
        );
      }

      // 5. Password Change Endpoint: POST /api/v1/admin/auth/change-password
      if (adminPath === '/api/v1/admin/auth/change-password' && method === 'POST') {
        const auth = await verifyAdminRequest(request, env);
        if (!auth.authorized && !auth.mustChangePassword) {
          return jsonResponse(
            {
              success: false,
              error: {
                code: 'UNAUTHORIZED',
                message: auth.error || 'Administrator authorization required.',
              },
            },
            auth.status || 401,
            true
          );
        }

        const body = (await request.json().catch(() => ({}))) as any;
        const currentPassword = body.currentPassword || '';
        const newPassword = body.newPassword || '';

        if (!currentPassword || !newPassword) {
          return jsonResponse(
            {
              success: false,
              error: {
                code: 'INVALID_PAYLOAD',
                message: 'Current password and new password are required.',
              },
            },
            400,
            true
          );
        }

        if (newPassword.length < 8) {
          return jsonResponse(
            {
              success: false,
              error: {
                code: 'WEAK_PASSWORD',
                message: 'New password must be at least 8 characters.',
              },
            },
            400,
            true
          );
        }

        if (currentPassword === newPassword) {
          return jsonResponse(
            {
              success: false,
              error: {
                code: 'SAME_PASSWORD',
                message: 'New password must be different from current password.',
              },
            },
            400,
            true
          );
        }

        const adminUser = auth.adminId
          ? await db.getAdminUserById(auth.adminId)
          : auth.email
          ? await db.getAdminUserByEmail(auth.email)
          : null;

        if (!adminUser) {
          return jsonResponse(
            {
              success: false,
              error: {
                code: 'USER_NOT_FOUND',
                message: 'Admin user not found.',
              },
            },
            404,
            true
          );
        }

        const matches = await verifyPassword(
          currentPassword,
          adminUser.password_hash
        );
        if (!matches) {
          return jsonResponse(
            {
              success: false,
              error: {
                code: 'INVALID_CURRENT_PASSWORD',
                message: 'Current password is incorrect.',
              },
            },
            400,
            true
          );
        }

        const newHash = await hashPassword(newPassword);
        await db.updateAdminPassword(adminUser.id, newHash);

        return jsonResponse(
          {
            success: true,
            data: {
              message:
                'Password updated successfully. Temporary password status cleared.',
            },
          },
          200,
          true
        );
      }

      // Every other admin route requires verified admin authentication
      const auth = await verifyAdminRequest(request, env);
      if (!auth.authorized) {
        return jsonResponse(
          {
            success: false,
            error: {
              code: auth.mustChangePassword
                ? 'PASSWORD_CHANGE_REQUIRED'
                : 'UNAUTHORIZED',
              message: auth.error || 'Administrator authorization required.',
            },
          },
          auth.status || 401,
          true
        );
      }

      // GET /api/v1/admin/dashboard
      if (adminPath === '/api/v1/admin/dashboard' && method === 'GET') {
        const kpis = await db.getDashboardKPIs();
        return jsonResponse(
          {
            success: true,
            data: kpis,
          },
          200,
          true
        );
      }

      // GET /api/v1/admin/orders
      if (adminPath === '/api/v1/admin/orders' && method === 'GET') {
        const opStatus = url.searchParams.get(
          'operationalStatus'
        ) as OperationalStatus | undefined;
        const payStatus = url.searchParams.get('paymentStatus') as any;
        const search = url.searchParams.get('search') || undefined;

        const orders = await db.getOrders({
          operationalStatus: opStatus || undefined,
          paymentStatus: payStatus || undefined,
          search,
        });

        return jsonResponse(
          {
            success: true,
            data: orders,
          },
          200,
          true
        );
      }

      // GET /api/v1/admin/orders/:id
      const adminOrderDetailMatch = adminPath.match(
        /^\/api\/v1\/admin\/orders\/([^/]+)$/
      );
      if (adminOrderDetailMatch && method === 'GET') {
        const orderId = adminOrderDetailMatch[1];
        const order = await db.getOrderById(orderId);
        if (!order) {
          return jsonResponse(
            {
              success: false,
              error: { code: 'ORDER_NOT_FOUND', message: 'Order not found.' },
            },
            404,
            true
          );
        }
        return jsonResponse(
          {
            success: true,
            data: order,
          },
          200,
          true
        );
      }

      // POST /api/v1/admin/orders/:id/status
      const adminStatusMatch = adminPath.match(
        /^\/api\/v1\/admin\/orders\/([^/]+)\/status$/
      );
      if (adminStatusMatch && method === 'POST') {
        const orderId = adminStatusMatch[1];
        const body = (await request.json()) as UpdateOrderStatusRequest;

        try {
          const updated = await db.updateOrderStatus(
            orderId,
            body.operationalStatus,
            auth.operatorId,
            body.notes
          );
          return jsonResponse(
            {
              success: true,
              data: updated,
            },
            200,
            true
          );
        } catch (err: any) {
          return jsonResponse(
            {
              success: false,
              error: {
                code: err.message || 'STATUS_UPDATE_FAILED',
                message: err.message,
              },
            },
            400,
            true
          );
        }
      }

      // Disabled reconciliation/verification endpoint
      const adminReconciliationMatch =
        adminPath.match(/^\/api\/v1\/admin\/orders\/([^/]+)\/reconciliation$/) ||
        adminPath.match(/^\/api\/v1\/admin\/orders\/([^/]+)\/verify-payment$/);
      if (adminReconciliationMatch && method === 'POST') {
        return jsonResponse(
          {
            success: false,
            error: {
              code: 'PAYMENT_VERIFICATION_DISABLED',
              message:
                'Payment verification operations are disabled. Real payment collection and verification are not implemented.',
            },
          },
          400,
          true
        );
      }

      // GET /api/v1/admin/variants
      if (adminPath === '/api/v1/admin/variants' && method === 'GET') {
        const variants = await db.getAllVariants();
        return jsonResponse(
          {
            success: true,
            data: variants,
          },
          200,
          true
        );
      }

      // POST /api/v1/admin/variants/:id/demo-price or /api/v1/admin/variants/:id/price
      const adminPriceMatch = adminPath.match(
        /^\/api\/v1\/admin\/variants\/([^/]+)\/(?:demo-price|price)$/
      );
      if (adminPriceMatch && method === 'POST') {
        const variantId = adminPriceMatch[1];
        const body = (await request.json()) as UpdateDemoPriceRequest;

        if (!body.newPricePaise || body.newPricePaise <= 0) {
          return jsonResponse(
            {
              success: false,
              error: {
                code: 'INVALID_PRICE',
                message: 'Price must be a positive integer in paise.',
              },
            },
            400,
            true
          );
        }

        const variant = await db.getVariantById(variantId);
        if (!variant) {
          return jsonResponse(
            {
              success: false,
              error: { code: 'VARIANT_NOT_FOUND', message: 'Variant not found.' },
            },
            404,
            true
          );
        }

        let isOutsidePrintedRange = false;
        const min = variant.printedMinPaise;
        const max = variant.printedMaxPaise;

        if (min !== null && min !== undefined && body.newPricePaise < min) {
          isOutsidePrintedRange = true;
        }
        if (max !== null && max !== undefined && body.newPricePaise > max) {
          isOutsidePrintedRange = true;
        }

        if (isOutsidePrintedRange && !body.allowOverride) {
          return jsonResponse(
            {
              success: false,
              error: {
                code: 'PRICE_OUTSIDE_PRINTED_RANGE',
                message: `Price (₹${(body.newPricePaise / 100).toFixed(
                  2
                )}) is outside the printed range (${variant.printedPriceText}). To confirm an override, explicit justification is required.`,
                details: {
                  printedText: variant.printedPriceText,
                  minPaise: min,
                  maxPaise: max,
                  submittedPaise: body.newPricePaise,
                },
              },
            },
            400,
            true
          );
        }

        if (isOutsidePrintedRange && body.allowOverride && !body.reason?.trim()) {
          return jsonResponse(
            {
              success: false,
              error: {
                code: 'OVERRIDE_REASON_REQUIRED',
                message:
                  'An audit reason must be supplied when overriding printed range boundaries.',
              },
            },
            400,
            true
          );
        }

        const updated = await db.updateVariantDemoPrice(
          variantId,
          body.newPricePaise,
          auth.operatorId,
          body.reason,
          isOutsidePrintedRange
        );

        return jsonResponse(
          {
            success: true,
            data: updated,
          },
          200,
          true
        );
      }

      // GET /api/v1/admin/audit-logs
      if (adminPath === '/api/v1/admin/audit-logs' && method === 'GET') {
        const logs = await db.getAuditLogs();
        return jsonResponse(
          {
            success: true,
            data: logs,
          },
          200,
          true
        );
      }

      // ── PAYMENT SUPPORT ISSUES ──────────────────────────────────────
      // GET /api/v1/admin/payment-issues
      if (adminPath === '/api/v1/admin/payment-issues' && method === 'GET') {
        const status = url.searchParams.get('status') as PaymentIssueStatus | undefined;
        const issues = await db.getPaymentIssues(status || undefined);
        return jsonResponse({ success: true, data: issues }, 200, true);
      }

      // PATCH /api/v1/admin/payment-issues/:id
      const issuePatchMatch = adminPath.match(/^\/api\/v1\/admin\/payment-issues\/([^/]+)$/);
      if (issuePatchMatch && method === 'PATCH') {
        const issueId = issuePatchMatch[1];
        const body = (await request.json()) as {
          status: PaymentIssueStatus;
          staffNotes?: string;
        };
        const updated = await db.updatePaymentIssue(
          issueId,
          body.status,
          body.staffNotes
        );
        return jsonResponse({ success: true, data: updated }, 200, true);
      }

      // ── INVENTORY MANAGEMENT ────────────────────────────────────────
      // GET /api/v1/admin/inventory
      if (adminPath === '/api/v1/admin/inventory' && method === 'GET') {
        const items = await db.getInventory();
        return jsonResponse({ success: true, data: items }, 200, true);
      }

      // POST /api/v1/admin/inventory/adjust
      if (adminPath === '/api/v1/admin/inventory/adjust' && method === 'POST') {
        const body = (await request.json()) as {
          variantId: string;
          newStock: number;
          operatorId?: string;
          reason?: string;
        };

        if (
          !body.variantId ||
          typeof body.newStock !== 'number' ||
          body.newStock < 0 ||
          body.newStock > 100000
        ) {
          return jsonResponse(
            {
              success: false,
              error: {
                code: 'INVALID_STOCK',
                message:
                  'Valid variantId and newStock (integer between 0 and 100,000) required.',
              },
            },
            400,
            true
          );
        }

        if (!body.reason || !body.reason.trim()) {
          return jsonResponse(
            {
              success: false,
              error: {
                code: 'REASON_REQUIRED',
                message: 'An audit reason is required for manual stock adjustments.',
              },
            },
            400,
            true
          );
        }

        try {
          const updated = await db.adjustStock(
            body.variantId,
            body.newStock,
            body.operatorId || auth.operatorId,
            body.reason.trim()
          );
          return jsonResponse({ success: true, data: updated }, 200, true);
        } catch (err: any) {
          return jsonResponse(
            {
              success: false,
              error: {
                code: 'STOCK_ADJUSTMENT_FAILED',
                message: err.message || 'Failed to adjust stock',
              },
            },
            400,
            true
          );
        }
      }

      // GET /api/v1/admin/inventory/audit-logs
      if (adminPath === '/api/v1/admin/inventory/audit-logs' && method === 'GET') {
        const logs = await db.getInventoryAuditLogs();
        return jsonResponse({ success: true, data: logs }, 200, true);
      }

      // ── QR VERSIONS & ROTATION ──────────────────────────────────────
      // GET /api/v1/admin/qr
      if (adminPath === '/api/v1/admin/qr' && method === 'GET') {
        const versions = await db.getQrVersions();
        return jsonResponse({ success: true, data: versions }, 200, true);
      }

      // POST /api/v1/admin/qr/upload
      if (adminPath === '/api/v1/admin/qr/upload' && method === 'POST') {
        const body = (await request.json().catch(() => ({}))) as UploadQrRequest;
        if (
          !body.label?.trim() ||
          !body.vpa?.includes('@') ||
          !body.accountName?.trim() ||
          !body.imageDataUri
        ) {
          return jsonResponse(
            {
              success: false,
              error: {
                code: 'INVALID_QR_PAYLOAD',
                message:
                  'Label, valid UPI VPA (containing @), account name, and image data are required.',
              },
            },
            400,
            true
          );
        }

        try {
          const tempId = `qr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
          const operator = body.operatorId || auth.operatorId || 'OP-ADMIN';
          const storedAsset = await storeQrImageInR2(
            tempId,
            body.imageDataUri,
            env,
            operator
          );

          const created = await db.uploadQrVersion(
            body.label.trim(),
            body.vpa.trim(),
            body.accountName.trim(),
            storedAsset.url,
            operator,
            {
              id: tempId,
              r2ObjectKey: storedAsset.objectKey,
              contentType: storedAsset.contentType,
              fileSizeBytes: storedAsset.sizeBytes,
              sha256Checksum: storedAsset.sha256Checksum,
            }
          );

          let finalRecord = created;
          if (body.activateNow) {
            finalRecord = await db.activateQrVersion(
              created.id,
              operator,
              'Initial activation upon upload'
            );
          }

          return jsonResponse({ success: true, data: finalRecord }, 201, true);
        } catch (err: any) {
          const msg = err?.message || 'Failed to process QR image upload';
          const isR2Unavailable = msg.includes('QR_BUCKET binding is unavailable');
          const code = isR2Unavailable
            ? 'R2_STORAGE_UNAVAILABLE'
            : msg.includes('exceeds maximum 2MB')
            ? 'FILE_TOO_LARGE'
            : msg.includes('rejected') || msg.includes('signature') || msg.includes('XML') || msg.includes('script')
            ? 'INVALID_IMAGE_TYPE'
            : 'QR_UPLOAD_FAILED';
          const status = isR2Unavailable ? 503 : 400;
          return jsonResponse(
            {
              success: false,
              error: {
                code,
                message: msg,
              },
            },
            status,
            true
          );
        }
      }

      // POST /api/v1/admin/qr/:id/activate
      const qrActivateMatch = adminPath.match(/^\/api\/v1\/admin\/qr\/([^/]+)\/activate$/);
      if (qrActivateMatch && method === 'POST') {
        const qrId = qrActivateMatch[1];
        const body = (await request.json().catch(() => ({}))) as { notes?: string };
        const activated = await db.activateQrVersion(
          qrId,
          auth.operatorId,
          body.notes
        );
        return jsonResponse({ success: true, data: activated }, 200, true);
      }

      // POST /api/v1/admin/qr/:id/deactivate
      const qrDeactivateMatch = adminPath.match(
        /^\/api\/v1\/admin\/qr\/([^/]+)\/deactivate$/
      );
      if (qrDeactivateMatch && method === 'POST') {
        const qrId = qrDeactivateMatch[1];
        const deactivated = await db.deactivateQrVersion(qrId, auth.operatorId);
        return jsonResponse({ success: true, data: deactivated }, 200, true);
      }

      // ── CUSTOMER DIRECTORY ──────────────────────────────────────────
      // GET /api/v1/admin/customers
      if (adminPath === '/api/v1/admin/customers' && method === 'GET') {
        const search = url.searchParams.get('search') || undefined;
        const customers = await db.getCustomers(search);
        return jsonResponse({ success: true, data: customers }, 200, true);
      }

      // GET /api/v1/admin/customers/:id
      const custDetailMatch = adminPath.match(
        /^\/api\/v1\/admin\/customers\/([^/]+)$/
      );
      if (custDetailMatch && method === 'GET') {
        const custId = custDetailMatch[1];
        const details = await db.getCustomerDetails(custId);
        return jsonResponse({ success: true, data: details }, 200, true);
      }

      // ── SALES REPORTS & ANALYTICS ───────────────────────────────────
      // GET /api/v1/admin/reports/sales
      if (adminPath === '/api/v1/admin/reports/sales' && method === 'GET') {
        const range =
          (url.searchParams.get('range') as 'today' | '7d' | '30d' | 'all') ||
          'today';
        const report = await db.getSalesReport(range);
        return jsonResponse({ success: true, data: report }, 200, true);
      }

      // GET /api/v1/admin/reports/export
      if (adminPath === '/api/v1/admin/reports/export' && method === 'GET') {
        const range =
          (url.searchParams.get('range') as 'today' | '7d' | '30d' | 'all') ||
          'today';
        const csv = await db.exportSalesReportCsv(range);
        return new Response(csv, {
          status: 200,
          headers: {
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': `attachment; filename="nagarjuna-sales-${range}-${new Date()
              .toISOString()
              .slice(0, 10)}.csv"`,
            'Cache-Control': 'no-store',
          },
        });
      }
    }

    // 404 Route Not Found
    return jsonResponse(
      {
        success: false,
        error: {
          code: 'ROUTE_NOT_FOUND',
          message: `API route ${method} ${path} not found.`,
        },
      },
      404
    );
  } catch (err: any) {
    return jsonResponse(
      {
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: err?.message || 'An unexpected server error occurred.',
        },
      },
      500
    );
  }
}
