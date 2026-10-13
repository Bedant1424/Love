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
      className="relative w-full h-full flex flex-col items-center justify-center p-2 sm:p-4 text-center max-w-lg mx-auto select-none"
    >
      <div
        className={`relative w-full rounded-2xl p-4 sm:p-6 shadow-[0_8px_24px_-4px_rgba(122,74,194,0.14)] border-2 flex flex-col items-center max-h-full ${
          isCinematic
            ? 'bg-plum-900 text-cream-50 border-lavender-500/40'
            : 'bg-[#FDFAFF] text-[#2D2635] border-[#DFD2F5]'
        }`}
      >
        {/* Top Washi Tape Strip */}
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-24 h-5 washi-tape rounded-xs z-20 pointer-events-none" />

        {/* Decorative corner stars/hearts */}
        <span className="absolute top-2 left-3 text-xs text-rose-300 opacity-60 pointer-events-none select-none">✨</span>
        <span className="absolute top-2 right-3 text-xs text-lavender-300 opacity-60 pointer-events-none select-none">🌸</span>

        {/* Chapter Badge */}
        <div
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-body text-xs font-bold tracking-wide mb-2 ${
            isCinematic
              ? 'bg-plum-950/90 border border-amber-300/40 text-amber-300'
              : 'bg-rose-50 border border-rose-200/80 text-rose-CTA'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>
            {page.badge || `Chapter ${chapterNumber} of ${totalChapters}`}
          </span>
        </div>

        {/* Title & Subtitle */}
        <h2
          className={`font-heading text-2xl sm:text-3xl leading-snug mb-1 ${
            isCinematic ? 'text-cream-50' : 'text-[#2D2635]'
          }`}
        >
          {page.title}
        </h2>
        {page.subtitle && (
          <p
            className={`font-body text-xs sm:text-sm mb-2.5 font-medium ${
              isCinematic ? 'text-lavender-200' : 'text-[#5C4D6B]'
            }`}
          >
            {page.subtitle}
          </p>
        )}

        {/* Image if supplied */}
        {page.imageUrl && (
          <div className="relative w-36 h-36 sm:w-44 sm:h-44 rounded-xl overflow-hidden my-2 border-2 border-stone-200/80 shadow-sm flex items-center justify-center flex-shrink-0">
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
          className={`w-full space-y-2 mb-3.5 font-body text-xs sm:text-sm leading-relaxed text-center max-w-md ${
            isCinematic ? 'text-lavender-200' : 'text-[#2D2635]'
          }`}
        >
          {paragraphs.map((p, idx) => (
            <p key={idx}>{p}</p>
          ))}
        </div>

        {/* Next Chapter CTA Button */}
        <div>
          <button
            type="button"
            onClick={onNext}
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full bg-rose-CTA hover:bg-rose-CTA-hover text-white font-body font-bold text-sm sm:text-base shadow-md hover:scale-102 active:scale-98 transition-all duration-150 focus:outline-none focus-visible:ring-3 focus-visible:ring-rose-300 cursor-pointer"
          >
            <span>{page.ctaText || 'Continue Our Story ✨'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
};
