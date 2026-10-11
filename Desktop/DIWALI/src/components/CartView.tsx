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
        <div className="w-20 h-20 mx-auto rounded-3xl bg-bg-surface border border-white/10 flex items-center justify-center text-3xl mb-4">
          📦
        </div>
        <h2 className="text-2xl font-bold font-display text-content-primary">
          Your Enquiry Basket is Empty
        </h2>
        <p className="text-sm text-content-muted mt-2 max-w-sm mx-auto leading-relaxed">
          You have not selected any crackers yet. Browse our 6 authentic Diwali
          categories to assemble your celebration box.
        </p>
        <button
          type="button"
          onClick={onContinueShopping}
          className="mt-6 min-h-touch px-6 py-3 rounded-xl bg-festive-marigold hover:bg-festive-marigold-hover active:scale-95 text-black font-semibold text-sm transition-transform inline-flex items-center gap-2"
        >
          <span>Explore 2026 Catalogue →</span>
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      {/* Header & Clear Option */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div>
          <h2 className="text-2xl font-bold font-display text-content-primary">
            Enquiry Basket
          </h2>
          <p className="text-xs text-content-muted mt-0.5">
            {totals.totalQuantity} items selected across {items.length} product(s)
          </p>
        </div>
        <button
          type="button"
          onClick={onClear}
          className="text-xs text-content-muted hover:text-festive-crimson p-2 transition-colors focus:outline-none"
        >
          Clear Basket
        </button>
      </div>

      {/* Item List */}
      <div className="space-y-3" role="list" aria-label="Enquiry basket items">
        {items.map((item) => (
          <div
            key={`${item.productId}-${item.variantId}`}
            className="p-4 rounded-2xl bg-bg-surface border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            role="listitem"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-content-primary font-display truncate">
                  {item.productName}
                </h3>
                <span className="shrink-0 px-2 py-0.5 rounded text-[10px] font-mono bg-bg-elevated text-content-muted border border-white/5">
                  {item.variantName}
                </span>
              </div>

              <div className="text-xs text-content-muted mt-1 flex flex-wrap items-center gap-2">
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
                {item.priceStatus === 'PRINTED_ESTIMATE' && (
                  <span className="text-amber-300">
                    Catalogue Estimate: {formatPaise(item.lineSubtotalPaise)}
                  </span>
                )}
                {item.priceStatus === 'PRICE_ON_ENQUIRY' && (
                  <span className="text-amber-400 font-medium">
                    Price on enquiry (quote will be confirmed at counter)
                  </span>
                )}
              </div>
            </div>

            {/* Stepper & Remove Action */}
            <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/5">
              <QuantityControl
                quantity={item.quantity}
                onIncrement={() => onIncrement(item.productId, item.variantId)}
                onDecrement={() => onDecrement(item.productId, item.variantId)}
                productName={`${item.productName} (${item.variantName})`}
              />

              <button
                type="button"
                onClick={() => onRemove(item.productId, item.variantId)}
                className="w-10 h-10 flex items-center justify-center rounded-lg text-content-muted hover:text-festive-crimson hover:bg-white/5 transition-colors"
                aria-label={`Remove ${item.productName} from enquiry basket`}
                title="Remove item"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Estimates & Financial Summary Card */}
      <div className="p-5 rounded-2xl bg-bg-surface border border-white/10 space-y-4">
        <h3 className="text-base font-bold font-display text-content-primary">
          Provisional Estimate Summary
        </h3>

        <div className="space-y-2 text-sm border-b border-white/5 pb-4">
          <div className="flex justify-between items-center">
            <span className="text-content-muted">
              Priced Items ({totals.pricedItemCount})
            </span>
            <span className="font-mono font-bold text-content-primary">
              {formatPaise(totals.provisionalSubtotalPaise)}
            </span>
          </div>

          {totals.unpricedItemCount > 0 && (
            <div className="flex justify-between items-center text-festive-amber">
              <span>Items Requiring Confirmation</span>
              <span className="font-mono font-bold">
                {totals.unpricedItemCount} item(s)
              </span>
            </div>
          )}

          <div className="flex justify-between items-center text-xs text-content-muted">
            <span>Taxes & Charges</span>
            <span>Included in printed rates</span>
          </div>
        </div>

        {/* Total Estimate */}
        <div className="flex justify-between items-baseline pt-1">
          <div>
            <span className="text-base font-bold text-content-primary">
              Provisional Subtotal Estimate
            </span>
            <p className="text-[11px] text-content-muted">
              Computed only from products with discrete printed catalogue prices
            </p>
          </div>
          <span className="text-2xl font-bold font-mono text-festive-amber">
            {formatPaise(totals.provisionalSubtotalPaise)}
          </span>
        </div>

        {/* Business Policy Disclaimer */}
        <div className="p-3 rounded-xl bg-bg-elevated border border-white/5 text-xs text-content-muted space-y-1">
          <p className="text-content-primary font-semibold">
            📌 Non-Binding Estimate Notice:
          </p>
          <p>
            The 20% advance token deposit remains an unconfirmed policy and is
            neither charged nor finalized on this site. You do not pay anything
            online. All transactions are settled in cash or counter UPI during
            in-person pickup.
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
        <button
          type="button"
          onClick={onContinueShopping}
          className="w-full sm:w-auto min-h-touch px-5 py-2.5 rounded-xl bg-bg-elevated hover:bg-white/10 border border-white/10 text-content-primary font-semibold text-sm transition-colors text-center"
        >
          ← Continue Browsing
        </button>

        <button
          type="button"
          onClick={onProceedToReview}
          className="w-full sm:flex-1 min-h-touch px-6 py-3 rounded-xl bg-festive-marigold hover:bg-festive-marigold-hover active:scale-95 text-black font-semibold text-base transition-transform flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-festive-marigold"
        >
          <span>Proceed to Review & Summary →</span>
        </button>
      </div>
    </div>
  );
};
