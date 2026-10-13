import React, { useState } from 'react';
import { FutureDreamsContent } from '../../types/content.types';
import { PhotoSticker } from '../common/PhotoSticker';
import { Compass, CheckSquare, Square, ArrowRight } from 'lucide-react';

interface SceneFutureDreamsProps {
  content?: FutureDreamsContent;
  onNext: () => void;
}

const DEFAULT_FUTURE: FutureDreamsContent = {
  badge: 'Our Tomorrow 🌅',
  title: 'A Little Future With You',
  subtitle: 'A few little promises, road trips, and adventures waiting for us',
  dreams: [
    {
      id: 1,
      title: 'Our First Trip to the Hills ⛰️',
      description: 'Misty mornings, hot chai in giant cups, wrapped together in a giant shawl.',
      tag: 'Getaway',
      checked: false,
    },
    {
      id: 2,
      title: 'Late Night Ice Cream Runs 🍦',
      description: 'Midnight drives in pajamas just because you craved something sweet.',
      tag: 'Date Night',
      checked: false,
    },
    {
      id: 3,
      title: 'Cooking a Complete Disaster Together 🍝',
      description: 'Flour on our noses, burning the garlic bread, laughing uncontrollably.',
      tag: 'Silly Fun',
      checked: false,
    },
    {
      id: 4,
      title: 'Our Own Cozy Balcony Garden 🏡',
      description: 'A sunny spot with fairy lights, potted plants, and your favorite books.',
      tag: 'Future Home',
      checked: false,
    },
    {
      id: 5,
      title: 'Stargazing on a Quiet Rooftop 🌌',
      description: 'Lying side by side pointing at stars and talking about our forever.',
      tag: 'Romance',
      checked: false,
    },
    {
      id: 6,
      title: 'Growing Old & Still Teasing You 👵👴',
      description: 'Sixty years from now, still kissing those same sweet dimples.',
      tag: 'Forever',
      checked: false,
    },
  ],
  note: 'The best chapters of our story are the ones we have not even written yet ✨',
  ctaText: 'Our Forever Promise 💕',
};

export const SceneFutureDreams: React.FC<SceneFutureDreamsProps> = ({
  content = DEFAULT_FUTURE,
  onNext,
}) => {
  const [checkedIds, setCheckedIds] = useState<number[]>([1, 2]);

  const dreams = content.dreams || DEFAULT_FUTURE.dreams;

  const toggleCheck = (id: number) => {
    setCheckedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  return (
    <section
      aria-label="Future Dreams and Bucket List"
      className="relative w-full h-full flex flex-col items-center justify-between py-1 sm:py-2 px-2 sm:px-4 text-center select-none overflow-hidden max-w-lg mx-auto"
    >
      {/* Decorative Scrapbook Photos (Responsive) */}
      <div className="hidden lg:block absolute left-4 bottom-8 z-10 pointer-events-auto">
        <PhotoSticker
          src="media/couple-scooter.jpeg"
          alt="Roadtrips"
          caption="Every adventure with you 🛵"
          type="polaroid"
          size="sm"
          rotation="-rotate-6"
          tape={true}
        />
      </div>

      <div className="hidden lg:block absolute right-4 top-10 z-10 pointer-events-auto">
        <PhotoSticker
          src="media/food-date.jpeg"
          alt="Cafe Date"
          caption="A lifetime of food dates 🍝"
          type="polaroid"
          size="sm"
          rotation="rotate-6"
          tape={true}
        />
      </div>

      {/* Top Header */}
      <div className="flex-shrink-0 flex flex-col items-center w-full max-w-sm">
        <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-rose-50 border border-rose-200/80 text-rose-CTA font-body text-xs font-bold tracking-wide mb-1">
          <Compass className="w-3.5 h-3.5 text-rose-CTA" />
          <span>{content.badge}</span>
        </div>

        <h2 className="font-heading text-xl sm:text-2xl text-[#2D2635] leading-tight mb-0.5">
          {content.title}
        </h2>
        <p className="font-body text-xs text-[#5C4D6B] max-w-xs mb-1.5">
          {content.subtitle}
        </p>
      </div>

      {/* Interactive Bucket List Card (Fits in Viewport) */}
      <div className="flex-1 min-h-0 w-full flex items-center justify-center my-auto py-1">
        <div className="relative w-full max-w-md bg-[#FDFAFF] text-[#2D2635] rounded-2xl p-3 sm:p-4 border-2 border-[#DFD2F5] shadow-card text-left flex flex-col justify-between max-h-full overflow-hidden">
          {/* Top Washi Tape */}
          <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-20 h-3.5 washi-tape rounded-xs z-20 pointer-events-none" />

          {/* List Container with Smooth Scroll if needed */}
          <div className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-2 touch-pan-y">
            {dreams.map((dream) => {
              const isDone = checkedIds.includes(dream.id);
              return (
                <div
                  key={dream.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => toggleCheck(dream.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      toggleCheck(dream.id);
                    }
                  }}
                  className={`flex items-start gap-2.5 p-2 rounded-xl border transition-all cursor-pointer ${
                    isDone
                      ? 'bg-rose-50/80 border-rose-200/90 shadow-2xs'
                      : 'bg-white/90 border-lavender-200/70 hover:bg-rose-50/40'
                  }`}
                >
                  <div className="mt-0.5 flex-shrink-0 text-rose-CTA">
                    {isDone ? (
                      <CheckSquare className="w-4 h-4 fill-rose-100" />
                    ) : (
                      <Square className="w-4 h-4 text-neutral-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3
                        className={`font-heading text-xs sm:text-sm font-bold ${
                          isDone ? 'text-rose-CTA' : 'text-[#2D2635]'
                        }`}
                      >
                        {dream.title}
                      </h3>
                      <span className="text-[9px] font-semibold text-[#5C4D6B] bg-lavender-100/70 px-1.5 py-0.2 rounded-full">
                        {dream.tag}
                      </span>
                    </div>
                    <p className="font-body text-[11px] sm:text-xs text-[#5C4D6B] mt-0.5 leading-snug">
                      {dream.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Sweet Concluding Note */}
          <div className="mt-2 pt-2 border-t border-rose-100/80 flex items-center justify-between">
            <p className="font-handwriting text-xs text-rose-CTA truncate">
              {content.note}
            </p>
            <span className="text-[10px] font-bold text-neutral-400 flex-shrink-0 ml-2">
              {checkedIds.length}/{dreams.length} Pledged 💕
            </span>
          </div>
        </div>
      </div>

      {/* Footer CTA */}
      <div className="flex-shrink-0 pb-1">
        <button
          type="button"
          onClick={onNext}
          className="inline-flex items-center justify-center gap-2 px-5 py-2 rounded-full bg-rose-CTA hover:bg-rose-CTA-hover text-white font-body font-bold text-xs sm:text-sm shadow-md hover:scale-102 active:scale-98 transition-all duration-150 focus:outline-none focus-visible:ring-3 focus-visible:ring-rose-300 cursor-pointer"
        >
          <span>{content.ctaText || 'Our Forever Promise 💕'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </section>
  );
};
