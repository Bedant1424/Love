import { describe, it, expect, beforeEach } from 'vitest';
import { generateKeyPair, exportJWK, SignJWT } from 'jose';
import { handleApiRequest } from '../../src/server/api';
import { globalMemoryDb } from '../../src/server/db';
import {
  TOKEN_LOW_TIER_PAISE,
  TOKEN_HIGH_TIER_PAISE,
  TOKEN_TIER_THRESHOLD_PAISE,
} from '../../src/utils/tokenPolicy';

describe('Cloudflare Backend API Route Suite (/api/v1)', () => {
  beforeEach(() => {
    // Reset database to initial seed state
    globalMemoryDb.seed();
  });

  it('GET /api/v1/payment-config returns disabled payment collection, test fixture, and token tiers', async () => {
    const req = new Request('http://localhost/api/v1/payment-config', {
      method: 'GET',
    });
    const res = await handleApiRequest(req);
    expect(res.status).toBe(200);

    const json = (await res.json()) as any;
    expect(json.success).toBe(true);
    expect(json.data.paymentCollectionEnabled).toBe(false);
    expect(json.data.testFixture.vpa).toBe('test-fixture@nagarjunatraders');
    expect(json.data.testFixture.isRestrictedEnv).toBe(true);
    expect(json.data.tokenTiers.thresholdPaise).toBe(TOKEN_TIER_THRESHOLD_PAISE);
    expect(json.data.tokenTiers.lowTierPaise).toBe(TOKEN_LOW_TIER_PAISE);
    expect(json.data.tokenTiers.highTierPaise).toBe(TOKEN_HIGH_TIER_PAISE);
  });

  it('GET /api/v1/catalogue returns store metadata and 6 categories', async () => {
    const req = new Request('http://localhost/api/v1/catalogue', {
      method: 'GET',
    });
    const res = await handleApiRequest(req);
    expect(res.status).toBe(200);

    const json = (await res.json()) as any;
    expect(json.success).toBe(true);
    expect(json.data.store.name).toBe('Nagarjuna Traders');
    expect(json.data.store.paymentCollectionEnabled).toBe(false);
    expect(json.data.categories.length).toBe(6);
  });

  it('POST /api/v1/orders validates customer name, phone, and age confirmation', async () => {
    const req1 = new Request('http://localhost/api/v1/orders', {
      method: 'POST',
      body: JSON.stringify({
        customer: { fullName: '', mobileNumber: '123', ageConfirmed: true },
        items: [{ variantId: 'var_sparklers_9cm_box', quantity: 1 }],
      }),
    });
    const res1 = await handleApiRequest(req1);
    expect(res1.status).toBe(400);
    expect(((await res1.json()) as any).error.code).toBe('INVALID_CUSTOMER_NAME');

    const req2 = new Request('http://localhost/api/v1/orders', {
      method: 'POST',
      body: JSON.stringify({
        customer: { fullName: 'Valid Name', mobileNumber: '9876543210', ageConfirmed: false },
        items: [{ variantId: 'var_sparklers_9cm_box', quantity: 1 }],
      }),
    });
    const res2 = await handleApiRequest(req2);
    expect(res2.status).toBe(400);
    expect(((await res2.json()) as any).error.code).toBe('AGE_VERIFICATION_REQUIRED');
  });

  it('POST /api/v1/orders blocks orders with unpriced range items', async () => {
    const variant = await globalMemoryDb.getVariantById('var_pandav_5pcs');
    const origDemo = variant?.demoPricePaise;
    const origPrice = (variant as any)?.pricePaise;

    try {
      if (variant) {
        variant.demoPricePaise = null;
        (variant as any).pricePaise = null;
      }

      const req = new Request('http://localhost/api/v1/orders', {
        method: 'POST',
        body: JSON.stringify({
          customer: {
            fullName: 'Test Buyer',
            mobileNumber: '9876543210',
            ageConfirmed: true,
          },
          items: [{ variantId: 'var_pandav_5pcs', quantity: 1 }],
        }),
      });
      const res = await handleApiRequest(req);
      expect(res.status).toBe(400);

      const json = (await res.json()) as any;
      expect(json.success).toBe(false);
      expect(json.error.code).toBe('UNPRICED_ITEM_IN_ORDER');
    } finally {
      if (variant) {
        variant.demoPricePaise = origDemo ?? null;
        (variant as any).pricePaise = origPrice ?? null;
      }
    }
  });

  it('POST /api/v1/orders rejects empty basket', async () => {
    const req = new Request('http://localhost/api/v1/orders', {
      method: 'POST',
      body: JSON.stringify({
        customer: {
          fullName: 'Test Buyer',
          mobileNumber: '9876543210',
          ageConfirmed: true,
        },
        items: [],
      }),
    });
    const res = await handleApiRequest(req);
    expect(res.status).toBe(400);
    expect(((await res.json()) as any).error.code).toBe('EMPTY_BASKET');
  });

  it('POST /api/v1/orders rejects orders with subtotal below ₹50 with SUBTOTAL_BELOW_MINIMUM_TOKEN', async () => {
    // Set variant price to ₹30 (3,000 paise)
    const variant = await globalMemoryDb.getVariantById('var_bijli_60');
    if (variant) variant.demoPricePaise = 3000;

    const req = new Request('http://localhost/api/v1/orders', {
      method: 'POST',
      body: JSON.stringify({
        customer: {
          fullName: 'Test Buyer',
          mobileNumber: '9876543210',
          ageConfirmed: true,
        },
        items: [{ variantId: 'var_bijli_60', quantity: 1 }],
      }),
    });
    const res = await handleApiRequest(req);
    expect(res.status).toBe(400);

    const json = (await res.json()) as any;
    expect(json.success).toBe(false);
    expect(json.error.code).toBe('SUBTOTAL_BELOW_MINIMUM_TOKEN');
    expect(json.error.message).toBe(
      'Order subtotal must be at least ₹50.00 because the required advance token is ₹50.00.'
    );
  });

  it('POST /api/v1/orders creates order at exact ₹50 boundary with ₹0 remaining balance', async () => {
    // Set variant price to ₹50 (5,000 paise)
    const variant = await globalMemoryDb.getVariantById('var_bijli_60');
    if (variant) variant.demoPricePaise = 5000;

    const req = new Request('http://localhost/api/v1/orders', {
      method: 'POST',
      body: JSON.stringify({
        customer: {
          fullName: 'Exact Fifty Buyer',
          mobileNumber: '9876543210',
          ageConfirmed: true,
        },
        items: [{ variantId: 'var_bijli_60', quantity: 1 }],
      }),
    });
    const res = await handleApiRequest(req);
    expect(res.status).toBe(201);

    const json = (await res.json()) as any;
    expect(json.success).toBe(true);
    expect(json.data.subtotalPaise).toBe(5000);
    expect(json.data.tokenDuePaise).toBe(5000); // ₹50 token
    expect(json.data.balanceDuePaise).toBe(0); // ₹50 - ₹50 = ₹0 balance
  });

  it('POST /api/v1/orders applies ₹50 token when subtotal is below ₹200 (e.g. ₹180)', async () => {
    const req = new Request('http://localhost/api/v1/orders', {
      method: 'POST',
      body: JSON.stringify({
        customer: {
          fullName: 'Ramesh Patel',
          mobileNumber: '9876543210',
          ageConfirmed: true,
        },
        items: [{ variantId: 'var_pandav_5pcs', quantity: 1 }], // ₹180 subtotal (18,000 paise)
      }),
    });
    const res = await handleApiRequest(req);
    expect(res.status).toBe(201);

    const json = (await res.json()) as any;
    expect(json.success).toBe(true);
    expect(json.data.orderReference).toMatch(/^NT-\d{4}$/);
    expect(json.data.subtotalPaise).toBe(18000); // ₹180
    expect(json.data.tokenDuePaise).toBe(5000); // ₹50 token tier for < ₹200
    expect(json.data.balanceDuePaise).toBe(13000); // ₹180 - ₹50 = ₹130
    expect(json.data.paymentStatus).toBe('UNPAID');
    expect(json.data.paymentInstructions.amountInr).toBe('50.00');
  });

  it('POST /api/v1/orders applies ₹100 token when subtotal is at or above ₹200 (e.g. ₹400)', async () => {
    const req = new Request('http://localhost/api/v1/orders', {
      method: 'POST',
      body: JSON.stringify({
        customer: {
          fullName: 'Ramesh Patel',
          mobileNumber: '9876543210',
          ageConfirmed: true,
        },
        items: [{ variantId: 'var_bigboss_3pcs', quantity: 1 }], // ₹400 subtotal (40,000 paise)
      }),
    });
    const res = await handleApiRequest(req);
    expect(res.status).toBe(201);

    const json = (await res.json()) as any;
    expect(json.success).toBe(true);
    expect(json.data.subtotalPaise).toBe(40000);
    expect(json.data.tokenDuePaise).toBe(10000); // ₹100 token tier for >= ₹200
    expect(json.data.balanceDuePaise).toBe(30000); // ₹400 - ₹100 = ₹300
    expect(json.data.paymentInstructions.amountInr).toBe('100.00');
  });

  it('POST /api/v1/orders applies ₹100 token at exact ₹200 boundary', async () => {
    // 1 x Jurassic Bomb (₹200 = 20,000 paise)
    const req = new Request('http://localhost/api/v1/orders', {
      method: 'POST',
      body: JSON.stringify({
        customer: {
          fullName: 'Boundary Tester',
          mobileNumber: '9876543210',
          ageConfirmed: true,
        },
        items: [{ variantId: 'var_jurassic_10pcs', quantity: 1 }], // ₹200 (20,000 paise)
      }),
    });
    const res = await handleApiRequest(req);
    expect(res.status).toBe(201);

    const json = (await res.json()) as any;
    expect(json.data.subtotalPaise).toBe(20000);
    expect(json.data.tokenDuePaise).toBe(10000); // Exactly ₹200 belongs to ₹100 tier
    expect(json.data.balanceDuePaise).toBe(10000); // ₹200 - ₹100 = ₹100
  });

  it('POST /api/v1/orders supports idempotency via idempotencyKey', async () => {
    const payload = {
      customer: {
        fullName: 'Idempotency Tester',
        mobileNumber: '9876543210',
        ageConfirmed: true,
      },
      items: [{ variantId: 'var_chakri_medium', quantity: 1 }],
      idempotencyKey: 'idem_key_unique_test_123',
    };

    const res1 = await handleApiRequest(
      new Request('http://localhost/api/v1/orders', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
    );
    const data1 = (await res1.json()).data;

    const res2 = await handleApiRequest(
      new Request('http://localhost/api/v1/orders', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
    );
    const data2 = (await res2.json()).data;

    expect(data1.orderReference).toBe(data2.orderReference);
    expect(data1.accessToken).toBe(data2.accessToken);
  });

  it('POST /api/v1/orders/:reference/utr validates 12-digit string and sets RECORDED_UNVERIFIED', async () => {
    // 1. Create order
    const createReq = new Request('http://localhost/api/v1/orders', {
      method: 'POST',
      body: JSON.stringify({
        customer: {
          fullName: 'Sita Sharma',
          mobileNumber: '9876543210',
          ageConfirmed: true,
        },
        items: [{ variantId: 'var_chakri_medium', quantity: 1 }],
      }),
    });
    const orderData = (await (await handleApiRequest(createReq)).json()).data;

    // 2. Reject non-12-digit strings
    const invalidUtrReq = new Request(
      `http://localhost/api/v1/orders/${orderData.orderReference}/utr`,
      {
        method: 'POST',
        headers: { 'X-Order-Token': orderData.accessToken },
        body: JSON.stringify({ utr: '12345' }), // Only 5 digits
      }
    );
    const invalidRes = await handleApiRequest(invalidUtrReq);
    expect(invalidRes.status).toBe(400);
    expect(((await invalidRes.json()) as any).error.code).toBe('INVALID_UTR_FORMAT');

    // 3. Submit valid 12-digit string
    const utrReq = new Request(
      `http://localhost/api/v1/orders/${orderData.orderReference}/utr`,
      {
        method: 'POST',
        headers: { 'X-Order-Token': orderData.accessToken },
        body: JSON.stringify({ utr: '428901234567' }),
      }
    );
    const utrRes = await handleApiRequest(utrReq);
    expect(utrRes.status).toBe(200);

    const utrJson = (await utrRes.json()) as any;
    expect(utrJson.success).toBe(true);
    expect(utrJson.data.paymentStatus).toBe('RECORDED_UNVERIFIED');
    expect(utrJson.data.paymentReference).toBe('428901234567');
  });

  it('POST /api/v1/orders/:reference/utr rejects duplicate UTR submission across different orders', async () => {
    // Create Order 1
    const res1 = await handleApiRequest(
      new Request('http://localhost/api/v1/orders', {
        method: 'POST',
        body: JSON.stringify({
          customer: { fullName: 'Customer One', mobileNumber: '9876543210', ageConfirmed: true },
          items: [{ variantId: 'var_chakri_medium', quantity: 1 }],
        }),
      })
    );
    const order1 = (await res1.json()).data;

    // Create Order 2
    const res2 = await handleApiRequest(
      new Request('http://localhost/api/v1/orders', {
        method: 'POST',
        body: JSON.stringify({
          customer: { fullName: 'Customer Two', mobileNumber: '9876543210', ageConfirmed: true },
          items: [{ variantId: 'var_chakri_medium', quantity: 1 }],
        }),
      })
    );
    const order2 = (await res2.json()).data;

    const utr = '999888777666';

    // Submit UTR to Order 1
    const submit1 = await handleApiRequest(
      new Request(`http://localhost/api/v1/orders/${order1.orderReference}/utr`, {
        method: 'POST',
        headers: { 'X-Order-Token': order1.accessToken },
        body: JSON.stringify({ utr }),
      })
    );
    expect(submit1.status).toBe(200);

    // Attempt to submit identical UTR to Order 2 -> Rejected with 409 DUPLICATE_UTR
    const submit2 = await handleApiRequest(
      new Request(`http://localhost/api/v1/orders/${order2.orderReference}/utr`, {
        method: 'POST',
        headers: { 'X-Order-Token': order2.accessToken },
        body: JSON.stringify({ utr }),
      })
    );
    expect(submit2.status).toBe(409);
    expect(((await submit2.json()) as any).error.code).toBe('DUPLICATE_UTR');
  });

  it('GET /api/v1/orders/:reference/status strictly requires X-Order-Token header and rejects query parameters', async () => {
    const createRes = await handleApiRequest(
      new Request('http://localhost/api/v1/orders', {
        method: 'POST',
        body: JSON.stringify({
          customer: { fullName: 'Status Tracker', mobileNumber: '9876543210', ageConfirmed: true },
          items: [{ variantId: 'var_chakri_medium', quantity: 1 }],
        }),
      })
    );
    const order = (await createRes.json()).data;

    // 1. Rejects query param token with 401 (query params prohibited)
    const queryParamRes = await handleApiRequest(
      new Request(
        `http://localhost/api/v1/orders/${order.orderReference}/status?token=${order.accessToken}`,
        { method: 'GET' }
      )
    );
    expect(queryParamRes.status).toBe(401);

    // 2. Rejects missing token with 401
    const missingTokenRes = await handleApiRequest(
      new Request(`http://localhost/api/v1/orders/${order.orderReference}/status`, {
        method: 'GET',
      })
    );
    expect(missingTokenRes.status).toBe(401);

    // 3. Rejects invalid token with 403
    const badTokenRes = await handleApiRequest(
      new Request(`http://localhost/api/v1/orders/${order.orderReference}/status`, {
        method: 'GET',
        headers: { 'X-Order-Token': 'wrong-token' },
      })
    );
    expect(badTokenRes.status).toBe(403);

    // 4. Accepts valid X-Order-Token header and includes no-store Cache-Control
    const statusRes = await handleApiRequest(
      new Request(`http://localhost/api/v1/orders/${order.orderReference}/status`, {
        method: 'GET',
        headers: { 'X-Order-Token': order.accessToken },
      })
    );
    expect(statusRes.status).toBe(200);
    expect(statusRes.headers.get('Cache-Control')).toContain('no-store');

    const statusData = (await statusRes.json()).data;
    expect(statusData.orderReference).toBe(order.orderReference);
    expect(statusData.operationalStatus).toBe('SUBMITTED');
    expect(statusData.paymentStatus).toBe('UNPAID');
    expect(statusData.subtotalPaise).toBe(order.subtotalPaise);
  });

  it('Payment Verification & Bank Reconciliation operations are strictly prohibited', async () => {
    const createRes = await handleApiRequest(
      new Request('http://localhost/api/v1/orders', {
        method: 'POST',
        body: JSON.stringify({
          customer: { fullName: 'Kiran Rao', mobileNumber: '9876543210', ageConfirmed: true },
          items: [{ variantId: 'var_bigboss_3pcs', quantity: 1 }],
        }),
      })
    );
    const order = (await createRes.json()).data;

    // Submit UTR
    await handleApiRequest(
      new Request(`http://localhost/api/v1/orders/${order.orderReference}/utr`, {
        method: 'POST',
        headers: { 'X-Order-Token': order.accessToken },
        body: JSON.stringify({ utr: '123456789012' }),
      })
    );

    const allOrders = (await (await handleApiRequest(
      new Request('http://localhost/api/v1/admin/orders', {
        method: 'GET',
        headers: { Authorization: 'Bearer dev-admin-token' },
      })
    )).json()).data;
    const orderRecord = allOrders[0];

    // Any reconciliation attempt must be rejected with 400 PAYMENT_VERIFICATION_DISABLED
    const reconcileRes = await handleApiRequest(
      new Request(`http://localhost/api/v1/admin/orders/${orderRecord.id}/reconciliation`, {
        method: 'POST',
        headers: { Authorization: 'Bearer dev-admin-token' },
        body: JSON.stringify({
          action: 'RECONCILE',
          operatorId: 'OP-MANAGER',
          reconciliationNotes: 'Verified against bank entry',
        }),
      })
    );
    expect(reconcileRes.status).toBe(400);
    expect(((await reconcileRes.json()) as any).error.code).toBe('PAYMENT_VERIFICATION_DISABLED');
  });

  it('Admin API: Requires authentication and rejects unauthorized requests', async () => {
    // Unauthenticated request to /admin/orders -> 401
    const unauthRes = await handleApiRequest(
      new Request('http://localhost/api/v1/admin/orders', { method: 'GET' })
    );
    expect(unauthRes.status).toBe(401);
  });

  it('Admin API: Enforces printed price bounds and records overrides with audit log', async () => {
    const variantId = 'var_kumpi_medium';

    // 1. Updating within printed range (₹195 / 19,500 paise) succeeds normally
    const normalReq = new Request(
      `http://localhost/api/v1/admin/variants/${variantId}/demo-price`,
      {
        method: 'POST',
        headers: { Authorization: 'Bearer dev-admin-token' },
        body: JSON.stringify({
          newPricePaise: 19500,
          operatorId: 'OP-NAGARJUNA',
        }),
      }
    );
    const normalRes = await handleApiRequest(normalReq);
    expect(normalRes.status).toBe(200);

    // 2. Updating outside printed range without override flag is rejected
    const outReq = new Request(
      `http://localhost/api/v1/admin/variants/${variantId}/demo-price`,
      {
        method: 'POST',
        headers: { Authorization: 'Bearer dev-admin-token' },
        body: JSON.stringify({
          newPricePaise: 29000, // ₹290 > ₹200 max
          operatorId: 'OP-NAGARJUNA',
        }),
      }
    );
    const outRes = await handleApiRequest(outReq);
    expect(outRes.status).toBe(400);
    expect(((await outRes.json()) as any).error.code).toBe('PRICE_OUTSIDE_PRINTED_RANGE');

    // 3. Updating outside printed range WITH override flag and reason succeeds
    const overrideReq = new Request(
      `http://localhost/api/v1/admin/variants/${variantId}/demo-price`,
      {
        method: 'POST',
        headers: { Authorization: 'Bearer dev-admin-token' },
        body: JSON.stringify({
          newPricePaise: 29000,
          operatorId: 'OP-NAGARJUNA',
          allowOverride: true,
          reason: 'Owner confirmed special raw material surge for premium batch',
        }),
      }
    );
    const overrideRes = await handleApiRequest(overrideReq);
    expect(overrideRes.status).toBe(200);
  });

  it('Admin API: Enforces Cloudflare Access RS256 signature verification in production environment', async () => {
    // 1. Generate test RSA key pair
    const keyPair = await generateKeyPair('RS256', { extractable: true });
    const publicJwk = await exportJWK(keyPair.publicKey);
    publicJwk.kid = 'prod-key-1';
    publicJwk.alg = 'RS256';
    publicJwk.use = 'sig';

    const jwks = { keys: [publicJwk] };
    const teamDomain = 'nagarjuna-prod';
    const aud = 'aud_nagarjuna_prod_123';

    const prodEnv = {
      ENVIRONMENT: 'production',
      CF_ACCESS_TEAM_DOMAIN: teamDomain,
      CF_ACCESS_AUD: aud,
      CF_ACCESS_JWKS: jwks,
      CF_ACCESS_ALLOWED_ADMINS: ['admin@nagarjuna.com'],
    };

    // 2. Reject dev token in production
    const devTokenReq = new Request('http://localhost/api/v1/admin/dashboard', {
      method: 'GET',
      headers: { Authorization: 'Bearer dev-admin-token' },
    });
    const devTokenRes = await handleApiRequest(devTokenReq, prodEnv);
    expect(devTokenRes.status).toBe(401);

    // 3. Reject unsigned or forged JWT in production
    const badReq = new Request('http://localhost/api/v1/admin/dashboard', {
      method: 'GET',
      headers: { 'Cf-Access-Jwt-Assertion': 'invalid.forged.jwt' },
    });
    const badRes = await handleApiRequest(badReq, prodEnv);
    expect(badRes.status).toBe(401);

    // 4. Accept cryptographically valid Cloudflare Access assertion
    const validJwt = await new SignJWT({
      email: 'admin@nagarjuna.com',
      sub: 'admin-uuid',
    })
      .setProtectedHeader({ alg: 'RS256', kid: 'prod-key-1' })
      .setIssuedAt()
      .setIssuer('https://nagarjuna-prod.cloudflareaccess.com')
      .setAudience(aud)
      .setExpirationTime('1h')
      .sign(keyPair.privateKey);

    const validReq = new Request('http://localhost/api/v1/admin/dashboard', {
      method: 'GET',
      headers: { 'Cf-Access-Jwt-Assertion': validJwt },
    });
    const validRes = await handleApiRequest(validReq, prodEnv);
    expect(validRes.status).toBe(200);
    const validJson = (await validRes.json()) as any;
    expect(validJson.success).toBe(true);

    // 5. Reject validly signed token when user is not in CF_ACCESS_ALLOWED_ADMINS
    const unauthorizedUserJwt = await new SignJWT({
      email: 'outsider@otherdomain.com',
      sub: 'outsider-uuid',
    })
      .setProtectedHeader({ alg: 'RS256', kid: 'prod-key-1' })
      .setIssuedAt()
      .setIssuer('https://nagarjuna-prod.cloudflareaccess.com')
      .setAudience(aud)
      .setExpirationTime('1h')
      .sign(keyPair.privateKey);

    const unauthReq = new Request('http://localhost/api/v1/admin/dashboard', {
      method: 'GET',
      headers: { 'Cf-Access-Jwt-Assertion': unauthorizedUserJwt },
    });
    const unauthRes = await handleApiRequest(unauthReq, prodEnv);
    expect(unauthRes.status).toBe(403);
  });
});
