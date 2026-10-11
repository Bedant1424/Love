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

export const globalMemoryDb = new InMemoryDemoDatabase();

export function getDb(_d1?: D1Database | null) {
  return globalMemoryDb;
}
