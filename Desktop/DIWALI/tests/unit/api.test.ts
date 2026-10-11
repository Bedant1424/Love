import { describe, it, expect, beforeEach } from 'vitest';
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
    const req = new Request('http://localhost/api/v1/orders', {
      method: 'POST',
      body: JSON.stringify({
        customer: {
          fullName: 'Test Buyer',
          mobileNumber: '9876543210',
          ageConfirmed: true,
        },
        items: [{ variantId: 'var_pandav_5pcs', quantity: 1 }], // Unpriced range item (₹200 to ₹250)
      }),
    });
    const res = await handleApiRequest(req);
    expect(res.status).toBe(400);

    const json = (await res.json()) as any;
    expect(json.success).toBe(false);
    expect(json.error.code).toBe('UNPRICED_ITEM_IN_ORDER');
  });

  it('POST /api/v1/orders enforces minimum subtotal threshold of ₹50', async () => {
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

  it('POST /api/v1/orders applies ₹50 token when subtotal is below ₹200 (e.g. ₹180)', async () => {
    const req = new Request('http://localhost/api/v1/orders', {
      method: 'POST',
      body: JSON.stringify({
        customer: {
          fullName: 'Ramesh Patel',
          mobileNumber: '9876543210',
          ageConfirmed: true,
        },
        items: [{ variantId: 'var_sparklers_9cm_box', quantity: 1 }], // ₹180 subtotal (18,000 paise)
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

  it('POST /api/v1/orders applies ₹100 token when subtotal is at or above ₹200 (e.g. ₹350)', async () => {
    const req = new Request('http://localhost/api/v1/orders', {
      method: 'POST',
      body: JSON.stringify({
        customer: {
          fullName: 'Ramesh Patel',
          mobileNumber: '9876543210',
          ageConfirmed: true,
        },
        items: [{ variantId: 'var_bigboss_3pcs', quantity: 1 }], // ₹350 subtotal (35,000 paise)
      }),
    });
    const res = await handleApiRequest(req);
    expect(res.status).toBe(201);

    const json = (await res.json()) as any;
    expect(json.success).toBe(true);
    expect(json.data.subtotalPaise).toBe(35000);
    expect(json.data.tokenDuePaise).toBe(10000); // ₹100 token tier for >= ₹200
    expect(json.data.balanceDuePaise).toBe(25000); // ₹350 - ₹100 = ₹250
    expect(json.data.paymentInstructions.amountInr).toBe('100.00');
  });

  it('POST /api/v1/orders applies ₹100 token at exact ₹200 boundary', async () => {
    // 2 x Ground Chakri Medium (₹100 each = ₹200 total)
    const req = new Request('http://localhost/api/v1/orders', {
      method: 'POST',
      body: JSON.stringify({
        customer: {
          fullName: 'Boundary Tester',
          mobileNumber: '9876543210',
          ageConfirmed: true,
        },
        items: [{ variantId: 'var_chakri_medium', quantity: 2 }], // 2 * ₹100 = ₹200 (20,000 paise)
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

    // 1. Updating within printed range (₹180 / 18,000 paise) succeeds normally
    const normalReq = new Request(
      `http://localhost/api/v1/admin/variants/${variantId}/demo-price`,
      {
        method: 'POST',
        headers: { Authorization: 'Bearer dev-admin-token' },
        body: JSON.stringify({
          newPricePaise: 18000,
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
});
