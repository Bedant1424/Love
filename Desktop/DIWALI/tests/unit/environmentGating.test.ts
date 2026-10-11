import { describe, it, expect } from 'vitest';
import { handleApiRequest, isRestrictedEnvironment } from '../../src/server/api';
import { globalMemoryDb } from '../../src/server/db';

describe('Server-Side Environment Security & Gating Suite', () => {
  const prodEnv = {
    ENVIRONMENT: 'production',
    RESTRICTED_TEST_MODE: 'false',
    PAYMENT_COLLECTION_ENABLED: 'false',
  };

  const restrictedEnv = {
    ENVIRONMENT: 'test',
    RESTRICTED_TEST_MODE: 'true',
    PAYMENT_COLLECTION_ENABLED: 'false',
  };

  it('isRestrictedEnvironment: Production strictly rejects test mode even when client sends X-Restricted-Test-Mode header', () => {
    const reqWithHeader = new Request('https://nagarjuna-traders.pages.dev/api/v1/payment-config', {
      headers: {
        'X-Restricted-Test-Mode': 'true',
      },
    });

    // In production, isRestrictedEnvironment must evaluate to false
    expect(isRestrictedEnvironment(reqWithHeader, prodEnv)).toBe(false);
  });

  it('isRestrictedEnvironment: Only activates when server-side configuration explicitly authorizes it', () => {
    const req = new Request('https://nagarjuna-traders.pages.dev/api/v1/payment-config');

    // Server-side RESTRICTED_TEST_MODE = 'true'
    expect(isRestrictedEnvironment(req, restrictedEnv)).toBe(true);

    // Unconfigured environment on public domain fails closed
    const publicReq = new Request('https://nagarjuna-traders.pages.dev/api/v1/payment-config');
    expect(isRestrictedEnvironment(publicReq, { ENVIRONMENT: 'unrecognized' })).toBe(false);
  });

  it('Production: GET /api/v1/payment-config returns testFixture: undefined, no VPA, no QR payload, and isRestrictedEnv: false', async () => {
    // Client tries headers and query parameters to spoof test mode
    const req = new Request('https://nagarjuna-traders.pages.dev/api/v1/payment-config?test=true&restricted=true', {
      method: 'GET',
      headers: {
        'X-Restricted-Test-Mode': 'true',
        'X-Test-Mode': 'true',
      },
    });

    const res = await handleApiRequest(req, prodEnv);
    expect(res.status).toBe(200);

    const json = (await res.json()) as any;
    expect(json.success).toBe(true);
    expect(json.data.paymentCollectionEnabled).toBe(false);
    expect(json.data.isRestrictedEnv).toBe(false);
    expect(json.data.vpa).toBeUndefined();
    expect(json.data.accountName).toBeUndefined();
    expect(json.data.qrPayload).toBeUndefined();
    expect(json.data.testFixture).toBeUndefined();
    expect(json.data.message).toBe('Payment instructions are currently unavailable.');
    expect(json.data.tokenTiers).toBeDefined();
  });

  it('Production: POST /api/v1/orders/:reference/utr is blocked with 403 PAYMENT_COLLECTION_DISABLED', async () => {
    globalMemoryDb.seed();
    // 1. Create a valid order first in the db
    const order = await globalMemoryDb.createOrder(
      {
        id: 'ord_prod_test_01',
        order_reference: 'NT-PROD-0001',
        customer_name: 'Prod Customer',
        customer_mobile: '9876543210',
        fulfilment_preference: 'STORE_PICKUP',
        operational_status: 'SUBMITTED',
        payment_status: 'UNPAID',
        subtotal_paise: 15000,
        token_amount_paise: 5000,
        remaining_balance_paise: 10000,
        access_token: 'token_prod_123',
        is_simulated_demo: 0,
      },
      [
        {
          product_id: 'prod_sparklers',
          variant_id: 'var_sparklers_9cm_box',
          product_name_snapshot: 'Sparklers 9cm',
          variant_name_snapshot: 'Box of 10',
          unit_price_paise: 15000,
          quantity: 1,
          line_subtotal_paise: 15000,
        },
      ]
    );

    // 2. Attempt to submit UTR in production (even with client test-mode header)
    const req = new Request(`https://nagarjuna-traders.pages.dev/api/v1/orders/${order.order_reference}/utr`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Order-Token': order.access_token,
        'X-Restricted-Test-Mode': 'true',
      },
      body: JSON.stringify({
        utr: '123456789012',
      }),
    });

    const res = await handleApiRequest(req, prodEnv);
    expect(res.status).toBe(403);

    const json = (await res.json()) as any;
    expect(json.success).toBe(false);
    expect(json.error.code).toBe('PAYMENT_COLLECTION_DISABLED');
  });

  it('Production: POST /api/v1/admin/auth/login is blocked with 403 PASSWORD_AUTH_DISABLED', async () => {
    const req = new Request('https://nagarjuna-traders.pages.dev/api/v1/admin/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ passphrase: 'any-password' }),
    });

    const res = await handleApiRequest(req, prodEnv);
    expect(res.status).toBe(403);

    const json = (await res.json()) as any;
    expect(json.success).toBe(false);
    expect(json.error.code).toBe('PASSWORD_AUTH_DISABLED');
  });

  it('Restricted Test Mode: Permits test fixture and UTR submission when server explicitly configured', async () => {
    globalMemoryDb.seed();
    // 1. Config returns test fixture in restricted mode
    const configReq = new Request('https://nagarjuna-traders-test.pages.dev/api/v1/payment-config', {
      method: 'GET',
    });
    const configRes = await handleApiRequest(configReq, restrictedEnv);
    expect(configRes.status).toBe(200);
    const configJson = (await configRes.json()) as any;
    expect(configJson.data.testFixture).toBeDefined();
    expect(configJson.data.testFixture.vpa).toBe('test-fixture@nagarjunatraders');

    // 2. Submit UTR in restricted mode succeeds
    const order = await globalMemoryDb.createOrder(
      {
        id: 'ord_test_env_01',
        order_reference: 'NT-TEST-0001',
        customer_name: 'Test Customer',
        customer_mobile: '9876543210',
        fulfilment_preference: 'STORE_PICKUP',
        operational_status: 'SUBMITTED',
        payment_status: 'UNPAID',
        subtotal_paise: 25000,
        token_amount_paise: 10000,
        remaining_balance_paise: 15000,
        access_token: 'token_test_456',
        is_simulated_demo: 1,
      },
      [
        {
          product_id: 'prod_flowerpots',
          variant_id: 'var_flowerpots_special',
          product_name_snapshot: 'Flower Pots Special',
          variant_name_snapshot: 'Box of 10',
          unit_price_paise: 25000,
          quantity: 1,
          line_subtotal_paise: 25000,
        },
      ]
    );

    const utrReq = new Request(`https://nagarjuna-traders-test.pages.dev/api/v1/orders/${order.order_reference}/utr`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Order-Token': order.access_token,
      },
      body: JSON.stringify({
        utr: '987654321098',
      }),
    });

    const utrRes = await handleApiRequest(utrReq, restrictedEnv);
    expect(utrRes.status).toBe(200);
    const utrJson = (await utrRes.json()) as any;
    expect(utrJson.success).toBe(true);
    expect(utrJson.data.paymentStatus).toBe('RECORDED_UNVERIFIED');
    expect(utrJson.data.paymentReference).toBe('987654321098');
  });

  it('Production: POST /api/v1/orders returns paymentInstructions without test VPA or fixtures', async () => {
    globalMemoryDb.seed();
    const orderReq = new Request('https://nagarjuna-traders.pages.dev/api/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        customer: {
          fullName: 'Campus Customer',
          mobileNumber: '9876543210',
          fulfilmentPreference: 'CAMPUS_PICKUP',
        },
        items: [
          {
            variantId: 'var_bijli_50',
            quantity: 2,
          },
        ],
      }),
    });

    const res = await handleApiRequest(orderReq, prodEnv);
    expect(res.status).toBe(201);
    const json = (await res.json()) as any;
    expect(json.success).toBe(true);
    expect(json.data.paymentInstructions.paymentCollectionEnabled).toBe(false);
    expect(json.data.paymentInstructions.notice).toBe('Payment instructions are currently unavailable.');
    expect(json.data.paymentInstructions.vpa).toBeUndefined();
    expect(json.data.paymentInstructions.accountName).toBeUndefined();
  });
});
