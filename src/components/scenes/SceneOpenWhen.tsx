import React, { useState } from 'react';
import { OpenWhenContent, OpenWhenEnvelope } from '../../types/content.types';
import { resolveMediaUrl } from '../../data/mediaRegistry';
import { Mail, X, Heart, ArrowRight, Sparkles, Moon, Laugh, Frown } from 'lucide-react';

interface SceneOpenWhenProps {
  content?: OpenWhenContent;
  onNext: () => void;
}

const DEFAULT_ENVELOPES: OpenWhenContent = {
  badge: 'Letters For Rainy Days ✉️',
  title: 'Open When...',
  subtitle: 'Six sealed notes for the exact moments you need my love the most',
  envelopes: [
    {
      id: 1,
      title: "When You're Missing Me",
      preview: 'Close your eyes and breathe...',
      message:
        'Close your eyes and take a deep breath. I am never further away than a thought. Call me right now, even if it is 3 AM. No matter where we are, half of my heart is always right there with you.',
      photoUrl: 'media/couple-face-cup.jpeg',
      icon: 'Heart',
    },
    {
      id: 2,
      title: 'When You Cannot Sleep',
      preview: 'Put the phone down and get cozy...',
      message:
        'Put your phone down, tuck yourself into the softest blanket, and picture my hand gently stroking your hair. You are completely safe, you are cherished, and tomorrow will be a peaceful day. Sweet dreams, my angel.',
      photoUrl: 'media/sleepy-pillow.jpeg',
      icon: 'Moon',
    },
    {
      id: 3,
      title: 'When You Doubt Yourself',
      preview: 'Look in the mirror, my love...',
      message:
        'Look at yourself with the same eyes I see you with. You are extraordinarily brilliant, hardworking, and strong. Whatever obstacle is in front of you right now does not stand a chance. I believe in you with every fiber of my being.',
      photoUrl: 'media/hero-white-dress.jpeg',
      icon: 'Sparkles',
    },
    {
      id: 4,
      title: "When You're Mad at Me",
      preview: 'I am so sorry for being silly...',
      message:
        'I am so sorry for whatever silly or thoughtless thing I said or did. Even when we disagree, my love for you does not waver by a single millimeter. Please let me give you a giant hug and treat you to your favorite meal right now.',
      photoUrl: 'media/couple-squish-cheeks.jpeg',
      icon: 'Frown',
    },
    {
      id: 5,
      title: 'When You Need a Laugh',
      preview: 'Remember this silly face?...',
      message:
        'Remember this moment? You are the most adorable little clown and my favorite chaos in this whole universe. Stop wrinkling your forehead and let yourself giggle—life is too short not to laugh at our silliness together!',
      photoUrl: 'media/museum-statue-pose.jpeg',
      icon: 'Laugh',
    },
    {
      id: 6,
      title: 'When You Wonder Why I Love You',
      preview: 'Because loving you is like breathing...',
      message:
        'Because you make ordinary days feel like poetry. Because the sound of your laugh is my favorite melody. Because with you, I am home. Loving you is the easiest, truest thing I have ever done and ever will do.',
      photoUrl: 'media/couple-head-rest.jpeg',
      icon: 'Heart',
    },
  ],
  ctaText: 'A Little Future With You 🌅',
};

