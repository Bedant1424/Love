import { PriceStatus, PricingOrigin } from './catalogue';
import {
  TOKEN_TIER_THRESHOLD_PAISE,
  TOKEN_LOW_TIER_PAISE,
  TOKEN_HIGH_TIER_PAISE,
  calculateTokenAmountPaise,
  calculateRemainingBalancePaise,
} from '../utils/tokenPolicy';

export {
  TOKEN_TIER_THRESHOLD_PAISE,
  TOKEN_LOW_TIER_PAISE,
  TOKEN_HIGH_TIER_PAISE,
  calculateTokenAmountPaise,
  calculateRemainingBalancePaise,
};

/**
 * Backward compatibility alias: default high tier token amount (₹100).
 */
export const TOKEN_AMOUNT_PAISE = TOKEN_HIGH_TIER_PAISE;

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
  tokenAmountPaise: number; // Tiered: ₹50 if subtotal < ₹200 (capped at subtotal if < ₹50), ₹100 if subtotal >= ₹200
  remainingBalancePaise: number; // max(0, subtotal - tokenAmountPaise)
  canProceedToCheckout: boolean;
  minOrderRequirementMet: boolean; // subtotal > 0
  hasUnpricedItems: boolean;
  checkoutBlockedReason?: string;
}

export type PaymentStatus =
  | 'UNPAID'
  | 'RECORDED_UNVERIFIED'
  | 'FAILED'
  | 'PENDING_VERIFICATION' // backward compat alias
  | 'VERIFIED_TOKEN'      // backward compat alias
  | 'RECONCILED';         // backward compat alias

export type SimulatedPaymentStatus = PaymentStatus;

export interface OrderRecord {
  orderReference: string;
  accessToken: string;
  createdAt: string;
  customerName: string;
  customerMobile: string;
  items: CartItem[];
  subtotalPaise: number;
  tokenAmountPaise: number;
  remainingBalancePaise: number;
  paymentStatus: PaymentStatus;
  paymentReference?: string | null;
}

// Backward compatibility alias
export type DemoOrderRecord = OrderRecord;
