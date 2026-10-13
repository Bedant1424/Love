import React, { useState } from 'react';
import { GalleryItem } from '../../types/content.types';
import { PolaroidCard } from '../interactive/PolaroidCard';
import { Lightbox } from '../interactive/Lightbox';
import { Camera, ArrowRight } from 'lucide-react';

interface Scene5GalleryProps {
  gallery: GalleryItem[];
  onGoToFinale: () => void;
}

export const Scene5Gallery: React.FC<Scene5GalleryProps> = ({
  gallery,
  onGoToFinale,
}) => {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);

  const openLightbox = (index: number) => {
    setSelectedPhotoIndex(index);
    setLightboxOpen(true);
  };

  const handleNextPhoto = () => {
    setSelectedPhotoIndex((prev) => (prev + 1) % gallery.length);
  };

  const handlePrevPhoto = () => {
    setSelectedPhotoIndex((prev) => (prev - 1 + gallery.length) % gallery.length);
  };

  const currentItem = gallery[selectedPhotoIndex] || gallery[0];

  return (
    <section
      aria-label="Memories Scrapbook Gallery"
      className="relative w-full h-full flex flex-col items-center justify-center p-2 sm:p-4 text-center select-none overflow-hidden max-w-2xl mx-auto"
    >
      <div className="flex flex-col short-landscape-row items-center justify-center gap-2 sm:gap-6">
        {/* Left column in landscape: Polaroid */}
        <div className="flex flex-col items-center flex-shrink-0">
          <div className="w-40 sm:w-48 short-compact-polaroid">
            <PolaroidCard
              item={currentItem}
              onClick={() => openLightbox(selectedPhotoIndex)}
            />
          </div>

          {/* Carousel / Navigation Controls */}
          <div className="flex items-center gap-2.5 mt-1.5 text-xs">
            <button
              type="button"
              onClick={handlePrevPhoto}
              className="text-xs font-semibold text-[#5C4D6B] hover:text-rose-CTA px-1.5 py-0.5 rounded transition-colors cursor-pointer"
            >
              ← Prev
            </button>
            <div className="flex items-center gap-1">
              {gallery.map((g, idx) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setSelectedPhotoIndex(idx)}
                  className={`w-2 h-2 rounded-full transition-all cursor-pointer ${
                    selectedPhotoIndex === idx
                      ? 'bg-rose-CTA scale-125 ring-2 ring-rose-200'
                      : 'bg-lavender-200 hover:bg-rose-300'
                  }`}
                  aria-label={`View photo ${idx + 1}`}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={handleNextPhoto}
              className="text-xs font-semibold text-[#5C4D6B] hover:text-rose-CTA px-1.5 py-0.5 rounded transition-colors cursor-pointer"
            >
              Next →
            </button>
          </div>
        </div>

        {/* Right column in landscape: Badges, Heading, Description & Action */}
        <div className="flex flex-col items-center max-w-xs text-center">
          {/* Chapter Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200/80 text-rose-CTA font-body text-xs font-bold tracking-wide mb-1">
            <Camera className="w-3.5 h-3.5 text-rose-CTA" />
            <span>Chapter 5: Our Scrapbook</span>
          </div>

          <h2 className="font-heading text-xl sm:text-2xl text-[#2D2635] leading-tight mb-0.5">
            Moments I Cherish
          </h2>
          <p className="font-body text-xs sm:text-sm text-[#5C4D6B] mb-2.5">
            Every smile and sweet memory together. Tap photo to zoom in!
          </p>

          <button
            type="button"
            onClick={onGoToFinale}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-rose-CTA hover:bg-rose-CTA-hover text-white font-body font-bold text-xs sm:text-sm shadow-md hover:scale-102 active:scale-98 transition-all duration-150 focus:outline-none focus-visible:ring-3 focus-visible:ring-rose-300 cursor-pointer"
            aria-label="Proceed to the next chapter"
          >
            <span>Continue Our Story ✨</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Accessible Lightbox Modal */}
      <Lightbox
        items={gallery}
        currentIndex={selectedPhotoIndex}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        onNavigate={(newIndex) => setSelectedPhotoIndex(newIndex)}
      />
    </section>
  );
};
