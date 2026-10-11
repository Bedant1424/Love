import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCart, MAX_QUANTITY } from '../../src/hooks/useCart';
import {
  calculateTokenAmountPaise,
  calculateRemainingBalancePaise,
  TOKEN_TIER_THRESHOLD_PAISE,
  TOKEN_LOW_TIER_PAISE,
  TOKEN_HIGH_TIER_PAISE,
} from '../../src/utils/tokenPolicy';

describe('useCart Hook & Tiered Token Calculation Policy', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('Pure Token Calculation Policy (tokenPolicy.ts)', () => {
    it('exports defined tier thresholds and constants', () => {
      expect(TOKEN_TIER_THRESHOLD_PAISE).toBe(20000);
      expect(TOKEN_LOW_TIER_PAISE).toBe(5000);
      expect(TOKEN_HIGH_TIER_PAISE).toBe(10000);
    });

    it('caps token amount to subtotal for subtotals below ₹50 so remaining balance is never negative', () => {
      expect(calculateTokenAmountPaise(3000)).toBe(3000); // ₹30 subtotal -> ₹30 token
      expect(calculateRemainingBalancePaise(3000, 3000)).toBe(0);
      expect(calculateTokenAmountPaise(1000)).toBe(1000); // ₹10 subtotal -> ₹10 token
      expect(calculateRemainingBalancePaise(1000, 1000)).toBe(0);
    });

    it('returns ₹50 (5,000 paise) token for subtotal below ₹200 (20,000 paise)', () => {
      expect(calculateTokenAmountPaise(5000)).toBe(5000); // ₹50
      expect(calculateTokenAmountPaise(15000)).toBe(5000); // ₹150
      expect(calculateTokenAmountPaise(19900)).toBe(5000); // ₹199
      expect(calculateTokenAmountPaise(19999)).toBe(5000); // ₹199.99
    });

    it('returns ₹100 (10,000 paise) token for exact ₹200 boundary', () => {
      // Prompt: "Treat exactly ₹200 as belonging to the ₹100 tier."
      expect(calculateTokenAmountPaise(20000)).toBe(10000); // ₹200.00
    });

    it('returns ₹100 (10,000 paise) token for subtotal strictly above ₹200', () => {
      expect(calculateTokenAmountPaise(20001)).toBe(10000); // ₹200.01
      expect(calculateTokenAmountPaise(35000)).toBe(10000); // ₹350
      expect(calculateTokenAmountPaise(100000)).toBe(10000); // ₹1,000
    });

    it('computes exact remaining balance matching prompt specification table', () => {
      // Examples from prompt:
      // Subtotal ₹150 -> Token ₹50 -> Balance ₹100
      expect(calculateRemainingBalancePaise(15000, 5000)).toBe(10000);

      // Subtotal ₹199 -> Token ₹50 -> Balance ₹149
      expect(calculateRemainingBalancePaise(19900, 5000)).toBe(14900);

      // Subtotal ₹200 -> Token ₹100 -> Balance ₹100
      expect(calculateRemainingBalancePaise(20000, 10000)).toBe(10000);

      // Subtotal ₹350 -> Token ₹100 -> Balance ₹250
      expect(calculateRemainingBalancePaise(35000, 10000)).toBe(25000);

      // Subtotal ₹1,000 -> Token ₹100 -> Balance ₹900
      expect(calculateRemainingBalancePaise(100000, 10000)).toBe(90000);
    });

    it('ensures remaining balance is never negative', () => {
      expect(calculateRemainingBalancePaise(4000, 5000)).toBe(0);
      expect(calculateRemainingBalancePaise(0, 5000)).toBe(0);
    });
  });

  it('initializes with empty cart when storage is empty', () => {
    const { result } = renderHook(() => useCart());
    expect(result.current.items).toEqual([]);
    expect(result.current.isEmpty).toBe(true);
    expect(result.current.totals.totalQuantity).toBe(0);
    expect(result.current.totals.provisionalSubtotalPaise).toBe(0);
  });

  it('adds priced items and computes exact integer paise subtotal', () => {
    const { result } = renderHook(() => useCart());

    // Skyshot Bigboss: 35000 paise (₹350.00)
    act(() => {
      result.current.addItem('prod_skyshot_bigboss', 'var_bigboss_3pcs', 2);
    });

    expect(result.current.items.length).toBe(1);
    expect(result.current.items[0].productName).toBe('Skyshot - Bigboss');
    expect(result.current.items[0].quantity).toBe(2);
    expect(result.current.items[0].pricePaise).toBe(35000);
    expect(result.current.items[0].lineSubtotalPaise).toBe(70000);
    expect(result.current.totals.provisionalSubtotalPaise).toBe(70000);
    expect(result.current.totals.pricedItemCount).toBe(1);
    expect(result.current.totals.unpricedItemCount).toBe(0);
  });

  it('adds unpriced items without inventing a price', () => {
    const { result } = renderHook(() => useCart());

    // Pandav (₹200 to ₹250 price range on poster -> pricePaise is null)
    act(() => {
      result.current.addItem('prod_pandav', 'var_pandav_5pcs', 1);
    });

    expect(result.current.items.length).toBe(1);
    expect(result.current.items[0].productName).toBe('Pandav');
    expect(result.current.items[0].pricePaise).toBeNull();
    expect(result.current.items[0].lineSubtotalPaise).toBeNull();
    expect(result.current.items[0].priceStatus).toBe('PRICE_ON_ENQUIRY');

    expect(result.current.totals.provisionalSubtotalPaise).toBe(0);
    expect(result.current.totals.pricedItemCount).toBe(0);
    expect(result.current.totals.unpricedItemCount).toBe(1);
  });

  it('increments, decrements, and updates quantities safely within 1 to 50 limits', () => {
    const { result } = renderHook(() => useCart());

    act(() => {
      result.current.addItem('prod_single_shot', 'var_single_shot_std', 1);
    });

    expect(result.current.getItemQuantity('prod_single_shot', 'var_single_shot_std')).toBe(1);

    act(() => {
      result.current.incrementQuantity('prod_single_shot', 'var_single_shot_std');
    });
    expect(result.current.getItemQuantity('prod_single_shot', 'var_single_shot_std')).toBe(2);

    act(() => {
      result.current.updateQuantity('prod_single_shot', 'var_single_shot_std', 10);
    });
    expect(result.current.getItemQuantity('prod_single_shot', 'var_single_shot_std')).toBe(10);

    // Test upper clamp (MAX_QUANTITY = 50)
    act(() => {
      result.current.updateQuantity('prod_single_shot', 'var_single_shot_std', 999);
    });
    expect(result.current.getItemQuantity('prod_single_shot', 'var_single_shot_std')).toBe(MAX_QUANTITY);

    // Test decrement past 1 removes item
    act(() => {
      result.current.updateQuantity('prod_single_shot', 'var_single_shot_std', 1);
    });
    act(() => {
      result.current.decrementQuantity('prod_single_shot', 'var_single_shot_std');
    });
    expect(result.current.items.length).toBe(0);
  });

  it('removes an item explicitly and clears cart', () => {
    const { result } = renderHook(() => useCart());

    act(() => {
      result.current.addItem('prod_skyshot_bigboss', 'var_bigboss_3pcs', 1);
      result.current.addItem('prod_single_shot', 'var_single_shot_std', 1);
    });
    expect(result.current.items.length).toBe(2);

    act(() => {
      result.current.removeItem('prod_skyshot_bigboss', 'var_bigboss_3pcs');
    });
    expect(result.current.items.length).toBe(1);

    act(() => {
      result.current.clearCart();
    });
    expect(result.current.items.length).toBe(0);
    expect(result.current.isEmpty).toBe(true);
  });

  describe('Tiered Token Integration in useCart Hook', () => {
    it('applies ₹50 token when subtotal is below ₹200 (e.g., Bijli Laddi ₹60)', () => {
      const { result } = renderHook(() => useCart());

      // Bijli Laddi: ₹60 (6000 paise)
      act(() => {
        result.current.addItem('prod_bijli_laddi', 'var_bijli_60', 1);
      });

      expect(result.current.totals.subtotalPaise).toBe(6000);
      expect(result.current.totals.tokenAmountPaise).toBe(5000); // ₹50 tier
      expect(result.current.totals.remainingBalancePaise).toBe(1000); // ₹60 - ₹50 = ₹10
      expect(result.current.totals.minOrderRequirementMet).toBe(true);
      expect(result.current.totals.canProceedToCheckout).toBe(true);
    });

    it('applies ₹100 token when subtotal is above ₹200 (e.g., Skyshot Bigboss ₹350)', () => {
      const { result } = renderHook(() => useCart());

      // Skyshot Bigboss: ₹350 (35000 paise)
      act(() => {
        result.current.addItem('prod_skyshot_bigboss', 'var_bigboss_3pcs', 1);
      });

      expect(result.current.totals.subtotalPaise).toBe(35000);
      expect(result.current.totals.tokenAmountPaise).toBe(10000); // ₹100 tier
      expect(result.current.totals.remainingBalancePaise).toBe(25000); // ₹350 - ₹100 = ₹250
      expect(result.current.totals.minOrderRequirementMet).toBe(true);
      expect(result.current.totals.canProceedToCheckout).toBe(true);
    });

    it('blocks checkout when subtotal contains unpriced items', () => {
      const { result } = renderHook(() => useCart());

      act(() => {
        result.current.addItem('prod_skyshot_bigboss', 'var_bigboss_3pcs', 1);
        result.current.addItem('prod_pandav', 'var_pandav_5pcs', 1);
      });

      expect(result.current.totals.hasUnpricedItems).toBe(true);
      expect(result.current.totals.canProceedToCheckout).toBe(false);
      expect(result.current.totals.checkoutBlockedReason).toContain('must have a confirmed price');
    });
  });
});
