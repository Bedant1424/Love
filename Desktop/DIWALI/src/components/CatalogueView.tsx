import React, { useState, useMemo } from 'react';
import { CATEGORIES, PRODUCTS } from '../data/catalogueData';
import { CategoryId, Product } from '../types/catalogue';
import { ProductCard } from './ProductCard';
import { CategoryNav } from './CategoryNav';

interface CatalogueViewProps {
  initialCategory?: CategoryId | 'all';
  getItemQuantity: (productId: string, variantId: string) => number;
  onAddItem: (productId: string, variantId: string, quantity?: number) => void;
  onIncrement: (productId: string, variantId: string) => void;
  onDecrement: (productId: string, variantId: string) => void;
}

export const CatalogueView: React.FC<CatalogueViewProps> = ({
  initialCategory = 'all',
  getItemQuantity,
  onAddItem,
  onIncrement,
  onDecrement,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<CategoryId | 'all'>(
    initialCategory
  );
  const [searchQuery, setSearchQuery] = useState('');

  const filteredProducts: Product[] = useMemo(() => {
    return PRODUCTS.filter((product) => {
      const matchesCategory =
        selectedCategory === 'all' || product.categoryId === selectedCategory;

      const matchesSearch =
        searchQuery.trim() === '' ||
        product.name.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
        product.printedPriceText
          .toLowerCase()
          .includes(searchQuery.toLowerCase().trim()) ||
        product.variants.some((v) =>
          v.name.toLowerCase().includes(searchQuery.toLowerCase().trim())
        );

      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  const activeCategoryInfo = CATEGORIES.find((c) => c.id === selectedCategory);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Category Navigation Bar with Visual Chips */}
      <CategoryNav
        selectedCategory={selectedCategory}
        onSelectCategory={(cat) => setSelectedCategory(cat)}
      />

      {/* Category Heading & Compact Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2 border-b border-stone-200 pb-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold font-display text-stone-900">
            {selectedCategory === 'all'
              ? 'All Fireworks Products'
              : activeCategoryInfo?.name}
          </h2>
          <p className="text-xs sm:text-sm text-stone-600 mt-1">
            {selectedCategory === 'all'
              ? `Showing all ${PRODUCTS.length} extracted products across 6 authentic categories`
              : activeCategoryInfo?.description}
          </p>
        </div>

        {/* Search Input with Clear Button */}
        <div className="w-full md:w-80 relative">
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products (e.g. Bigboss, Tiger)..."
            className="w-full min-h-[44px] pl-3.5 pr-8 py-2 rounded-xl bg-white border border-stone-300 text-stone-900 placeholder-stone-400 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-festive-marigold focus:border-festive-marigold shadow-sm"
            aria-label="Search catalogue products"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 text-xs p-1"
              aria-label="Clear search query"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Environmental Notice for Category 1 */}
      {selectedCategory === 'laddis' && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-xs sm:text-sm text-amber-900 leading-relaxed shadow-sm">
          <strong className="text-amber-950 font-bold">Environmental Notice:</strong> Series
          and garland crackers (laddis) are regulated under nationwide Supreme
          Court clean air directives. Nagarjuna Traders lists these solely for
          verbatim catalogue reference. Live checkout is disabled.
        </div>
      )}

      {/* Responsive Product Cards Grid (2 cols on tablet/mobile, 3-4 on desktop) */}
      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              getItemQuantity={getItemQuantity}
              onAddItem={onAddItem}
              onIncrement={onIncrement}
              onDecrement={onDecrement}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 px-4 bg-white rounded-2xl border border-stone-200 shadow-warm-sm space-y-3">
          <div className="w-12 h-12 mx-auto rounded-full bg-stone-100 flex items-center justify-center text-xl">
            🔍
          </div>
          <h3 className="text-lg font-bold font-display text-stone-900">
            No Fireworks Matched "{searchQuery}"
          </h3>
          <p className="text-xs sm:text-sm text-stone-500 max-w-sm mx-auto">
            Try checking spelling or reset your search filter to see all available items.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('all');
            }}
            className="mt-2 min-h-[44px] px-5 py-2 rounded-xl bg-stone-900 text-white text-xs font-semibold hover:bg-stone-800 transition-colors"
          >
            Reset Filters
          </button>
        </div>
      )}
    </div>
  );
};
