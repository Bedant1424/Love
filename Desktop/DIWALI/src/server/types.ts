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
