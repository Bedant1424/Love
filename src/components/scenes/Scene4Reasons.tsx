import React, { useState } from 'react';
import { ReasonItem } from '../../types/content.types';
import { resolveMediaUrl } from '../../data/mediaRegistry';
import {
  Smile,
  Heart,
  Moon,
  Sparkles,
  Home,
  Star,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';

interface Scene4ReasonsProps {
  reasons: ReasonItem[];
  onNext: () => void;
}

export const Scene4Reasons: React.FC<Scene4ReasonsProps> = ({
  reasons,
  onNext,
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [openedCards, setOpenedCards] = useState<number[]>([reasons[0]?.id || 1]);

  const currentItem = reasons[activeIndex] || reasons[0];
  const isOpen = openedCards.includes(currentItem.id);

  const toggleCard = (id: number) => {
    setOpenedCards((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleNextReason = () => {
    const nextIdx = (activeIndex + 1) % reasons.length;
    setActiveIndex(nextIdx);
    if (!openedCards.includes(reasons[nextIdx].id)) {
      setOpenedCards((prev) => [...prev, reasons[nextIdx].id]);
    }
  };

  const handlePrevReason = () => {
    const prevIdx = (activeIndex - 1 + reasons.length) % reasons.length;
    setActiveIndex(prevIdx);
    if (!openedCards.includes(reasons[prevIdx].id)) {
      setOpenedCards((prev) => [...prev, reasons[prevIdx].id]);
    }
  };

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Smile':
        return <Smile className="w-4 h-4 text-rose-CTA" />;
      case 'Heart':
        return <Heart className="w-4 h-4 text-rose-CTA fill-rose-CTA/30" />;
      case 'Moon':
        return <Moon className="w-4 h-4 text-lavender-CTA" />;
      case 'Sparkles':
        return <Sparkles className="w-4 h-4 text-amber-500" />;
      case 'Home':
        return <Home className="w-4 h-4 text-rose-500" />;
      case 'Star':
      default:
        return <Star className="w-4 h-4 text-amber-500 fill-amber-400/40" />;
    }
  };

  const progressCount = openedCards.length;

  return (
    <section
      aria-label="Reasons Why I Love You"
      className="relative w-full h-full flex flex-col items-center justify-between py-1 sm:py-2 px-2 sm:px-4 text-center select-none overflow-hidden max-w-lg mx-auto"
    >
      {/* Top Header & Counter */}
      <div className="flex-shrink-0 flex flex-col items-center max-w-sm w-full">
        <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-rose-50 border border-rose-200/80 text-rose-CTA font-body text-xs font-bold tracking-wide mb-1">
          <Heart className="w-3.5 h-3.5 fill-rose-CTA" />
          <span>Chapter 4: What Makes You So Special</span>
        </div>

        <h2 className="font-heading text-xl sm:text-2xl text-[#2D2635] leading-tight mb-0.5">
          Reasons Why I Love You
        </h2>
        <p className="font-body text-xs text-[#5C4D6B] max-w-xs mb-2">
          Pieces of my heart. Tap to unfold each memory!
        </p>

        {/* Discovery Counter Bar */}
        <div className="w-full bg-white/90 rounded-full py-0.5 px-3 shadow-xs border border-lavender-200/80 flex items-center justify-between text-xs">
          <span className="font-body font-semibold text-[#5C4D6B]">
            Unfolded: <strong className="text-rose-CTA">{progressCount}</strong> of {reasons.length}
          </span>
          <div className="flex items-center gap-1.5">
            {reasons.map((r, idx) => (
              <button
                key={r.id}
                type="button"
                onClick={() => {
                  setActiveIndex(idx);
                  if (!openedCards.includes(r.id)) {
                    setOpenedCards((prev) => [...prev, r.id]);
                  }
                }}
                className={`w-2.5 h-2.5 rounded-full transition-all cursor-pointer ${
                  activeIndex === idx
                    ? 'bg-rose-CTA scale-125 ring-2 ring-rose-200'
                    : openedCards.includes(r.id)
                    ? 'bg-rose-300'
                    : 'bg-lavender-200'
                }`}
                aria-label={`Go to reason ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Center Interactive Reason Card */}
      <div className="flex-1 min-h-0 w-full flex items-center justify-center my-auto py-1">
        <div
          role="button"
          tabIndex={0}
          onClick={() => toggleCard(currentItem.id)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              toggleCard(currentItem.id);
            }
          }}
          aria-expanded={isOpen}
          className="relative w-full max-w-sm bg-[#FDFAFF] text-[#2D2635] rounded-2xl p-3 sm:p-4 border-2 border-[#DFD2F5] shadow-[0_8px_24px_-4px_rgba(122,74,194,0.12)] cursor-pointer text-left flex flex-col justify-between transition-all hover:scale-[1.01]"
        >
          {/* Top Washi Tape Strip */}
          <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-20 h-3.5 washi-tape rounded-xs z-20 pointer-events-none" />

          {/* Card Header */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-lavender-100/70 border border-lavender-200 flex items-center justify-center">
                {getIcon(currentItem.iconName)}
              </div>
              <span className="font-heading text-xs text-[#5C4D6B]">
                Reason {activeIndex + 1} of {reasons.length}
              </span>
            </div>
            {isOpen && <CheckCircle2 className="w-4 h-4 text-rose-CTA" />}
          </div>

          {/* Content with Optional Photo Pairing */}
          <div className="flex gap-3 items-start">
            {currentItem.photoUrl && (
              <div className="flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border-2 border-white shadow-md bg-cream-100 rotate-1">
                <img
                  src={resolveMediaUrl(currentItem.photoUrl)}
                  alt={currentItem.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="font-heading text-sm sm:text-base font-semibold text-[#2D2635] mb-1">
                {currentItem.title}
              </h3>
              {isOpen ? (
                <p className="font-body text-xs text-[#2D2635] leading-relaxed animate-fade-in line-clamp-3">
                  {currentItem.description}
                </p>
              ) : (
                <p className="font-handwriting text-xs sm:text-sm text-rose-CTA italic">
                  Tap to unfold this memory... 💕
                </p>
              )}
            </div>
          </div>

          {/* Bottom Card Navigation Arrows */}
          <div className="mt-2.5 pt-1.5 border-t border-rose-100/60 flex items-center justify-between">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handlePrevReason();
              }}
              className="text-xs font-semibold text-[#5C4D6B] hover:text-rose-CTA px-2 py-0.5 rounded transition-colors cursor-pointer"
            >
              ← Prev
            </button>
            <span className="text-[10px] text-neutral-400">
              {isOpen ? 'Tap to fold' : 'Tap card to unfold ✨'}
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleNextReason();
              }}
              className="text-xs font-semibold text-[#5C4D6B] hover:text-rose-CTA px-2 py-0.5 rounded transition-colors cursor-pointer"
            >
              Next →
            </button>
          </div>
        </div>
      </div>

      {/* Direct Route to Next Chapter */}
      <div className="flex-shrink-0 pb-1">
        <button
          type="button"
          onClick={onNext}
          className="inline-flex items-center justify-center gap-2 px-5 py-2 rounded-full bg-rose-CTA hover:bg-rose-CTA-hover text-white font-body font-bold text-xs sm:text-sm shadow-md hover:scale-102 active:scale-98 transition-all duration-150 focus:outline-none focus-visible:ring-3 focus-visible:ring-rose-300 cursor-pointer"
          aria-label="Continue to Cute vs Chaos Museum"
        >
          <span>Cute vs Chaos Museum 🏛️</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </section>
  );
};
