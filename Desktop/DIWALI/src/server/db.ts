import { CATEGORIES, PRODUCTS } from '../data/catalogueData';
import { ProductVariant } from '../types/catalogue';
import {
  AdminDashboardKPIs,
  CreatePaymentIssueRequest,
  DbCustomerDirectoryItem,
  DbInventoryAuditLog,
  DbInventoryItem,
  DbOrder,
  DbOrderItem,
  DbPaymentIssue,
  DbQrVersion,
  DemoOrderRecordWithItems,
  OperationalStatus,
  PaymentIssueStatus,
  PaymentStatus,
  PaymentSubmission,
  PriceAuditLog,
  SalesReportDailyTrend,
  SalesReportProductBreakdown,
  SalesReportResponse,
  SalesReportSummary,
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
  private inventory: Map<
    string,
    { currentStock: number; reservedStock: number; lowStockThreshold: number }
  > = new Map();
  private inventoryAuditLogs: DbInventoryAuditLog[] = [];
  private qrVersions: DbQrVersion[] = [];
  private paymentIssues: Map<string, DbPaymentIssue> = new Map();
  private customers: Map<string, DbCustomerDirectoryItem> = new Map();

  constructor() {
    this.seed();
  }

  public seed() {
    this.variants.clear();
    this.inventory.clear();
    this.orders.clear();
    this.orderItems.clear();
    this.paymentSubmissions.clear();
    this.auditLogs = [];
    this.inventoryAuditLogs = [];
    this.paymentIssues.clear();
    this.customers.clear();

    for (const prod of this.products) {
      for (const v of prod.variants) {
        this.variants.set(v.id, { ...v, productId: prod.id });
        this.inventory.set(v.id, {
          currentStock: 100,
          reservedStock: 0,
          lowStockThreshold: 10,
        });
      }
    }

    const now = new Date().toISOString();
    this.qrVersions = [
      {
        id: 'qr_v1_seed',
        version_number: 1,
        label: 'Default Testing Fixture QR (v1)',
        vpa: 'test-fixture@nagarjunatraders',
        account_name: 'NAGARJUNA TRADERS (TEST)',
        image_url: '/images/test-qr-v1.png',
        is_active: 1,
        upload_operator_id: 'SYSTEM',
        activation_notes: 'Initial active restricted test fixture QR',
        activated_at: now,
        deactivated_at: null,
        created_at: now,
      },
    ];
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

    // Reserve stock for items
    for (const it of items) {
      const inv = this.inventory.get(it.variant_id);
      if (inv) {
        inv.reservedStock += it.quantity;
        this.inventoryAuditLogs.unshift({
          id: `inv_audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          variant_id: it.variant_id,
          action: 'RESERVATION',
          quantity_delta: it.quantity,
          stock_before: inv.currentStock,
          stock_after: inv.currentStock,
          operator_id: 'SYSTEM',
          reason: `Reserved for order ${order.order_reference}`,
          created_at: now,
        });
      }
    }

    // Upsert customer into normalized directory
    const cMobile = order.customer_mobile;
    const existingCust = this.customers.get(cMobile);
    if (existingCust) {
      existingCust.total_orders += 1;
      existingCust.lifetime_spent_paise += order.subtotal_paise;
      existingCust.last_order_date = now;
      existingCust.updated_at = now;
    } else {
      this.customers.set(cMobile, {
        id: `cust_${cMobile}`,
        full_name: order.customer_name,
        mobile_number: cMobile,
        total_orders: 1,
        lifetime_spent_paise: order.subtotal_paise,
        last_order_date: now,
        notes: null,
        created_at: now,
        updated_at: now,
      });
    }

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

  // Inventory Management
  public async getInventory(): Promise<DbInventoryItem[]> {
    const list: DbInventoryItem[] = [];
    for (const prod of this.products) {
      for (const v of prod.variants) {
        const inv = this.inventory.get(v.id) || {
          currentStock: 100,
          reservedStock: 0,
          lowStockThreshold: 10,
        };
        const available = inv.currentStock - inv.reservedStock;
        list.push({
          variant_id: v.id,
          product_id: prod.id,
          product_name: prod.name,
          variant_name: v.name,
          current_stock: inv.currentStock,
          reserved_stock: inv.reservedStock,
          available_stock: available,
          low_stock_threshold: inv.lowStockThreshold,
          is_low_stock: available <= inv.lowStockThreshold,
        });
      }
    }
    return list;
  }

  public async adjustStock(
    variantId: string,
    newStock: number,
    operatorId: string = 'OP-ADMIN',
    reason?: string
  ): Promise<DbInventoryItem> {
    const variant = this.variants.get(variantId);
    if (!variant) throw new Error(`Variant ${variantId} not found`);
    const inv = this.inventory.get(variantId) || {
      currentStock: 100,
      reservedStock: 0,
      lowStockThreshold: 10,
    };
    const stockBefore = inv.currentStock;
    const safeStock = Math.max(0, Math.floor(newStock));
    if (safeStock < inv.reservedStock) {
      throw new Error(
        `Cannot reduce stock to ${safeStock} below active reservation of ${inv.reservedStock} units.`
      );
    }
    inv.currentStock = safeStock;
    this.inventory.set(variantId, inv);

    const log: DbInventoryAuditLog = {
      id: `inv_audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      variant_id: variantId,
      action: 'MANUAL_ADJUST',
      quantity_delta: inv.currentStock - stockBefore,
      stock_before: stockBefore,
      stock_after: inv.currentStock,
      operator_id: operatorId,
      reason: reason || 'Manual stock adjustment',
      created_at: new Date().toISOString(),
    };
    this.inventoryAuditLogs.unshift(log);

    const prod = this.products.find((p) => p.id === variant.productId) || {
      name: '',
    };
    const available = inv.currentStock - inv.reservedStock;
    return {
      variant_id: variantId,
      product_id: variant.productId || '',
      product_name: prod.name,
      variant_name: variant.name,
      current_stock: inv.currentStock,
      reserved_stock: inv.reservedStock,
      available_stock: available,
      low_stock_threshold: inv.lowStockThreshold,
      is_low_stock: available <= inv.lowStockThreshold,
    };
  }

  public async getInventoryAuditLogs(): Promise<DbInventoryAuditLog[]> {
    return [...this.inventoryAuditLogs];
  }

  // QR Versions Management
  public async getQrVersions(): Promise<DbQrVersion[]> {
    return [...this.qrVersions];
  }

  public async getActiveQrVersion(): Promise<DbQrVersion | null> {
    return this.qrVersions.find((q) => q.is_active === 1) || null;
  }

  public async uploadQrVersion(
    label: string,
    vpa: string,
    accountName: string,
    imageUrl: string,
    operatorId: string = 'OP-ADMIN'
  ): Promise<DbQrVersion> {
    const nextVer = this.qrVersions.length
      ? Math.max(...this.qrVersions.map((q) => q.version_number)) + 1
      : 1;
    const now = new Date().toISOString();
    const newVer: DbQrVersion = {
      id: `qr_v${nextVer}_${Date.now()}`,
      version_number: nextVer,
      label,
      vpa,
      account_name: accountName,
      image_url: imageUrl,
      is_active: 0,
      upload_operator_id: operatorId,
      activation_notes: null,
      activated_at: null,
      deactivated_at: null,
      created_at: now,
    };
    this.qrVersions.unshift(newVer);
    return newVer;
  }

  public async activateQrVersion(
    id: string,
    operatorId: string = 'OP-ADMIN',
    notes?: string
  ): Promise<DbQrVersion> {
    const target = this.qrVersions.find((q) => q.id === id);
    if (!target) throw new Error(`QR version ${id} not found`);

    const now = new Date().toISOString();
    for (const q of this.qrVersions) {
      if (q.is_active === 1) {
        q.is_active = 0;
        q.deactivated_at = now;
      }
    }
    target.is_active = 1;
    target.activated_at = now;
    target.activation_notes = notes || null;

    const audit: PriceAuditLog = {
      id: `audit_qr_${Date.now()}`,
      entity_type: 'SYSTEM_SETTING',
      entity_id: target.id,
      action: 'QR_VERSION_ACTIVATED',
      operator_id: operatorId,
      old_value_json: null,
      new_value_json: JSON.stringify({
        version: target.version_number,
        vpa: target.vpa,
      }),
      reason: notes || `Activated QR Version ${target.version_number}`,
      is_override: 0,
      created_at: now,
    };
    this.auditLogs.unshift(audit);

    return target;
  }

  public async deactivateQrVersion(
    id: string,
    _operatorId: string = 'OP-ADMIN'
  ): Promise<DbQrVersion> {
    const target = this.qrVersions.find((q) => q.id === id);
    if (!target) throw new Error(`QR version ${id} not found`);
    target.is_active = 0;
    target.deactivated_at = new Date().toISOString();
    return target;
  }

  // Payment Support Issues
  public async createPaymentIssue(
    req: CreatePaymentIssueRequest
  ): Promise<DbPaymentIssue> {
    const now = new Date().toISOString();
    const hex = Math.floor(1000 + Math.random() * 9000)
      .toString(16)
      .toUpperCase();
    const issueRef = `ISS-${hex}`;
    const issue: DbPaymentIssue = {
      id: `issue_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      issue_reference: issueRef,
      order_reference: req.orderReference || null,
      customer_name: req.customerName,
      customer_mobile: req.customerMobile,
      issue_type: req.issueType,
      description: req.description || null,
      status: 'OPEN',
      staff_notes: null,
      created_at: now,
      updated_at: now,
    };
    this.paymentIssues.set(issue.id, issue);
    return issue;
  }

  public async getPaymentIssues(
    status?: PaymentIssueStatus
  ): Promise<DbPaymentIssue[]> {
    let list = Array.from(this.paymentIssues.values());
    if (status) {
      list = list.filter((i) => i.status === status);
    }
    return list.sort((a, b) => b.created_at.localeCompare(a.created_at));
  }

  public async updatePaymentIssue(
    id: string,
    status: PaymentIssueStatus,
    staffNotes?: string
  ): Promise<DbPaymentIssue> {
    const issue = this.paymentIssues.get(id);
    if (!issue) throw new Error(`Payment issue ${id} not found`);
    issue.status = status;
    if (staffNotes !== undefined) issue.staff_notes = staffNotes;
    issue.updated_at = new Date().toISOString();
    return issue;
  }

  // Customer Directory
  public async getCustomers(search?: string): Promise<DbCustomerDirectoryItem[]> {
    let list = Array.from(this.customers.values());
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (c) =>
          c.full_name.toLowerCase().includes(q) ||
          c.mobile_number.includes(q)
      );
    }
    return list.sort((a, b) => b.lifetime_spent_paise - a.lifetime_spent_paise);
  }

  public async getCustomerDetails(id: string): Promise<{
    customer: DbCustomerDirectoryItem;
    orders: DemoOrderRecordWithItems[];
  }> {
    const cust =
      this.customers.get(id) ||
      Array.from(this.customers.values()).find(
        (c) => c.id === id || c.mobile_number === id
      );
    if (!cust) throw new Error(`Customer ${id} not found`);

    const orders = Array.from(this.orders.values())
      .filter((o) => o.customer_mobile === cust.mobile_number)
      .map((o) => ({
        ...o,
        items: this.orderItems.get(o.id) || [],
      }))
      .sort((a, b) => b.created_at.localeCompare(a.created_at));

    return { customer: cust, orders };
  }

  // Sales Analytics & Reporting
  public async getSalesReport(
    range: 'today' | '7d' | '30d' | 'all' = 'today'
  ): Promise<SalesReportResponse> {
    const allOrders = Array.from(this.orders.values());
    const now = Date.now();
    let filtered = allOrders;

    if (range === 'today') {
      const todayIso = new Date().toISOString().slice(0, 10);
      filtered = allOrders.filter((o) => o.created_at.startsWith(todayIso));
    } else if (range === '7d') {
      const cutoff = now - 7 * 86400000;
      filtered = allOrders.filter(
        (o) => new Date(o.created_at).getTime() >= cutoff
      );
    } else if (range === '30d') {
      const cutoff = now - 30 * 86400000;
      filtered = allOrders.filter(
        (o) => new Date(o.created_at).getTime() >= cutoff
      );
    }

    const totalOrders = filtered.length;
    let totalGrossOrderPaise = 0;
    let totalVerifiedFundsPaise = 0;
    let totalPendingUnverifiedPaise = 0;

    const dailyMap = new Map<
      string,
      { orderCount: number; grossPaise: number; verifiedPaise: number }
    >();
    const prodMap = new Map<
      string,
      { productName: string; quantitySold: number; totalRevenuePaise: number }
    >();

    for (const o of filtered) {
      totalGrossOrderPaise += o.subtotal_paise;
      const isVerified =
        o.payment_status === 'VERIFIED_TOKEN' ||
        o.payment_status === 'RECONCILED';
      if (isVerified) {
        totalVerifiedFundsPaise += o.token_amount_paise;
      } else if (o.payment_status === 'RECORDED_UNVERIFIED') {
        totalPendingUnverifiedPaise += o.token_amount_paise;
      }

      const day = o.created_at.slice(0, 10);
      if (!dailyMap.has(day)) {
        dailyMap.set(day, { orderCount: 0, grossPaise: 0, verifiedPaise: 0 });
      }
      const d = dailyMap.get(day)!;
      d.orderCount += 1;
      d.grossPaise += o.subtotal_paise;
      if (isVerified) d.verifiedPaise += o.token_amount_paise;

      const items = this.orderItems.get(o.id) || [];
      for (const it of items) {
        if (!prodMap.has(it.product_id)) {
          prodMap.set(it.product_id, {
            productName: it.product_name_snapshot,
            quantitySold: 0,
            totalRevenuePaise: 0,
          });
        }
        const p = prodMap.get(it.product_id)!;
        p.quantitySold += it.quantity;
        p.totalRevenuePaise += it.line_subtotal_paise;
      }
    }

    const averageOrderValuePaise =
      totalOrders > 0 ? Math.round(totalGrossOrderPaise / totalOrders) : 0;

    const dailyTrends: SalesReportDailyTrend[] = Array.from(dailyMap.entries())
      .map(([date, val]) => ({ date, ...val }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const productBreakdown: SalesReportProductBreakdown[] = Array.from(
      prodMap.entries()
    )
      .map(([productId, val]) => ({ productId, ...val }))
      .sort((a, b) => b.totalRevenuePaise - a.totalRevenuePaise);

    const summary: SalesReportSummary = {
      totalOrders,
      totalGrossOrderPaise,
      totalVerifiedFundsPaise,
      totalPendingUnverifiedPaise,
      averageOrderValuePaise,
      dateRange: range,
    };

    return { summary, dailyTrends, productBreakdown };
  }

  public async exportSalesReportCsv(
    range: 'today' | '7d' | '30d' | 'all' = 'today'
  ): Promise<string> {
    const report = await this.getSalesReport(range);
    const orders = Array.from(this.orders.values());

    const escapeCsv = (val: string | number | null | undefined): string => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const lines: string[] = [];
    lines.push(
      [
        'Order Reference',
        'Customer Name',
        'Mobile Number',
        'Created At',
        'Operational Status',
        'Payment Status',
        'Subtotal (INR)',
        'Token Due (INR)',
        'Balance Due (INR)',
        'Payment Reference (UTR)',
      ]
        .map(escapeCsv)
        .join(',')
    );

    for (const o of orders) {
      lines.push(
        [
          o.order_reference,
          o.customer_name,
          o.customer_mobile,
          o.created_at,
          o.operational_status,
          o.payment_status,
          (o.subtotal_paise / 100).toFixed(2),
          (o.token_amount_paise / 100).toFixed(2),
          (o.remaining_balance_paise / 100).toFixed(2),
          o.payment_reference || '',
        ]
          .map(escapeCsv)
          .join(',')
      );
    }

    lines.push('');
    lines.push(escapeCsv('SUMMARY METRICS'));
    lines.push(
      [escapeCsv('Total Orders'), escapeCsv(report.summary.totalOrders)].join(',')
    );
    lines.push(
      [
        escapeCsv('Gross Order Value (INR)'),
        escapeCsv((report.summary.totalGrossOrderPaise / 100).toFixed(2)),
      ].join(',')
    );
    lines.push(
      [
        escapeCsv('Verified Token Funds (INR)'),
        escapeCsv((report.summary.totalVerifiedFundsPaise / 100).toFixed(2)),
      ].join(',')
    );
    lines.push(
      [
        escapeCsv('Pending Unverified Tokens (INR)'),
        escapeCsv((report.summary.totalPendingUnverifiedPaise / 100).toFixed(2)),
      ].join(',')
    );

    return lines.join('\r\n');
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

    const reserveStmts = items.map((it) =>
      this.d1.prepare(
        'UPDATE product_variants SET reserved_stock = reserved_stock + ? WHERE id = ?'
      ).bind(it.quantity, it.variant_id)
    );

    const invAuditStmts = items.map((it) => {
      const invAuditId = `inv_audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      return this.d1.prepare(`
        INSERT INTO inventory_audit_logs (id, variant_id, action, quantity_delta, stock_before, stock_after, operator_id, reason)
        VALUES (?, ?, 'RESERVATION', ?, 0, 0, 'SYSTEM', ?)
      `).bind(
        invAuditId,
        it.variant_id,
        it.quantity,
        `Reserved for order ${order.order_reference}`
      );
    });

    const custStmt = this.d1.prepare(`
      INSERT INTO customers (id, full_name, mobile_number, total_orders, lifetime_spent_paise, last_order_date, created_at, updated_at)
      VALUES (?, ?, ?, 1, ?, datetime("now"), datetime("now"), datetime("now"))
      ON CONFLICT(mobile_number) DO UPDATE SET
        full_name = excluded.full_name,
        total_orders = total_orders + 1,
        lifetime_spent_paise = lifetime_spent_paise + excluded.lifetime_spent_paise,
        last_order_date = datetime("now"),
        updated_at = datetime("now")
    `).bind(
      `cust_${order.customer_mobile}`,
      order.customer_name,
      order.customer_mobile,
      order.subtotal_paise
    );

    await this.d1.batch([orderStmt, ...itemStmts, ...reserveStmts, ...invAuditStmts, custStmt]);

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
      'INSERT INTO payment_submissions (id, order_id, order_reference, utr, payment_status, created_at) VALUES (?, ?, ?, ?, ?, datetime("now"))'
    ).bind(submissionId, order.id, reference, utr, 'RECORDED_UNVERIFIED');

    const updateStmt = this.d1.prepare(
      'UPDATE orders SET payment_reference = ?, payment_status = ?, payment_submitted_at = datetime("now"), updated_at = datetime("now") WHERE id = ?'
    ).bind(utr, 'RECORDED_UNVERIFIED', order.id);

    const auditStmt = this.d1.prepare(
      'INSERT INTO price_audit_logs (id, entity_type, entity_id, action, operator_id, old_value_json, new_value_json, reason, is_override, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime("now"))'
    ).bind(
      auditId,
      'PAYMENT_VERIFICATION',
      order.id,
      'UTR_RECORDED_UNVERIFIED',
      'CUSTOMER',
      JSON.stringify({ paymentStatus: order.payment_status }),
      JSON.stringify({
        utrMasked: `******${utr.slice(-4)}`,
        paymentStatus: 'RECORDED_UNVERIFIED',
      }),
      'Customer submitted 12-digit UTR; recorded as unverified without claim of funds receipt',
      0
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
      'INSERT INTO price_audit_logs (id, entity_type, entity_id, action, operator_id, old_value_json, new_value_json, reason, is_override, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime("now"))'
    ).bind(
      auditId,
      'ORDER_STATUS',
      orderId,
      'STATUS_TRANSITION',
      operatorId,
      JSON.stringify({ operationalStatus: existing.operational_status }),
      JSON.stringify({ operationalStatus: newStatus }),
      notes || `Operational status transitioned to ${newStatus}`,
      0
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
      "SELECT COUNT(*) as count FROM orders WHERE payment_reference IS NOT NULL OR payment_status = 'RECORDED_UNVERIFIED'"
    ).first<{ count: number }>();
    const readyRes = await this.d1.prepare(
      "SELECT COUNT(*) as count FROM orders WHERE operational_status = 'READY_FOR_PICKUP'"
    ).first<{ count: number }>();
    const compRes = await this.d1.prepare(
      "SELECT COUNT(*) as count FROM orders WHERE operational_status = 'COMPLETED'"
    ).first<{ count: number }>();
    const confRes = await this.d1.prepare(
      "SELECT COUNT(*) as count FROM orders WHERE operational_status = 'CONFIRMED'"
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

  // Inventory Management
  public async getInventory(): Promise<DbInventoryItem[]> {
    const stmt = this.d1.prepare(`
      SELECT 
        v.id as variant_id,
        v.product_id,
        p.name as product_name,
        v.variant_name,
        COALESCE(v.current_stock, 100) as current_stock,
        COALESCE(v.reserved_stock, 0) as reserved_stock,
        COALESCE(v.low_stock_threshold, 10) as low_stock_threshold
      FROM product_variants v
      JOIN products p ON v.product_id = p.id
      ORDER BY p.id ASC, v.id ASC
    `);
    const res = await stmt.all<any>();
    return (res.results || []).map((row) => {
      const available = (row.current_stock || 0) - (row.reserved_stock || 0);
      return {
        variant_id: row.variant_id,
        product_id: row.product_id,
        product_name: row.product_name,
        variant_name: row.variant_name,
        current_stock: row.current_stock || 0,
        reserved_stock: row.reserved_stock || 0,
        available_stock: available,
        low_stock_threshold: row.low_stock_threshold || 10,
        is_low_stock: available <= (row.low_stock_threshold || 10),
      };
    });
  }

  public async adjustStock(
    variantId: string,
    newStock: number,
    operatorId: string = 'OP-ADMIN',
    reason?: string
  ): Promise<DbInventoryItem> {
    const beforeRes = await this.d1.prepare(
      'SELECT current_stock, reserved_stock, low_stock_threshold FROM product_variants WHERE id = ?'
    ).bind(variantId).first<any>();
    const stockBefore = beforeRes?.current_stock ?? 100;
    const reserved = beforeRes?.reserved_stock ?? 0;
    const threshold = beforeRes?.low_stock_threshold ?? 10;
    const safeStock = Math.max(0, Math.floor(newStock));
    if (safeStock < reserved) {
      throw new Error(
        `Cannot reduce stock to ${safeStock} below active reservation of ${reserved} units.`
      );
    }

    await this.d1.prepare(
      'UPDATE product_variants SET current_stock = ? WHERE id = ?'
    ).bind(safeStock, variantId).run();

    const auditId = `inv_audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    await this.d1.prepare(`
      INSERT INTO inventory_audit_logs (id, variant_id, action, quantity_delta, stock_before, stock_after, operator_id, reason)
      VALUES (?, ?, 'MANUAL_ADJUST', ?, ?, ?, ?, ?)
    `).bind(
      auditId,
      variantId,
      safeStock - stockBefore,
      stockBefore,
      safeStock,
      operatorId,
      reason || 'Manual stock adjustment'
    ).run();

    const info = await this.d1.prepare(`
      SELECT v.id as variant_id, v.product_id, p.name as product_name, v.variant_name
      FROM product_variants v
      JOIN products p ON v.product_id = p.id
      WHERE v.id = ?
    `).bind(variantId).first<any>();

    const available = safeStock - reserved;
    return {
      variant_id: variantId,
      product_id: info?.product_id || '',
      product_name: info?.product_name || '',
      variant_name: info?.variant_name || '',
      current_stock: safeStock,
      reserved_stock: reserved,
      available_stock: available,
      low_stock_threshold: threshold,
      is_low_stock: available <= threshold,
    };
  }

  public async getInventoryAuditLogs(): Promise<DbInventoryAuditLog[]> {
    const res = await this.d1.prepare(
      'SELECT * FROM inventory_audit_logs ORDER BY created_at DESC LIMIT 100'
    ).all<DbInventoryAuditLog>();
    return res.results || [];
  }

  // QR Versions Management
  public async getQrVersions(): Promise<DbQrVersion[]> {
    const res = await this.d1.prepare(
      'SELECT * FROM qr_versions ORDER BY version_number DESC'
    ).all<DbQrVersion>();
    return res.results || [];
  }

  public async getActiveQrVersion(): Promise<DbQrVersion | null> {
    return this.d1.prepare(
      'SELECT * FROM qr_versions WHERE is_active = 1 LIMIT 1'
    ).first<DbQrVersion>();
  }

  public async uploadQrVersion(
    label: string,
    vpa: string,
    accountName: string,
    imageUrl: string,
    operatorId: string = 'OP-ADMIN'
  ): Promise<DbQrVersion> {
    const maxRes = await this.d1.prepare(
      'SELECT MAX(version_number) as max_ver FROM qr_versions'
    ).first<{ max_ver: number | null }>();
    const nextVer = (maxRes?.max_ver || 0) + 1;
    const now = new Date().toISOString();
    const id = `qr_v${nextVer}_${Date.now()}`;

    await this.d1.prepare(`
      INSERT INTO qr_versions (id, version_number, label, vpa, account_name, image_url, is_active, upload_operator_id, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?)
    `).bind(id, nextVer, label, vpa, accountName, imageUrl, operatorId, now).run();

    return {
      id,
      version_number: nextVer,
      label,
      vpa,
      account_name: accountName,
      image_url: imageUrl,
      is_active: 0,
      upload_operator_id: operatorId,
      activation_notes: null,
      activated_at: null,
      deactivated_at: null,
      created_at: now,
    };
  }

  public async activateQrVersion(
    id: string,
    operatorId: string = 'OP-ADMIN',
    notes?: string
  ): Promise<DbQrVersion> {
    const now = new Date().toISOString();
    await this.d1.batch([
      this.d1.prepare(
        "UPDATE qr_versions SET is_active = 0, deactivated_at = datetime('now') WHERE is_active = 1"
      ),
      this.d1.prepare(
        "UPDATE qr_versions SET is_active = 1, activated_at = datetime('now'), activation_notes = ? WHERE id = ?"
      ).bind(notes || null, id),
    ]);

    const updated = await this.d1.prepare(
      'SELECT * FROM qr_versions WHERE id = ?'
    ).bind(id).first<DbQrVersion>();
    if (!updated) throw new Error(`QR version ${id} not found`);

    const auditId = `audit_qr_${Date.now()}`;
    await this.d1.prepare(`
      INSERT INTO price_audit_logs (id, entity_type, entity_id, action, operator_id, new_value_json, reason, is_override, created_at)
      VALUES (?, 'SYSTEM_SETTING', ?, 'QR_VERSION_ACTIVATED', ?, ?, ?, 0, ?)
    `).bind(
      auditId,
      id,
      operatorId,
      JSON.stringify({ version: updated.version_number, vpa: updated.vpa }),
      notes || `Activated QR Version ${updated.version_number}`,
      now
    ).run();

    return updated;
  }

  public async deactivateQrVersion(
    id: string,
    _operatorId: string = 'OP-ADMIN'
  ): Promise<DbQrVersion> {
    await this.d1.prepare(
      "UPDATE qr_versions SET is_active = 0, deactivated_at = datetime('now') WHERE id = ?"
    ).bind(id).run();
    const updated = await this.d1.prepare(
      'SELECT * FROM qr_versions WHERE id = ?'
    ).bind(id).first<DbQrVersion>();
    if (!updated) throw new Error(`QR version ${id} not found`);
    return updated;
  }

  // Payment Support Issues
  public async createPaymentIssue(
    req: CreatePaymentIssueRequest
  ): Promise<DbPaymentIssue> {
    const now = new Date().toISOString();
    const hex = Math.floor(1000 + Math.random() * 9000).toString(16).toUpperCase();
    const issueRef = `ISS-${hex}`;
    const id = `issue_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    await this.d1.prepare(`
      INSERT INTO payment_issues (id, issue_reference, order_reference, customer_name, customer_mobile, issue_type, description, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'OPEN', ?, ?)
    `).bind(
      id,
      issueRef,
      req.orderReference || null,
      req.customerName,
      req.customerMobile,
      req.issueType,
      req.description || null,
      now,
      now
    ).run();

    return {
      id,
      issue_reference: issueRef,
      order_reference: req.orderReference || null,
      customer_name: req.customerName,
      customer_mobile: req.customerMobile,
      issue_type: req.issueType,
      description: req.description || null,
      status: 'OPEN',
      staff_notes: null,
      created_at: now,
      updated_at: now,
    };
  }

  public async getPaymentIssues(
    status?: PaymentIssueStatus
  ): Promise<DbPaymentIssue[]> {
    if (status) {
      const res = await this.d1.prepare(
        'SELECT * FROM payment_issues WHERE status = ? ORDER BY created_at DESC'
      ).bind(status).all<DbPaymentIssue>();
      return res.results || [];
    }
    const res = await this.d1.prepare(
      'SELECT * FROM payment_issues ORDER BY created_at DESC'
    ).all<DbPaymentIssue>();
    return res.results || [];
  }

  public async updatePaymentIssue(
    id: string,
    status: PaymentIssueStatus,
    staffNotes?: string
  ): Promise<DbPaymentIssue> {
    await this.d1.prepare(`
      UPDATE payment_issues SET status = ?, staff_notes = COALESCE(?, staff_notes), updated_at = datetime('now') WHERE id = ?
    `).bind(status, staffNotes || null, id).run();

    const updated = await this.d1.prepare(
      'SELECT * FROM payment_issues WHERE id = ?'
    ).bind(id).first<DbPaymentIssue>();
    if (!updated) throw new Error(`Payment issue ${id} not found`);
    return updated;
  }

  // Customer Directory
  public async getCustomers(search?: string): Promise<DbCustomerDirectoryItem[]> {
    if (search && search.trim()) {
      const term = `%${search.trim().toLowerCase()}%`;
      const res = await this.d1.prepare(`
        SELECT * FROM customers 
        WHERE LOWER(full_name) LIKE ? OR mobile_number LIKE ?
        ORDER BY lifetime_spent_paise DESC
      `).bind(term, term).all<DbCustomerDirectoryItem>();
      return res.results || [];
    }
    const res = await this.d1.prepare(
      'SELECT * FROM customers ORDER BY lifetime_spent_paise DESC'
    ).all<DbCustomerDirectoryItem>();
    return res.results || [];
  }

  public async getCustomerDetails(id: string): Promise<{
    customer: DbCustomerDirectoryItem;
    orders: DemoOrderRecordWithItems[];
  }> {
    const cust = await this.d1.prepare(
      'SELECT * FROM customers WHERE id = ? OR mobile_number = ?'
    ).bind(id, id).first<DbCustomerDirectoryItem>();
    if (!cust) throw new Error(`Customer ${id} not found`);

    const ordersRes = await this.d1.prepare(
      'SELECT * FROM orders WHERE customer_mobile = ? ORDER BY created_at DESC'
    ).bind(cust.mobile_number).all<DbOrder>();

    const ordersWithItems: DemoOrderRecordWithItems[] = [];
    for (const o of ordersRes.results || []) {
      const itemsRes = await this.d1.prepare(
        'SELECT * FROM order_items WHERE order_id = ?'
      ).bind(o.id).all<DbOrderItem>();
      ordersWithItems.push({
        ...o,
        items: itemsRes.results || [],
      });
    }

    return { customer: cust, orders: ordersWithItems };
  }

  public async upsertCustomerOnOrder(
    fullName: string,
    mobile: string,
    spendPaise: number
  ): Promise<void> {
    const now = new Date().toISOString();
    const id = `cust_${mobile}`;
    await this.d1.prepare(`
      INSERT INTO customers (id, full_name, mobile_number, total_orders, lifetime_spent_paise, last_order_date, created_at, updated_at)
      VALUES (?, ?, ?, 1, ?, ?, ?, ?)
      ON CONFLICT(mobile_number) DO UPDATE SET
        full_name = excluded.full_name,
        total_orders = total_orders + 1,
        lifetime_spent_paise = lifetime_spent_paise + excluded.lifetime_spent_paise,
        last_order_date = excluded.last_order_date,
        updated_at = excluded.updated_at
    `).bind(id, fullName, mobile, spendPaise, now, now, now).run();
  }

  // Sales Analytics & Reporting
  public async getSalesReport(
    range: 'today' | '7d' | '30d' | 'all' = 'today'
  ): Promise<SalesReportResponse> {
    let dateFilter = '';
    if (range === 'today') {
      dateFilter = "WHERE created_at >= date('now', 'start of day')";
    } else if (range === '7d') {
      dateFilter = "WHERE created_at >= datetime('now', '-7 days')";
    } else if (range === '30d') {
      dateFilter = "WHERE created_at >= datetime('now', '-30 days')";
    }

    const ordersRes = await this.d1.prepare(
      `SELECT * FROM orders ${dateFilter} ORDER BY created_at ASC`
    ).all<DbOrder>();
    const orders = ordersRes.results || [];

    const totalOrders = orders.length;
    let totalGrossOrderPaise = 0;
    let totalVerifiedFundsPaise = 0;
    let totalPendingUnverifiedPaise = 0;
    const dailyMap = new Map<string, { orderCount: number; grossPaise: number; verifiedPaise: number }>();

    for (const o of orders) {
      totalGrossOrderPaise += o.subtotal_paise;
      const isVerified =
        o.payment_status === 'VERIFIED_TOKEN' ||
        o.payment_status === 'RECONCILED';
      if (isVerified) {
        totalVerifiedFundsPaise += o.token_amount_paise;
      } else if (o.payment_status === 'RECORDED_UNVERIFIED') {
        totalPendingUnverifiedPaise += o.token_amount_paise;
      }

      const day = o.created_at.slice(0, 10);
      if (!dailyMap.has(day)) {
        dailyMap.set(day, { orderCount: 0, grossPaise: 0, verifiedPaise: 0 });
      }
      const d = dailyMap.get(day)!;
      d.orderCount += 1;
      d.grossPaise += o.subtotal_paise;
      if (isVerified) d.verifiedPaise += o.token_amount_paise;
    }

    const prodRes = await this.d1.prepare(`
      SELECT oi.product_id, oi.product_name_snapshot as product_name,
             SUM(oi.quantity) as quantity_sold,
             SUM(oi.line_subtotal_paise) as total_revenue_paise
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      ${dateFilter.replace(/created_at/g, 'o.created_at')}
      GROUP BY oi.product_id, oi.product_name_snapshot
      ORDER BY total_revenue_paise DESC
    `).all<any>();

    const productBreakdown: SalesReportProductBreakdown[] = (prodRes.results || []).map((p) => ({
      productId: p.product_id,
      productName: p.product_name,
      quantitySold: Number(p.quantity_sold) || 0,
      totalRevenuePaise: Number(p.total_revenue_paise) || 0,
    }));

    const dailyTrends: SalesReportDailyTrend[] = Array.from(dailyMap.entries())
      .map(([date, val]) => ({ date, ...val }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const summary: SalesReportSummary = {
      totalOrders,
      totalGrossOrderPaise,
      totalVerifiedFundsPaise,
      totalPendingUnverifiedPaise,
      averageOrderValuePaise:
        totalOrders > 0 ? Math.round(totalGrossOrderPaise / totalOrders) : 0,
      dateRange: range,
    };

    return { summary, dailyTrends, productBreakdown };
  }

  public async exportSalesReportCsv(
    range: 'today' | '7d' | '30d' | 'all' = 'today'
  ): Promise<string> {
    const report = await this.getSalesReport(range);
    const ordersRes = await this.d1.prepare('SELECT * FROM orders ORDER BY created_at DESC').all<DbOrder>();
    const orders = ordersRes.results || [];

    const escapeCsv = (val: string | number | null | undefined): string => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const lines: string[] = [];
    lines.push(
      [
        'Order Reference',
        'Customer Name',
        'Mobile Number',
        'Created At',
        'Operational Status',
        'Payment Status',
        'Subtotal (INR)',
        'Token Due (INR)',
        'Balance Due (INR)',
        'Payment Reference (UTR)',
      ]
        .map(escapeCsv)
        .join(',')
    );

    for (const o of orders) {
      lines.push(
        [
          o.order_reference,
          o.customer_name,
          o.customer_mobile,
          o.created_at,
          o.operational_status,
          o.payment_status,
          (o.subtotal_paise / 100).toFixed(2),
          (o.token_amount_paise / 100).toFixed(2),
          (o.remaining_balance_paise / 100).toFixed(2),
          o.payment_reference || '',
        ]
          .map(escapeCsv)
          .join(',')
      );
    }

    lines.push('');
    lines.push(escapeCsv('SUMMARY METRICS'));
    lines.push([escapeCsv('Total Orders'), escapeCsv(report.summary.totalOrders)].join(','));
    lines.push(
      [
        escapeCsv('Gross Order Value (INR)'),
        escapeCsv((report.summary.totalGrossOrderPaise / 100).toFixed(2)),
      ].join(',')
    );
    lines.push(
      [
        escapeCsv('Verified Token Funds (INR)'),
        escapeCsv((report.summary.totalVerifiedFundsPaise / 100).toFixed(2)),
      ].join(',')
    );
    lines.push(
      [
        escapeCsv('Pending Unverified Tokens (INR)'),
        escapeCsv((report.summary.totalPendingUnverifiedPaise / 100).toFixed(2)),
      ].join(',')
    );

    return lines.join('\r\n');
  }
}

export const globalMemoryDb = new InMemoryDemoDatabase();

export function getDb(_d1?: D1Database | null) {
  if (_d1) {
    return new D1DatabaseAdapter(_d1);
  }
  return globalMemoryDb;
}
