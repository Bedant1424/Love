import React, { useState } from 'react';
import { BirthdayBlessingsContent } from '../../types/content.types';
import { PhotoSticker } from '../common/PhotoSticker';
import { Sparkles, Heart, Sun, Shield, Compass, Smile, ArrowRight, Check } from 'lucide-react';

interface SceneBlessingsProps {
  content?: BirthdayBlessingsContent;
  onNext: () => void;
}

const DEFAULT_BLESSINGS: BirthdayBlessingsContent = {
  badge: 'From My Soul to Yours 🕊️',
  title: 'Birthday Blessings For You',
  subtitle: 'Tap each little token to unlock all the sweet wishes in my heart',
  blessings: [
    {
      id: 1,
      icon: 'Sun',
      title: 'Boundless Joy 🌸',
      blessing:
        'May you wake up each morning with lightness in your chest, laughter on your lips, and a smile that reaches your eyes.',
      color: '#C2315D',
    },
    {
      id: 2,
      icon: 'Shield',
      title: 'Unshakable Peace 🕊️',
      blessing:
        'May all overthinking fade away. Whenever the world gets loud, may you always find calm and serenity right here in my arms.',
      color: '#7A4AC2',
    },
    {
      id: 3,
      icon: 'Sparkles',
      title: 'Fierce Success 🌟',
      blessing:
        'May every single dream, goal, and ambition you hold blossom into reality this year. You are capable of moving mountains.',
      color: '#E6A117',
    },
    {
      id: 4,
      icon: 'Smile',
      title: 'Radiant Health 🌿',
      blessing:
        'May you stay energized, glowing, and protected always—eating good food, sleeping peacefully, and staying safe everywhere you go.',
      color: '#2E8540',
    },
    {
      id: 5,
      icon: 'Compass',
      title: 'Pure Adventure 🚀',
      blessing:
        'May this year bring us exciting trips, late-night food runs, spontaneous drives, and memories we will treasure forever.',
      color: '#1A73E8',
    },
    {
      id: 6,
      icon: 'Heart',
      title: 'Unconditional Love 💖',
      blessing:
        'May you never doubt for a single second how deeply precious, cherished, and endlessly loved you are by me.',
      color: '#C2315D',
    },
  ],
  ctaText: 'Open When... Letters ✉️',
};

