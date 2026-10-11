import { handleApiRequest } from '../server/api';
import {
  AdminDashboardKPIs,
  ApiResponse,
  CreateOrderRequest,
  CreatePaymentIssueRequest,
  DbCustomerDirectoryItem,
  DbInventoryAuditLog,
  DbInventoryItem,
  DbPaymentIssue,
  DbQrVersion,
  DemoOrderRecordWithItems,
  OperationalStatus,
  PaymentConfig,
  PaymentIssueStatus,
  PaymentStatus,
  PriceAuditLog,
  SalesReportResponse,
  UploadQrRequest,
} from '../server/types';
import { ProductVariant } from '../types/catalogue';

const API_BASE = '/api/v1';

let currentAdminToken: string | null = (() => {
  if (typeof window !== 'undefined' && window.sessionStorage) {
    try {
      return window.sessionStorage.getItem('nagarjuna_admin_token');
    } catch {
      return null;
    }
  }
  return null;
})();

let currentCsrfToken: string | null = (() => {
  if (typeof window !== 'undefined' && window.sessionStorage) {
    try {
      return window.sessionStorage.getItem('nagarjuna_admin_csrf');
    } catch {
      return null;
    }
  }
  return null;
})();

export function setAdminAuthToken(token: string | null) {
  currentAdminToken = token;
  if (typeof window !== 'undefined' && window.sessionStorage) {
    try {
      if (token) {
        window.sessionStorage.setItem('nagarjuna_admin_token', token);
      } else {
        window.sessionStorage.removeItem('nagarjuna_admin_token');
      }
    } catch {}
  }
}

export function getAdminAuthToken(): string | null {
  return currentAdminToken;
}

export function setAdminCsrfToken(token: string | null) {
  currentCsrfToken = token;
  if (typeof window !== 'undefined' && window.sessionStorage) {
    try {
      if (token) {
        window.sessionStorage.setItem('nagarjuna_admin_csrf', token);
      } else {
        window.sessionStorage.removeItem('nagarjuna_admin_csrf');
      }
    } catch {}
  }
}

export function getAdminCsrfToken(): string | null {
  return currentCsrfToken;
}

async function executeApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };

  if (endpoint.startsWith('/admin')) {
    if (currentAdminToken && !headers['Authorization']) {
      headers['Authorization'] = `Bearer ${currentAdminToken}`;
    }
    const method = (options.method || 'GET').toUpperCase();
    if (
      ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method) &&
      currentCsrfToken &&
      !headers['X-CSRF-Token']
    ) {
      headers['X-CSRF-Token'] = currentCsrfToken;
    }
  }

  let response: Response;

  try {
    response = await fetch(url, {
      credentials: 'same-origin',
      ...options,
      headers,
    });
    if (!response.ok && !response.headers.get('content-type')?.includes('application/json')) {
      throw new Error('Static host non-JSON response');
    }
  } catch (_fetchErr) {
    const fullUrl = `http://localhost${url}`;
    const syntheticHeaders: Record<string, string> = { ...headers };
    if (currentAdminToken && !syntheticHeaders['Cookie']) {
      syntheticHeaders['Cookie'] = `admin_session=${currentAdminToken}`;
    }
    const syntheticReq = new Request(fullUrl, {
      ...options,
      headers: syntheticHeaders,
    });
    response = await handleApiRequest(syntheticReq);
  }

  const json = (await response.json()) as ApiResponse<T>;
  if (!json.success) {
    throw new Error(json.error.message || 'API request failed');
  }
  return json.data;
}

