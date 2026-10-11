import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  StoredCartItem,
  CartItem,
  CartTotals,
  TOKEN_AMOUNT_PAISE,
  MIN_ORDER_SUBTOTAL_PAISE,
} from '../types/cart';
import { PRODUCTS } from '../data/catalogueData';
import { loadCartFromStorage, saveCartToStorage } from '../utils/storage';

export const MIN_QUANTITY = 1;
export const MAX_QUANTITY = 50;

export function useCart() {
  const [storedItems, setStoredItems] = useState<StoredCartItem[]>(() => {
    return loadCartFromStorage();
  });

  // Persist minimal cart state to LocalStorage on state change
  useEffect(() => {
    saveCartToStorage(storedItems);
  }, [storedItems]);

  // Reconstitute rich CartItem array by joining with trusted PRODUCTS catalogue
  const cartItems: CartItem[] = useMemo(() => {
    const items: CartItem[] = [];

    for (const stored of storedItems) {
      const product = PRODUCTS.find((p) => p.id === stored.productId);
      if (!product) continue;

      const variant = product.variants.find((v) => v.id === stored.variantId);
      if (!variant || !variant.isAvailable) continue;

      const lineSubtotalPaise =
        variant.pricePaise !== null
          ? variant.pricePaise * stored.quantity
          : null;

      items.push({
        productId: product.id,
        variantId: variant.id,
        productName: product.name,
        variantName: variant.name,
        packInfo: variant.packInfo,
        isPackInfoVerified: variant.isPackInfoVerified,
        pricePaise: variant.pricePaise,
        printedPriceText: variant.printedPriceText,
        priceStatus: variant.priceStatus,
        pricingOrigin: variant.pricingOrigin,
        quantity: stored.quantity,
        lineSubtotalPaise,
      });
    }

    return items;
  }, [storedItems]);

  // Compute financial totals and unpriced counts with fixed ₹100 token rules
  const totals: CartTotals = useMemo(() => {
    let totalQuantity = 0;
    let pricedItemCount = 0;
    let unpricedItemCount = 0;
    let subtotalPaise = 0;

    for (const item of cartItems) {
      totalQuantity += item.quantity;
      if (item.lineSubtotalPaise !== null) {
        pricedItemCount += 1;
        subtotalPaise += item.lineSubtotalPaise;
      } else {
        unpricedItemCount += 1;
      }
    }

    const tokenAmountPaise = TOKEN_AMOUNT_PAISE;
    const remainingBalancePaise = Math.max(0, subtotalPaise - tokenAmountPaise);
    const minOrderRequirementMet = subtotalPaise >= MIN_ORDER_SUBTOTAL_PAISE;
    const hasUnpricedItems = unpricedItemCount > 0;

    const canProceedToCheckout =
      totalQuantity > 0 && minOrderRequirementMet && !hasUnpricedItems;

    let checkoutBlockedReason: string | undefined;
    if (hasUnpricedItems) {
      checkoutBlockedReason =
        'Every item in your box must have a confirmed price before proceeding to simulated payment.';
    } else if (!minOrderRequirementMet && totalQuantity > 0) {
      checkoutBlockedReason =
        'Add items until your subtotal reaches ₹100. The demo token amount is fixed at ₹100.';
    }

    return {
      totalQuantity,
      pricedItemCount,
      unpricedItemCount,
      subtotalPaise,
      provisionalSubtotalPaise: subtotalPaise, // backward-compatibility alias
      tokenAmountPaise,
      remainingBalancePaise,
      canProceedToCheckout,
      minOrderRequirementMet,
      hasUnpricedItems,
      checkoutBlockedReason,
    };
  }, [cartItems]);

  const addItem = useCallback(
    (productId: string, variantId: string, quantity = 1) => {
      const product = PRODUCTS.find((p) => p.id === productId);
      if (!product) return;
      const variant = product.variants.find((v) => v.id === variantId);
      if (!variant || !variant.isAvailable) return;

      const safeQuantity = Math.max(
        MIN_QUANTITY,
        Math.min(MAX_QUANTITY, Math.floor(quantity))
      );

      setStoredItems((prev) => {
        const existingIndex = prev.findIndex(
          (item) => item.productId === productId && item.variantId === variantId
        );

        if (existingIndex >= 0) {
          const updated = [...prev];
          const newQty = Math.min(
            MAX_QUANTITY,
            updated[existingIndex].quantity + safeQuantity
          );
          updated[existingIndex] = {
            ...updated[existingIndex],
            quantity: newQty,
          };
          return updated;
        }

        return [...prev, { productId, variantId, quantity: safeQuantity }];
      });
    },
    []
  );

  const updateQuantity = useCallback(
    (productId: string, variantId: string, newQuantity: number) => {
      const parsed = Math.floor(newQuantity);
      if (parsed < MIN_QUANTITY) {
        setStoredItems((prev) =>
          prev.filter(
            (item) =>
              !(item.productId === productId && item.variantId === variantId)
          )
        );
        return;
      }

      const clamped = Math.min(MAX_QUANTITY, parsed);

      setStoredItems((prev) =>
        prev.map((item) => {
          if (item.productId === productId && item.variantId === variantId) {
            return { ...item, quantity: clamped };
          }
          return item;
        })
      );
    },
    []
  );

  const incrementQuantity = useCallback(
    (productId: string, variantId: string) => {
      setStoredItems((prev) =>
        prev.map((item) => {
          if (item.productId === productId && item.variantId === variantId) {
            return {
              ...item,
              quantity: Math.min(MAX_QUANTITY, item.quantity + 1),
            };
          }
          return item;
        })
      );
    },
    []
  );

  const decrementQuantity = useCallback(
    (productId: string, variantId: string) => {
      setStoredItems((prev) =>
        prev
          .map((item) => {
            if (item.productId === productId && item.variantId === variantId) {
              return {
                ...item,
                quantity: item.quantity - 1,
              };
            }
            return item;
          })
          .filter((item) => item.quantity >= MIN_QUANTITY)
      );
    },
    []
  );

  const removeItem = useCallback((productId: string, variantId: string) => {
    setStoredItems((prev) =>
      prev.filter(
        (item) =>
          !(item.productId === productId && item.variantId === variantId)
      )
    );
  }, []);

  const clearCart = useCallback(() => {
    setStoredItems([]);
  }, []);

  const getItemQuantity = useCallback(
    (productId: string, variantId: string) => {
      const match = storedItems.find(
        (item) => item.productId === productId && item.variantId === variantId
      );
      return match ? match.quantity : 0;
    },
    [storedItems]
  );

  return {
    items: cartItems,
    totals,
    addItem,
    updateQuantity,
    incrementQuantity,
    decrementQuantity,
    removeItem,
    clearCart,
    getItemQuantity,
    isEmpty: cartItems.length === 0,
  };
}
