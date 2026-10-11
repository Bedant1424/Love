import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCart, MAX_QUANTITY } from '../../src/hooks/useCart';

describe('useCart Hook', () => {
  beforeEach(() => {
    localStorage.clear();
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

  it('adds unpriced items to enquiry basket without inventing a line price', () => {
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

    // Provisional subtotal must remain 0 and count unpriced items
    expect(result.current.totals.provisionalSubtotalPaise).toBe(0);
    expect(result.current.totals.pricedItemCount).toBe(0);
    expect(result.current.totals.unpricedItemCount).toBe(1);
  });

  it('calculates mixed baskets: computes subtotal for priced items and counts unpriced items separately', () => {
    const { result } = renderHook(() => useCart());

    // 1. Skyshot Bigboss: ₹350 (35000 paise) × 1 = 35000 paise
    act(() => {
      result.current.addItem('prod_skyshot_bigboss', 'var_bigboss_3pcs', 1);
    });

    // 2. Pandav: Price on enquiry × 2
    act(() => {
      result.current.addItem('prod_pandav', 'var_pandav_5pcs', 2);
    });

    // 3. 9cm Sparklers: ₹180 (18000 paise) × 2 = 36000 paise
    act(() => {
      result.current.addItem('prod_sparklers_9cm', 'var_sparklers_9cm_box', 2);
    });

    expect(result.current.items.length).toBe(3);
    expect(result.current.totals.totalQuantity).toBe(5);
    expect(result.current.totals.pricedItemCount).toBe(2);
    expect(result.current.totals.unpricedItemCount).toBe(1);
    // Subtotal: 35000 + 36000 = 71000 paise (₹710.00)
    expect(result.current.totals.provisionalSubtotalPaise).toBe(71000);
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
    expect(result.current.items[0].productId).toBe('prod_single_shot');

    act(() => {
      result.current.clearCart();
    });
    expect(result.current.items.length).toBe(0);
    expect(result.current.isEmpty).toBe(true);
  });

  it('ignores attempts to add non-existent products or variants', () => {
    const { result } = renderHook(() => useCart());

    act(() => {
      result.current.addItem('non_existent_product', 'non_existent_variant', 1);
    });
    expect(result.current.items.length).toBe(0);
  });

  it('recovers cart from LocalStorage on mount', () => {
    localStorage.setItem(
      'nt_cart_items_v1',
      JSON.stringify([
        { productId: 'prod_skyshot_bigboss', variantId: 'var_bigboss_3pcs', quantity: 3 },
      ])
    );

    const { result } = renderHook(() => useCart());
    expect(result.current.items.length).toBe(1);
    expect(result.current.items[0].quantity).toBe(3);
    expect(result.current.items[0].lineSubtotalPaise).toBe(105000); // 35000 * 3
  });
});
