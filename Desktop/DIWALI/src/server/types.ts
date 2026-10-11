import { CustomerDetails } from '../types/customer';

export type OperationalStatus =
  | 'SUBMITTED'
  | 'CONFIRMED'
  | 'PREPARING'
  | 'READY_FOR_PICKUP'
  | 'COMPLETED'
  | 'CANCELLED';

export type PaymentStatus =
  | 'UNPAID'
  | 'RECORDED_UNVERIFIED'
  | 'FAILED'
  | 'PENDING_VERIFICATION' // backward compat alias
  | 'VERIFIED_TOKEN'      // backward compat alias
  | 'RECONCILED';         // backward compat alias

export interface DbOrder {
  id: string;
  order_reference: string;
  customer_name: string;
  customer_mobile: string;
  fulfilment_preference: string;
  operational_status: OperationalStatus;
  payment_status: PaymentStatus;
  subtotal_paise: number;
  token_amount_paise: number;
  remaining_balance_paise: number;
  access_token: string;
  idempotency_key?: string | null;
  customer_notes?: string | null;
  payment_reference?: string | null; // 12-digit UTR string
  payment_submitted_at?: string | null;
  is_simulated_demo: number;
  created_at: string;
  updated_at: string;
}

export interface DbOrderItem {
  id: string;
  order_id: string;
  product_id: string;
  variant_id: string;
  product_name_snapshot: string;
  variant_name_snapshot: string;
  unit_price_paise: number;
  quantity: number;
  line_subtotal_paise: number;
  created_at: string;
}

export interface DemoOrderRecordWithItems extends DbOrder {
  items: DbOrderItem[];
}

export interface PaymentSubmission {
  id: string;
  order_id: string;
  order_reference: string;
  utr: string; // Exactly 12-digit string
  payment_status: 'RECORDED_UNVERIFIED' | 'FAILED';
  created_at: string;
}

export interface PriceAuditLog {
  id: string;
  entity_type:
    | 'VARIANT_PRICE'
    | 'ORDER_STATUS'
    | 'PAYMENT_VERIFICATION'
    | 'PAYMENT_SUBMISSION'
    | 'SYSTEM_SETTING';
  entity_id: string;
  action: string;
  operator_id: string;
  old_value_json?: string | null;
  new_value_json?: string | null;
  reason?: string | null;
  is_override: number;
  created_at: string;
}

export interface AdminDashboardKPIs {
  totalDemoOrders: number;
  totalOrders: number;
  recordedUnverifiedCount: number;
  utrSubmittedCount: number;
  awaitingUtrCount: number;
  pendingPaymentVerificationCount: number; // backward-compat alias
  ordersReadyForPickupCount: number;
  confirmedTodayCount: number;
  completedOrdersCount: number;
  unresolvedVariantsCount: number;
  totalVariantsCount: number;
}

export interface PaymentConfig {
  paymentCollectionEnabled: boolean;
  isRestrictedEnv: boolean;
  message?: string;
  vpa?: string | null;
  accountName?: string | null;
  testFixture?: {
    qrPayload: string;
    vpa: string;
    accountName: string;
    isRestrictedEnv: boolean;
    notice: string;
  };
  tokenTiers?: {
    thresholdPaise: number;
    lowTierPaise: number;
    highTierPaise: number;
  };
}

export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

export interface CreateOrderRequest {
  customer: CustomerDetails;
  items: Array<{
    variantId: string;
    quantity: number;
  }>;
  idempotencyKey?: string;
}

export interface UpdateOrderStatusRequest {
  operationalStatus: OperationalStatus;
  operatorId?: string;
  notes?: string;
}

export interface SubmitUtrRequest {
  utr: string;
}

export interface UpdateDemoPriceRequest {
  newPricePaise: number;
  operatorId: string;
  reason?: string;
  allowOverride?: boolean;
}

// Payment Support Issues
export type PaymentIssueType =
  | 'QR_LIMIT_REACHED'
  | 'QR_NOT_SCANNING'
  | 'APP_CANNOT_OPEN'
  | 'PAYMENT_APP_ERROR'
  | 'UTR_SUBMISSION_FAILED'
  | 'OTHER';

export type PaymentIssueStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'DISMISSED';

export interface DbPaymentIssue {
  id: string;
  issue_reference: string;
  order_reference?: string | null;
  customer_name: string;
  customer_mobile: string;
  issue_type: PaymentIssueType;
  description?: string | null;
  status: PaymentIssueStatus;
  staff_notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreatePaymentIssueRequest {
  orderReference?: string;
  customerName: string;
  customerMobile: string;
  issueType: PaymentIssueType;
  description?: string;
}

// QR Versions Management
export interface DbQrVersion {
  id: string;
  version_number: number;
  label: string;
  vpa: string;
  account_name: string;
  image_url: string;
  r2_object_key?: string | null;
  content_type?: string | null;
  file_size_bytes?: number | null;
  sha256_checksum?: string | null;
  merchant_category_code?: string | null;
  merchant_id?: string | null;
  is_active: number;
  upload_operator_id: string;
  activation_notes?: string | null;
  activated_at?: string | null;
  deactivated_at?: string | null;
  created_at: string;
}

export interface UploadQrRequest {
  label: string;
  vpa: string;
  accountName: string;
  imageDataUri: string; // Base64 data URI (image/png, image/jpeg, image/webp)
  operatorId?: string;
  activateNow?: boolean;
}

// Inventory Tracking
export interface DbInventoryItem {
  variant_id: string;
  product_id: string;
  product_name: string;
  variant_name: string;
  current_stock: number;
  reserved_stock: number;
  available_stock: number;
  low_stock_threshold: number;
  is_low_stock: boolean;
}

export interface DbInventoryAuditLog {
  id: string;
  variant_id: string;
  action: 'MANUAL_ADJUST' | 'RESERVATION' | 'RELEASE' | 'COMMIT' | 'CANCEL';
  quantity_delta: number;
  stock_before: number;
  stock_after: number;
  operator_id: string;
  reason?: string | null;
  created_at: string;
}

export interface AdjustStockRequest {
  variantId: string;
  newStock: number;
  operatorId?: string;
  reason?: string;
}

// Customer Directory
export interface DbCustomerDirectoryItem {
  id: string;
  full_name: string;
  mobile_number: string;
  total_orders: number;
  lifetime_spent_paise: number;
  last_order_date?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

// Sales Analytics and Reporting
export interface SalesReportSummary {
  totalOrders: number;
  totalGrossOrderPaise: number;
  totalVerifiedFundsPaise: number;
  totalPendingUnverifiedPaise: number;
  averageOrderValuePaise: number;
  dateRange: string;
}

export interface SalesReportDailyTrend {
  date: string;
  orderCount: number;
  grossPaise: number;
  verifiedPaise: number;
}

export interface SalesReportProductBreakdown {
  productId: string;
  productName: string;
  quantitySold: number;
  totalRevenuePaise: number;
}

export interface SalesReportResponse {
  summary: SalesReportSummary;
  dailyTrends: SalesReportDailyTrend[];
  productBreakdown: SalesReportProductBreakdown[];
}

