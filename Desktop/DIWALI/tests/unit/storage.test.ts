import { describe, it, expect, beforeEach } from 'vitest';
import {
  loadCartFromStorage,
  saveCartToStorage,
  clearCartStorage,
} from '../../src/utils/storage';

describe('Storage Utility (Untrusted LocalStorage Sanitization)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('loads valid cart items correctly', () => {
    const valid = [
      { productId: 'prod_skyshot_bigboss', variantId: 'var_bigboss_3pcs', quantity: 2 },
    ];
    saveCartToStorage(valid);
    expect(loadCartFromStorage()).toEqual(valid);
  });

  it('gracefully handles non-array or corrupted JSON', () => {
    localStorage.setItem('nt_cart_items_v1', 'not valid json {{{');
    expect(loadCartFromStorage()).toEqual([]);

    localStorage.setItem('nt_cart_items_v1', '{"not": "an array"}');
    expect(loadCartFromStorage()).toEqual([]);
  });

  it('filters out items with invalid fields, negative quantities, or non-numeric values', () => {
    const corruptData = [
      { productId: 'prod_1', variantId: 'var_1', quantity: 3 }, // valid
      { productId: '', variantId: 'var_2', quantity: 2 }, // invalid product ID
      { productId: 'prod_3', variantId: '', quantity: 1 }, // invalid variant ID
      { productId: 'prod_4', variantId: 'var_4', quantity: -5 }, // negative quantity
      { productId: 'prod_5', variantId: 'var_5', quantity: 0 }, // zero quantity
      { productId: 'prod_6', variantId: 'var_6', quantity: 999 }, // excessive quantity > 50
      { productId: 'prod_7', variantId: 'var_7', quantity: 'two' }, // non-number
      null,
      undefined,
      'string-instead-of-object',
    ];

    localStorage.setItem('nt_cart_items_v1', JSON.stringify(corruptData));
    const loaded = loadCartFromStorage();
    expect(loaded).toEqual([
      { productId: 'prod_1', variantId: 'var_1', quantity: 3 },
    ]);
  });

  it('clears cart storage correctly', () => {
    saveCartToStorage([
      { productId: 'prod_1', variantId: 'var_1', quantity: 1 },
    ]);
    expect(loadCartFromStorage().length).toBe(1);
    clearCartStorage();
    expect(loadCartFromStorage()).toEqual([]);
  });

  it('ensures personal customer data is never saved to the cart storage key', () => {
    const data = [{ productId: 'prod_1', variantId: 'var_1', quantity: 1 }];
    saveCartToStorage(data);
    const raw = localStorage.getItem('nt_cart_items_v1');
    expect(raw).not.toContain('name');
    expect(raw).not.toContain('phone');
    expect(raw).not.toContain('customer');
    expect(raw).not.toContain('price');
  });
});
