import React from 'react';
import { LoveLetterContent } from '../../types/content.types';
import { Envelope3D } from '../interactive/Envelope3D';
import { PhotoSticker } from '../common/PhotoSticker';
import { HeartHandshake } from 'lucide-react';

interface Scene3LetterProps {
  content: LoveLetterContent;
  onNext: () => void;
}

export const Scene3Letter: React.FC<Scene3LetterProps> = ({ content, onNext }) => {
  return (
    <section
      aria-label="Love Letter Chapter"
      className="relative w-full h-full flex flex-col items-center justify-center p-2 sm:p-4 text-center select-none overflow-hidden"
    >
      {/* Decorative Scrapbook Photo Stickers (Responsive) */}
      <div className="hidden md:block absolute left-4 lg:left-8 bottom-6 z-10 pointer-events-auto">
        <PhotoSticker
          src="media/couple-face-cup.jpeg"
          alt="My Whole Heart"
          caption="Forever yours 💕"
          type="polaroid"
          size="sm"
          rotation="-rotate-6"
          tape={true}
        />
      </div>

      <div className="hidden lg:block absolute right-6 top-8 z-10 pointer-events-auto">
        <PhotoSticker
          src="media/dimple-closeup.jpeg"
          alt="That Smile"
          type="circle"
          size="sm"
          rotation="rotate-6"
        />
      </div>

      {/* Chapter Title Badge */}
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200/80 text-rose-CTA font-body text-xs font-bold tracking-wide mb-2">
        <HeartHandshake className="w-3.5 h-3.5 text-rose-CTA" />
        <span>Chapter 3: From My Heart</span>
      </div>

      <h2 className="font-heading text-2xl sm:text-4xl text-[#2D2635] leading-tight mb-1">
        A Letter Just For You
      </h2>
      <p className="font-body text-xs sm:text-sm text-[#5C4D6B] max-w-sm mb-3">
        Take a breath, tap the wax seal, and read what you mean to me.
      </p>

      {/* 3D Envelope Component */}
      <Envelope3D content={content} onProceedToNext={onNext} />
    </section>
  );
};
