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
      className="relative min-h-[90vh] flex flex-col items-center justify-center px-4 py-12 text-center overflow-hidden"
    >
      {/* Ambient Floating Hearts & Stars */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <span className="absolute top-[12%] left-[10%] text-2xl animate-float opacity-75">🌸</span>
        <span className="absolute top-[20%] right-[12%] text-3xl animate-float opacity-80 [animation-delay:1s]">✨</span>
        <span className="absolute bottom-[22%] left-[15%] text-2xl animate-float opacity-70 [animation-delay:2s]">💕</span>
        <span className="absolute bottom-[18%] right-[14%] text-3xl animate-float opacity-75 [animation-delay:1.5s]">💖</span>
        <span className="absolute top-[45%] left-[6%] text-xl animate-float opacity-60 [animation-delay:2.5s]">⭐</span>
        <span className="absolute top-[50%] right-[8%] text-xl animate-float opacity-60 [animation-delay:0.5s]">🌷</span>
      </div>

      {/* Main Greeting Card Surface */}
      <div className="relative max-w-lg w-full bg-white/90 backdrop-blur-sm rounded-3xl p-6 sm:p-10 shadow-card border-2 border-lavender-200/70 parchment-texture flex flex-col items-center z-10">
        {/* Top Washi Tape Strip */}
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 w-28 h-6 washi-tape rounded-xs opacity-90 z-20 pointer-events-none" />

        {/* Romantic Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-50 border border-rose-200/60 text-rose-CTA font-body text-xs sm:text-sm font-bold tracking-wide mb-5">
          <Sparkles className="w-4 h-4 text-rose-CTA" />
          <span>{content.badge}</span>
        </div>

        {/* Display Hero Title */}
        <h1 className="font-heading text-3xl sm:text-5xl text-neutral-800 leading-tight pb-2">
          {content.title}
        </h1>

        {/* Recipient Dedication */}
        <div className="flex items-center gap-2 mt-1 mb-5 text-rose-CTA">
          <Heart className="w-5 h-5 fill-rose-CTA" />
          <span className="font-handwriting text-2xl sm:text-3xl font-bold tracking-wide">
            {recipient.name} {recipient.nickname ? `(${recipient.nickname})` : ''}
          </span>
          <Heart className="w-5 h-5 fill-rose-CTA" />
        </div>

        {/* Invitation Message */}
        <p className="font-body text-base sm:text-lg text-neutral-600 leading-relaxed max-w-md mb-8">
          {content.invitation}
        </p>

        {/* Primary Call to Action Button */}
        <button
          type="button"
          onClick={onStart}
          className="group relative inline-flex items-center justify-center gap-3 px-8 py-4 rounded-full bg-rose-CTA hover:bg-rose-CTA-hover text-white font-body font-bold text-lg sm:text-xl shadow-floating hover:scale-105 active:scale-95 transition-all duration-200 focus:outline-none focus-visible:ring-4 focus-visible:ring-rose-300"
          aria-label="Begin our birthday story"
        >
          <span>{content.ctaText}</span>
          <span className="group-hover:translate-x-1 transition-transform">→</span>
        </button>

        {/* Sound Hint Notice */}
        {content.audioHint && (
          <p className="mt-6 font-body text-xs text-neutral-500 flex items-center gap-1.5">
            <span>{content.audioHint}</span>
          </p>
        )}
      </div>
    </section>
  );
};
