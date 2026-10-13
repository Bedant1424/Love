import React, { useState } from 'react';
import { BirthdayMomentContent } from '../../types/content.types';
import { Cake3D } from '../interactive/Cake3D';
import { Sparkles, ArrowRight } from 'lucide-react';

interface Scene2CakeProps {
  content: BirthdayMomentContent;
  onNext: () => void;
}

export const Scene2Cake: React.FC<Scene2CakeProps> = ({ content, onNext }) => {
  const [isBlownOut, setIsBlownOut] = useState(false);

  return (
    <section
      aria-label="Birthday Cake and Wish"
      className="relative w-full h-full flex flex-col items-center justify-center p-2 sm:p-4 text-center select-none overflow-hidden"
    >
      {/* Cinematic Starry Background Accent */}
      <div className="absolute inset-0 pointer-events-none opacity-40 bg-[radial-gradient(#FCD34D_1px,transparent_1px)] [background-size:28px_28px]" />

      <div className="relative max-w-lg w-full flex flex-col items-center z-10">
        {/* Header Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-plum-900/90 border border-lavender-400/30 text-amber-300 font-body text-xs font-bold tracking-wide mb-1.5 shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          <span>The Birthday Moment</span>
        </div>

        {/* Cinematic Header Title */}
        <h2 className="font-heading text-xl sm:text-3xl text-cream-50 leading-tight mb-1">
          {content.celebrationHeader}
        </h2>

        {/* Dynamic Wish Instruction Text */}
        <p
          className={`font-body text-xs sm:text-sm transition-all duration-500 max-w-md my-1.5 ${
            isBlownOut
              ? 'text-amber-200 font-semibold bg-plum-900/80 px-3 py-1.5 rounded-xl border border-amber-400/40'
              : 'text-lavender-200'
          }`}
        >
          {isBlownOut ? content.instructionPost : content.instructionPre}
        </p>

        {/* Interactive 3-Tier Birthday Cake with Candle */}
        <div className="my-1 scale-80 sm:scale-90 origin-center">
          <Cake3D isBlownOut={isBlownOut} onBlowOut={() => setIsBlownOut(true)} />
        </div>

        {/* Proceed Button (Visible once the wish has been made) */}
        {isBlownOut ? (
          <div className="mt-2 animate-fade-in">
            <button
              type="button"
              onClick={onNext}
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full bg-rose-CTA hover:bg-rose-CTA-hover text-white font-body font-bold text-sm sm:text-base shadow-md hover:scale-102 active:scale-98 transition-all duration-150 focus:outline-none focus-visible:ring-3 focus-visible:ring-rose-300 cursor-pointer"
              aria-label="Proceed to love letter"
            >
              <span>{content.ctaText}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <p className="font-handwriting text-base text-amber-300/90 mt-1 animate-pulse">
            ✨ Tap the candle flame to blow it out! ✨
          </p>
        )}
      </div>
    </section>
  );
};
