import { StoredCartItem } from '../types/cart';

const STORAGE_KEY = 'nt_cart_items_v1';

/**
 * Loads cart items from LocalStorage with strict untrusted-data validation.
 * Rejects corrupt structures, negative/zero/excessive quantities, and invalid types.
 */
export function loadCartFromStorage(): StoredCartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      localStorage.removeItem(STORAGE_KEY);
      return [];
    }

    const validItems: StoredCartItem[] = [];

    for (const item of parsed) {
      if (
        item &&
        typeof item === 'object' &&
        typeof item.productId === 'string' &&
        item.productId.trim().length > 0 &&
        typeof item.variantId === 'string' &&
        item.variantId.trim().length > 0 &&
        typeof item.quantity === 'number' &&
        Number.isInteger(item.quantity) &&
        item.quantity >= 1 &&
        item.quantity <= 50
      ) {
        validItems.push({
          productId: item.productId.trim(),
          variantId: item.variantId.trim(),
          quantity: item.quantity,
        });
      }
    }

    return validItems;
  } catch {
    // If parse fails or localStorage is blocked, gracefully return empty
    return [];
  }
}

/**
 * Persists cart items to LocalStorage.
 * Invariant: Never stores customer personal information, phone numbers, or prices.
 */
export function saveCartToStorage(items: StoredCartItem[]): void {
  try {
    const sanitized = items
      .filter(
        (item) =>
          typeof item.productId === 'string' &&
          typeof item.variantId === 'string' &&
          typeof item.quantity === 'number' &&
          Number.isInteger(item.quantity) &&
          item.quantity >= 1 &&
          item.quantity <= 50
      )
      .map((item) => ({
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
      }));

    localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
  } catch {
    // Graceful no-op if storage is full or restricted
  }
}

export function clearCartStorage(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // No-op
  }
}
