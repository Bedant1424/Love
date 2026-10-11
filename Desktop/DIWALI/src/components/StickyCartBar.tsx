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
      className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-stone-200 px-4 py-3 shadow-warm-lg"
      aria-label="Shopping cart quick summary"
    >
      <div className="flex items-center justify-between gap-3 max-w-md mx-auto">
        <div className="min-w-0">
          <div className="text-xs text-stone-500 font-medium">
            {totals.totalQuantity} item{totals.totalQuantity > 1 ? 's' : ''} selected
          </div>
          <div className="text-base sm:text-lg font-bold font-mono text-stone-900 truncate">
            {totals.pricedItemCount > 0
              ? formatPaise(totals.provisionalSubtotalPaise)
              : 'Price on enquiry'}
          </div>
          {totals.unpricedItemCount > 0 && totals.pricedItemCount > 0 && (
            <div className="text-[10px] text-amber-700 font-medium">
              +{totals.unpricedItemCount} items needing price confirmation
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={onReviewCart}
          className="min-h-[48px] px-5 py-2.5 rounded-xl bg-festive-marigold hover:bg-festive-marigold-hover active:scale-95 text-white font-bold text-sm transition-transform flex items-center gap-1.5 whitespace-nowrap shadow-md focus:outline-none focus:ring-2 focus:ring-amber-400"
        >
          <span>Review Box</span>
          <span aria-hidden="true">→</span>
        </button>
      </div>
    </aside>
  );
};
