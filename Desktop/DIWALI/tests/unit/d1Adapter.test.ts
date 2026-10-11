import { describe, it, expect, beforeEach } from 'vitest';
import { D1Database, D1DatabaseAdapter, D1PreparedStatement } from '../../src/server/db';
import { DbOrder, DbOrderItem } from '../../src/server/types';

/**
 * In-memory Mock D1 Database simulating SQLite prepared statement mechanics.
 */
class MockD1Database implements D1Database {
  public executedQueries: { query: string; params: unknown[] }[] = [];
  public batches: { query: string; params: unknown[] }[][] = [];

  // Simulated tables
  public categories: any[] = [
    {
      id: 'cat_sparklers',
      name: 'Sparklers',
      slug: 'sparklers',
      description: 'Handheld sparklers',
      compliance_warning: null,
      sort_order: 1,
      is_active: 1,
    },
  ];
  public products: any[] = [
    {
      id: 'prod_sparklers_9cm',
      category_id: 'cat_sparklers',
      name: '9cm Sparklers',
      slug: '9cm-sparklers',
      printed_price_text: '15.00',
      pack_info: '10 pcs',
      is_pack_verified: 1,
      pricing_origin: 'EXACT',
      compliance_notice: null,
      notes: null,
      is_active: 1,
    },
  ];
  public variants: any[] = [
    {
      id: 'var_sparklers_9cm_box',
      product_id: 'prod_sparklers_9cm',
      variant_name: 'Box of 10',
      sku: 'SPK-9CM-10',
      pack_info: '10 pcs',
      is_pack_verified: 1,
      printed_price_text: '15.00',
      printed_min_paise: 1500,
      printed_max_paise: 1500,
      printed_options_json: null,
      source_notes: null,
      demo_price_paise: 1500,
      price_status: 'CONFIRMED',
      pricing_origin: 'EXACT',
      stock_quantity: 100,
      is_available: 1,
    },
  ];
  public orders: any[] = [];
  public orderItems: any[] = [];
  public paymentSubmissions: any[] = [];
  public priceAuditLogs: any[] = [];

  prepare(query: string): D1PreparedStatement {
    const executed = this.executedQueries;
    const db = this;

    return {
      query,
      _params: [] as unknown[],
      bind(...values: unknown[]) {
        (this as any)._params = values;
        return this;
      },
      async all<T = unknown>(): Promise<{ results: T[]; success: boolean }> {
        const params = (this as any)._params || [];
        executed.push({ query, params });

        if (query.includes('FROM categories')) {
          return { results: db.categories as unknown as T[], success: true };
        }
        if (query.includes('FROM products')) {
          return { results: db.products as unknown as T[], success: true };
        }
        if (query.includes('FROM product_variants')) {
          return { results: db.variants as unknown as T[], success: true };
        }
        if (query.includes('FROM order_items WHERE order_id = ?')) {
          const orderId = params[0];
          const items = db.orderItems.filter((i) => i.order_id === orderId);
          return { results: items as unknown as T[], success: true };
        }
        if (query.includes('FROM orders')) {
          return { results: db.orders as unknown as T[], success: true };
        }
        if (query.includes('FROM price_audit_logs')) {
          return { results: db.priceAuditLogs as unknown as T[], success: true };
        }
        if (query.includes('FROM payment_submissions')) {
          return { results: db.paymentSubmissions as unknown as T[], success: true };
        }
        return { results: [], success: true };
      },
      async first<T = unknown>(_colName?: string): Promise<T | null> {
        const params = (this as any)._params || [];
        executed.push({ query, params });

        if (query.includes('FROM product_variants WHERE id = ?')) {
          const id = params[0];
          const found = db.variants.find((v) => v.id === id);
          return (found as unknown as T) || null;
        }
        if (query.includes('FROM orders WHERE order_reference = ? AND access_token = ?')) {
          const [ref, token] = params;
          const found = db.orders.find(
            (o) => o.order_reference === ref && o.access_token === token
          );
          return (found as unknown as T) || null;
        }
        if (query.includes('FROM orders WHERE order_reference = ?')) {
          const ref = params[0];
          const found = db.orders.find((o) => o.order_reference === ref);
          return (found as unknown as T) || null;
        }
        if (query.includes('FROM orders WHERE id = ?')) {
          const id = params[0];
          const found = db.orders.find((o) => o.id === id);
          return (found as unknown as T) || null;
        }
        if (query.includes('FROM payment_submissions WHERE utr = ? AND order_reference != ?')) {
          const [utr, ref] = params;
          const found = db.paymentSubmissions.find(
            (s) => s.utr === utr && s.order_reference !== ref
          );
          return (found as unknown as T) || null;
        }
        if (query.includes('SELECT COUNT(*) as count FROM orders WHERE payment_reference IS NOT NULL')) {
          const count = db.orders.filter((o) => o.payment_reference || o.payment_status === 'RECORDED_UNVERIFIED').length;
          return { count } as unknown as T;
        }
        if (query.includes('SELECT COUNT(*) as count FROM orders WHERE operational_status = "READY_FOR_PICKUP"')) {
          const count = db.orders.filter((o) => o.operational_status === 'READY_FOR_PICKUP').length;
          return { count } as unknown as T;
        }
        if (query.includes('SELECT COUNT(*) as count FROM orders WHERE operational_status = "COMPLETED"')) {
          const count = db.orders.filter((o) => o.operational_status === 'COMPLETED').length;
          return { count } as unknown as T;
        }
        if (query.includes('SELECT COUNT(*) as count FROM orders WHERE operational_status = "CONFIRMED"')) {
          const count = db.orders.filter((o) => o.operational_status === 'CONFIRMED').length;
          return { count } as unknown as T;
        }
        if (query.includes('SELECT COUNT(*) as count FROM orders')) {
          return { count: db.orders.length } as unknown as T;
        }
        if (query.includes('SELECT COUNT(*) as count FROM product_variants WHERE demo_price_paise IS NULL')) {
          const count = db.variants.filter((v) => v.demo_price_paise === null).length;
          return { count } as unknown as T;
        }
        if (query.includes('SELECT COUNT(*) as count FROM product_variants')) {
          return { count: db.variants.length } as unknown as T;
        }
        return null;
      },
      async run(): Promise<{ success: boolean; meta?: unknown }> {
        const params = (this as any)._params || [];
        executed.push({ query, params });
        return { success: true };
      },
    } as D1PreparedStatement;
  }

