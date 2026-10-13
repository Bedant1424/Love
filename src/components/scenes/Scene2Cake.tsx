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

  // Sweet rounded heading hierarchy
  const headingText =
    content.celebrationHeader && !content.celebrationHeader.includes("IT'S FINALLY HERE")
      ? content.celebrationHeader
      : 'Happy Birthday, My Love! 🎉';

  return (
    <section
      aria-label="Birthday Cake and Wish"
      className="relative w-full h-full flex flex-col items-center justify-between py-1 sm:py-2 px-2 sm:px-4 text-center select-none overflow-hidden max-h-full"
    >
      {/* 1. Atmospheric Gradient Background: Deep plum blending into soft berry and muted lavender */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-[#160B1F] via-[#2D123A] to-[#1C0C28]" />
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,_rgba(122,74,194,0.18)_0%,_transparent_65%)]" />

      {/* Gentle pink glow centered behind the cake */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 sm:w-96 sm:h-96 rounded-full bg-rose-500/15 blur-3xl pointer-events-none" />

      {/* Subtle floating stars & hearts accent */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-35">
        <span className="absolute top-6 left-8 text-xs text-lavender-200 animate-pulse">✦</span>
        <span className="absolute top-14 right-10 text-xs text-rose-300 animate-pulse delay-300">♥</span>
        <span className="absolute bottom-16 left-10 text-xs text-rose-200 animate-pulse delay-700">♥</span>
        <span className="absolute bottom-10 right-12 text-xs text-lavender-300 animate-pulse delay-500">✦</span>
        <span className="absolute top-1/3 left-6 text-[10px] text-amber-200 animate-pulse delay-200">✨</span>
        <span className="absolute top-2/3 right-8 text-[10px] text-pink-200 animate-pulse delay-400">✨</span>
      </div>

      {/* 2. Top Header Section: Small Badge + Rounded Sweet Heading + Subtle Wish Card */}
      <div className="relative flex flex-col items-center flex-shrink-0 z-10 max-w-md w-full pt-0.5">
        {/* Small badge: “The Birthday Moment ✨” */}
        <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-plum-900/80 border border-lavender-400/25 text-rose-300 font-body text-xs font-semibold tracking-wide mb-1 shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-rose-300" />
          <span>The Birthday Moment ✨</span>
        </div>

        {/* Main heading: Sweet, rounded font (Quicksand via font-body) */}
        <h2 className="font-body font-bold text-lg sm:text-2xl text-cream-50 leading-tight tracking-tight mb-1 drop-shadow-sm">
          {headingText}
        </h2>

        {/* Wish message: Short, warm sentence in a subtle card (no bulky gold border) */}
        <div className="w-full flex justify-center px-2">
          <p
            className={`font-body text-xs sm:text-sm short-compact-text transition-all duration-300 max-w-sm py-1 px-3 rounded-full leading-normal ${
              isBlownOut
                ? 'bg-plum-900/60 border border-lavender-400/20 text-rose-200 shadow-xs'
                : 'bg-black/25 border border-white/10 text-lavender-200/95'
            }`}
          >
            {isBlownOut
              ? content.instructionPost || '✨ Wish locked in! May all your sweetest dreams come true.'
              : content.instructionPre || 'Close your eyes, make a sweet wish, and tap the flame to blow it out! 🕯️'}
          </p>
        </div>
      </div>

      {/* 3. Center Section: Scaled 3-Tier Cake with Candle */}
      <div className="flex-1 min-h-0 w-full flex items-center justify-center z-10 my-auto py-0.5">
        <div className="cake-responsive-scale scale-[0.72] sm:scale-[0.82] md:scale-90 origin-center transition-transform duration-200">
          <Cake3D isBlownOut={isBlownOut} onBlowOut={() => setIsBlownOut(true)} />
        </div>
      </div>

      {/* 4. Bottom Section: Comfortable CTA Button or Tap Hint (Never hidden or clipped) */}
      <div className="flex-shrink-0 w-full flex flex-col items-center justify-center min-h-[48px] z-10 pb-1 sm:pb-2">
        {isBlownOut ? (
          <div className="animate-fade-in w-full flex justify-center">
            <button
              type="button"
              onClick={onNext}
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full bg-rose-CTA hover:bg-rose-CTA-hover text-white font-body font-bold text-sm sm:text-base shadow-lg hover:scale-102 active:scale-98 transition-all duration-150 focus:outline-none focus-visible:ring-3 focus-visible:ring-rose-300 cursor-pointer"
              aria-label="Proceed to love letter"
            >
              <span>{content.ctaText || 'Open Your Birthday Letter 💌'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <p className="font-handwriting text-sm sm:text-base text-amber-200/90 animate-pulse">
            ✨ Tap the candle flame to blow it out! ✨
          </p>
        )}
      </div>
    </section>
  );
};

