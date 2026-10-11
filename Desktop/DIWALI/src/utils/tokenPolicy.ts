/**
 * Nagarjuna Traders - Exact Token Calculation Policy
 * Shared business-logic rules for advance order tokens.
 *
 * Rules:
 * - Subtotal below ₹200 (20,000 paise): token exactly ₹50 (5,000 paise).
 * - Subtotal equal to or above ₹200 (20,000 paise): token exactly ₹100 (10,000 paise).
 * - Subtotal below ₹50 (5,000 paise): reject order creation because the required token
 *   would exceed the subtotal.
 * - Subtotal of exactly ₹50: token ₹50 and balance ₹0.
 * - Subtotal of exactly ₹200: token ₹100 and balance ₹100.
 * - Remove any logic that silently reduces the token to match a subtotal below ₹50.
 * - Integer paise used throughout (₹1 = 100 paise).
 */

export const TOKEN_TIER_THRESHOLD_PAISE = 20000; // ₹200.00 in paise
export const TOKEN_LOW_TIER_PAISE = 5000;         // ₹50.00 in paise
export const TOKEN_HIGH_TIER_PAISE = 10000;       // ₹100.00 in paise
export const MIN_ORDER_SUBTOTAL_PAISE = 5000;     // ₹50.00 in paise

/**
 * Calculates advance token amount in integer paise based on subtotal.
 * Subtotal < ₹200 -> token exactly ₹50 (5,000 paise).
 * Subtotal >= ₹200 -> token exactly ₹100 (10,000 paise).
 * Note: Never silently reduces the token to match a subtotal below ₹50.
 */
export function calculateTokenAmountPaise(subtotalPaise: number): number {
  if (subtotalPaise < TOKEN_TIER_THRESHOLD_PAISE) {
    return TOKEN_LOW_TIER_PAISE;
  }
  return TOKEN_HIGH_TIER_PAISE;
}

/**
 * Calculates remaining balance payable at physical counter collection.
 * Remaining balance = max(0, subtotal - token).
 */
export function calculateRemainingBalancePaise(
  subtotalPaise: number,
  tokenAmountPaise: number
): number {
  return Math.max(0, subtotalPaise - tokenAmountPaise);
}

/**
 * Validates whether an order subtotal is eligible for checkout.
 * Subtotals below ₹50 are rejected because the required advance token (₹50)
 * would exceed the order subtotal.
 */
export function isOrderSubtotalEligible(subtotalPaise: number): boolean {
  return subtotalPaise >= MIN_ORDER_SUBTOTAL_PAISE;
}

/**
 * Returns human-readable validation error message when subtotal is below minimum.
 */
export function getSubtotalValidationError(subtotalPaise: number): string | null {
  if (subtotalPaise <= 0) {
    return 'Your basket is currently empty. Add at least one cracker item to proceed.';
  }
  if (subtotalPaise < MIN_ORDER_SUBTOTAL_PAISE) {
    return 'Order subtotal must be at least ₹50.00 because the required advance token is ₹50.00.';
  }
  return null;
}