export const SceneBlessings: React.FC<SceneBlessingsProps> = ({
  content = DEFAULT_BLESSINGS,
  onNext,
}) => {
  const [selectedId, setSelectedId] = useState<number>(1);
  const [unlockedIds, setUnlockedIds] = useState<number[]>([1]);

  const items = content.blessings || DEFAULT_BLESSINGS.blessings;
  const activeItem = items.find((b) => b.id === selectedId) || items[0];

  const handleSelect = (id: number) => {
    setSelectedId(id);
    if (!unlockedIds.includes(id)) {
      setUnlockedIds((prev) => [...prev, id]);
    }
  };

  const getIcon = (name: string) => {
    switch (name) {
      case 'Sun':
        return <Sun className="w-4 h-4 text-amber-500" />;
      case 'Shield':
        return <Shield className="w-4 h-4 text-lavender-CTA" />;
      case 'Sparkles':
        return <Sparkles className="w-4 h-4 text-gold-500" />;
      case 'Smile':
        return <Smile className="w-4 h-4 text-emerald-600" />;
      case 'Compass':
        return <Compass className="w-4 h-4 text-blue-500" />;
      case 'Heart':
      default:
        return <Heart className="w-4 h-4 text-rose-CTA fill-rose-CTA/40" />;
    }
  };

  return (
    <section
      aria-label="Birthday Blessings"
      className="relative w-full h-full flex flex-col items-center justify-between py-1 sm:py-2 px-2 sm:px-4 text-center select-none overflow-hidden max-w-lg mx-auto"
    >
      {/* Decorative Scrapbook Photos (Responsive) */}
      <div className="hidden lg:block absolute left-4 bottom-10 z-10 pointer-events-auto">
        <PhotoSticker
          src="media/hero-white-dress.jpeg"
          alt="Angel in White"
          caption="Pure Radiance ✨"
          type="polaroid"
          size="sm"
          rotation="-rotate-6"
          tape={true}
        />
      </div>

      <div className="hidden lg:block absolute right-4 top-10 z-10 pointer-events-auto">
        <PhotoSticker
          src="media/couple-arms-linked.jpeg"
          alt="Always Together"
          type="circle"
          size="sm"
          rotation="rotate-6"
        />
      </div>

      {/* Top Header & Counter */}
      <div className="flex-shrink-0 flex flex-col items-center w-full max-w-sm">
        <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-rose-50 border border-rose-200/80 text-rose-CTA font-body text-xs font-bold tracking-wide mb-1">
          <Heart className="w-3.5 h-3.5 fill-rose-CTA text-rose-CTA" />
          <span>{content.badge}</span>
        </div>

        <h2 className="font-heading text-xl sm:text-2xl text-[#2D2635] leading-tight mb-0.5">
          {content.title}
        </h2>
        <p className="font-body text-xs text-[#5C4D6B] max-w-xs mb-2">
          {content.subtitle}
        </p>

        {/* 6 Blessing Interactive Tokens */}
        <div className="grid grid-cols-6 gap-1.5 w-full p-1 bg-white/80 rounded-2xl border border-lavender-200/70 shadow-xs">
          {items.map((b) => {
            const isSelected = b.id === selectedId;
            const isUnlocked = unlockedIds.includes(b.id);
            return (
              <button
                key={b.id}
                type="button"
                onClick={() => handleSelect(b.id)}
                className={`flex flex-col items-center justify-center p-1.5 rounded-xl transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-rose-CTA text-white shadow-xs scale-105'
                    : isUnlocked
                    ? 'bg-rose-50/80 text-neutral-800 hover:bg-rose-100'
                    : 'bg-lavender-50/60 text-neutral-500 hover:bg-lavender-100'
                }`}
                aria-label={`Open blessing ${b.title}`}
              >
                <div className={isSelected ? 'text-white' : ''}>
                  {getIcon(b.icon)}
                </div>
                <span className="text-[9px] font-semibold mt-0.5 truncate w-full">
                  #{b.id}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Blessing Display Card */}
      <div className="flex-1 min-h-0 w-full flex items-center justify-center my-auto py-1">
        <div className="relative w-full max-w-sm bg-[#FDFAFF] text-[#2D2635] rounded-2xl p-4 sm:p-5 border-2 border-[#DFD2F5] shadow-card text-left flex flex-col justify-between">
          {/* Top Washi Tape Decoration */}
          <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-20 h-3.5 washi-tape rounded-xs z-20 pointer-events-none" />

          {/* Blessing Card Header */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-rose-100/70 border border-rose-200 flex items-center justify-center">
                {getIcon(activeItem.icon)}
              </div>
              <h3 className="font-heading text-base sm:text-lg font-bold text-[#2D2635]">
                {activeItem.title}
              </h3>
            </div>
            {unlockedIds.includes(activeItem.id) && (
              <div className="flex items-center gap-1 text-[11px] font-semibold text-rose-CTA bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                <Check className="w-3 h-3" />
                <span>Unlocked</span>
              </div>
            )}
          </div>

          {/* Blessing Message */}
          <p className="font-body text-xs sm:text-sm text-[#2D2635] leading-relaxed my-2 animate-fade-in">
            {activeItem.blessing}
          </p>

          {/* Signoff */}
          <div className="mt-2 pt-2 border-t border-rose-100/60 text-right">
            <span className="font-handwriting text-xs sm:text-sm text-rose-CTA">
              Sent with my whole heart 💕
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
          <span>{content.ctaText || 'Open When... Letters ✉️'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </section>
  );
};
