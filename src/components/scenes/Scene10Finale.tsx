import React, { useEffect, useState } from 'react';
import { FinaleContent, SenderInfo } from '../../types/content.types';
import { PapercraftFallback } from '../common/PapercraftFallback';
import confetti from 'canvas-confetti';
import { Heart, Sparkles, RotateCcw } from 'lucide-react';

interface Scene10FinaleProps {
  content: FinaleContent;
  sender: SenderInfo;
  chapterNumber?: number;
  onReplay: () => void;
}

export const Scene10Finale: React.FC<Scene10FinaleProps> = ({
  content,
  sender,
  chapterNumber,
  onReplay,
}) => {
  const [imageError, setImageError] = useState(false);

  // Trigger celebration confetti on mount
  useEffect(() => {
    try {
      const end = Date.now() + 1800;
      const colors = ['#F9A8BD', '#DFD2F5', '#FCD34D', '#C2315D', '#FAF7F2'];

      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: colors,
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: colors,
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      frame();
    } catch {
      // Graceful fallback
    }
  }, []);

  return (
    <section
      aria-label="Grand Birthday Finale"
      className="relative min-h-[90vh] flex flex-col items-center justify-center px-4 py-12 text-center select-none"
    >
      {/* Cinematic Starfield Texture */}
      <div className="absolute inset-0 pointer-events-none opacity-30 bg-[radial-gradient(#FCD34D_1px,transparent_1px)] [background-size:24px_24px]" />

      <div className="relative max-w-lg w-full bg-plum-900/90 backdrop-blur-md rounded-3xl p-6 sm:p-10 shadow-2xl border-2 border-lavender-400/30 flex flex-col items-center z-10">
        {/* Floating Accent Icons */}
        <div className="flex items-center gap-2 text-amber-300 font-heading text-sm mb-4">
          <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
          <span>
            {chapterNumber ? `Chapter ${chapterNumber}: Our Endless Story` : 'Our Endless Story'}
          </span>
          <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
        </div>

        {/* Hero Photo or Illustrated Fallback Frame */}
        <div className="relative w-56 h-56 sm:w-64 sm:h-64 rounded-2xl overflow-hidden border-4 border-amber-300/60 shadow-floating mb-6 bg-plum-950 flex items-center justify-center">
          {content.heroImageUrl && !imageError ? (
            <img
              src={content.heroImageUrl}
              alt={content.fallbackTitle}
              onError={() => setImageError(true)}
              className="w-full h-full object-cover"
            />
          ) : (
            <PapercraftFallback
              title={content.fallbackTitle}
              theme="gold"
              iconType="heart"
              className="h-full border-0"
            />
          )}
        </div>

        {/* Climax Romantic Headline */}
        <h2 className="font-heading text-3xl sm:text-5xl text-cream-50 leading-tight mb-4">
          {content.title}
        </h2>

        {/* Heartfelt Paragraphs */}
        <div className="space-y-3 font-body text-base sm:text-lg text-lavender-200 leading-relaxed max-w-md mb-8">
          {content.paragraphs.map((para, idx) => (
            <p key={idx}>{para}</p>
          ))}
        </div>

        {/* Sign-off & Signature */}
        <div className="mb-8 border-t border-lavender-500/20 pt-4 w-full">
          <p className="font-handwriting text-xl text-neutral-400">
            {content.signOff}
          </p>
          <div className="flex items-center justify-center gap-2 mt-1">
            <Heart className="w-5 h-5 text-rose-CTA fill-rose-CTA" />
            <p className="font-handwriting text-3xl font-bold text-amber-300">
              {sender.name} 💕
            </p>
            <Heart className="w-5 h-5 text-rose-CTA fill-rose-CTA" />
          </div>
        </div>

        {/* Replay Control */}
        <button
          type="button"
          onClick={onReplay}
          className="inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-full bg-lavender-CTA hover:bg-lavender-CTA-hover text-white font-body font-bold text-base sm:text-lg shadow-floating hover:scale-105 active:scale-95 transition-all duration-200 focus:outline-none focus-visible:ring-4 focus-visible:ring-lavender-400"
          aria-label="Replay the birthday experience from the beginning"
        >
          <RotateCcw className="w-5 h-5" />
          <span>{content.replayText}</span>
        </button>
      </div>
    </section>
  );
};
