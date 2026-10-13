import React, { useState } from 'react';
import { ReasonItem } from '../../types/content.types';
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
  const [openedCards, setOpenedCards] = useState<number[]>([]);

  const toggleCard = (id: number) => {
    setOpenedCards((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Smile':
        return <Smile className="w-6 h-6 text-rose-CTA" />;
      case 'Heart':
        return <Heart className="w-6 h-6 text-rose-CTA fill-rose-CTA/30" />;
      case 'Moon':
        return <Moon className="w-6 h-6 text-lavender-CTA" />;
      case 'Sparkles':
        return <Sparkles className="w-6 h-6 text-gold-500" />;
      case 'Home':
        return <Home className="w-6 h-6 text-rose-500" />;
      case 'Star':
      default:
        return <Star className="w-6 h-6 text-gold-500 fill-gold-400/40" />;
    }
  };

  const progressCount = openedCards.length;

  return (
    <section
      aria-label="Reasons Why I Love You"
      className="relative min-h-[90vh] flex flex-col items-center justify-center px-4 py-12 max-w-4xl mx-auto"
    >
      {/* Chapter Badge */}
      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-50 border border-rose-200/60 text-rose-CTA font-body text-xs sm:text-sm font-bold tracking-wide mb-3">
        <Heart className="w-4 h-4 fill-rose-CTA" />
        <span>Chapter 4: What Makes You So Special</span>
      </div>

      <h2 className="font-heading text-3xl sm:text-4xl text-neutral-800 leading-tight text-center mb-2">
        Reasons Why I Love You
      </h2>
      <p className="font-body text-base text-neutral-600 text-center max-w-md mb-6">
        There are infinite reasons, but here are six little pieces of my heart. Tap each card to unlock the memory!
      </p>

      {/* Discovery Counter Bar */}
      <div className="w-full max-w-md bg-white rounded-full p-2 px-4 shadow-sm border border-lavender-200/70 mb-8 flex items-center justify-between">
        <span className="font-body text-xs sm:text-sm font-semibold text-neutral-700">
          Unfolded: <strong className="text-rose-CTA">{progressCount}</strong> of {reasons.length} reasons
        </span>
        <div className="flex items-center gap-1.5">
          {reasons.map((r) => (
            <span
              key={r.id}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                openedCards.includes(r.id) ? 'bg-rose-CTA scale-110' : 'bg-lavender-100'
              }`}
            />
          ))}
        </div>
      </div>

      {/* 6 Reasons Card Grid */}
      <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
        {reasons.map((item) => {
          const isOpen = openedCards.includes(item.id);

          return (
            <div
              key={item.id}
              role="button"
              tabIndex={0}
              onClick={() => toggleCard(item.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  toggleCard(item.id);
                }
              }}
              aria-expanded={isOpen}
              className={`relative bg-white rounded-2xl p-6 border-2 transition-all duration-300 cursor-pointer shadow-card text-left flex flex-col justify-between min-h-[190px] focus:outline-none focus-visible:ring-4 focus-visible:ring-rose-CTA ${
                isOpen
                  ? 'border-rose-CTA/60 bg-gradient-to-br from-white to-rose-50/50 shadow-md scale-102'
                  : 'border-lavender-200/80 hover:border-rose-300 hover:scale-101'
              }`}
            >
              {/* Card Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 rounded-xl bg-lavender-50 border border-lavender-200/60 flex items-center justify-center">
                  {getIcon(item.iconName)}
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="font-heading text-xs text-neutral-400">#{item.id}</span>
                  {isOpen && <CheckCircle2 className="w-4 h-4 text-rose-CTA" />}
                </div>
              </div>

              {/* Title & Revealed Description */}
              <div>
                <h3 className="font-heading text-lg font-semibold text-neutral-800 mb-1.5">
                  {item.title}
                </h3>
                {isOpen ? (
                  <p className="font-body text-sm text-neutral-700 leading-relaxed animate-fade-in">
                    {item.description}
                  </p>
                ) : (
                  <p className="font-handwriting text-base text-rose-CTA/90 italic">
                    Tap to reveal this sweet reason... 💕
                  </p>
                )}
              </div>

              {/* Card Footer Tap Prompt */}
              <div className="mt-4 pt-2 border-t border-stone-100 flex items-center justify-end">
                <span className="font-body text-[11px] text-neutral-400">
                  {isOpen ? 'Tap to minimize' : 'Tap to unfold ✨'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Direct Route to Next Chapter (Scene 5) */}
      <div className="flex flex-col items-center">
        <button
          type="button"
          onClick={onNext}
          className="inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-full bg-rose-CTA hover:bg-rose-CTA-hover text-white font-body font-bold text-lg shadow-floating hover:scale-105 active:scale-95 transition-all duration-200 focus:outline-none focus-visible:ring-4 focus-visible:ring-rose-300"
          aria-label="Continue to our photo memory gallery"
        >
          <span>Explore Our Memories 📷</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </section>
  );
};
