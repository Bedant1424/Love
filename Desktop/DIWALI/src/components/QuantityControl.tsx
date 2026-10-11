import React from 'react';
import { MAX_QUANTITY } from '../hooks/useCart';

interface QuantityControlProps {
  quantity: number;
  onIncrement: () => void;
  onDecrement: () => void;
  productName?: string;
}

export const QuantityControl: React.FC<QuantityControlProps> = ({
  quantity,
  onIncrement,
  onDecrement,
  productName = 'item',
}) => {
  return (
    <div
      className="inline-flex items-center rounded-xl bg-bg-elevated border border-white/10 p-1"
      role="group"
      aria-label={`Quantity controls for ${productName}`}
    >
      {/* Decrease Button (Min 48x48px Touch Target) */}
      <button
        type="button"
        onClick={onDecrement}
        className="w-12 h-12 flex items-center justify-center rounded-lg text-content-primary hover:bg-white/10 active:scale-95 transition-transform text-lg font-bold focus:outline-none focus:ring-2 focus:ring-festive-marigold"
        aria-label={`Decrease quantity of ${productName}. Current quantity is ${quantity}`}
        title="Decrease quantity"
      >
        <span aria-hidden="true">−</span>
      </button>

      {/* Numeric Display */}
      <span
        className="w-12 text-center font-mono font-bold text-base text-content-primary select-none"
        aria-live="polite"
        aria-atomic="true"
      >
        {quantity}
      </span>

      {/* Increase Button (Min 48x48px Touch Target) */}
      <button
        type="button"
        onClick={onIncrement}
        disabled={quantity >= MAX_QUANTITY}
        className={`w-12 h-12 flex items-center justify-center rounded-lg text-lg font-bold transition-transform focus:outline-none focus:ring-2 focus:ring-festive-marigold ${
          quantity >= MAX_QUANTITY
            ? 'text-content-muted opacity-40 cursor-not-allowed'
            : 'text-content-primary hover:bg-white/10 active:scale-95'
        }`}
        aria-label={`Increase quantity of ${productName}. Current quantity is ${quantity}`}
        title={
          quantity >= MAX_QUANTITY
            ? `Maximum limit of ${MAX_QUANTITY} units reached`
            : 'Increase quantity'
        }
      >
        <span aria-hidden="true">+</span>
      </button>
    </div>
  );
};
