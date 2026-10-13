import React, { useEffect, useState, useRef } from 'react';
import { GalleryItem } from '../../types/content.types';
import { PapercraftFallback } from '../common/PapercraftFallback';
import { X, ChevronLeft, ChevronRight, Heart } from 'lucide-react';

interface LightboxProps {
  items: GalleryItem[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (newIndex: number) => void;
}

export const Lightbox: React.FC<LightboxProps> = ({
  items,
  currentIndex,
  isOpen,
  onClose,
  onNavigate,
}) => {
  const [imageError, setImageError] = useState(false);
  const touchStartXRef = useRef<number | null>(null);

  const activeItem = items[currentIndex];

  // Reset image error state whenever current item changes
  useEffect(() => {
    setImageError(false);
  }, [currentIndex]);

  const handlePrev = React.useCallback(() => {
    const nextIdx = currentIndex === 0 ? items.length - 1 : currentIndex - 1;
    onNavigate(nextIdx);
  }, [currentIndex, items.length, onNavigate]);

  const handleNext = React.useCallback(() => {
    const nextIdx = (currentIndex + 1) % items.length;
    onNavigate(nextIdx);
  }, [currentIndex, items.length, onNavigate]);

  // Keyboard navigation (Escape, ArrowLeft, ArrowRight)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, handlePrev, handleNext]);

  if (!isOpen || !activeItem) return null;

  // Touch swipe handling for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartXRef.current - touchEndX;

    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        handleNext(); // swiped left
      } else {
        handlePrev(); // swiped right
      }
    }
    touchStartXRef.current = null;
  };

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

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Photo viewer: ${activeItem.fallbackTitle}`}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/85 backdrop-blur-md select-none animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative max-w-lg w-full bg-white dark:bg-plum-900 rounded-2xl shadow-2xl p-4 sm:p-6 border border-lavender-200/40 dark:border-plum-800 flex flex-col items-center"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Top Controls: Counter & Close */}
        <div className="w-full flex items-center justify-between pb-3 border-b border-lavender-100 dark:border-plum-800">
          <div className="flex items-center gap-1.5 font-body text-xs font-bold text-rose-CTA dark:text-rose-300">
            <Heart className="w-4 h-4 fill-rose-CTA/40" />
            <span>Memory {currentIndex + 1} of {items.length}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-rose-50 dark:bg-plum-800 hover:bg-rose-100 dark:hover:bg-plum-700 text-rose-CTA dark:text-rose-300 flex items-center justify-center transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-CTA"
            aria-label="Close photo viewer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Media Frame */}
        <div className="relative w-full aspect-square sm:aspect-4/3 my-4 rounded-xl overflow-hidden bg-cream-50 dark:bg-plum-950 flex items-center justify-center border border-stone-200/60 dark:border-plum-800">
          {activeItem.imageUrl && !imageError ? (
            <img
              src={activeItem.imageUrl}
              alt={activeItem.caption || activeItem.fallbackTitle}
              onError={() => setImageError(true)}
              className="w-full h-full object-contain"
            />
          ) : (
            <PapercraftFallback
              title={activeItem.fallbackTitle}
              iconType={getFallbackIcon(activeItem.id)}
              theme="rose"
              className="h-full"
            />
          )}

          {/* Left Arrow Button */}
          <button
            type="button"
            onClick={handlePrev}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/80 dark:bg-plum-900/80 hover:bg-white text-neutral-800 dark:text-cream-50 shadow-md flex items-center justify-center transition-all hover:scale-105 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-CTA"
            aria-label="Previous memory"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          {/* Right Arrow Button */}
          <button
            type="button"
            onClick={handleNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/80 dark:bg-plum-900/80 hover:bg-white text-neutral-800 dark:text-cream-50 shadow-md flex items-center justify-center transition-all hover:scale-105 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-CTA"
            aria-label="Next memory"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>

        {/* Caption & Story Description */}
        <div className="w-full text-center px-2">
          <h3 className="font-heading text-xl sm:text-2xl text-neutral-800 dark:text-cream-50">
            {activeItem.fallbackTitle}
          </h3>
          <p className="font-body text-sm sm:text-base text-neutral-600 dark:text-lavender-200 mt-1">
            {activeItem.caption}
          </p>
          {activeItem.date && (
            <span className="inline-block mt-2 font-body text-xs font-semibold text-rose-CTA dark:text-rose-300 bg-rose-50 dark:bg-plum-800 px-3 py-1 rounded-full">
              {activeItem.date}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
