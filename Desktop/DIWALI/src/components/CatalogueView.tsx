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
      {/* Category Navigation Bar */}
      <CategoryNav
        selectedCategory={selectedCategory}
        onSelectCategory={(cat) => setSelectedCategory(cat)}
      />

      {/* Category Heading & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2">
        <div>
          <h2 className="text-2xl font-bold font-display text-content-primary">
            {selectedCategory === 'all'
              ? 'All Fireworks Products'
              : activeCategoryInfo?.name}
          </h2>
          <p className="text-xs text-content-muted mt-0.5">
            {selectedCategory === 'all'
              ? `Showing all ${PRODUCTS.length} extracted products across 6 categories`
              : activeCategoryInfo?.description}
          </p>
        </div>

        {/* Search Input */}
        <div className="w-full md:w-72 relative">
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products (e.g. Bigboss, Tiger)..."
            className="w-full min-h-[44px] pl-3 pr-8 py-2 rounded-xl bg-bg-surface border border-white/10 text-content-primary placeholder-content-muted text-xs focus:outline-none focus:ring-2 focus:ring-festive-marigold"
            aria-label="Search catalogue products"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-content-muted hover:text-content-primary text-xs"
              aria-label="Clear search query"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Compliance Warning for Category 1 */}
      {selectedCategory === 'laddis' && (
        <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-800/40 text-xs text-amber-200 leading-relaxed">
          <strong className="text-amber-300">Environmental Notice:</strong> Series
          and garland crackers (laddis) are regulated under nationwide Supreme
          Court clean air directives. Nagarjuna Traders lists these solely for
          verbatim catalogue reference. Live checkout is disabled.
        </div>
      )}

      {/* Product Cards Grid */}
      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
        <div className="text-center py-16 px-4 bg-bg-surface rounded-2xl border border-white/5 space-y-3">
          <div className="text-3xl" aria-hidden="true">🔍</div>
          <h3 className="text-lg font-bold font-display text-content-primary">
            No Fireworks Matched "{searchQuery}"
          </h3>
          <p className="text-xs text-content-muted max-w-sm mx-auto">
            Try checking spelling or reset your search filter to see all
            available items.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('all');
            }}
            className="mt-2 min-h-touch px-4 py-2 rounded-xl bg-bg-elevated border border-white/10 text-xs font-semibold text-content-primary hover:bg-white/10"
          >
            Reset Filters
          </button>
        </div>
      )}
    </div>
  );
};
