import React from 'react';
import { GreetingSceneContent, RecipientInfo } from '../../types/content.types';
import { Sparkles, Heart } from 'lucide-react';

interface Scene1GreetingProps {
  content: GreetingSceneContent;
  recipient: RecipientInfo;
  onStart: () => void;
}

export const Scene1Greeting: React.FC<Scene1GreetingProps> = ({
  content,
  recipient,
  onStart,
}) => {
  return (
    <section
      aria-label="Welcome and Birthday Greeting"
      className="relative w-full h-full flex flex-col items-center justify-center p-2 sm:p-4 text-center overflow-hidden select-none"
    >
      {/* Ambient Floating Hearts & Stars */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <span className="absolute top-[8%] left-[8%] text-xl animate-float opacity-70">🌸</span>
        <span className="absolute top-[14%] right-[10%] text-2xl animate-float opacity-75 [animation-delay:1s]">✨</span>
        <span className="absolute bottom-[16%] left-[10%] text-xl animate-float opacity-70 [animation-delay:2s]">💕</span>
        <span className="absolute bottom-[12%] right-[10%] text-2xl animate-float opacity-70 [animation-delay:1.5s]">💖</span>
      </div>

      {/* Main Greeting Card Surface */}
      <div className="relative max-w-md w-full bg-[#FDFAFF] rounded-2xl p-4 sm:p-6 shadow-[0_8px_24px_-4px_rgba(122,74,194,0.14)] border-2 border-[#DFD2F5] flex flex-col items-center z-10">
        {/* Top Washi Tape Strip */}
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-24 h-5 washi-tape rounded-xs z-20 pointer-events-none" />

        {/* Decorative corner accents */}
        <span className="absolute top-2 left-3 text-xs text-rose-300 opacity-60 pointer-events-none select-none">✨</span>
        <span className="absolute top-2 right-3 text-xs text-lavender-300 opacity-60 pointer-events-none select-none">🌸</span>

        {/* Romantic Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200/80 text-rose-CTA font-body text-xs font-bold tracking-wide mb-2">
          <Sparkles className="w-3.5 h-3.5 text-rose-CTA" />
          <span>{content.badge}</span>
        </div>

        {/* Display Hero Title */}
        <h1 className="font-heading text-2xl sm:text-4xl text-[#2D2635] leading-tight pb-0.5">
          {content.title}
        </h1>

        {/* Recipient Dedication */}
        <div className="flex items-center gap-1.5 my-1 text-rose-CTA">
          <Heart className="w-4 h-4 fill-rose-CTA" />
          <span className="font-handwriting text-2xl sm:text-3xl font-bold tracking-wide">
            {recipient.name} {recipient.nickname ? `(${recipient.nickname})` : ''}
          </span>
          <Heart className="w-4 h-4 fill-rose-CTA" />
        </div>

        {/* Invitation Message */}
        <p className="font-body text-xs sm:text-sm text-[#5C4D6B] leading-relaxed max-w-sm mb-3.5">
          {content.invitation}
        </p>

        {/* Primary Call to Action Button */}
        <button
          type="button"
          onClick={onStart}
          className="group relative inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full bg-rose-CTA hover:bg-rose-CTA-hover text-white font-body font-bold text-sm sm:text-base shadow-md hover:scale-102 active:scale-98 transition-all duration-150 focus:outline-none focus-visible:ring-3 focus-visible:ring-rose-300 cursor-pointer"
          aria-label="Begin our birthday story"
        >
          <span>{content.ctaText}</span>
          <span className="group-hover:translate-x-1 transition-transform">→</span>
        </button>

        {/* Sound Hint Notice */}
        {content.audioHint && (
          <p className="mt-2 font-body text-[11px] text-[#5C4D6B] flex items-center gap-1">
            <span>{content.audioHint}</span>
          </p>
        )}
      </div>
    </section>
  );
};