export const SceneOpenWhen: React.FC<SceneOpenWhenProps> = ({
  content = DEFAULT_ENVELOPES,
  onNext,
}) => {
  const [activeEnvelope, setActiveEnvelope] = useState<OpenWhenEnvelope | null>(null);

  const envelopes = content.envelopes || DEFAULT_ENVELOPES.envelopes;

  const getEnvelopeIcon = (iconName: string) => {
    switch (iconName) {
      case 'Moon':
        return <Moon className="w-4 h-4 text-lavender-CTA" />;
      case 'Sparkles':
        return <Sparkles className="w-4 h-4 text-amber-500" />;
      case 'Laugh':
        return <Laugh className="w-4 h-4 text-emerald-600" />;
      case 'Frown':
        return <Frown className="w-4 h-4 text-rose-500" />;
      case 'Heart':
      default:
        return <Heart className="w-4 h-4 text-rose-CTA fill-rose-CTA/40" />;
    }
  };

  return (
    <section
      aria-label="Open When Letters"
      className="relative w-full h-full flex flex-col items-center justify-between py-1 sm:py-2 px-2 sm:px-4 text-center select-none overflow-hidden max-w-lg mx-auto"
    >
      {/* Top Header */}
      <div className="flex-shrink-0 flex flex-col items-center w-full max-w-sm">
        <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-rose-50 border border-rose-200/80 text-rose-CTA font-body text-xs font-bold tracking-wide mb-1">
          <Mail className="w-3.5 h-3.5 text-rose-CTA" />
          <span>{content.badge}</span>
        </div>

        <h2 className="font-heading text-xl sm:text-2xl text-[#2D2635] leading-tight mb-0.5">
          {content.title}
        </h2>
        <p className="font-body text-xs text-[#5C4D6B] max-w-xs mb-2">
          {content.subtitle}
        </p>
      </div>

      {/* 6 Interactive Tactile Envelopes Grid */}
      <div className="flex-1 min-h-0 w-full flex items-center justify-center my-auto py-1">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-2.5 w-full max-w-md">
          {envelopes.map((env) => (
            <div
              key={env.id}
              role="button"
              tabIndex={0}
              onClick={() => setActiveEnvelope(env)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setActiveEnvelope(env);
                }
              }}
              className="relative bg-gradient-to-br from-rose-50 via-cream-50 to-lavender-50 rounded-xl p-2.5 border-2 border-lavender-200/90 shadow-card hover:shadow-floating hover:scale-102 active:scale-98 transition-all cursor-pointer flex flex-col justify-between min-h-[90px] sm:min-h-[105px] group text-left"
            >
              {/* Mini Stamp Accent */}
              <div className="flex items-center justify-between">
                <div className="w-6 h-6 rounded-lg bg-white/90 border border-rose-200/80 flex items-center justify-center shadow-2xs group-hover:rotate-6 transition-transform">
                  {getEnvelopeIcon(env.icon)}
                </div>
                <span className="font-handwriting text-[10px] text-rose-CTA font-bold">
                  Letter #{env.id}
                </span>
              </div>

              {/* Title & Prompt */}
              <div className="mt-1">
                <h3 className="font-heading text-xs font-bold text-[#2D2635] line-clamp-2 leading-tight">
                  {env.title}
                </h3>
                <p className="font-body text-[10px] text-[#5C4D6B] mt-0.5 truncate">
                  {env.preview}
                </p>
              </div>

              {/* Tap to Unseal Hint */}
              <div className="text-right">
                <span className="text-[9px] font-semibold text-rose-CTA bg-rose-100/60 px-1.5 py-0.2 rounded-full">
                  Unseal 🗝️
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer CTA */}
      <div className="flex-shrink-0 pb-1">
        <button
          type="button"
          onClick={onNext}
          className="inline-flex items-center justify-center gap-2 px-5 py-2 rounded-full bg-rose-CTA hover:bg-rose-CTA-hover text-white font-body font-bold text-xs sm:text-sm shadow-md hover:scale-102 active:scale-98 transition-all duration-150 focus:outline-none focus-visible:ring-3 focus-visible:ring-rose-300 cursor-pointer"
        >
          <span>{content.ctaText || 'A Little Future With You 🌅'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Tactile Letter Modal (Fully in-viewport with fixed header/footer) */}
      {activeEnvelope && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-neutral-900/60 backdrop-blur-xs animate-fade-in"
          onClick={() => setActiveEnvelope(null)}
        >
          <div
            className="relative w-full max-w-md max-h-[85dvh] bg-[#FDFAFF] text-[#2D2635] rounded-2xl shadow-xl border-2 border-[#DFD2F5] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Washi Tape */}
            <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-20 h-3.5 washi-tape rounded-xs z-20 pointer-events-none" />

            {/* Header (Fixed) */}
            <div className="flex-shrink-0 flex items-center justify-between px-4 pt-4 pb-2 border-b border-rose-100">
              <div className="flex items-center gap-1.5 text-rose-CTA">
                <Mail className="w-4 h-4" />
                <h3 className="font-heading text-base font-bold text-[#2D2635]">
                  {activeEnvelope.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveEnvelope(null)}
                className="w-7 h-7 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-CTA flex items-center justify-center transition-all cursor-pointer"
                aria-label="Close letter"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Letter Body */}
            <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-5 py-3 space-y-3 font-body text-xs sm:text-sm leading-relaxed text-[#2D2635] touch-pan-y">
              {activeEnvelope.photoUrl && (
                <div className="w-full h-36 sm:h-44 rounded-xl overflow-hidden bg-cream-100 border border-lavender-200/80 shadow-xs mb-2">
                  <img
                    src={resolveMediaUrl(activeEnvelope.photoUrl)}
                    alt={activeEnvelope.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
              )}
              <p className="indent-3 text-justify leading-relaxed">
                {activeEnvelope.message}
              </p>
              <div className="pt-2 text-right">
                <p className="font-handwriting text-xs text-[#5C4D6B]">
                  Written with forever love,
                </p>
                <p className="font-handwriting text-lg font-bold text-rose-CTA">
                  Bedant 💕
                </p>
              </div>
            </div>

            {/* Footer (Fixed) */}
            <div className="flex-shrink-0 p-2.5 bg-cream-50/90 border-t border-rose-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setActiveEnvelope(null)}
                className="px-4 py-1.5 rounded-full bg-rose-CTA text-white font-medium text-xs hover:bg-rose-CTA-hover transition-colors cursor-pointer"
              >
                Keep Sealed 💕
              </button>
              <span className="text-[10px] text-neutral-400">
                You can re-read this anytime
              </span>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
