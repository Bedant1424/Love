import { CATEGORIES, PRODUCTS } from '../data/catalogueData';
import { ProductVariant } from '../types/catalogue';
import {
  AdminDashboardKPIs,
  DbOrder,
  DbOrderItem,
  DemoOrderRecordWithItems,
  OperationalStatus,
  PaymentStatus,
  PaymentSubmission,
  PriceAuditLog,
} from './types';

export interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  all<T = unknown>(): Promise<{ results: T[]; success: boolean }>;
  first<T = unknown>(colName?: string): Promise<T | null>;
  run(): Promise<{ success: boolean; meta?: unknown }>;
}

export interface D1Database {
  prepare(query: string): D1PreparedStatement;
  batch(statements: D1PreparedStatement[]): Promise<unknown[]>;
  exec(query: string): Promise<unknown>;
}

/**
 * In-memory repository fallback for deterministic testing and local dev.
 * Provides transactional state management and parameterised query semantics.
 */
class InMemoryDemoDatabase {
  private categories = [...CATEGORIES];
  private products = [...PRODUCTS];
  private variants: Map<string, ProductVariant> = new Map();
  private orders: Map<string, DbOrder> = new Map();
  private orderItems: Map<string, DbOrderItem[]> = new Map();
  private paymentSubmissions: Map<string, PaymentSubmission> = new Map();
  private auditLogs: PriceAuditLog[] = [];

  constructor() {
    this.seed();
  }

  public seed() {
    this.variants.clear();
    for (const prod of this.products) {
      for (const v of prod.variants) {
        this.variants.set(v.id, { ...v, productId: prod.id });
      }
    }
  }

  public async getCategories() {
    return this.categories.map((cat) => ({
      ...cat,
      products: this.products
        .filter((p) => p.categoryId === cat.id)
        .map((p) => ({
          ...p,
          variants: p.variants.map((v) => this.variants.get(v.id) || v),
        })),
    }));
  }

  public async getAllVariants(): Promise<ProductVariant[]> {
    return Array.from(this.variants.values());
  }

  public async getVariantById(id: string): Promise<ProductVariant | null> {
    return this.variants.get(id) || null;
  }

  public async updateVariantDemoPrice(
    variantId: string,
    newPricePaise: number,
    operatorId: string,
    reason?: string,
    isOverride: boolean = false
  ): Promise<ProductVariant> {
    const variant = this.variants.get(variantId);
    if (!variant) {
      throw new Error(`Variant ${variantId} not found`);
    }

    const oldPrice = variant.demoPricePaise ?? variant.pricePaise;
    const updated: ProductVariant = {
      ...variant,
      demoPricePaise: newPricePaise,
      pricePaise: newPricePaise,
      priceStatus: 'CONFIRMED',
      updatedAt: new Date().toISOString(),
    };
    this.variants.set(variantId, updated);

    for (const p of this.products) {
      p.variants = p.variants.map((v) => (v.id === variantId ? updated : v));
    }

    const log: PriceAuditLog = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      entity_type: 'VARIANT_PRICE',
      entity_id: variantId,
      action: isOverride ? 'PRICE_OVERRIDE' : 'DEMO_PRICE_UPDATE',
      operator_id: operatorId,
      old_value_json: JSON.stringify({ pricePaise: oldPrice }),
      new_value_json: JSON.stringify({ pricePaise: newPricePaise }),
      reason:
        reason ||
        (isOverride
          ? 'Manual override authorized'
          : 'Updated demo price within printed range'),
      is_override: isOverride ? 1 : 0,
      created_at: new Date().toISOString(),
    };
    this.auditLogs.unshift(log);

