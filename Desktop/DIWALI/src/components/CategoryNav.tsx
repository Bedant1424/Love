import React from 'react';
import { CATEGORIES } from '../data/catalogueData';
import { CategoryId } from '../types/catalogue';

interface CategoryNavProps {
  selectedCategory: CategoryId | 'all';
  onSelectCategory: (categoryId: CategoryId | 'all') => void;
}

export const CategoryNav: React.FC<CategoryNavProps> = ({
  selectedCategory,
  onSelectCategory,
}) => {
  return (
    <div className="w-full">
      <div
        className="flex items-center gap-2 overflow-x-auto scrollbar-none py-2 px-1"
        role="tablist"
        aria-label="Filter catalogue by category"
      >
        <button
          type="button"
          role="tab"
          aria-selected={selectedCategory === 'all'}
          onClick={() => onSelectCategory('all')}
          className={`min-h-touch px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-colors border ${
            selectedCategory === 'all'
              ? 'bg-festive-marigold text-black border-festive-marigold'
              : 'bg-bg-surface text-content-secondary border-white/10 hover:border-white/20'
          }`}
        >
          All Categories (6)
        </button>

        {CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              role="tab"
              aria-selected={isSelected}
              onClick={() => onSelectCategory(cat.id)}
              className={`min-h-touch px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-colors border ${
                isSelected
                  ? 'bg-festive-marigold text-black border-festive-marigold'
                  : 'bg-bg-surface text-content-secondary border-white/10 hover:border-white/20'
              }`}
            >
              <span>{cat.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
