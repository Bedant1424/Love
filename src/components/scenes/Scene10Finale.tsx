import React, { useEffect, useState } from 'react';
import { FinaleContent, SenderInfo } from '../../types/content.types';
import { PapercraftFallback } from '../common/PapercraftFallback';
import { PhotoSticker } from '../common/PhotoSticker';
import { resolveMediaUrl } from '../../data/mediaRegistry';
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
      className="relative w-full h-full flex flex-col items-center justify-center p-2 sm:p-4 text-center select-none overflow-hidden max-w-lg mx-auto"
    >
      {/* Decorative Scrapbook Photos (Responsive) */}
      <div className="hidden lg:block absolute left-4 bottom-8 z-10 pointer-events-auto">
        <PhotoSticker
          src="media/couple-head-rest.jpeg"
          alt="Us Forever"
          caption="My Safe Place 💕"
          type="polaroid"
          size="sm"
          rotation="-rotate-6"
          tape={true}
        />
      </div>

      <div className="hidden lg:block absolute right-4 top-8 z-10 pointer-events-auto">
        <PhotoSticker
          src="media/hero-purple-saree.jpeg"
          alt="My Queen"
          type="circle"
          size="sm"
          rotation="rotate-6"
        />
      </div>

      {/* Cinematic Starfield Texture */}
      <div className="absolute inset-0 pointer-events-none opacity-30 bg-[radial-gradient(#FCD34D_1px,transparent_1px)] [background-size:24px_24px]" />

      <div className="relative max-w-xl w-full bg-plum-900/90 rounded-2xl p-3 sm:p-5 shadow-xl border-2 border-lavender-400/30 flex flex-col items-center z-10">
        <div className="flex flex-col short-landscape-row items-center justify-center gap-2 sm:gap-5 w-full">
          {/* Photo frame on left in landscape */}
          <div className="flex flex-col items-center flex-shrink-0">
            {/* Floating Accent Icons */}
            <div className="flex items-center gap-1.5 text-amber-300 font-heading text-xs mb-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
              <span>
                {chapterNumber ? `Chapter ${chapterNumber}` : 'Endless Story'}
              </span>
              <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
            </div>

            <div className="relative w-28 h-28 sm:w-36 sm:h-36 short-compact-photo rounded-xl overflow-hidden border-2 border-amber-300/60 shadow-md bg-plum-950 flex items-center justify-center flex-shrink-0">
              {content.heroImageUrl && !imageError ? (
                <img
                  src={resolveMediaUrl(content.heroImageUrl)}
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
          </div>

          {/* Text, signature & button on right in landscape */}
          <div className="flex flex-col items-center text-center max-w-sm">
            <h2 className="font-heading text-lg sm:text-2xl text-cream-50 leading-tight mb-1">
              {content.title}
            </h2>

            <div className="space-y-1 font-body text-xs sm:text-sm text-lavender-200 leading-relaxed mb-2">
              {content.paragraphs.map((para, idx) => (
                <p key={idx}>{para}</p>
              ))}
            </div>

            {/* Sign-off & Signature */}
            <div className="mb-2 border-t border-lavender-500/20 pt-1 w-full">
              <p className="font-handwriting text-xs text-neutral-400">
                {content.signOff}
              </p>
              <div className="flex items-center justify-center gap-1.5 mt-0.5">
                <Heart className="w-3.5 h-3.5 text-rose-CTA fill-rose-CTA" />
                <p className="font-handwriting text-lg sm:text-xl font-bold text-amber-300">
                  {sender.name} 💕
                </p>
                <Heart className="w-3.5 h-3.5 text-rose-CTA fill-rose-CTA" />
              </div>
            </div>

            {/* Replay Control */}
            <button
              type="button"
              onClick={onReplay}
              className="inline-flex items-center justify-center gap-2 px-5 py-1.5 rounded-full bg-lavender-CTA hover:bg-lavender-CTA-hover text-white font-body font-bold text-xs sm:text-sm shadow-md hover:scale-102 active:scale-98 transition-all duration-150 focus:outline-none focus-visible:ring-3 focus-visible:ring-lavender-400 cursor-pointer"
              aria-label="Replay the birthday experience from the beginning"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{content.replayText}</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
