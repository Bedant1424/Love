import React from 'react';
import { CustomPageItem } from '../../types/content.types';
import { PapercraftFallback } from '../common/PapercraftFallback';
import { Sparkles, ArrowRight } from 'lucide-react';

interface SceneCustomProps {
  page: CustomPageItem;
  chapterNumber: number;
  totalChapters: number;
  onNext: () => void;
}

export const SceneCustom: React.FC<SceneCustomProps> = ({
  page,
  chapterNumber,
  totalChapters,
  onNext,
}) => {
  const [imageError, setImageError] = React.useState(false);
  const isCinematic = page.theme === 'cinematic';

  // Split content by double or single newlines into paragraphs
  const paragraphs = page.content
    ? page.content.split(/\n+/).filter((p) => p.trim().length > 0)
    : [];

  return (
    <section
      aria-label={`Custom Chapter: ${page.title}`}
      className="relative min-h-[90vh] flex flex-col items-center justify-center px-4 py-12 text-center max-w-2xl mx-auto"
    >
      <div
        className={`relative w-full rounded-3xl p-6 sm:p-10 shadow-card border-2 flex flex-col items-center ${
          isCinematic
            ? 'bg-plum-900/90 text-cream-50 border-lavender-500/30'
            : 'bg-white/90 text-neutral-800 border-lavender-200 parchment-texture'
        }`}
      >
        {/* Chapter Badge */}
        <div
          className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full font-body text-xs sm:text-sm font-bold tracking-wide mb-4 ${
            isCinematic
              ? 'bg-plum-950/80 border border-amber-300/30 text-amber-300'
              : 'bg-rose-50 border border-rose-200/60 text-rose-CTA'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>
            {page.badge || `Chapter ${chapterNumber} of ${totalChapters}`}
          </span>
        </div>

        {/* Title & Subtitle */}
        <h2
          className={`font-heading text-3xl sm:text-4xl leading-tight mb-2 ${
            isCinematic ? 'text-cream-50' : 'text-neutral-800'
          }`}
        >
          {page.title}
        </h2>
        {page.subtitle && (
          <p
            className={`font-body text-base sm:text-lg mb-6 ${
              isCinematic ? 'text-lavender-200' : 'text-neutral-600'
            }`}
          >
            {page.subtitle}
          </p>
        )}

        {/* Image if supplied */}
        {page.imageUrl && (
          <div className="relative w-64 h-64 rounded-2xl overflow-hidden my-4 border-2 border-stone-200/60 shadow-md flex items-center justify-center">
            {!imageError ? (
              <img
                src={page.imageUrl}
                alt={page.title}
                onError={() => setImageError(true)}
                className="w-full h-full object-cover"
              />
            ) : (
              <PapercraftFallback title={page.title} theme="rose" iconType="heart" />
            )}
          </div>
        )}

        {/* Content Paragraphs */}
        <div
          className={`w-full space-y-4 my-6 font-body text-base sm:text-lg leading-relaxed text-left sm:text-center ${
            isCinematic ? 'text-lavender-200' : 'text-neutral-700'
          }`}
        >
          {paragraphs.map((p, idx) => (
            <p key={idx}>{p}</p>
          ))}
        </div>

        {/* Next Chapter CTA Button */}
        <div className="mt-4">
          <button
            type="button"
            onClick={onNext}
            className="inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-full bg-rose-CTA hover:bg-rose-CTA-hover text-white font-body font-bold text-lg shadow-floating hover:scale-105 active:scale-95 transition-all duration-200 focus:outline-none focus-visible:ring-4 focus-visible:ring-rose-300"
          >
            <span>{page.ctaText || 'Continue Our Story ✨'}</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </section>
  );
};
