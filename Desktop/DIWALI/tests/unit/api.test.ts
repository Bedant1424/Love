import { describe, it, expect, beforeEach } from 'vitest';
import { handleApiRequest } from '../../src/server/api';
import { globalMemoryDb } from '../../src/server/db';
import { TOKEN_AMOUNT_PAISE } from '../../src/types/cart';

describe('Cloudflare Backend API Route Suite (/api/v1)', () => {
  beforeEach(() => {
    // Reset database to initial seed state
    globalMemoryDb.seed();
  });

  it('GET /api/v1/catalogue returns store metadata and 6 categories', async () => {
    const req = new Request('http://localhost/api/v1/catalogue', { method: 'GET' });
    const res = await handleApiRequest(req);
    expect(res.status).toBe(200);

    const json = (await res.json()) as any;
    expect(json.success).toBe(true);
    expect(json.data.store.name).toBe('Nagarjuna Traders');
    expect(json.data.store.fixedTokenAmountPaise).toBe(TOKEN_AMOUNT_PAISE);
    expect(json.data.categories.length).toBe(6);
  });

  it('POST /api/v1/orders validates customer name and phone format', async () => {
    const req = new Request('http://localhost/api/v1/orders', {
      method: 'POST',
      body: JSON.stringify({
        customer: { fullName: '', mobileNumber: '123', ageConfirmed: true },
        items: [{ variantId: 'var_sparklers_9cm_box', quantity: 1 }],
      }),
    });
    const res = await handleApiRequest(req);
    expect(res.status).toBe(400);

    const json = (await res.json()) as any;
    expect(json.success).toBe(false);
    expect(json.error.code).toBe('INVALID_CUSTOMER_NAME');
  });

  it('POST /api/v1/orders blocks orders with unpriced range items', async () => {
    const req = new Request('http://localhost/api/v1/orders', {
      method: 'POST',
      body: JSON.stringify({
        customer: { fullName: 'Test Buyer', mobileNumber: '9876543210', ageConfirmed: true },
        items: [{ variantId: 'var_pandav_5pcs', quantity: 1 }], // Unpriced range item (₹200 to ₹250)
      }),
    });
    const res = await handleApiRequest(req);
    expect(res.status).toBe(400);

    const json = (await res.json()) as any;
    expect(json.success).toBe(false);
    expect(json.error.code).toBe('UNPRICED_ITEM_IN_ORDER');
    expect(json.error.message).toContain('Every item in your box must have a confirmed price');
  });

  it('POST /api/v1/orders enforces minimum subtotal threshold of ₹100', async () => {
    const req = new Request('http://localhost/api/v1/orders', {
      method: 'POST',
      body: JSON.stringify({
        customer: { fullName: 'Test Buyer', mobileNumber: '9876543210', ageConfirmed: true },
        items: [{ variantId: 'var_bijli_60', quantity: 1 }], // ₹60 subtotal < ₹100
      }),
    });
    const res = await handleApiRequest(req);
    expect(res.status).toBe(400);

    const json = (await res.json()) as any;
    expect(json.success).toBe(false);
    expect(json.error.code).toBe('SUBTOTAL_BELOW_MINIMUM');
    expect(json.error.message).toContain('Add items until your subtotal reaches ₹100');
  });

  it('POST /api/v1/orders succeeds with fixed ₹100 token for qualifying subtotal', async () => {
    const req = new Request('http://localhost/api/v1/orders', {
      method: 'POST',
      body: JSON.stringify({
        customer: { fullName: 'Ramesh Patel', mobileNumber: '9876543210', ageConfirmed: true },
        items: [{ variantId: 'var_sparklers_9cm_box', quantity: 1 }], // ₹180 subtotal (18,000 paise)
      }),
    });
    const res = await handleApiRequest(req);
    expect(res.status).toBe(201);

    const json = (await res.json()) as any;
    expect(json.success).toBe(true);
    expect(json.data.orderReference).toMatch(/^DEMO-NT-\d{4}$/);
    expect(json.data.subtotalPaise).toBe(18000);
    expect(json.data.tokenDuePaise).toBe(10000); // Fixed ₹100 token
    expect(json.data.balanceDuePaise).toBe(8000); // ₹80 remaining balance
    expect(json.data.isSimulatedDemo).toBe(true);
  });

  it('POST /api/v1/orders/:reference/payment-reference updates status to PENDING_VERIFICATION', async () => {
    // 1. Create order
    const createReq = new Request('http://localhost/api/v1/orders', {
      method: 'POST',
      body: JSON.stringify({
        customer: { fullName: 'Sita Sharma', mobileNumber: '9876543210', ageConfirmed: true },
        items: [{ variantId: 'var_chakri_medium', quantity: 1 }], // ₹100
      }),
    });
    const createRes = await handleApiRequest(createReq);
    const orderData = (await createRes.json()).data;

    // 2. Submit valid 12-digit UTR
    const utrReq = new Request(
      `http://localhost/api/v1/orders/${orderData.orderReference}/payment-reference`,
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
    expect(utrJson.data.paymentStatus).toBe('PENDING_VERIFICATION');
    expect(utrJson.data.paymentReference).toBe('428901234567');
  });

  it('Admin API: Dashboard KPIs, Order Status Transitions, and Payment Verification', async () => {
    // 1. Create an order and submit UTR
    const createReq = new Request('http://localhost/api/v1/orders', {
      method: 'POST',
      body: JSON.stringify({
        customer: { fullName: 'Kiran Rao', mobileNumber: '9876543210', ageConfirmed: true },
        items: [{ variantId: 'var_bigboss_3pcs', quantity: 1 }], // ₹350
      }),
    });
    const order = (await (await handleApiRequest(createReq)).json()).data;

    await handleApiRequest(
      new Request(`http://localhost/api/v1/orders/${order.orderReference}/payment-reference`, {
        method: 'POST',
        headers: { 'X-Order-Token': order.accessToken },
        body: JSON.stringify({ utr: '123456789012' }),
      })
    );

    // 2. Dashboard KPIs
    const kpiRes = await handleApiRequest(
      new Request('http://localhost/api/v1/admin/dashboard', { method: 'GET' })
    );
    const kpis = (await kpiRes.json()).data;
    expect(kpis.totalDemoOrders).toBeGreaterThanOrEqual(1);
    expect(kpis.pendingPaymentVerificationCount).toBeGreaterThanOrEqual(1);

    // 3. Verify Payment: APPROVE_TOKEN
    const allOrdersRes = await handleApiRequest(
      new Request('http://localhost/api/v1/admin/orders', { method: 'GET' })
    );
    const orderRecord = (await allOrdersRes.json()).data[0];

    const verifyReq = new Request(
      `http://localhost/api/v1/admin/orders/${orderRecord.id}/verify-payment`,
      {
        method: 'POST',
        body: JSON.stringify({ action: 'APPROVE_TOKEN', operatorId: 'OP-TEST' }),
      }
    );
    const verifyRes = await handleApiRequest(verifyReq);
    const verifiedOrder = (await verifyRes.json()).data;
    expect(verifiedOrder.payment_status).toBe('VERIFIED_TOKEN');
    expect(verifiedOrder.operational_status).toBe('CONFIRMED');

    // 4. Status Transition: CONFIRMED -> PREPARING -> READY_FOR_PICKUP
    const statusReq = new Request(
      `http://localhost/api/v1/admin/orders/${orderRecord.id}/status`,
      {
        method: 'POST',
        body: JSON.stringify({ operationalStatus: 'READY_FOR_PICKUP' }),
      }
    );
    const statusRes = await handleApiRequest(statusReq);
    expect((await statusRes.json()).data.operational_status).toBe('READY_FOR_PICKUP');
  });

  it('Admin API: Enforces printed price bounds and records overrides with audit log', async () => {
    // Kumpi Medium printed range is ₹150 to ₹200 (15,000 to 20,000 paise)
    const variantId = 'var_kumpi_medium';

    // 1. Updating within printed range (₹180 / 18,000 paise) succeeds normally
    const normalReq = new Request(
      `http://localhost/api/v1/admin/variants/${variantId}/demo-price`,
      {
        method: 'POST',
        body: JSON.stringify({
          newPricePaise: 18000,
          operatorId: 'OP-NAGARJUNA',
        }),
      }
    );
    const normalRes = await handleApiRequest(normalReq);
    expect(normalRes.status).toBe(200);
    const normalJson = (await normalRes.json()) as any;
    expect(normalJson.data.demoPricePaise).toBe(18000);
    expect(normalJson.data.priceStatus).toBe('CONFIRMED');

    // 2. Updating outside printed range without override flag is rejected
    const outReq = new Request(
      `http://localhost/api/v1/admin/variants/${variantId}/demo-price`,
      {
        method: 'POST',
        body: JSON.stringify({
          newPricePaise: 29000, // ₹290 > ₹200 max
          operatorId: 'OP-NAGARJUNA',
        }),
      }
    );
    const outRes = await handleApiRequest(outReq);
    expect(outRes.status).toBe(400);
    const outJson = (await outRes.json()) as any;
    expect(outJson.error.code).toBe('PRICE_OUTSIDE_PRINTED_RANGE');

    // 3. Updating outside printed range WITH override flag and reason succeeds
    const overrideReq = new Request(
      `http://localhost/api/v1/admin/variants/${variantId}/demo-price`,
      {
        method: 'POST',
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

    // 4. Verify audit log entry
    const auditRes = await handleApiRequest(
      new Request('http://localhost/api/v1/admin/audit-logs', { method: 'GET' })
    );
    const logs = (await auditRes.json()).data;
    const overrideLog = logs.find((l: any) => l.action === 'PRICE_OVERRIDE');
    expect(overrideLog).toBeDefined();
    expect(overrideLog.is_override).toBe(1);
    expect(overrideLog.reason).toContain('special raw material surge');
  });

  it('Admin API: Login validation with passphrase', async () => {
    const badLogin = await handleApiRequest(
      new Request('http://localhost/api/v1/admin/auth/login', {
        method: 'POST',
        body: JSON.stringify({ passphrase: 'wrong' }),
      })
    );
    expect(badLogin.status).toBe(401);

    const goodLogin = await handleApiRequest(
      new Request('http://localhost/api/v1/admin/auth/login', {
        method: 'POST',
        body: JSON.stringify({ passphrase: 'nagarjuna-demo-2026' }),
      })
    );
    expect(goodLogin.status).toBe(200);
    expect((await goodLogin.json()).data.token).toBeDefined();
  });
});
