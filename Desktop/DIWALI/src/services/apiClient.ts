import { handleApiRequest } from '../server/api';
import {
  AdminDashboardKPIs,
  ApiResponse,
  CreateOrderRequest,
  DemoOrderRecordWithItems,
  OperationalStatus,
  PaymentStatus,
  PriceAuditLog,
} from '../server/types';
import { ProductVariant } from '../types/catalogue';

const API_BASE = '/api/v1';

async function executeApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  let response: Response;

  try {
    response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    });
  } catch (_fetchErr) {
    // If standard fetch fails (e.g. no running HTTP server in pure unit test), dispatch directly to handler
    const fullUrl = `http://localhost${url}`;
    const syntheticReq = new Request(fullUrl, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
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
  // Public Customer Operations
  async createDemoOrder(order: CreateOrderRequest) {
    return executeApi<{
      orderReference: string;
      accessToken: string;
      operationalStatus: OperationalStatus;
      paymentStatus: PaymentStatus;
      subtotalPaise: number;
      tokenDuePaise: number;
      balanceDuePaise: number;
      isSimulatedDemo: true;
      paymentInstructions: {
        vpa: string;
        accountName: string;
        amountInr: string;
        transactionNote: string;
        notice: string;
      };
    }>('/orders', {
      method: 'POST',
      body: JSON.stringify(order),
    });
  },

  async submitPaymentReference(orderReference: string, utr: string, token?: string) {
    return executeApi<{
      orderReference: string;
      paymentReference: string;
      paymentStatus: PaymentStatus;
      message: string;
    }>(`/orders/${orderReference}/payment-reference`, {
      method: 'POST',
      headers: token ? { 'X-Order-Token': token } : {},
      body: JSON.stringify({ utr }),
    });
  },

  async getOrder(orderReference: string, token?: string) {
    const query = token ? `?token=${encodeURIComponent(token)}` : '';
    return executeApi<DemoOrderRecordWithItems>(`/orders/${orderReference}${query}`, {
      method: 'GET',
    });
  },

  // Admin Dashboard Operations
  async adminLogin(passphrase: string) {
    return executeApi<{
      token: string;
      operatorId: string;
      role: string;
      expiresIn: number;
    }>('/admin/auth/login', {
      method: 'POST',
      body: JSON.stringify({ passphrase }),
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
    if (filters?.operationalStatus) params.append('operationalStatus', filters.operationalStatus);
    if (filters?.paymentStatus) params.append('paymentStatus', filters.paymentStatus);
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
    return executeApi<DemoOrderRecordWithItems>(`/admin/orders/${orderId}/status`, {
      method: 'POST',
      body: JSON.stringify({ operationalStatus, operatorId, notes }),
    });
  },

  async verifyPayment(
    orderId: string,
    action: 'APPROVE_TOKEN' | 'REJECT_INVALID_UTR',
    operatorId: string = 'OP-ADMIN',
    operatorNote?: string
  ) {
    return executeApi<DemoOrderRecordWithItems>(`/admin/orders/${orderId}/verify-payment`, {
      method: 'POST',
      body: JSON.stringify({ action, operatorId, operatorNote }),
    });
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
    return executeApi<ProductVariant>(`/admin/variants/${variantId}/demo-price`, {
      method: 'POST',
      body: JSON.stringify({
        newPricePaise,
        operatorId,
        reason,
        allowOverride,
      }),
    });
  },

  async getAuditLogs() {
    return executeApi<PriceAuditLog[]>('/admin/audit-logs', {
      method: 'GET',
    });
  },
};
