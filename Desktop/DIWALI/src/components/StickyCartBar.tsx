import React from 'react';
import { CartTotals } from '../types/cart';
import { formatPaise } from '../utils/formatters';

interface StickyCartBarProps {
  totals: CartTotals;
  onReviewCart: () => void;
}

export const StickyCartBar: React.FC<StickyCartBarProps> = ({
  totals,
  onReviewCart,
}) => {
  if (totals.totalQuantity === 0) return null;

  return (
    <aside
      className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-bg-surface/95 backdrop-blur-md border-t border-white/10 px-4 py-3 shadow-2xl"
      aria-label="Enquiry basket quick summary"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs text-content-muted">
            {totals.totalQuantity} item{totals.totalQuantity > 1 ? 's' : ''} in box
          </div>
          <div className="text-lg font-bold font-mono text-content-primary truncate">
            {totals.pricedItemCount > 0
              ? formatPaise(totals.provisionalSubtotalPaise)
              : 'Price on enquiry'}
          </div>
          {totals.unpricedItemCount > 0 && totals.pricedItemCount > 0 && (
            <div className="text-[10px] text-festive-amber font-medium">
              +{totals.unpricedItemCount} items needing quote
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={onReviewCart}
          className="min-h-touch px-5 py-2.5 rounded-xl bg-festive-marigold hover:bg-festive-marigold-hover active:scale-95 text-black font-semibold text-sm transition-transform flex items-center gap-1.5 whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-festive-marigold"
        >
          <span>Review Box</span>
          <span aria-hidden="true">→</span>
        </button>
      </div>
    </aside>
  );
};
