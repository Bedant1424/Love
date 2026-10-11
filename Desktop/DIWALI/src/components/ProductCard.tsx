import React, { useState } from 'react';
import { Product, ProductVariant } from '../types/catalogue';
import { formatPaise } from '../utils/formatters';
import { QuantityControl } from './QuantityControl';

interface ProductCardProps {
  product: Product;
  getItemQuantity: (productId: string, variantId: string) => number;
  onAddItem: (productId: string, variantId: string, quantity?: number) => void;
  onIncrement: (productId: string, variantId: string) => void;
  onDecrement: (productId: string, variantId: string) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  getItemQuantity,
  onAddItem,
  onIncrement,
  onDecrement,
}) => {
  // Default to first variant
  const [selectedVariantId, setSelectedVariantId] = useState<string>(
    product.variants[0]?.id || ''
  );

  const activeVariant: ProductVariant | undefined =
    product.variants.find((v) => v.id === selectedVariantId) ||
    product.variants[0];

  const currentQuantity = activeVariant
    ? getItemQuantity(product.id, activeVariant.id)
    : 0;

  return (
    <article
      className="rounded-2xl bg-bg-surface border border-white/10 p-4 md:p-5 flex flex-col justify-between transition-colors hover:border-white/20 focus-within:border-festive-marigold/50"
      aria-labelledby={`prod-title-${product.id}`}
    >
      <div>
        {/* Compliance Warning Badge (e.g. Laddis) */}
        {product.complianceNotice && (
          <div className="mb-3 p-2.5 rounded-lg bg-amber-950/40 border border-amber-800/40 text-[11px] text-amber-300 flex items-start gap-1.5 leading-tight">
            <span aria-hidden="true" className="shrink-0 text-sm">⚠️</span>
            <span>{product.complianceNotice}</span>
          </div>
        )}

        {/* Product Title & Printed Range */}
        <div className="flex items-start justify-between gap-2">
          <h3
            id={`prod-title-${product.id}`}
            className="text-lg md:text-xl font-bold text-content-primary font-display"
          >
            {product.name}
          </h3>
          <span className="shrink-0 px-2 py-0.5 rounded text-[11px] font-mono bg-bg-elevated text-content-muted border border-white/5">
            {product.printedPriceText}
          </span>
        </div>

        {/* Pack Information with Verification Badge */}
        <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-content-muted">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-bg-elevated border border-white/5 text-content-secondary">
            📦 {product.packInfo}
          </span>
          {product.isPackInfoVerified ? (
            <span className="text-emerald-400 text-[11px]">✓ Pack verified</span>
          ) : (
            <span className="text-amber-400 text-[11px]">⚠️ Pack count unconfirmed</span>
          )}
        </div>

        {/* Variant Selector (if more than 1 variant) */}
        {product.variants.length > 1 && (
          <div className="mt-4 pt-3 border-t border-white/5">
            <label className="block text-xs font-medium text-content-muted mb-2">
              Select Variant / Size:
            </label>
            <div
              className="grid grid-cols-2 gap-1.5"
              role="radiogroup"
              aria-label={`Select variant for ${product.name}`}
            >
              {product.variants.map((v) => {
                const isSelected = v.id === selectedVariantId;
                return (
                  <button
                    key={v.id}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => setSelectedVariantId(v.id)}
                    className={`min-h-[44px] p-2 rounded-xl text-left text-xs transition-colors border ${
                      isSelected
                        ? 'bg-festive-marigold/15 border-festive-marigold text-content-primary font-semibold'
                        : 'bg-bg-elevated border-white/5 text-content-muted hover:border-white/20'
                    }`}
                  >
                    <div className="truncate font-medium">{v.name}</div>
                    <div className="text-[11px] font-mono mt-0.5 text-festive-amber">
                      {v.pricePaise !== null
                        ? formatPaise(v.pricePaise)
                        : 'On enquiry'}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Pricing & Cart Action Area */}
      <div className="mt-5 pt-4 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Active Variant Price Display */}
        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-content-primary">
              {activeVariant?.pricePaise !== null
                ? formatPaise(activeVariant?.pricePaise)
                : 'Price on enquiry'}
            </span>
          </div>
          <div className="text-[11px] text-content-muted mt-0.5">
            {activeVariant?.priceStatus === 'PRINTED_ESTIMATE' && (
              <span className="text-amber-300">Printed catalogue estimate</span>
            )}
            {activeVariant?.priceStatus === 'PRICE_ON_ENQUIRY' && (
              <span className="text-amber-400">Owner quote required</span>
            )}
            {activeVariant?.priceStatus === 'CONFIRMED' && (
              <span className="text-emerald-400">Confirmed price</span>
            )}
          </div>
        </div>

        {/* Add or Stepper Controls */}
        <div className="shrink-0">
          {activeVariant && currentQuantity > 0 ? (
            <QuantityControl
              quantity={currentQuantity}
              onIncrement={() => onIncrement(product.id, activeVariant.id)}
              onDecrement={() => onDecrement(product.id, activeVariant.id)}
              productName={`${product.name} (${activeVariant.name})`}
            />
          ) : (
            <button
              type="button"
              disabled={!activeVariant?.isAvailable}
              onClick={() => {
                if (activeVariant) {
                  onAddItem(product.id, activeVariant.id, 1);
                }
              }}
              className="w-full sm:w-auto min-h-touch px-5 py-2.5 rounded-xl bg-festive-marigold hover:bg-festive-marigold-hover active:scale-95 text-black font-semibold text-sm transition-transform flex items-center justify-center gap-2 whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-festive-marigold"
              aria-label={`Add ${product.name} ${
                activeVariant ? activeVariant.name : ''
              } to enquiry basket`}
            >
              <span>+ Add to Box</span>
            </button>
          )}
        </div>
      </div>
    </article>
  );
};
