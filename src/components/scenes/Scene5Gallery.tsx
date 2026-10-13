import React, { useState } from 'react';
import { GalleryItem } from '../../types/content.types';
import { PolaroidCard } from '../interactive/PolaroidCard';
import { Lightbox } from '../interactive/Lightbox';
import { Camera, Sparkles, ArrowRight } from 'lucide-react';

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

  return (
    <section
      aria-label="Memories Scrapbook Gallery"
      className="relative min-h-[90vh] flex flex-col items-center justify-center px-4 py-12 max-w-5xl mx-auto"
    >
      {/* Chapter Badge */}
      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-50 border border-rose-200/60 text-rose-CTA font-body text-xs sm:text-sm font-bold tracking-wide mb-3">
        <Camera className="w-4 h-4 text-rose-CTA" />
        <span>Chapter 5: Our Scrapbook of Memories</span>
      </div>

      <h2 className="font-heading text-3xl sm:text-5xl text-neutral-800 leading-tight text-center mb-2">
        Moments I Cherish
      </h2>
      <p className="font-body text-base sm:text-lg text-neutral-600 text-center max-w-lg mb-10">
        Every smile, every little adventure, every quiet moment together. Tap any Polaroid to view it up close!
      </p>

      {/* Polaroid Scrapbook Grid */}
      <div className="w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 sm:gap-10 mb-14 px-2">
        {gallery.map((item, index) => (
          <PolaroidCard
            key={item.id}
            item={item}
            onClick={() => openLightbox(index)}
          />
        ))}
      </div>

      {/* Prominent Direct P0 Route to Finale (Scene 10) */}
      <div className="w-full max-w-md bg-white/90 backdrop-blur-sm rounded-3xl p-6 sm:p-8 shadow-card border-2 border-lavender-200 text-center flex flex-col items-center">
        <div className="inline-flex items-center gap-1.5 text-rose-CTA font-heading text-lg mb-1">
          <Sparkles className="w-5 h-5" />
          <span>The Best Part Is Ahead</span>
          <Sparkles className="w-5 h-5" />
        </div>
        <p className="font-body text-sm text-neutral-600 mb-6">
          There is one final surprise waiting just for you on your birthday...
        </p>
        <button
          type="button"
          onClick={onGoToFinale}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 rounded-full bg-rose-CTA hover:bg-rose-CTA-hover text-white font-body font-bold text-lg sm:text-xl shadow-floating hover:scale-105 active:scale-95 transition-all duration-200 focus:outline-none focus-visible:ring-4 focus-visible:ring-rose-300"
          aria-label="Proceed directly to birthday grand finale"
        >
          <span>See Your Birthday Finale ✨</span>
          <ArrowRight className="w-5 h-5" />
        </button>
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
