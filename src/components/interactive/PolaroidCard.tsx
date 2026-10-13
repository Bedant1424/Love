import React, { useState } from 'react';
import { GalleryItem } from '../../types/content.types';
import { PapercraftFallback } from '../common/PapercraftFallback';

interface PolaroidCardProps {
  item: GalleryItem;
  onClick: () => void;
  className?: string;
}

export const PolaroidCard: React.FC<PolaroidCardProps> = ({
  item,
  onClick,
  className = '',
}) => {
  const [imageError, setImageError] = useState(false);

  // Pick themed icons for papercraft fallback based on ID
  const getFallbackIcon = (id: number): 'cake' | 'heart' | 'stars' | 'sunset' | 'coffee' | 'journey' => {
    switch (id % 6) {
      case 1:
        return 'heart';
      case 2:
        return 'sunset';
      case 3:
        return 'stars';
      case 4:
        return 'coffee';
      case 5:
        return 'journey';
      default:
        return 'cake';
    }
  };

  const getFallbackTheme = (id: number): 'rose' | 'lavender' | 'cream' | 'gold' => {
    switch (id % 4) {
      case 1:
        return 'rose';
      case 2:
        return 'lavender';
      case 3:
        return 'gold';
      default:
        return 'cream';
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      aria-label={`View photo memory: ${item.fallbackTitle}. ${item.caption}`}
      className={`group relative bg-white p-3.5 pb-6 rounded-sm shadow-polaroid border border-stone-200/60 cursor-pointer transform transition-all duration-300 hover:scale-105 hover:z-20 hover:shadow-floating focus:outline-none focus-visible:ring-4 focus-visible:ring-rose-CTA ${item.rotation} ${className}`}
    >
      {/* Decorative Washi Tape at Top */}
      <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 w-20 h-5 washi-tape rounded-xs opacity-85 group-hover:opacity-100 transition-opacity z-10 pointer-events-none" />

      {/* Image or Illustrated Papercraft Fallback */}
      <div className="relative w-full aspect-square overflow-hidden rounded-xs bg-stone-100 flex items-center justify-center">
        {item.imageUrl && !imageError ? (
          <img
            src={item.imageUrl}
            alt={item.caption || item.fallbackTitle}
            onError={() => setImageError(true)}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-103"
            loading="lazy"
          />
        ) : (
          <PapercraftFallback
            title={item.fallbackTitle}
            theme={getFallbackTheme(item.id)}
            iconType={getFallbackIcon(item.id)}
          />
        )}
      </div>

      {/* Caption & Date Container */}
      <div className="mt-3 text-center px-1">
        <h4 className="font-handwriting text-lg sm:text-xl font-bold text-neutral-800 group-hover:text-rose-CTA transition-colors line-clamp-1">
          {item.fallbackTitle}
        </h4>
        <p className="font-body text-xs sm:text-sm text-neutral-600 line-clamp-2 mt-0.5">
          {item.caption}
        </p>
        {item.date && (
          <span className="inline-block mt-1 font-body text-[11px] font-semibold text-rose-CTA/90 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200/50">
            {item.date}
          </span>
        )}
      </div>
    </div>
  );
};
