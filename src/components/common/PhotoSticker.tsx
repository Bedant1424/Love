import React, { useState } from 'react';
import { resolveMediaUrl } from '../../data/mediaRegistry';

export type PhotoStickerType = 'polaroid' | 'circle' | 'sticker' | 'stamp';
export type PhotoStickerSize = 'xs' | 'sm' | 'md' | 'lg';

interface PhotoStickerProps {
  src: string;
  alt: string;
  type?: PhotoStickerType;
  size?: PhotoStickerSize;
  caption?: string;
  rotation?: string;
  className?: string;
  tape?: boolean;
  pin?: boolean;
  onClick?: () => void;
}

export const PhotoSticker: React.FC<PhotoStickerProps> = ({
  src,
  alt,
  type = 'polaroid',
  size = 'sm',
  caption,
  rotation = 'rotate-0',
  className = '',
  tape = false,
  pin = false,
  onClick,
}) => {
  const [isZoomed, setIsZoomed] = useState(false);
  const resolvedSrc = resolveMediaUrl(src);

  const sizeClasses: Record<PhotoStickerType, Record<PhotoStickerSize, string>> = {
    circle: {
      xs: 'w-10 h-10',
      sm: 'w-14 h-14 sm:w-16 sm:h-16',
      md: 'w-20 h-20 sm:w-24 sm:h-24',
      lg: 'w-28 h-28 sm:w-32 sm:h-32',
    },
    polaroid: {
      xs: 'w-16 p-1 pb-2',
      sm: 'w-20 sm:w-24 p-1.5 pb-3',
      md: 'w-28 sm:w-32 p-2 pb-4',
      lg: 'w-36 sm:w-44 p-2.5 pb-5',
    },
    sticker: {
      xs: 'w-12 h-12',
      sm: 'w-16 h-16 sm:w-20 sm:h-20',
      md: 'w-24 h-24 sm:w-28 sm:h-28',
      lg: 'w-32 h-32 sm:w-36 sm:h-36',
    },
    stamp: {
      xs: 'w-12 h-12 p-1',
      sm: 'w-16 h-16 p-1.5',
      md: 'w-24 h-24 p-2',
      lg: 'w-32 h-32 p-2.5',
    },
  };

  const handleInteraction = () => {
    if (onClick) {
      onClick();
    } else {
      setIsZoomed(!isZoomed);
    }
  };

  return (
    <>
      <div
        className={`relative inline-block transition-transform duration-300 hover:scale-105 hover:z-30 cursor-pointer select-none ${rotation} ${className}`}
        onClick={handleInteraction}
      >
        {/* Washi Tape Header Decor */}
        {tape && (
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-10 sm:w-12 h-3 bg-rose-200/80 border-t border-b border-rose-300/60 shadow-xs -rotate-2 rounded-2xs z-20 pointer-events-none" />
        )}

        {/* Push Pin Decor */}
        {pin && (
          <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-rose-CTA border-2 border-white shadow-sm z-20 pointer-events-none" />
        )}

        {/* Circular Bobble-Head Style */}
        {type === 'circle' && (
          <div
            className={`rounded-full overflow-hidden border-2 border-white/90 shadow-floating bg-cream-100 flex items-center justify-center ${sizeClasses.circle[size]}`}
          >
            <img
              src={resolvedSrc}
              alt={alt}
              className="w-full h-full object-cover pointer-events-none"
              loading="lazy"
            />
          </div>
        )}

        {/* Classic Scrapbook Polaroid Style */}
        {type === 'polaroid' && (
          <div
            className={`bg-[#FDFAFF] text-[#2D2635] rounded-lg border border-[#DFD2F5] shadow-card flex flex-col items-center ${sizeClasses.polaroid[size]}`}
          >
            <div className="w-full aspect-square rounded-sm overflow-hidden bg-rose-50/50">
              <img
                src={resolvedSrc}
                alt={alt}
                className="w-full h-full object-cover pointer-events-none"
                loading="lazy"
              />
            </div>
            {caption && (
              <span className="font-handwriting text-[10px] sm:text-xs text-[#5C4D6B] mt-1 text-center truncate max-w-full px-0.5">
                {caption}
              </span>
            )}
          </div>
        )}

        {/* Die-cut Floating Sticker Style */}
        {type === 'sticker' && (
          <div
            className={`rounded-2xl overflow-hidden border-2 border-white shadow-floating bg-white/40 backdrop-blur-2xs p-1 ${sizeClasses.sticker[size]}`}
          >
            <img
              src={resolvedSrc}
              alt={alt}
              className="w-full h-full object-cover rounded-xl pointer-events-none"
              loading="lazy"
            />
          </div>
        )}

        {/* Postage Stamp Style */}
        {type === 'stamp' && (
          <div
            className={`bg-white border-2 border-dashed border-rose-300 shadow-sm rounded-sm ${sizeClasses.stamp[size]}`}
          >
            <img
              src={resolvedSrc}
              alt={alt}
              className="w-full h-full object-cover rounded-2xs pointer-events-none"
              loading="lazy"
            />
          </div>
        )}
      </div>

      {/* Quick Tap Zoom Preview Modal */}
      {isZoomed && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/70 backdrop-blur-xs animate-fade-in"
          onClick={() => setIsZoomed(false)}
        >
          <div
            className="relative max-w-xs sm:max-w-sm w-full bg-[#FDFAFF] text-[#2D2635] p-3 rounded-2xl shadow-2xl border-2 border-[#DFD2F5] flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full aspect-[4/5] rounded-xl overflow-hidden shadow-inner bg-cream-100">
              <img
                src={resolvedSrc}
                alt={alt}
                className="w-full h-full object-contain bg-neutral-950/5"
              />
            </div>
            <div className="mt-2 text-center w-full">
              <p className="font-heading text-base text-rose-CTA">{alt}</p>
              {caption && (
                <p className="font-body text-xs text-[#5C4D6B] mt-0.5">{caption}</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => setIsZoomed(false)}
              className="mt-3 px-4 py-1 rounded-full bg-rose-CTA text-white font-medium text-xs hover:bg-rose-CTA-hover transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
};
