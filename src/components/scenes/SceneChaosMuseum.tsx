import React, { useState } from 'react';
import { ChaosMuseumContent } from '../../types/content.types';
import { resolveMediaUrl } from '../../data/mediaRegistry';
import { Sparkles, Laugh, Crown, ArrowRight } from 'lucide-react';

interface SceneChaosMuseumProps {
  content?: ChaosMuseumContent;
  onNext: () => void;
}

const DEFAULT_CONTENT: ChaosMuseumContent = {
  badge: 'Special Exhibition 🏛️',
  title: 'Cute vs. Chaos Museum',
  subtitle: 'A scientific curation of "My Pretty Girl" vs "My Little Menace"',
  cuteItems: [
    {
      id: 'cute-1',
      title: 'The Queen in Purple',
      caption: 'Breathtaking elegance in traditional saree',
      imageUrl: 'media/hero-purple-saree.jpeg',
      tag: 'Elegance',
    },
    {
      id: 'cute-2',
      title: 'Sunshine & Dimples',
      caption: 'Outdoor glow with that sweetest smile',
      imageUrl: 'media/hero-pretty-dress.jpeg',
      tag: 'Radiant',
    },
    {
      id: 'cute-3',
      title: 'Angel in White',
      caption: 'Gentle, warm, and endlessly lovely',
      imageUrl: 'media/hero-white-dress.jpeg',
      tag: 'Soft Heart',
    },
    {
      id: 'cute-4',
      title: 'Autumn Golden Hour',
      caption: 'Warm brick-wall portrait at sunset',
      imageUrl: 'media/hero-red-wall.jpeg',
      tag: 'Stunning',
    },
  ],
  chaosItems: [
    {
      id: 'chaos-1',
      title: 'Historical Menace',
      caption: 'Out-posing museum statues with unmatched flair',
      imageUrl: 'media/museum-statue-pose.jpeg',
      tag: 'Peak Drama',
    },
    {
      id: 'chaos-2',
      title: 'The Face Mask Ritual',
      caption: 'Glowing skin, zero tolerance for laughter',
      imageUrl: 'media/chaos-ubtan-mask.jpeg',
      tag: 'Spa Chaos',
    },
    {
      id: 'chaos-3',
      title: 'The Signature Scrunch',
      caption: 'When she does not get her way for 2 seconds',
      imageUrl: 'media/chaos-pout-scrunch.jpeg',
      tag: 'Drama Queen',
    },
    {
      id: 'chaos-4',
      title: 'Gulal Pink Bandit',
      caption: 'Holi festival joy and pink colored cheeks',
      imageUrl: 'media/chaos-holi-colors.jpeg',
      tag: 'Holi Joy',
    },
    {
      id: 'chaos-5',
      title: 'The Tease Tongue-Out',
      caption: 'Unstoppable comedic timing mid-photo',
      imageUrl: 'media/chaos-tongue-out.jpeg',
      tag: 'Teasing',
    },
  ],
  ctaText: 'Relive Our Memories 📷',
};

