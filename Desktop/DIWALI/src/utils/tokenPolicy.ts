/**
 * Nagarjuna Traders - Token Calculation Policy
 * Shared business-logic rules for advance order tokens.
 *
 * Rules:
 * - Subtotal below ₹200 (20,000 paise): token amount is ₹50 (5,000 paise).
 * - Subtotal equal to or above ₹200 (20,000 paise): token amount is ₹100 (10,000 paise).
 * - Treat exactly ₹200 as belonging to the ₹100 tier.
 * - Subtotals below the token amount (e.g. below ₹50): the safe token amount is capped
 *   at the order subtotal (Math.min(subtotalPaise, 5000)) so the token never exceeds
 *   the order value and remaining balance is never negative.
 * - Remaining balance = order subtotal minus token amount (Math.max(0, subtotal - token)).
 */

export const TOKEN_TIER_THRESHOLD_PAISE = 20000; // ₹200.00 in paise
export const TOKEN_LOW_TIER_PAISE = 5000;         // ₹50.00 in paise
export const TOKEN_HIGH_TIER_PAISE = 10000;       // ₹100.00 in paise

/**
 * Calculates advance token amount in integer paise based on subtotal.
 * Safely caps token at subtotal if subtotal is below the low tier token amount.
 * @param subtotalPaise Order subtotal in integer paise
 * @returns Token amount in integer paise
 */
export function calculateTokenAmountPaise(subtotalPaise: number): number {
  if (subtotalPaise <= 0) {
    return 0;
  }
  if (subtotalPaise < TOKEN_TIER_THRESHOLD_PAISE) {
    // If subtotal is below the standard low tier token (₹50), the safe token amount
    // is capped at the order subtotal so it never exceeds the total order value.
    return Math.min(subtotalPaise, TOKEN_LOW_TIER_PAISE);
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