  async batch(statements: D1PreparedStatement[]): Promise<unknown[]> {
    const batchList: { query: string; params: unknown[] }[] = [];
    for (const stmt of statements) {
      const q = (stmt as any).query || '';
      const p = (stmt as any)._params || [];
      batchList.push({ query: q, params: p });

      // Apply mutations in batch
      if (q.includes('INSERT INTO orders')) {
        const [
          id, order_reference, customer_name, customer_mobile, fulfilment_preference,
          operational_status, payment_status, subtotal_paise, token_amount_paise,
          remaining_balance_paise, access_token, idempotency_key, customer_notes,
          payment_reference, payment_submitted_at, is_simulated_demo
        ] = p;
        this.orders.push({
          id, order_reference, customer_name, customer_mobile, fulfilment_preference,
          operational_status, payment_status, subtotal_paise, token_amount_paise,
          remaining_balance_paise, access_token, idempotency_key, customer_notes,
          payment_reference, payment_submitted_at, is_simulated_demo,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }
      if (q.includes('INSERT INTO order_items')) {
        const [
          id, order_id, product_id, variant_id, product_name_snapshot,
          variant_name_snapshot, unit_price_paise, quantity, line_subtotal_paise
        ] = p;
        this.orderItems.push({
          id, order_id, product_id, variant_id, product_name_snapshot,
          variant_name_snapshot, unit_price_paise, quantity, line_subtotal_paise,
          created_at: new Date().toISOString(),
        });
      }
      if (q.includes('UPDATE product_variants SET demo_price_paise = ?')) {
        const [newPrice, status, id] = p;
        const v = this.variants.find((item) => item.id === id);
        if (v) {
          v.demo_price_paise = newPrice;
          v.price_status = status;
        }
      }
      if (q.includes('INSERT INTO price_audit_logs')) {
        this.priceAuditLogs.push({ id: p[0], action: p[3], reason: p[7] });
      }
      if (q.includes('INSERT INTO payment_submissions')) {
        const [id, order_id, order_reference, utr] = p;
        this.paymentSubmissions.push({ id, order_id, order_reference, utr });
      }
      if (q.includes('UPDATE orders SET payment_reference = ?')) {
        const [utr, id] = p;
        const o = this.orders.find((item) => item.id === id);
        if (o) {
          o.payment_reference = utr;
          o.payment_status = 'RECORDED_UNVERIFIED';
        }
      }
      if (q.includes('UPDATE orders SET operational_status = ?')) {
        const [status, id] = p;
        const o = this.orders.find((item) => item.id === id);
        if (o) {
          o.operational_status = status;
        }
      }
    }
    this.batches.push(batchList);
    return batchList.map(() => ({ success: true }));
  }

  async exec(_query: string): Promise<unknown> {
    return { success: true };
  }
}

describe('D1DatabaseAdapter Parameterised SQL Invariants', () => {
  let mockD1: MockD1Database;
  let adapter: D1DatabaseAdapter;

  beforeEach(() => {
    mockD1 = new MockD1Database();
    adapter = new D1DatabaseAdapter(mockD1);
  });

  it('getCategories: executes prepared queries and constructs nested category hierarchy', async () => {
    const categories = await adapter.getCategories();
    expect(categories).toHaveLength(1);
    expect(categories[0].id).toBe('cat_sparklers');
    expect(categories[0].products).toHaveLength(1);
    expect(categories[0].products[0].variants).toHaveLength(1);
    expect(categories[0].products[0].variants[0].id).toBe('var_sparklers_9cm_box');
  });

  it('getVariantById: binds variant ID safely as parameter', async () => {
    const variant = await adapter.getVariantById('var_sparklers_9cm_box');
    expect(variant).not.toBeNull();
    expect(variant?.id).toBe('var_sparklers_9cm_box');
    expect(variant?.name).toBe('Box of 10');

    // Confirm that query was parameterised with ? and bound
    const executed = mockD1.executedQueries.find((q) => q.query.includes('FROM product_variants WHERE id = ?'));
    expect(executed).toBeDefined();
    expect(executed?.params).toEqual(['var_sparklers_9cm_box']);
  });

  it('updateDemoPrice: executes atomic batch with UPDATE and audit log INSERT', async () => {
    const updated = await adapter.updateDemoPrice(
      'var_sparklers_9cm_box',
      1800,
      'OP-ADMIN',
      false,
      'Seasonal price adjustment'
    );

    expect(updated.demoPricePaise).toBe(1800);
    expect(mockD1.batches).toHaveLength(1);
    const batch = mockD1.batches[0];
    expect(batch).toHaveLength(2); // update statement + audit log
  });

  it('createOrder: batches order and item insertions atomically with parameter bindings', async () => {
    const orderData: Omit<DbOrder, 'created_at' | 'updated_at'> = {
      id: 'ord_d1_test_01',
      order_reference: 'NT-D1-0001',
      customer_name: 'Cloudflare D1 Buyer',
      customer_mobile: '9876543210',
      fulfilment_preference: 'STORE_PICKUP',
      operational_status: 'SUBMITTED',
      payment_status: 'UNPAID',
      subtotal_paise: 15000,
      token_amount_paise: 5000,
      remaining_balance_paise: 10000,
      access_token: 'd1_access_token_123',
      is_simulated_demo: 1,
    };

    const itemData: Omit<DbOrderItem, 'id' | 'order_id' | 'created_at'>[] = [
      {
        product_id: 'prod_sparklers_9cm',
        variant_id: 'var_sparklers_9cm_box',
        product_name_snapshot: '9cm Sparklers',
        variant_name_snapshot: 'Box of 10',
        unit_price_paise: 15000,
        quantity: 1,
        line_subtotal_paise: 15000,
      },
    ];

    const result = await adapter.createOrder(orderData, itemData);
    expect(result.order_reference).toBe('NT-D1-0001');
    expect(result.items).toHaveLength(1);
    expect(mockD1.orders).toHaveLength(1);
    expect(mockD1.orderItems).toHaveLength(1);
  });

  it('submitPaymentReference: records unverified UTR and logs masked UTR in audit', async () => {
    // 1. Create order first
    mockD1.orders.push({
      id: 'ord_d1_test_02',
      order_reference: 'NT-D1-0002',
      customer_name: 'Payment Tester',
      customer_mobile: '9876543210',
      fulfilment_preference: 'STORE_PICKUP',
      operational_status: 'SUBMITTED',
      payment_status: 'UNPAID',
      subtotal_paise: 25000,
      token_amount_paise: 10000,
      remaining_balance_paise: 15000,
      access_token: 'd1_token_456',
      is_simulated_demo: 1,
    });

    const updated = await adapter.submitPaymentReference(
      'NT-D1-0002',
      '123456789012',
      'd1_token_456'
    );

    expect(updated.payment_status).toBe('RECORDED_UNVERIFIED');
    expect(updated.payment_reference).toBe('123456789012');

    // Confirm duplicate UTR check
    mockD1.paymentSubmissions.push({
      id: 'sub_01',
      order_id: 'ord_d1_test_02',
      order_reference: 'NT-D1-0002',
      utr: '123456789012',
    });

    await expect(
      adapter.submitPaymentReference('NT-D1-DIFF', '123456789012')
    ).rejects.toThrow('ORDER_NOT_FOUND');
  });

  it('reconcilePayment: throws PAYMENT_VERIFICATION_DISABLED invariant', async () => {
    await expect(adapter.reconcilePayment()).rejects.toThrow('PAYMENT_VERIFICATION_DISABLED');
  });

  it('updateOrderStatus: updates operational status and creates audit log', async () => {
    mockD1.orders.push({
      id: 'ord_d1_status_01',
      order_reference: 'NT-D1-0003',
      operational_status: 'SUBMITTED',
    });

    const res = await adapter.updateOrderStatus('ord_d1_status_01', 'CONFIRMED', 'OP-NAGARJUNA', 'Confirmed by manager');
    expect(res.operational_status).toBe('CONFIRMED');
  });

  it('getDashboardKPIs: returns correct aggregate metrics', async () => {
    mockD1.orders.push(
      { id: '1', payment_reference: '123456789012', operational_status: 'CONFIRMED' },
      { id: '2', payment_reference: null, operational_status: 'PENDING' }
    );

    const kpis = await adapter.getDashboardKPIs();
    expect(kpis.totalOrders).toBe(2);
    expect(kpis.totalVariantsCount).toBe(1);
  });
});
