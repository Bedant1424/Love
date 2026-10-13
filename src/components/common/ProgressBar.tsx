import React from 'react';

interface ProgressBarProps {
  currentChapter: number; // 1 to 6
  totalChapters?: number; // default 6
  chapterTitle?: string;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  currentChapter,
  totalChapters = 6,
  chapterTitle,
  className = '',
}) => {
  const percentage = Math.min(100, Math.max(0, (currentChapter / totalChapters) * 100));

  return (
    <nav
      aria-label="Story Progress"
      className={`relative flex items-center gap-2 sm:gap-3 bg-white/90 dark:bg-plum-900/90 backdrop-blur-md px-3 sm:px-4 py-1 sm:py-1.5 rounded-full shadow-sm border border-lavender-200/80 dark:border-lavender-500/20 text-neutral-800 dark:text-cream-50 transition-all select-none ${className}`}
    >
      {/* Chapter Counter Badge */}
      <div className="flex flex-col">
        <div className="flex items-center gap-1.5 font-body text-xs font-bold tracking-wide text-rose-CTA dark:text-rose-300">
          <span>Chapter {currentChapter}</span>
          <span className="text-neutral-400 dark:text-neutral-500">of</span>
          <span>{totalChapters}</span>
        </div>
        {chapterTitle && (
          <span className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400 hidden sm:inline max-w-[140px] truncate">
            {chapterTitle}
          </span>
        )}
      </div>

      {/* Visual Progress Bar Track */}
      <div
        role="progressbar"
        aria-valuenow={currentChapter}
        aria-valuemin={1}
        aria-valuemax={totalChapters}
        aria-label={`Story progress: Chapter ${currentChapter} of ${totalChapters}`}
        className="w-16 sm:w-24 h-2 bg-lavender-100 dark:bg-plum-950 rounded-full overflow-hidden relative shadow-inner"
      >
        <div
          className="h-full bg-gradient-to-r from-rose-CTA to-lavender-CTA rounded-full transition-all duration-500 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Discrete Chapter Step Dots (mobile hidden or compact) */}
      <div className="hidden md:flex items-center gap-1">
        {Array.from({ length: totalChapters }, (_, i) => i + 1).map((step) => (
          <div
            key={step}
            className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
              step <= currentChapter
                ? 'bg-rose-CTA dark:bg-rose-400 scale-110'
                : 'bg-lavender-200 dark:bg-plum-950'
            }`}
            aria-hidden="true"
          />
        ))}
      </div>
    </nav>
  );
};
