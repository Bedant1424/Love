import React, { useState } from 'react';
import confetti from 'canvas-confetti';

interface Cake3DProps {
  isBlownOut: boolean;
  onBlowOut: () => void;
  className?: string;
}

export const Cake3D: React.FC<Cake3DProps> = ({
  isBlownOut,
  onBlowOut,
  className = '',
}) => {
  const [smokeActive, setSmokeActive] = useState(false);

  const handleCandleTap = () => {
    if (isBlownOut) return;

    // Trigger smoke animation
    setSmokeActive(true);

    // Trigger canvas-confetti burst
    try {
      // Main center burst
      confetti({
        particleCount: 90,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#F9A8BD', '#DFD2F5', '#FCD34D', '#C2315D', '#7A4AC2'],
        disableForReducedMotion: true,
      });

      // Side glitter showers
      setTimeout(() => {
        confetti({
          particleCount: 40,
          angle: 60,
          spread: 55,
          origin: { x: 0.2, y: 0.65 },
          colors: ['#F9A8BD', '#FCD34D', '#DFD2F5'],
          disableForReducedMotion: true,
        });
        confetti({
          particleCount: 40,
          angle: 120,
          spread: 55,
          origin: { x: 0.8, y: 0.65 },
          colors: ['#7A4AC2', '#C2315D', '#FAF7F2'],
          disableForReducedMotion: true,
        });
      }, 250);
    } catch {
      // Graceful fallback if confetti fails
    }

    onBlowOut();
  };

  return (
    <div
      className={`relative flex flex-col items-center justify-center select-none py-6 ${className}`}
      aria-label="Interactive 3-tier birthday cake with candle"
    >
      {/* Candle and Flame Assembly */}
      <div className="relative flex flex-col items-center z-20 -mb-2">
        {/* Flame Button */}
        <button
          type="button"
          onClick={handleCandleTap}
          disabled={isBlownOut}
          className={`relative group cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 rounded-full p-2 transition-transform duration-200 ${
            !isBlownOut ? 'hover:scale-110 active:scale-95' : 'cursor-default'
          }`}
          aria-label={isBlownOut ? 'Candle extinguished' : 'Tap candle flame to make a wish and blow it out'}
          title={isBlownOut ? 'Wish made! ✨' : 'Make a wish and tap to blow out 🎂'}
        >
          {/* Flame Halo Glow */}
          {!isBlownOut && (
            <div className="absolute inset-0 bg-gold-400/40 rounded-full blur-md animate-pulse pointer-events-none" />
          )}

          {/* Animated Flame SVG */}
          {!isBlownOut ? (
            <div className="relative w-8 h-10 flex items-center justify-center animate-flicker">
              <svg viewBox="0 0 24 32" className="w-8 h-10 drop-shadow-md">
                {/* Outer Orange Flame */}
                <path
                  d="M12 2 C8 10 4 16 4 22 C4 27.5 7.5 31 12 31 C16.5 31 20 27.5 20 22 C20 16 16 10 12 2 Z"
                  fill="#F59E0B"
                />
                {/* Mid Yellow Flame */}
                <path
                  d="M12 8 C9.5 14 7 18 7 23 C7 26.5 9.2 29 12 29 C14.8 29 17 26.5 17 23 C17 18 14.5 14 12 8 Z"
                  fill="#FCD34D"
                />
                {/* Inner White Core */}
                <path
                  d="M12 16 C10.8 19 9.5 21 9.5 24 C9.5 26 10.6 27.5 12 27.5 C13.4 27.5 14.5 26 14.5 24 C14.5 21 13.2 19 12 16 Z"
                  fill="#FFFBEB"
                />
              </svg>
            </div>
          ) : (
            /* Smoke Curl when Extinguished */
            <div className="relative w-8 h-10 flex items-center justify-center">
              {smokeActive && (
                <div className="w-2 h-8 flex flex-col items-center">
                  <div className="w-1.5 h-1.5 bg-neutral-400/60 rounded-full animate-ping" />
                  <div className="w-2 h-4 bg-gradient-to-t from-neutral-400/40 to-transparent rounded-full animate-pulse blur-[1px]" />
                </div>
              )}
            </div>
          )}
        </button>

        {/* Candle Wick & Body */}
        <div className="w-1.5 h-3 bg-neutral-800 rounded-t -mt-1 z-10" />
        <div className="w-4 h-12 bg-gradient-to-r from-amber-100 via-amber-200 to-amber-300 rounded-sm shadow-sm relative overflow-hidden border border-amber-400/30">
          {/* Candle Spiral Stripes */}
          <div className="absolute inset-0 opacity-40 bg-[repeating-linear-gradient(45deg,#E85D83,#E85D83_3px,transparent_3px,transparent_8px)]" />
        </div>
      </div>

      {/* SVG 3-Tier Layered Cake */}
      <div className="relative flex flex-col items-center drop-shadow-2xl">
        {/* Tier 1: Top Layer (Vanilla Cream with Drip Icing) */}
        <div className="relative w-36 h-16 bg-cream-50 rounded-t-2xl border-2 border-cream-100 shadow-sm flex flex-col items-center z-10">
          {/* Strawberry Drip Icing */}
          <div className="w-full h-5 bg-rose-300 rounded-t-2xl relative overflow-hidden">
            <svg viewBox="0 0 144 20" className="absolute bottom-0 w-full h-4 fill-rose-300" preserveAspectRatio="none">
              <path d="M0,0 Q12,16 24,0 T48,0 T72,0 T96,0 T120,0 T144,0 L144,0 L0,0 Z" />
            </svg>
          </div>
          {/* Sugar Pearls */}
          <div className="flex items-center justify-around w-full px-3 mt-1.5">
            <span className="w-2 h-2 rounded-full bg-lavender-400 shadow-xs" />
            <span className="w-2 h-2 rounded-full bg-gold-400 shadow-xs" />
            <span className="w-2 h-2 rounded-full bg-rose-CTA shadow-xs" />
            <span className="w-2 h-2 rounded-full bg-gold-400 shadow-xs" />
            <span className="w-2 h-2 rounded-full bg-lavender-400 shadow-xs" />
          </div>
        </div>

        {/* Tier 2: Middle Layer (Soft Lavender with Rosette Piping) */}
        <div className="relative w-48 h-18 bg-lavender-100 rounded-t-2xl border-2 border-lavender-200 shadow-md flex flex-col items-center -mt-2 z-0">
          {/* Rosette Cream Border */}
          <div className="flex items-center justify-around w-full px-2 pt-1">
            {Array.from({ length: 8 }).map((_, i) => (
              <span
                key={i}
                className="w-3.5 h-3.5 rounded-full bg-cream-50 border border-lavender-200 shadow-xs -mt-2"
              />
            ))}
          </div>
          {/* Floral Swirl Pattern */}
          <div className="flex items-center justify-center gap-4 mt-2 opacity-80 text-lavender-CTA">
            <span className="text-xs">🌸</span>
            <span className="text-xs font-handwriting font-bold tracking-widest text-lavender-800">SWEET LOVE</span>
            <span className="text-xs">🌸</span>
          </div>
        </div>

        {/* Tier 3: Bottom Layer (Blush Pink Base) */}
        <div className="relative w-64 h-20 bg-rose-100 rounded-t-2xl border-2 border-rose-300 shadow-lg flex flex-col items-center -mt-2 -z-10">
          {/* Scalloped Sugar Piping */}
          <div className="flex items-center justify-around w-full px-2 pt-0.5">
            {Array.from({ length: 11 }).map((_, i) => (
              <span
                key={i}
                className="w-4 h-4 rounded-full bg-cream-50 border border-rose-200 shadow-xs -mt-2"
              />
            ))}
          </div>
          {/* Heart Accents */}
          <div className="flex items-center justify-around w-full px-6 mt-3 text-rose-CTA">
            <span className="text-sm">💖</span>
            <span className="text-sm">✨</span>
            <span className="text-sm">💕</span>
            <span className="text-sm">✨</span>
            <span className="text-sm">💖</span>
          </div>
        </div>

        {/* Cake Platter Stand (Golden Pearl Base) */}
        <div className="w-72 h-4 bg-gradient-to-r from-amber-100 via-amber-200 to-amber-100 rounded-full border border-amber-300 shadow-xl -mt-1 flex items-center justify-center">
          <div className="w-56 h-1 bg-amber-400/40 rounded-full" />
        </div>
        <div className="w-36 h-3 bg-amber-200/80 rounded-b-xl border-x border-b border-amber-300/60 shadow-md" />
      </div>
    </div>
  );
};
