import React from 'react';
import { LoveLetterContent } from '../../types/content.types';
import { Envelope3D } from '../interactive/Envelope3D';
import { HeartHandshake } from 'lucide-react';

interface Scene3LetterProps {
  content: LoveLetterContent;
  onNext: () => void;
}

export const Scene3Letter: React.FC<Scene3LetterProps> = ({ content, onNext }) => {
  return (
    <section
      aria-label="Love Letter Chapter"
      className="relative min-h-[90vh] flex flex-col items-center justify-center px-4 py-12 text-center"
    >
      {/* Chapter Title Badge */}
      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-50 border border-rose-200/60 text-rose-CTA font-body text-xs sm:text-sm font-bold tracking-wide mb-4">
        <HeartHandshake className="w-4 h-4 text-rose-CTA" />
        <span>Chapter 3: From My Heart</span>
      </div>

      <h2 className="font-heading text-3xl sm:text-4xl text-neutral-800 leading-tight mb-2">
        A Letter Just For You
      </h2>
      <p className="font-body text-base sm:text-lg text-neutral-600 max-w-md mb-8">
        Take a breath, tap the wax seal, and read what you mean to me.
      </p>

      {/* 3D Envelope Component */}
      <Envelope3D content={content} onProceedToNext={onNext} />
    </section>
  );
};