export const SceneChaosMuseum: React.FC<SceneChaosMuseumProps> = ({
  content = DEFAULT_CONTENT,
  onNext,
}) => {
  const [activeTab, setActiveTab] = useState<'cute' | 'chaos'>('cute');
  const [selectedIdx, setSelectedIdx] = useState(0);

  const items = activeTab === 'cute' ? content.cuteItems : content.chaosItems;
  const currentItem = items[selectedIdx] || items[0];

  const handleTabSwitch = (tab: 'cute' | 'chaos') => {
    setActiveTab(tab);
    setSelectedIdx(0);
  };

  return (
    <section
      aria-label="Cute vs Chaos Museum"
      className="relative w-full h-full flex flex-col items-center justify-between py-1 sm:py-2 px-2 sm:px-4 text-center select-none overflow-hidden max-w-lg mx-auto"
    >
      {/* Top Header & Exhibition Selector */}
      <div className="flex-shrink-0 flex flex-col items-center w-full max-w-sm">
        {/* Chapter Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-rose-50 border border-rose-200/80 text-rose-CTA font-body text-xs font-bold tracking-wide mb-1">
          <Sparkles className="w-3.5 h-3.5 text-rose-CTA" />
          <span>{content.badge || 'Special Exhibition 🏛️'}</span>
        </div>

        <h2 className="font-heading text-xl sm:text-2xl text-[#2D2635] leading-tight mb-0.5">
          {content.title}
        </h2>
        <p className="font-body text-xs text-[#5C4D6B] max-w-xs mb-2">
          {content.subtitle}
        </p>

        {/* Wing Switcher Tabs */}
        <div className="inline-flex p-1 rounded-full bg-lavender-100/80 border border-lavender-200 shadow-xs">
          <button
            type="button"
            onClick={() => handleTabSwitch('cute')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'cute'
                ? 'bg-rose-CTA text-white shadow-xs scale-102'
                : 'text-[#5C4D6B] hover:text-[#2D2635]'
            }`}
          >
            <Crown className="w-3.5 h-3.5" />
            <span>My Pretty Girl 🌸</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabSwitch('chaos')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'chaos'
                ? 'bg-lavender-CTA text-white shadow-xs scale-102'
                : 'text-[#5C4D6B] hover:text-[#2D2635]'
            }`}
          >
            <Laugh className="w-3.5 h-3.5" />
            <span>Little Menace 😈</span>
          </button>
        </div>
      </div>

      {/* Main Exhibition Exhibit Display (Fits comfortably inside viewport) */}
      <div className="flex-1 min-h-0 w-full flex items-center justify-center my-auto py-1">
        <div className="relative w-full max-w-sm bg-[#FDFAFF] text-[#2D2635] rounded-2xl p-2.5 sm:p-3.5 border-2 border-[#DFD2F5] shadow-card flex flex-col items-center">
          {/* Top Washi Tape Decoration */}
          <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-20 h-3.5 washi-tape rounded-xs z-20 pointer-events-none" />

          {/* Photo Frame */}
          <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-rose-50/60 border border-lavender-200/80 shadow-inner group">
            <img
              src={resolveMediaUrl(currentItem.imageUrl)}
              alt={currentItem.title}
              className="w-full h-full object-contain bg-neutral-900/5 transition-transform duration-300 group-hover:scale-102"
              loading="lazy"
            />
            {currentItem.tag && (
              <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/60 text-white text-[10px] font-semibold backdrop-blur-xs">
                {currentItem.tag}
              </span>
            )}
          </div>

          {/* Exhibit Placard Description */}
          <div className="mt-2 text-center w-full px-1">
            <h3 className="font-heading text-sm sm:text-base font-bold text-[#2D2635]">
              {currentItem.title}
            </h3>
            <p className="font-body text-xs text-[#5C4D6B] mt-0.5 line-clamp-2">
              {currentItem.caption}
            </p>
          </div>

          {/* Exhibit Thumbnail Selector Dots / Strips */}
          <div className="flex items-center gap-1.5 mt-2">
            {items.map((item, idx) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedIdx(idx)}
                className={`w-2.5 h-2.5 rounded-full transition-all cursor-pointer ${
                  selectedIdx === idx
                    ? activeTab === 'cute'
                      ? 'bg-rose-CTA scale-125 ring-2 ring-rose-200'
                      : 'bg-lavender-CTA scale-125 ring-2 ring-lavender-300'
                    : 'bg-lavender-200 hover:bg-lavender-300'
                }`}
                aria-label={`View exhibit ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Footer Navigation CTA */}
      <div className="flex-shrink-0 pb-1">
        <button
          type="button"
          onClick={onNext}
          className="inline-flex items-center justify-center gap-2 px-5 py-2 rounded-full bg-rose-CTA hover:bg-rose-CTA-hover text-white font-body font-bold text-xs sm:text-sm shadow-md hover:scale-102 active:scale-98 transition-all duration-150 focus:outline-none focus-visible:ring-3 focus-visible:ring-rose-300 cursor-pointer"
        >
          <span>{content.ctaText || 'Relive Our Memories 📷'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </section>
  );
};
