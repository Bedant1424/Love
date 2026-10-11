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
  | 'PENDING_VERIFICATION'
  | 'VERIFIED_TOKEN'
  | 'FAILED';

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
  payment_reference?: string | null;
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

export interface PriceAuditLog {
  id: string;
  entity_type: 'VARIANT_PRICE' | 'ORDER_STATUS' | 'PAYMENT_VERIFICATION' | 'SYSTEM_SETTING';
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
  pendingPaymentVerificationCount: number;
  ordersReadyForPickupCount: number;
  confirmedTodayCount: number;
  completedOrdersCount: number;
  totalTokenCollectedPaise: number;
  totalBalanceCollectedPaise: number;
  unresolvedVariantsCount: number;
  totalVariantsCount: number;
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

export interface VerifyPaymentRequest {
  action: 'APPROVE_TOKEN' | 'REJECT_INVALID_UTR';
  operatorId?: string;
  operatorNote?: string;
}

export interface UpdateDemoPriceRequest {
  newPricePaise: number;
  operatorId: string;
  reason?: string;
  allowOverride?: boolean;
}
