/**
 * Nagarjuna Traders - Token Calculation Policy
 * Shared business-logic rules for advance order tokens.
 *
 * Rules:
 * - Order subtotal below ₹200 (20,000 paise): token amount is ₹50 (5,000 paise).
 * - Order subtotal equal to or above ₹200 (20,000 paise): token amount is ₹100 (10,000 paise).
 * - Treat exactly ₹200 as belonging to the ₹100 tier.
 * - Remaining balance = order subtotal minus token amount (never negative).
 */

export const TOKEN_TIER_THRESHOLD_PAISE = 20000; // ₹200.00 in paise
export const TOKEN_LOW_TIER_PAISE = 5000;         // ₹50.00 in paise
export const TOKEN_HIGH_TIER_PAISE = 10000;       // ₹100.00 in paise
export const MIN_ORDER_SUBTOTAL_PAISE = 5000;     // Minimum order subtotal is ₹50.00

/**
 * Calculates advance token amount in integer paise based on subtotal.
 * @param subtotalPaise Order subtotal in integer paise
 * @returns Token amount in integer paise
 */
export function calculateTokenAmountPaise(subtotalPaise: number): number {
  if (subtotalPaise < TOKEN_TIER_THRESHOLD_PAISE) {
    return TOKEN_LOW_TIER_PAISE;
  }
  return TOKEN_HIGH_TIER_PAISE;
}

/**
 * Calculates remaining balance payable at physical counter collection.
 * @param subtotalPaise Order subtotal in integer paise
 * @param tokenAmountPaise Advance token amount in integer paise
 * @returns Non-negative balance due in paise
 */
export function calculateRemainingBalancePaise(
  subtotalPaise: number,
  tokenAmountPaise: number
): number {
  return Math.max(0, subtotalPaise - tokenAmountPaise);
}