    return updated;
  }

  /**
   * Transactional atomic order creation.
   * If any item snapshot fails, the entire order is rejected without orphaned state.
   */
  public async createOrder(
    order: Omit<DbOrder, 'created_at' | 'updated_at'>,
    items: Omit<DbOrderItem, 'id' | 'order_id' | 'created_at'>[]
  ): Promise<DemoOrderRecordWithItems> {
    // Idempotency check
    if (order.idempotency_key) {
      const existing = Array.from(this.orders.values()).find(
        (o) => o.idempotency_key === order.idempotency_key
      );
      if (existing) {
        return {
          ...existing,
          items: this.orderItems.get(existing.id) || [],
        };
      }
    }

    const now = new Date().toISOString();
    const fullOrder: DbOrder = {
      ...order,
      created_at: now,
      updated_at: now,
    };

    const fullItems: DbOrderItem[] = items.map((it, idx) => ({
      ...it,
      id: `item_${order.id}_${idx + 1}`,
      order_id: order.id,
      created_at: now,
    }));

    // Transactional write: assign both maps simultaneously
    this.orders.set(order.id, fullOrder);
    this.orderItems.set(order.id, fullItems);

    const log: PriceAuditLog = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      entity_type: 'ORDER_STATUS',
      entity_id: order.id,
      action: 'ORDER_CREATED',
      operator_id: 'SYSTEM',
      old_value_json: null,
      new_value_json: JSON.stringify({
        reference: order.order_reference,
        subtotalPaise: order.subtotal_paise,
        tokenDuePaise: order.token_amount_paise,
      }),
      reason: 'Order created with server-calculated totals',
      is_override: 0,
      created_at: now,
    };
    this.auditLogs.unshift(log);

    return {
      ...fullOrder,
      items: fullItems,
    };
  }

  /**
   * Retrieves order by reference.
   * If accessToken is provided, enforces cryptographic token equivalence to prevent IDOR.
   */
  public async getOrderByReference(
    reference: string,
    accessToken?: string
  ): Promise<DemoOrderRecordWithItems | null> {
    const order = Array.from(this.orders.values()).find(
      (o) => o.order_reference === reference
    );
    if (!order) return null;
    if (accessToken !== undefined && order.access_token !== accessToken) {
      throw new Error('INVALID_ACCESS_TOKEN');
    }
    const items = this.orderItems.get(order.id) || [];
    return { ...order, items };
  }

  public async getOrderById(id: string): Promise<DemoOrderRecordWithItems | null> {
    const order = this.orders.get(id);
    if (!order) return null;
    const items = this.orderItems.get(order.id) || [];
    return { ...order, items };
  }

  public async getOrders(filters?: {
    operationalStatus?: OperationalStatus;
    paymentStatus?: PaymentStatus;
    search?: string;
  }): Promise<DemoOrderRecordWithItems[]> {
    let list = Array.from(this.orders.values());
    if (filters?.operationalStatus) {
      list = list.filter((o) => o.operational_status === filters.operationalStatus);
    }
    if (filters?.paymentStatus) {
      list = list.filter((o) => o.payment_status === filters.paymentStatus);
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(
        (o) =>
          o.order_reference.toLowerCase().includes(q) ||
          o.customer_name.toLowerCase().includes(q) ||
          o.customer_mobile.includes(q) ||
          (o.payment_reference && o.payment_reference.toLowerCase().includes(q))
      );
    }
    list.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return list.map((o) => ({
      ...o,
      items: this.orderItems.get(o.id) || [],
    }));
  }

  /**
   * Transactional UTR recording.
   * Strictly records UTR with status RECORDED_UNVERIFIED without changing payment to paid.
   */
  public async submitPaymentReference(
    reference: string,
    utr: string,
    accessToken?: string
  ): Promise<DemoOrderRecordWithItems> {
    const order = await this.getOrderByReference(reference, accessToken);
    if (!order) throw new Error('ORDER_NOT_FOUND');

    // Duplicate UTR check across all orders
    const existingSubmission = Array.from(this.paymentSubmissions.values()).find(
      (s) => s.utr === utr && s.order_reference !== reference
    );
    if (existingSubmission) {
      throw new Error('DUPLICATE_UTR');
    }

    const now = new Date().toISOString();
    const submissionId = `sub_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const submission: PaymentSubmission = {
      id: submissionId,
      order_id: order.id,
      order_reference: reference,
      utr,
      payment_status: 'RECORDED_UNVERIFIED',
      created_at: now,
    };

    const updatedOrder: DbOrder = {
      ...order,
      payment_reference: utr,
      payment_submitted_at: now,
      payment_status: 'RECORDED_UNVERIFIED',
      updated_at: now,
    };

    // Transactional write
    this.paymentSubmissions.set(submissionId, submission);
    this.orders.set(order.id, updatedOrder);

    this.auditLogs.unshift({
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      entity_type: 'PAYMENT_SUBMISSION',
      entity_id: order.id,
      action: 'UTR_RECORDED_UNVERIFIED',
      operator_id: 'CUSTOMER',
      old_value_json: JSON.stringify({ paymentStatus: order.payment_status }),
      new_value_json: JSON.stringify({
        utrMasked: `******${utr.slice(-4)}`,
        paymentStatus: 'RECORDED_UNVERIFIED',
      }),
      reason:
        'Customer submitted 12-digit UTR; recorded as unverified without claim of funds receipt',
      is_override: 0,
      created_at: now,
    });

    return { ...updatedOrder, items: this.orderItems.get(order.id) || [] };
  }

  /**
   * Explicitly disallows payment verification operations that claim to establish receipt of funds.
   */
  public async reconcilePayment(): Promise<never> {
    throw new Error('PAYMENT_VERIFICATION_DISABLED');
  }

  public async updateOrderStatus(
    orderId: string,
    newStatus: OperationalStatus,
    operatorId: string = 'OP-ADMIN',
    notes?: string
  ): Promise<DemoOrderRecordWithItems> {
    const order = this.orders.get(orderId);
    if (!order) throw new Error('ORDER_NOT_FOUND');

    const updatedOrder: DbOrder = {
      ...order,
      operational_status: newStatus,
      updated_at: new Date().toISOString(),
    };
    this.orders.set(orderId, updatedOrder);

    this.auditLogs.unshift({
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      entity_type: 'ORDER_STATUS',
      entity_id: orderId,
      action: 'STATUS_TRANSITION',
      operator_id: operatorId,
      old_value_json: JSON.stringify({
        operationalStatus: order.operational_status,
      }),
      new_value_json: JSON.stringify({ operationalStatus: newStatus }),
      reason: notes || `Operational status transitioned to ${newStatus}`,
      is_override: 0,
      created_at: new Date().toISOString(),
    });

    return { ...updatedOrder, items: this.orderItems.get(orderId) || [] };
  }

  public async getDashboardKPIs(): Promise<AdminDashboardKPIs> {
    const ordersList = Array.from(this.orders.values());
    const totalOrders = ordersList.length;
    const utrSubmitted = ordersList.filter(
      (o) => Boolean(o.payment_reference) || o.payment_status === 'RECORDED_UNVERIFIED'
    ).length;
    const awaitingUtr = totalOrders - utrSubmitted;
    const readyForPickup = ordersList.filter(
      (o) => o.operational_status === 'READY_FOR_PICKUP'
    ).length;
    const completedOrders = ordersList.filter(
      (o) => o.operational_status === 'COMPLETED'
    ).length;
    const confirmedToday = ordersList.filter(
      (o) => o.operational_status === 'CONFIRMED'
    ).length;

    const allVariants = Array.from(this.variants.values());
    const unresolvedVariants = allVariants.filter(
      (v) => (v.demoPricePaise ?? v.pricePaise) === null
    ).length;

    return {
      totalDemoOrders: totalOrders,
      totalOrders,
      recordedUnverifiedCount: utrSubmitted,
      utrSubmittedCount: utrSubmitted,
      awaitingUtrCount: awaitingUtr,
      pendingPaymentVerificationCount: utrSubmitted,
      ordersReadyForPickupCount: readyForPickup,
      confirmedTodayCount: confirmedToday,
      completedOrdersCount: completedOrders,
      unresolvedVariantsCount: unresolvedVariants,
      totalVariantsCount: allVariants.length,
    };
  }

  public async getAuditLogs(): Promise<PriceAuditLog[]> {
    return [...this.auditLogs];
  }

  public async getPaymentSubmissions(): Promise<PaymentSubmission[]> {
    return Array.from(this.paymentSubmissions.values());
  }
}

/**
 * Cloudflare D1 Database Adapter.
 * Executes fully parameterised queries against distributed D1 SQLite database.
 * Enforces zero SQL injection and atomic batch transaction semantics.
 */
export class D1DatabaseAdapter {
  private d1: D1Database;

  constructor(d1: D1Database) {
    this.d1 = d1;
  }

  public async getCategories() {
    const catStmt = this.d1.prepare(
      'SELECT id, name, slug, description, compliance_warning, sort_order, is_active FROM categories WHERE is_active = 1 ORDER BY sort_order ASC'
    );
    const prodStmt = this.d1.prepare(
      'SELECT id, category_id, name, slug, printed_price_text, pack_info, is_pack_verified, pricing_origin, compliance_notice, notes, is_active FROM products WHERE is_active = 1 ORDER BY id ASC'
    );
    const varStmt = this.d1.prepare(
      'SELECT id, product_id, variant_name, sku, pack_info, is_pack_verified, printed_price_text, printed_min_paise, printed_max_paise, printed_options_json, source_notes, demo_price_paise, price_status, pricing_origin, stock_quantity, is_available FROM product_variants WHERE is_available = 1 ORDER BY id ASC'
    );

    const [catRes, prodRes, varRes] = await Promise.all([
      catStmt.all<any>(),
      prodStmt.all<any>(),
      varStmt.all<any>(),
    ]);

    const variantsByProd = new Map<string, any[]>();
    for (const v of varRes.results || []) {
      const pId = v.product_id;
      if (!variantsByProd.has(pId)) variantsByProd.set(pId, []);
      variantsByProd.get(pId)!.push({
        id: v.id,
        productId: v.product_id,
        sku: v.sku,
        name: v.variant_name,
        packInfo: v.pack_info,
        isPackInfoVerified: Boolean(v.is_pack_verified),
        printedPriceText: v.printed_price_text,
        printedMinPaise: v.printed_min_paise,
        printedMaxPaise: v.printed_max_paise,
        printedOptionsPaise: v.printed_options_json
          ? JSON.parse(v.printed_options_json)
          : undefined,
        demoPricePaise: v.demo_price_paise,
        pricePaise: v.demo_price_paise,
        priceStatus: v.price_status,
        pricingOrigin: v.pricing_origin,
        isAvailable: Boolean(v.is_available),
        sourceNotes: v.source_notes,
      });
    }

    const prodsByCat = new Map<string, any[]>();
    for (const p of prodRes.results || []) {
      const cId = p.category_id;
      if (!prodsByCat.has(cId)) prodsByCat.set(cId, []);
      prodsByCat.get(cId)!.push({
        id: p.id,
        categoryId: p.category_id,
        name: p.name,
        printedPriceText: p.printed_price_text,
        packInfo: p.pack_info,
        isPackInfoVerified: Boolean(p.is_pack_verified),
        pricingOrigin: p.pricing_origin,
        complianceNotice: p.compliance_notice,
        notes: p.notes,
        variants: variantsByProd.get(p.id) || [],
      });
    }

    return (catRes.results || []).map((c: any) => ({
      id: c.id,
      name: c.name,
      description: c.description,
      complianceWarning: c.compliance_warning,
      sortOrder: c.sort_order,
      products: prodsByCat.get(c.id) || [],
    }));
  }

  public async getVariantById(variantId: string): Promise<ProductVariant | null> {
    const stmt = this.d1.prepare(
      'SELECT id, product_id, variant_name, sku, pack_info, is_pack_verified, printed_price_text, printed_min_paise, printed_max_paise, printed_options_json, source_notes, demo_price_paise, price_status, pricing_origin, stock_quantity, is_available FROM product_variants WHERE id = ?'
    ).bind(variantId);

    const row = await stmt.first<any>();
    if (!row) return null;

    return {
      id: row.id,
      productId: row.product_id,
      sku: row.sku,
      name: row.variant_name,
      packInfo: row.pack_info,
      isPackInfoVerified: Boolean(row.is_pack_verified),
      printedPriceText: row.printed_price_text,
      printedMinPaise: row.printed_min_paise,
      printedMaxPaise: row.printed_max_paise,
      printedOptionsPaise: row.printed_options_json
        ? JSON.parse(row.printed_options_json)
        : undefined,
      demoPricePaise: row.demo_price_paise,
      pricePaise: row.demo_price_paise,
      priceStatus: row.price_status,
      pricingOrigin: row.pricing_origin,
      isAvailable: Boolean(row.is_available),
      sourceNotes: row.source_notes,
    };
  }

  public async getAllVariants(): Promise<ProductVariant[]> {
    const stmt = this.d1.prepare(
      'SELECT id, product_id, variant_name, sku, pack_info, is_pack_verified, printed_price_text, printed_min_paise, printed_max_paise, printed_options_json, source_notes, demo_price_paise, price_status, pricing_origin, stock_quantity, is_available FROM product_variants WHERE is_available = 1 ORDER BY id ASC'
    );
    const res = await stmt.all<any>();
    return (res.results || []).map((v) => ({
      id: v.id,
      productId: v.product_id,
      sku: v.sku,
      name: v.variant_name,
      packInfo: v.pack_info,
      isPackInfoVerified: Boolean(v.is_pack_verified),
      printedPriceText: v.printed_price_text,
      printedMinPaise: v.printed_min_paise,
      printedMaxPaise: v.printed_max_paise,
      printedOptionsPaise: v.printed_options_json
        ? JSON.parse(v.printed_options_json)
        : undefined,
      demoPricePaise: v.demo_price_paise,
      pricePaise: v.demo_price_paise,
      priceStatus: v.price_status,
      pricingOrigin: v.pricing_origin,
      isAvailable: Boolean(v.is_available),
      sourceNotes: v.source_notes,
    }));
  }

  public async getOrderById(orderId: string): Promise<DemoOrderRecordWithItems | null> {
    const stmt = this.d1.prepare('SELECT * FROM orders WHERE id = ?').bind(orderId);
    const orderRow = await stmt.first<any>();
    if (!orderRow) return null;

    const itemsStmt = this.d1.prepare('SELECT * FROM order_items WHERE order_id = ?').bind(orderId);
    const itemsRes = await itemsStmt.all<any>();

    return {
      ...orderRow,
      items: itemsRes.results || [],
    };
  }

  public async updateVariantDemoPrice(
    variantId: string,
    newPricePaise: number,
    operatorId: string,
    reason?: string,
    isOverride: boolean = false
  ): Promise<ProductVariant> {
    return this.updateDemoPrice(variantId, newPricePaise, operatorId, isOverride, reason);
  }

  public async updateDemoPrice(
    variantId: string,
    newPricePaise: number,
    operatorId: string,
    isOverride: boolean = false,
    reason?: string
  ): Promise<ProductVariant> {
    const existing = await this.getVariantById(variantId);
    if (!existing) throw new Error(`Variant ${variantId} not found`);

    const oldPrice = existing.demoPricePaise ?? existing.pricePaise;
    const auditId = `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const action = isOverride ? 'PRICE_OVERRIDE' : 'DEMO_PRICE_UPDATE';
    const auditReason =
      reason ||
      (isOverride
        ? 'Manual override authorized'
        : 'Updated demo price within printed range');

    const updateStmt = this.d1.prepare(
      'UPDATE product_variants SET demo_price_paise = ?, price_status = ?, updated_at = datetime("now") WHERE id = ?'
    ).bind(newPricePaise, 'CONFIRMED', variantId);

    const auditStmt = this.d1.prepare(
      'INSERT INTO price_audit_logs (id, entity_type, entity_id, action, operator_id, old_value_json, new_value_json, reason, is_override, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime("now"))'
    ).bind(
      auditId,
      'VARIANT_PRICE',
      variantId,
      action,
      operatorId,
      JSON.stringify({ pricePaise: oldPrice }),
      JSON.stringify({ pricePaise: newPricePaise }),
      auditReason,
      isOverride ? 1 : 0
    );

    await this.d1.batch([updateStmt, auditStmt]);

    return {
      ...existing,
      demoPricePaise: newPricePaise,
      pricePaise: newPricePaise,
      priceStatus: 'CONFIRMED',
    };
  }

  public async createOrder(
    order: Omit<DbOrder, 'created_at' | 'updated_at'>,
    items: Omit<DbOrderItem, 'id' | 'order_id' | 'created_at'>[]
  ): Promise<DemoOrderRecordWithItems> {
    if (order.idempotency_key) {
      const checkStmt = this.d1.prepare(
        'SELECT * FROM orders WHERE idempotency_key = ?'
      ).bind(order.idempotency_key);
      const existing = await checkStmt.first<any>();
      if (existing) {
        const itemStmt = this.d1.prepare(
          'SELECT * FROM order_items WHERE order_id = ?'
        ).bind(existing.id);
        const itemRes = await itemStmt.all<any>();
        return {
          ...existing,
          items: itemRes.results || [],
        };
      }
    }

    const orderStmt = this.d1.prepare(
      `INSERT INTO orders (
        id, order_reference, customer_name, customer_mobile, fulfilment_preference,
        operational_status, payment_status, subtotal_paise, token_amount_paise,
        remaining_balance_paise, access_token, idempotency_key, customer_notes,
        payment_reference, payment_submitted_at, is_simulated_demo, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime("now"), datetime("now"))`
    ).bind(
      order.id,
      order.order_reference,
      order.customer_name,
      order.customer_mobile,
      order.fulfilment_preference,
      order.operational_status,
      order.payment_status,
      order.subtotal_paise,
      order.token_amount_paise,
      order.remaining_balance_paise,
      order.access_token,
      order.idempotency_key || null,
      order.customer_notes || null,
      order.payment_reference || null,
      order.payment_submitted_at || null,
      order.is_simulated_demo
    );

    const itemStmts = items.map((it, idx) => {
      const itemId = `item_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`;
      return this.d1.prepare(
        `INSERT INTO order_items (
          id, order_id, product_id, variant_id, product_name_snapshot,
          variant_name_snapshot, unit_price_paise, quantity, line_subtotal_paise, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime("now"))`
      ).bind(
        itemId,
        order.id,
        it.product_id,
        it.variant_id,
        it.product_name_snapshot,
        it.variant_name_snapshot,
        it.unit_price_paise,
        it.quantity,
        it.line_subtotal_paise
      );
    });

    await this.d1.batch([orderStmt, ...itemStmts]);

    const createdItems: DbOrderItem[] = items.map((it, idx) => ({
      ...it,
      id: `item_${order.id}_${idx}`,
      order_id: order.id,
      created_at: new Date().toISOString(),
    }));

    return {
      ...order,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      items: createdItems,
    };
  }

  public async getOrderByReference(
    reference: string,
    accessToken?: string
  ): Promise<DemoOrderRecordWithItems | null> {
    let stmt: D1PreparedStatement;
    if (accessToken) {
      stmt = this.d1.prepare(
        'SELECT * FROM orders WHERE order_reference = ? AND access_token = ?'
      ).bind(reference, accessToken);
    } else {
      stmt = this.d1.prepare(
        'SELECT * FROM orders WHERE order_reference = ?'
      ).bind(reference);
    }

    const orderRow = await stmt.first<any>();
    if (!orderRow) return null;

    const itemsStmt = this.d1.prepare(
      'SELECT * FROM order_items WHERE order_id = ?'
    ).bind(orderRow.id);
    const itemsRes = await itemsStmt.all<any>();

    return {
      ...orderRow,
      items: itemsRes.results || [],
    };
  }

  public async getOrders(filters?: {
    operationalStatus?: OperationalStatus;
    paymentStatus?: any;
    search?: string;
  }): Promise<DemoOrderRecordWithItems[]> {
    let sql = 'SELECT * FROM orders WHERE 1=1';
    const params: any[] = [];

    if (filters?.operationalStatus) {
      sql += ' AND operational_status = ?';
      params.push(filters.operationalStatus);
    }
    if (filters?.paymentStatus) {
      sql += ' AND payment_status = ?';
      params.push(filters.paymentStatus);
    }
    if (filters?.search) {
      sql += ' AND (order_reference LIKE ? OR customer_name LIKE ? OR customer_mobile LIKE ?)';
      const s = `%${filters.search}%`;
      params.push(s, s, s);
    }

    sql += ' ORDER BY created_at DESC LIMIT 100';

    const stmt = this.d1.prepare(sql).bind(...params);
    const res = await stmt.all<any>();
    const orders = res.results || [];

    const ordersWithItems: DemoOrderRecordWithItems[] = [];
    for (const o of orders) {
      const itemsStmt = this.d1.prepare(
        'SELECT * FROM order_items WHERE order_id = ?'
      ).bind(o.id);
      const itemsRes = await itemsStmt.all<any>();
      ordersWithItems.push({
        ...o,
        items: itemsRes.results || [],
      });
    }

    return ordersWithItems;
  }

  public async submitPaymentReference(
    reference: string,
    utr: string,
    accessToken?: string
  ): Promise<DemoOrderRecordWithItems> {
    const order = await this.getOrderByReference(reference, accessToken);
    if (!order) throw new Error('ORDER_NOT_FOUND');

    // Duplicate UTR check across all orders
    const dupStmt = this.d1.prepare(
      'SELECT id FROM payment_submissions WHERE utr = ? AND order_reference != ?'
    ).bind(utr, reference);
    const existing = await dupStmt.first<any>();
    if (existing) {
      throw new Error('DUPLICATE_UTR');
    }

    const submissionId = `sub_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const auditId = `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const subStmt = this.d1.prepare(
      'INSERT INTO payment_submissions (id, order_id, order_reference, utr, payment_status, created_at) VALUES (?, ?, ?, ?, "RECORDED_UNVERIFIED", datetime("now"))'
    ).bind(submissionId, order.id, reference, utr);

    const updateStmt = this.d1.prepare(
      'UPDATE orders SET payment_reference = ?, payment_status = "RECORDED_UNVERIFIED", payment_submitted_at = datetime("now"), updated_at = datetime("now") WHERE id = ?'
    ).bind(utr, order.id);

    const auditStmt = this.d1.prepare(
      'INSERT INTO price_audit_logs (id, entity_type, entity_id, action, operator_id, old_value_json, new_value_json, reason, is_override, created_at) VALUES (?, "PAYMENT_SUBMISSION", ?, "UTR_RECORDED_UNVERIFIED", "CUSTOMER", ?, ?, ?, 0, datetime("now"))'
    ).bind(
      auditId,
      order.id,
      JSON.stringify({ paymentStatus: order.payment_status }),
      JSON.stringify({
        utrMasked: `******${utr.slice(-4)}`,
        paymentStatus: 'RECORDED_UNVERIFIED',
      }),
      'Customer submitted 12-digit UTR; recorded as unverified without claim of funds receipt'
    );

    await this.d1.batch([subStmt, updateStmt, auditStmt]);

    return {
      ...order,
      payment_reference: utr,
      payment_status: 'RECORDED_UNVERIFIED',
      payment_submitted_at: new Date().toISOString(),
    };
  }

  public async reconcilePayment(): Promise<never> {
    throw new Error('PAYMENT_VERIFICATION_DISABLED');
  }

  public async updateOrderStatus(
    orderId: string,
    newStatus: OperationalStatus,
    operatorId: string = 'OP-ADMIN',
    notes?: string
  ): Promise<DemoOrderRecordWithItems> {
    const checkStmt = this.d1.prepare('SELECT * FROM orders WHERE id = ?').bind(orderId);
    const existing = await checkStmt.first<any>();
    if (!existing) throw new Error('ORDER_NOT_FOUND');

    const auditId = `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const updateStmt = this.d1.prepare(
      'UPDATE orders SET operational_status = ?, updated_at = datetime("now") WHERE id = ?'
    ).bind(newStatus, orderId);

    const auditStmt = this.d1.prepare(
      'INSERT INTO price_audit_logs (id, entity_type, entity_id, action, operator_id, old_value_json, new_value_json, reason, is_override, created_at) VALUES (?, "ORDER_STATUS", ?, "STATUS_TRANSITION", ?, ?, ?, ?, 0, datetime("now"))'
    ).bind(
      auditId,
      orderId,
      operatorId,
      JSON.stringify({ operationalStatus: existing.operational_status }),
      JSON.stringify({ operationalStatus: newStatus }),
      notes || `Operational status transitioned to ${newStatus}`
    );

    await this.d1.batch([updateStmt, auditStmt]);

    const itemStmt = this.d1.prepare('SELECT * FROM order_items WHERE order_id = ?').bind(orderId);
    const itemRes = await itemStmt.all<any>();

    return {
      ...existing,
      operational_status: newStatus,
      items: itemRes.results || [],
    };
  }

  public async getDashboardKPIs(): Promise<AdminDashboardKPIs> {
    const totalOrdersRes = await this.d1.prepare('SELECT COUNT(*) as count FROM orders').first<{ count: number }>();
    const utrRes = await this.d1.prepare(
      'SELECT COUNT(*) as count FROM orders WHERE payment_reference IS NOT NULL OR payment_status = "RECORDED_UNVERIFIED"'
    ).first<{ count: number }>();
    const readyRes = await this.d1.prepare(
      'SELECT COUNT(*) as count FROM orders WHERE operational_status = "READY_FOR_PICKUP"'
    ).first<{ count: number }>();
    const compRes = await this.d1.prepare(
      'SELECT COUNT(*) as count FROM orders WHERE operational_status = "COMPLETED"'
    ).first<{ count: number }>();
    const confRes = await this.d1.prepare(
      'SELECT COUNT(*) as count FROM orders WHERE operational_status = "CONFIRMED"'
    ).first<{ count: number }>();
    const unresRes = await this.d1.prepare(
      'SELECT COUNT(*) as count FROM product_variants WHERE demo_price_paise IS NULL'
    ).first<{ count: number }>();
    const totalVarRes = await this.d1.prepare(
      'SELECT COUNT(*) as count FROM product_variants'
    ).first<{ count: number }>();

    const totalOrders = totalOrdersRes?.count ?? 0;
    const utrSubmitted = utrRes?.count ?? 0;

    return {
      totalDemoOrders: totalOrders,
      totalOrders,
      recordedUnverifiedCount: utrSubmitted,
      utrSubmittedCount: utrSubmitted,
      awaitingUtrCount: totalOrders - utrSubmitted,
      pendingPaymentVerificationCount: utrSubmitted,
      ordersReadyForPickupCount: readyRes?.count ?? 0,
      confirmedTodayCount: confRes?.count ?? 0,
      completedOrdersCount: compRes?.count ?? 0,
      unresolvedVariantsCount: unresRes?.count ?? 0,
      totalVariantsCount: totalVarRes?.count ?? 0,
    };
  }

  public async getAuditLogs(): Promise<PriceAuditLog[]> {
    const res = await this.d1.prepare(
      'SELECT * FROM price_audit_logs ORDER BY created_at DESC LIMIT 100'
    ).all<PriceAuditLog>();
    return res.results || [];
  }

  public async getPaymentSubmissions(): Promise<PaymentSubmission[]> {
    const res = await this.d1.prepare(
      'SELECT * FROM payment_submissions ORDER BY created_at DESC LIMIT 100'
    ).all<PaymentSubmission>();
    return res.results || [];
  }
}

export const globalMemoryDb = new InMemoryDemoDatabase();

export function getDb(_d1?: D1Database | null) {
  if (_d1) {
    return new D1DatabaseAdapter(_d1);
  }
  return globalMemoryDb;
}
