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
          className={`min-h-[44px] px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all border ${
            selectedCategory === 'all'
              ? 'bg-festive-marigold text-white border-festive-marigold shadow-sm'
              : 'bg-white text-stone-700 border-stone-200 hover:border-stone-300 hover:bg-stone-50'
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
              className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all border flex items-center gap-2 ${
                isSelected
                  ? 'bg-festive-marigold text-white border-festive-marigold shadow-sm'
                  : 'bg-white text-stone-700 border-stone-200 hover:border-stone-300 hover:bg-stone-50'
              }`}
            >
              <span className="w-5 h-5 rounded-md overflow-hidden shrink-0 hidden sm:inline-block border border-black/10">
                <img
                  src={cat.imageUrl || `/images/cat-${cat.id}.jpg`}
                  alt=""
                  className="w-full h-full object-cover"
                  loading="lazy"
                  width="20"
                  height="20"
                />
              </span>
              <span>{cat.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
