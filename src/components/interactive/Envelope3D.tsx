import React, { useState, useEffect } from 'react';
import { LoveLetterContent } from '../../types/content.types';
import { X, Heart, Mail } from 'lucide-react';

interface Envelope3DProps {
  content: LoveLetterContent;
  onProceedToNext: () => void;
  className?: string;
}

export const Envelope3D: React.FC<Envelope3DProps> = ({
  content,
  onProceedToNext,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showLetterModal, setShowLetterModal] = useState(false);

  const handleOpenEnvelope = () => {
    if (isOpen) {
      setShowLetterModal(true);
      return;
    }
    setIsOpen(true);
    // After flap opening animation finishes, reveal reading modal
    setTimeout(() => {
      setShowLetterModal(true);
    }, 600);
  };

  // Keyboard navigation for letter modal (Escape to close)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showLetterModal) {
        setShowLetterModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showLetterModal]);

  return (
    <div className={`relative flex flex-col items-center justify-center select-none ${className}`}>
      {/* Interactive 3D Envelope Container */}
      <div
        className="relative w-80 h-52 sm:w-96 sm:h-60 cursor-pointer group [perspective:1000px]"
        onClick={handleOpenEnvelope}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleOpenEnvelope();
          }
        }}
        role="button"
        tabIndex={0}
        aria-label="Interactive love letter envelope. Tap wax seal to open."
        aria-expanded={isOpen}
      >
        {/* Envelope Base Shadow */}
        <div className="absolute inset-x-4 -bottom-3 h-8 bg-neutral-800/15 rounded-full blur-md group-hover:scale-105 transition-transform" />

        {/* Envelope Body (Backboard & Inner Lining) */}
        <div className="absolute inset-0 bg-gradient-to-br from-rose-100 to-lavender-200 rounded-xl border-2 border-lavender-300/80 shadow-card overflow-hidden">
          {/* Inner Decorative Rose Pattern */}
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#C2315D_1px,transparent_1px)] [background-size:12px_12px]" />
        </div>

        {/* Peek of the Letter Sheet Inside (slides up when opened) */}
        <div
          className={`absolute inset-x-6 top-6 h-40 bg-cream-50 rounded-lg border border-stone-200 shadow-sm p-4 flex flex-col justify-between transition-all duration-700 ease-out ${
            isOpen ? '-translate-y-16 scale-102 shadow-md' : 'translate-y-2'
          }`}
        >
          <div className="flex items-center justify-between border-b border-rose-100 pb-1.5">
            <span className="font-heading text-sm text-rose-CTA">For Arya 💕</span>
            <Heart className="w-3.5 h-3.5 text-rose-CTA fill-rose-CTA/40" />
          </div>
          <p className="font-handwriting text-base text-neutral-800 line-clamp-3 leading-snug">
            {content.salutation} {content.paragraphs[0]}
          </p>
          <div className="text-right font-handwriting text-xs text-neutral-500">
            Tap to read full letter ✨
          </div>
        </div>

        {/* Envelope Left & Right Side Pockets */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Left Pocket Flap */}
          <div
            className="absolute left-0 bottom-0 top-0 w-1/2 bg-gradient-to-r from-lavender-100 to-lavender-200/90 [clip-path:polygon(0_0,100%_50%,0_100%)] border-l-2 border-lavender-300/40"
          />
          {/* Right Pocket Flap */}
          <div
            className="absolute right-0 bottom-0 top-0 w-1/2 bg-gradient-to-l from-lavender-100 to-lavender-200/90 [clip-path:polygon(100%_0,0_50%,100%_100%)] border-r-2 border-lavender-300/40"
          />
          {/* Bottom Pocket Flap */}
          <div
            className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-rose-100 via-rose-50 to-white/90 [clip-path:polygon(0_100%,50%_0,100%_100%)] border-b-2 border-rose-200/60 shadow-sm"
          />
        </div>

        {/* Top Triangular Flap (Folds open upwards with 3D rotation) */}
        <div
          className={`absolute top-0 inset-x-0 h-32 origin-top transition-transform duration-700 ease-in-out pointer-events-none [transform-style:preserve-3d] ${
            isOpen ? '[transform:rotateX(180deg)] z-0' : '[transform:rotateX(0deg)] z-20'
          }`}
        >
          {/* Flap Outer Face */}
          <div className="absolute inset-0 bg-gradient-to-b from-rose-200 to-lavender-200 [clip-path:polygon(0_0,50%_100%,100%_0)] border-t-2 border-rose-300/50 shadow-sm flex items-end justify-center pb-2">
            {/* Flap Tip Shadow */}
            <div className="w-12 h-1 bg-neutral-800/10 rounded-full" />
          </div>
        </div>

        {/* Golden Wax Seal (Centered on the closed flap) */}
        {!isOpen && (
          <div className="absolute top-[4.5rem] sm:top-[5.25rem] left-1/2 -translate-x-1/2 z-30 flex flex-col items-center pointer-events-auto">
            <button
              type="button"
              onClick={handleOpenEnvelope}
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-amber-400 via-gold-500 to-amber-600 shadow-floating border-2 border-amber-300/80 flex items-center justify-center text-amber-950 hover:scale-110 active:scale-95 transition-all duration-200 group-hover:rotate-6 focus:outline-none focus-visible:ring-4 focus-visible:ring-gold-400"
              aria-label="Break golden wax seal and read love letter"
            >
              {/* Seal Embossed Monogram */}
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full border border-amber-600/40 flex items-center justify-center bg-amber-500/30">
                <Heart className="w-6 h-6 text-amber-950 fill-amber-950/70" />
              </div>
            </button>
            <span className="mt-2 text-xs font-bold text-neutral-800 dark:text-cream-50 bg-white/90 dark:bg-plum-900/90 px-3 py-1 rounded-full shadow-sm border border-lavender-200/60 animate-bounce">
              {content.waxSealHint}
            </span>
          </div>
        )}
      </div>

      {/* Helper Prompt below envelope */}
      <div className="mt-6 text-center">
        <p className="font-heading text-lg text-rose-CTA dark:text-rose-300">
          {content.envelopeLabel}
        </p>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 font-medium">
          {isOpen ? 'Tap anywhere to unfold and read' : 'A special handwritten message sealed with love'}
        </p>
      </div>

      {/* Accessible Reading Modal on Warm Parchment Surface */}
      {showLetterModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="letter-heading"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/70 backdrop-blur-md animate-fade-in"
        >
          <div
            className="relative w-full max-w-lg max-h-[90vh] bg-cream-50 text-neutral-800 rounded-2xl shadow-2xl border-4 border-amber-100/60 flex flex-col overflow-hidden parchment-texture"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Washi Tape Decoration */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-28 h-5 washi-tape rounded-sm rotate-1 z-10 pointer-events-none" />

            {/* Modal Header & Close Button */}
            <div className="flex items-center justify-between px-6 pt-7 pb-3 border-b border-rose-200/40">
              <div className="flex items-center gap-2 text-rose-CTA">
                <Mail className="w-5 h-5" />
                <span id="letter-heading" className="font-heading text-xl">
                  {content.envelopeLabel}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowLetterModal(false)}
                className="w-10 h-10 rounded-full bg-rose-100 hover:bg-rose-200 text-rose-CTA flex items-center justify-center transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-CTA"
                aria-label="Close letter"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Letter Content */}
            <div className="overflow-y-auto px-6 py-6 space-y-4 font-body text-neutral-800 text-base sm:text-lg leading-relaxed focus:outline-none">
              {/* Salutation */}
              <h3 className="font-handwriting text-2xl sm:text-3xl font-bold text-rose-CTA">
                {content.salutation}
              </h3>

              {/* Letter Paragraphs */}
              {content.paragraphs.map((p, idx) => (
                <p key={idx} className="indent-4 text-justify font-normal text-neutral-800">
                  {p}
                </p>
              ))}

              {/* Sign-off & Signature */}
              <div className="pt-4 text-right">
                <p className="font-handwriting text-xl text-neutral-600">
                  {content.signOff}
                </p>
                <p className="font-handwriting text-3xl font-bold text-rose-CTA mt-1">
                  {content.signature}
                </p>
              </div>
            </div>

            {/* Action Footer */}
            <div className="p-4 bg-cream-100/80 border-t border-rose-200/50 flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setShowLetterModal(false)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-full border border-lavender-300 text-neutral-800 font-medium text-sm hover:bg-white transition-all text-center"
              >
                Keep Reading
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowLetterModal(false);
                  onProceedToNext();
                }}
                className="w-full sm:w-auto px-6 py-3 rounded-full bg-rose-CTA hover:bg-rose-CTA-hover text-white font-semibold text-base shadow-md hover:scale-102 active:scale-98 transition-all flex items-center justify-center gap-2"
              >
                <span>{content.ctaText}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
