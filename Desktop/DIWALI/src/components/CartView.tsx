import React from 'react';
import { CartItem, CartTotals } from '../types/cart';
import { formatPaise } from '../utils/formatters';
import { QuantityControl } from './QuantityControl';

interface CartViewProps {
  items: CartItem[];
  totals: CartTotals;
  onIncrement: (productId: string, variantId: string) => void;
  onDecrement: (productId: string, variantId: string) => void;
  onRemove: (productId: string, variantId: string) => void;
  onClear: () => void;
  onContinueShopping: () => void;
  onProceedToReview: () => void;
}

export const CartView: React.FC<CartViewProps> = ({
  items,
  totals,
  onIncrement,
  onDecrement,
  onRemove,
  onClear,
  onContinueShopping,
  onProceedToReview,
}) => {
  if (items.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <div className="w-20 h-20 mx-auto rounded-3xl bg-amber-50 border border-amber-200 flex items-center justify-center text-3xl mb-4 shadow-sm">
          📦
        </div>
        <h2 className="text-2xl font-bold font-display text-stone-900">
          Your Shopping Cart is Empty
        </h2>
        <p className="text-sm text-stone-500 mt-2 max-w-sm mx-auto leading-relaxed">
          You have not selected any cracker items yet. Browse our 6 authentic Diwali
          catalogue categories to assemble your festival box.
        </p>
        <button
          type="button"
          onClick={onContinueShopping}
          className="mt-6 min-h-[48px] px-6 py-3 rounded-xl bg-festive-marigold hover:bg-festive-marigold-hover active:scale-95 text-white font-bold text-sm transition-transform inline-flex items-center gap-2 shadow-md"
        >
          <span>Explore 2026 Catalogue →</span>
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      {/* Header & Clear Option */}
      <div className="flex items-center justify-between border-b border-stone-200 pb-4">
        <div>
          <h2 className="text-2xl font-bold font-display text-stone-900">
            Shopping Cart
          </h2>
          <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
            {totals.totalQuantity} items selected across {items.length} product(s)
          </p>
        </div>
        <button
          type="button"
          onClick={onClear}
          className="text-xs text-stone-500 hover:text-festive-vermilion p-2 transition-colors focus:outline-none"
        >
          Clear Cart
        </button>
      </div>

      {/* Item List */}
      <div className="space-y-3" role="list" aria-label="Shopping cart items">
        {items.map((item) => (
          <div
            key={`${item.productId}-${item.variantId}`}
            className="p-4 rounded-2xl bg-white border border-stone-200 shadow-warm-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            role="listitem"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-stone-900 font-display truncate">
                  {item.productName}
                </h3>
                {item.variantName &&
                  item.variantName !== item.productName &&
                  item.variantName !== 'Standard Unit' &&
                  item.variantName !== 'Per packet' && (
                    <span className="shrink-0 px-2 py-0.5 rounded text-[10px] font-mono bg-stone-100 text-stone-600 border border-stone-200">
                      {item.variantName}
                    </span>
                  )}
              </div>

              <div className="text-xs text-stone-500 mt-1 flex flex-wrap items-center gap-2">
                <span>📦 {item.packInfo}</span>
                <span>•</span>
                <span>
                  Unit:{' '}
                  {item.pricePaise !== null
                    ? formatPaise(item.pricePaise)
                    : item.printedPriceText}
                </span>
              </div>

              {/* Price Status Note */}
              <div className="mt-1 text-[11px]">
                {item.lineSubtotalPaise !== null ? (
                  <span className="text-festive-marigold font-bold font-mono">
                    Line Subtotal: {formatPaise(item.lineSubtotalPaise)}
                  </span>
                ) : (
                  <span className="text-amber-800 font-medium">
                    Price to be confirmed (Range item: {item.printedPriceText})
                  </span>
                )}
              </div>
            </div>

            {/* Stepper & Remove Action */}
            <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-stone-100">
              <QuantityControl
                quantity={item.quantity}
                onIncrement={() => onIncrement(item.productId, item.variantId)}
                onDecrement={() => onDecrement(item.productId, item.variantId)}
                productName={
                  item.variantName &&
                  item.variantName !== item.productName &&
                  item.variantName !== 'Standard Unit' &&
                  item.variantName !== 'Per packet'
                    ? `${item.productName} (${item.variantName})`
                    : item.productName
                }
              />

              <button
                type="button"
                onClick={() => onRemove(item.productId, item.variantId)}
                className="w-10 h-10 flex items-center justify-center rounded-lg text-stone-400 hover:text-festive-vermilion hover:bg-stone-50 transition-colors"
                aria-label={`Remove ${item.productName} from cart`}
                title="Remove item"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Financial Summary Card */}
      <div className="p-5 rounded-2xl bg-white border border-stone-200 shadow-warm-sm space-y-4">
        <h3 className="text-base font-bold font-display text-stone-900">
          Order Price & Advance Token Breakdown
        </h3>

        <div className="space-y-2.5 text-sm border-b border-stone-100 pb-4">
          <div className="flex justify-between items-center">
            <span className="text-stone-600">
              Order Subtotal ({totals.pricedItemCount} item{totals.pricedItemCount !== 1 ? 's' : ''})
            </span>
            <span className="font-mono font-bold text-stone-900">
              {formatPaise(totals.subtotalPaise)}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <div className="flex items-center gap-1.5">
              <span className="text-stone-600">Advance Token Required</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-semibold">
                {totals.subtotalPaise < 20000 ? '₹50 (< ₹200)' : '₹100 (≥ ₹200)'}
              </span>
            </div>
            <span className="font-mono font-bold text-festive-marigold">
              {formatPaise(totals.tokenAmountPaise)}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-stone-600">Balance Due upon Pickup</span>
            <span className="font-mono font-bold text-stone-900">
              {formatPaise(totals.remainingBalancePaise)}
            </span>
          </div>

          {totals.unpricedItemCount > 0 && (
            <div className="flex justify-between items-center text-amber-800 font-medium">
              <span>Items Requiring Price Confirmation</span>
              <span className="font-mono font-bold">
                {totals.unpricedItemCount} item(s)
              </span>
            </div>
          )}
        </div>

        {/* Total Estimate */}
        <div className="flex justify-between items-baseline pt-1">
          <div>
            <span className="text-base font-bold text-stone-900">
              Order Subtotal
            </span>
            <p className="text-[11px] text-stone-500">
              Advance token online + remaining balance upon pickup
            </p>
          </div>
          <span className="text-2xl font-bold font-mono text-festive-marigold">
            {formatPaise(totals.subtotalPaise)}
          </span>
        </div>

        {/* Validation Blocking Warnings */}
        {totals.hasUnpricedItems && (
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-xs text-amber-900 space-y-1">
            <p className="font-bold flex items-center gap-1.5">
              <span>⚠️</span> Unpriced Items Present:
            </p>
            <p>
              Every item in your box must have a confirmed price before proceeding to payment instructions.
            </p>
          </div>
        )}

        {!totals.minOrderRequirementMet && totals.totalQuantity > 0 && !totals.hasUnpricedItems && (
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-xs text-amber-900 space-y-1">
            <p className="font-bold flex items-center gap-1.5">
              <span>⚠️</span> Minimum Order Subtotal Required:
            </p>
            <p>
              Order subtotal must be at least ₹50.00 because the required advance token is ₹50.00.
            </p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
        <button
          type="button"
          onClick={onContinueShopping}
          className="w-full sm:w-auto min-h-[48px] px-5 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 border border-stone-200 text-stone-800 font-semibold text-sm transition-colors text-center"
        >
          ← Continue Browsing
        </button>

        <button
          type="button"
          onClick={onProceedToReview}
          className="w-full sm:flex-1 min-h-[48px] px-6 py-3 rounded-xl bg-festive-marigold hover:bg-festive-marigold-hover active:scale-95 text-white font-bold text-base transition-transform flex items-center justify-center gap-2 shadow-md focus:outline-none focus:ring-2 focus:ring-festive-marigold"
        >
          <span>Proceed to Review & Pay →</span>
        </button>
      </div>
    </div>
  );
};
