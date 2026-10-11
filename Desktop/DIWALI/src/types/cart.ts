import { PriceStatus, PricingOrigin } from './catalogue';

/**
 * Shared fixed demo token constant: ₹100 = 10,000 paise.
 * Invariant: Never a percentage, does not scale with subtotal.
 */
export const TOKEN_AMOUNT_PAISE = 10000;
export const MIN_ORDER_SUBTOTAL_PAISE = 10000;

export interface StoredCartItem {
  productId: string;
  variantId: string;
  quantity: number;
}

export interface CartItem {
  productId: string;
  variantId: string;
  productName: string;
  variantName: string;
  packInfo: string;
  isPackInfoVerified: boolean;
  pricePaise: number | null;
  printedPriceText: string;
  priceStatus: PriceStatus;
  pricingOrigin: PricingOrigin;
  quantity: number;
  lineSubtotalPaise: number | null;
}

export interface CartTotals {
  totalQuantity: number;
  pricedItemCount: number;
  unpricedItemCount: number;
  subtotalPaise: number;
  provisionalSubtotalPaise: number; // backward compatibility alias
  tokenAmountPaise: number; // Fixed at 10,000 paise (₹100)
  remainingBalancePaise: number; // max(0, subtotal - 10,000)
  canProceedToCheckout: boolean;
  minOrderRequirementMet: boolean;
  hasUnpricedItems: boolean;
  checkoutBlockedReason?: string;
}

export type SimulatedPaymentStatus =
  | 'NOT_STARTED'
  | 'PENDING'
  | 'SUCCESS'
  | 'FAILED';

export interface DemoOrderRecord {
  demoOrderId: string;
  createdAt: string;
  customerName: string;
  customerMobile: string;
  items: CartItem[];
  subtotalPaise: number;
  tokenAmountPaise: number;
  remainingBalancePaise: number;
  paymentStatus: SimulatedPaymentStatus;
  isSimulatedDemo: true;
}
