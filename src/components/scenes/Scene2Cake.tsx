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
      className="relative min-h-[90vh] flex flex-col items-center justify-center px-4 py-10 text-center select-none"
    >
      {/* Cinematic Starry Background Accent */}
      <div className="absolute inset-0 pointer-events-none opacity-40 bg-[radial-gradient(#FCD34D_1px,transparent_1px)] [background-size:28px_28px]" />

      <div className="relative max-w-xl w-full flex flex-col items-center z-10">
        {/* Header Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-plum-900/90 border border-lavender-400/30 text-amber-300 font-body text-xs sm:text-sm font-bold tracking-wide mb-4 shadow-sm">
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>The Birthday Moment</span>
        </div>

        {/* Cinematic Header Title */}
        <h2 className="font-heading text-2xl sm:text-4xl text-cream-50 leading-tight mb-2">
          {content.celebrationHeader}
        </h2>

        {/* Dynamic Wish Instruction Text */}
        <p
          className={`font-body text-base sm:text-lg transition-all duration-500 max-w-md my-3 ${
            isBlownOut
              ? 'text-amber-200 font-semibold bg-plum-900/80 px-4 py-2 rounded-xl border border-amber-400/40'
              : 'text-lavender-200'
          }`}
        >
          {isBlownOut ? content.instructionPost : content.instructionPre}
        </p>

        {/* Interactive 3-Tier Birthday Cake with Candle */}
        <div className="my-4">
          <Cake3D isBlownOut={isBlownOut} onBlowOut={() => setIsBlownOut(true)} />
        </div>

        {/* Proceed Button (Visible once the wish has been made) */}
        {isBlownOut ? (
          <div className="mt-4 animate-fade-in">
            <button
              type="button"
              onClick={onNext}
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-rose-CTA hover:bg-rose-CTA-hover text-white font-body font-bold text-lg shadow-floating hover:scale-105 active:scale-95 transition-all duration-200 focus:outline-none focus-visible:ring-4 focus-visible:ring-rose-300"
              aria-label="Proceed to love letter"
            >
              <span>{content.ctaText}</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <p className="font-handwriting text-xl text-amber-300/80 mt-2 animate-pulse">
            ✨ Tap the candle flame to blow it out! ✨
          </p>
        )}
      </div>
    </section>
  );
};
