import React, { useState } from 'react';
import { Product, ProductVariant } from '../types/catalogue';
import { formatPaise } from '../utils/formatters';
import { getProductImage } from '../data/catalogueData';
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

  const activePrice = activeVariant
    ? (activeVariant.pricePaise ?? activeVariant.demoPricePaise)
    : null;

  const isPriced =
    activePrice !== null &&
    activePrice !== undefined &&
    activePrice > 0;

  const productImage = getProductImage(product);

  return (
    <article
      className="rounded-2xl bg-white border border-stone-200 hover:border-amber-300 shadow-warm-sm hover:shadow-warm-md transition-all duration-200 p-4 flex flex-col justify-between group focus-within:ring-2 focus-within:ring-festive-marigold"
      aria-labelledby={`prod-title-${product.id}`}
    >
      <div>
        {/* Product Image Tile with Category Badge */}
        <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-stone-100 mb-3.5 border border-stone-100">
          <img
            src={productImage}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
            width="400"
            height="300"
          />
          <span className="absolute top-2 left-2 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-white/95 text-stone-800 shadow-sm backdrop-blur-sm">
            {product.printedPriceText}
          </span>
          {activeVariant?.isAvailable === false && (
            <span className="absolute top-2 right-2 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-rose-600 text-white shadow-sm">
              Out of Stock
            </span>
          )}
        </div>

        {/* Product Title */}
        <h3
          id={`prod-title-${product.id}`}
          className="text-base sm:text-lg font-bold text-stone-900 font-display group-hover:text-festive-marigold transition-colors"
        >
          {product.name}
        </h3>

        {/* Pack Info (clean, omit if not specified) */}
        {product.packInfo ? (
          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-stone-500">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-stone-100 text-stone-700 font-medium">
              {product.packInfo}
            </span>
          </div>
        ) : null}

        {/* Variant Selector (if multiple variants) */}
        {product.variants.length > 1 && (
          <div className="mt-3 pt-2.5 border-t border-stone-100">
            <label className="block text-[11px] font-semibold text-stone-600 mb-1.5">
              Available Options / Sizes:
            </label>
            <div
              className="grid grid-cols-2 gap-1.5"
              role="radiogroup"
              aria-label={`Select variant for ${product.name}`}
            >
              {product.variants.map((v) => {
                const isSelected = v.id === selectedVariantId;
                const variantPrice = v.pricePaise ?? v.demoPricePaise;
                const vPrice = variantPrice ? formatPaise(variantPrice) : 'Enquiry';
                return (
                  <button
                    key={v.id}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => setSelectedVariantId(v.id)}
                    className={`min-h-[44px] p-2 rounded-xl text-left text-xs transition-colors border ${
                      isSelected
                        ? 'bg-amber-50 border-festive-marigold text-stone-900 font-semibold'
                        : 'bg-stone-50 border-stone-200 text-stone-600 hover:border-stone-300'
                    }`}
                  >
                    <div className="truncate font-medium">{v.name}</div>
                    <div className="text-[11px] font-mono mt-0.5 text-festive-marigold font-bold">
                      {vPrice}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Pricing & Add to Cart Action Footer */}
      <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
        <div>
          <span className="text-[11px] text-stone-500 block">
            {activeVariant && activeVariant.printedMinPaise && activeVariant.printedMaxPaise && activeVariant.printedMinPaise !== activeVariant.printedMaxPaise
              ? `Range: ${activeVariant.printedPriceText}`
              : 'Catalogue Price'}
          </span>
          <span className="text-base sm:text-lg font-bold font-mono text-stone-900">
            {isPriced && activePrice
              ? formatPaise(activePrice)
              : 'Enquiry Only'}
          </span>
        </div>

        <div>
          {isPriced ? (
            currentQuantity > 0 ? (
              <QuantityControl
                quantity={currentQuantity}
                onIncrement={() => activeVariant && onIncrement(product.id, activeVariant.id)}
                onDecrement={() => activeVariant && onDecrement(product.id, activeVariant.id)}
                productName={`${product.name} ${activeVariant?.name || ''}`}
              />
            ) : (
              <button
                type="button"
                onClick={() => activeVariant && onAddItem(product.id, activeVariant.id, 1)}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-stone-900 hover:bg-festive-marigold text-white text-xs font-bold transition-all active:scale-95 shadow-sm focus:outline-none focus:ring-2 focus:ring-festive-marigold flex items-center gap-1.5"
                aria-label={`Add ${product.name} to enquiry basket`}
              >
                <span>Add to Cart</span>
                <span aria-hidden="true">+</span>
              </button>
            )
          ) : (
            <span className="text-xs px-2.5 py-1.5 rounded-lg bg-stone-100 text-stone-600 font-medium">
              Price on Enquiry
            </span>
          )}
        </div>
      </div>
    </article>
  );
};