export const apiClient = {
  setAdminAuthToken,
  getAdminAuthToken,

  // Public Customer Operations
  async getPaymentConfig(): Promise<PaymentConfig> {
    return executeApi<PaymentConfig>('/payment-config', {
      method: 'GET',
    });
  },

  async createOrder(order: CreateOrderRequest) {
    return executeApi<{
      orderReference: string;
      accessToken: string;
      operationalStatus: OperationalStatus;
      paymentStatus: PaymentStatus;
      subtotalPaise: number;
      tokenDuePaise: number;
      balanceDuePaise: number;
      paymentInstructions: {
        vpa?: string;
        accountName?: string;
        amountInr?: string;
        transactionNote?: string;
        paymentCollectionEnabled: boolean;
        qrImageUrl?: string;
        notice?: string;
      };
    }>('/orders', {
      method: 'POST',
      body: JSON.stringify(order),
    });
  },

  // Backward compatibility alias
  async createDemoOrder(order: CreateOrderRequest) {
    return this.createOrder(order);
  },

  async submitUtr(orderReference: string, utr: string, token?: string) {
    return executeApi<{
      orderReference: string;
      paymentReference: string;
      paymentStatus: PaymentStatus;
      message: string;
    }>(`/orders/${orderReference}/utr`, {
      method: 'POST',
      headers: token ? { 'X-Order-Token': token } : {},
      body: JSON.stringify({ utr }),
    });
  },

  // Backward compatibility alias
  async submitPaymentReference(
    orderReference: string,
    utr: string,
    token?: string
  ) {
    return this.submitUtr(orderReference, utr, token);
  },

  /**
   * Retrieves order status strictly using X-Order-Token header for privacy protection.
   */
  async getOrderStatus(orderReference: string, token?: string) {
    return executeApi<{
      orderReference: string;
      customerName: string;
      operationalStatus: OperationalStatus;
      paymentStatus: PaymentStatus;
      paymentReference?: string | null;
      paymentSubmittedAt?: string | null;
      subtotalPaise: number;
      tokenAmountPaise: number;
      remainingBalancePaise: number;
      createdAt: string;
      updatedAt: string;
    }>(`/orders/${orderReference}/status`, {
      method: 'GET',
      headers: token ? { 'X-Order-Token': token } : {},
    });
  },

  /**
   * Retrieves full order record strictly using X-Order-Token header for IDOR protection.
   */
  async getOrder(orderReference: string, token?: string) {
    return executeApi<DemoOrderRecordWithItems>(
      `/orders/${orderReference}`,
      {
        method: 'GET',
        headers: token ? { 'X-Order-Token': token } : {},
      }
    );
  },

  // Admin Authentication Operations
  async adminInit(email: string, password: string) {
    return executeApi<{ message: string; email: string }>('/admin/auth/init', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  async adminLogin(emailOrPassphrase: string, password?: string) {
    const payload =
      password !== undefined
        ? { email: emailOrPassphrase, password }
        : {
            email: emailOrPassphrase.includes('@')
              ? emailOrPassphrase
              : 'astar0017@gmail.com',
            password: emailOrPassphrase,
          };

    const result = await executeApi<{
      authenticated: boolean;
      email: string;
      operatorId: string;
      mustChangePassword: boolean;
      csrfToken: string;
      sessionToken?: string;
    }>('/admin/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (result.sessionToken) {
      setAdminAuthToken(result.sessionToken);
    }
    if (result.csrfToken) {
      setAdminCsrfToken(result.csrfToken);
    }
    return result;
  },

  async adminLogout() {
    try {
      await executeApi<{ message: string }>('/admin/auth/logout', {
        method: 'POST',
      });
    } finally {
      setAdminAuthToken(null);
      setAdminCsrfToken(null);
    }
  },

  async adminChangePassword(currentPassword: string, newPassword: string) {
    return executeApi<{ message: string }>('/admin/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  },

  async checkAdminAuthSession() {
    const res = await executeApi<{
      authenticated: boolean;
      email?: string;
      operatorId?: string;
      mustChangePassword?: boolean;
      csrfToken?: string;
      error?: string;
      teamDomain?: string;
    }>('/admin/auth/session', {
      method: 'GET',
    });

    if (res.csrfToken) {
      setAdminCsrfToken(res.csrfToken);
    }
    return res;
  },

  async verifyCfAccessSession(token?: string) {
    if (token) {
      setAdminAuthToken(token.trim());
    }
    return executeApi<AdminDashboardKPIs>('/admin/dashboard', {
      method: 'GET',
    });
  },

  async getDashboardKPIs() {
    return executeApi<AdminDashboardKPIs>('/admin/dashboard', {
      method: 'GET',
    });
  },

  async getAdminOrders(filters?: {
    operationalStatus?: OperationalStatus;
    paymentStatus?: PaymentStatus;
    search?: string;
  }) {
    const params = new URLSearchParams();
    if (filters?.operationalStatus)
      params.append('operationalStatus', filters.operationalStatus);
    if (filters?.paymentStatus)
      params.append('paymentStatus', filters.paymentStatus);
    if (filters?.search) params.append('search', filters.search);

    const query = params.toString() ? `?${params.toString()}` : '';
    return executeApi<DemoOrderRecordWithItems[]>(`/admin/orders${query}`, {
      method: 'GET',
    });
  },

  async getAdminOrderById(orderId: string) {
    return executeApi<DemoOrderRecordWithItems>(`/admin/orders/${orderId}`, {
      method: 'GET',
    });
  },

  async updateOrderStatus(
    orderId: string,
    operationalStatus: OperationalStatus,
    operatorId: string = 'OP-ADMIN',
    notes?: string
  ) {
    return executeApi<DemoOrderRecordWithItems>(
      `/admin/orders/${orderId}/status`,
      {
        method: 'POST',
        body: JSON.stringify({ operationalStatus, operatorId, notes }),
      }
    );
  },

  async getAdminVariants() {
    return executeApi<ProductVariant[]>('/admin/variants', {
      method: 'GET',
    });
  },

  async updateVariantDemoPrice(
    variantId: string,
    newPricePaise: number,
    operatorId: string = 'OP-ADMIN',
    reason?: string,
    allowOverride: boolean = false
  ) {
    return executeApi<ProductVariant>(
      `/admin/variants/${variantId}/demo-price`,
      {
        method: 'POST',
        body: JSON.stringify({
          newPricePaise,
          operatorId,
          reason,
          allowOverride,
        }),
      }
    );
  },

  async getAuditLogs() {
    return executeApi<PriceAuditLog[]>('/admin/audit-logs', {
      method: 'GET',
    });
  },

  // Payment Support Issue Submission (Customer)
  async reportPaymentIssue(req: CreatePaymentIssueRequest) {
    return executeApi<{
      issueReference: string;
      message: string;
      status: PaymentIssueStatus;
    }>('/payment-issues', {
      method: 'POST',
      body: JSON.stringify(req),
    });
  },

  // Payment Support Issue Management (Admin)
  async getAdminPaymentIssues(status?: PaymentIssueStatus) {
    const query = status ? `?status=${status}` : '';
    return executeApi<DbPaymentIssue[]>(`/admin/payment-issues${query}`, {
      method: 'GET',
    });
  },

  async updatePaymentIssueStatus(
    id: string,
    status: PaymentIssueStatus,
    staffNotes?: string
  ) {
    return executeApi<DbPaymentIssue>(`/admin/payment-issues/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status, staffNotes }),
    });
  },

  // Inventory Management (Admin)
  async getAdminInventory() {
    return executeApi<DbInventoryItem[]>('/admin/inventory', {
      method: 'GET',
    });
  },

  async adjustInventoryStock(
    variantId: string,
    newStock: number,
    operatorId: string = 'OP-ADMIN',
    reason?: string
  ) {
    return executeApi<DbInventoryItem>('/admin/inventory/adjust', {
      method: 'POST',
      body: JSON.stringify({ variantId, newStock, operatorId, reason }),
    });
  },

  async getInventoryAuditLogs() {
    return executeApi<DbInventoryAuditLog[]>('/admin/inventory/audit-logs', {
      method: 'GET',
    });
  },

  // QR Version Rotation (Admin)
  async getAdminQrVersions() {
    return executeApi<DbQrVersion[]>('/admin/qr', {
      method: 'GET',
    });
  },

  async uploadAdminQr(req: UploadQrRequest) {
    return executeApi<DbQrVersion>('/admin/qr/upload', {
      method: 'POST',
      body: JSON.stringify(req),
    });
  },

  async activateAdminQr(id: string, notes?: string) {
    return executeApi<DbQrVersion>(`/admin/qr/${id}/activate`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    });
  },

  async deactivateAdminQr(id: string) {
    return executeApi<DbQrVersion>(`/admin/qr/${id}/deactivate`, {
      method: 'POST',
    });
  },

  // Customer History & Directory (Admin)
  async getAdminCustomers(search?: string) {
    const query = search ? `?search=${encodeURIComponent(search)}` : '';
    return executeApi<DbCustomerDirectoryItem[]>(`/admin/customers${query}`, {
      method: 'GET',
    });
  },

  async getAdminCustomerDetails(id: string) {
    return executeApi<{
      customer: DbCustomerDirectoryItem;
      orders: DemoOrderRecordWithItems[];
    }>(`/admin/customers/${id}`, {
      method: 'GET',
    });
  },

  // Sales Analytics & Reporting (Admin)
  async getAdminSalesReport(range: 'today' | '7d' | '30d' | 'all' = 'today') {
    return executeApi<SalesReportResponse>(`/admin/reports/sales?range=${range}`, {
      method: 'GET',
    });
  },

  async exportAdminSalesReportCsv(range: 'today' | '7d' | '30d' | 'all' = 'today') {
    const url = `${API_BASE}/admin/reports/export?range=${range}`;
    const token = getAdminAuthToken();
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(url, { headers });
    if (!res.ok) {
      throw new Error('Failed to export CSV report');
    }
    return res.text();
  },
};
