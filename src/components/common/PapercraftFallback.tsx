import React from 'react';

interface PapercraftFallbackProps {
  title: string;
  theme?: 'rose' | 'lavender' | 'cream' | 'gold';
  iconType?: 'cake' | 'heart' | 'stars' | 'sunset' | 'coffee' | 'journey';
  className?: string;
}

export const PapercraftFallback: React.FC<PapercraftFallbackProps> = ({
  title,
  theme = 'rose',
  iconType = 'heart',
  className = '',
}) => {
  const getThemeBg = () => {
    switch (theme) {
      case 'lavender':
        return 'from-lavender-100 to-lavender-200 border-lavender-300';
      case 'gold':
        return 'from-amber-50 to-amber-100 border-amber-200';
      case 'cream':
        return 'from-cream-50 to-cream-100 border-stone-200';
      case 'rose':
      default:
        return 'from-rose-50 to-rose-100 border-rose-200';
    }
  };

  const renderIcon = () => {
    switch (iconType) {
      case 'cake':
        return (
          <svg className="w-16 h-16 text-rose-CTA/80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 2v4m0 0a2 2 0 100-4 2 2 0 000 4zm-7 8h14a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2zm0 4h14" />
          </svg>
        );
      case 'stars':
        return (
          <svg className="w-16 h-16 text-lavender-CTA/80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
        );
      case 'sunset':
        return (
          <svg className="w-16 h-16 text-amber-500/80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2m6.364 1.636l-1.414 1.414M21 12h-2M4 12H2m3.636-6.364l1.414 1.414M17 16a5 5 0 00-10 0m-4 4h18" />
          </svg>
        );
      case 'coffee':
        return (
          <svg className="w-16 h-16 text-rose-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M18 8h1a4 4 0 010 8h-1M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8zM6 1v3M10 1v3M14 1v3" />
          </svg>
        );
      case 'journey':
        return (
          <svg className="w-16 h-16 text-lavender-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
        );
      case 'heart':
      default:
        return (
          <svg className="w-16 h-16 text-rose-CTA/80" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
        );
    }
  };

  return (
    <div
      className={`w-full h-full min-h-[220px] bg-gradient-to-br ${getThemeBg()} border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center relative overflow-hidden select-none ${className}`}
    >
      {/* Subtle paper texture overlay */}
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#2D2635_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

      {/* Illustrated graphic icon */}
      <div className="relative mb-3 transform hover:scale-105 transition-transform duration-300">
        {renderIcon()}
      </div>

      {/* Romantic caption */}
      <h4 className="font-heading text-lg text-neutral-800 tracking-wide mb-1 px-2">
        {title}
      </h4>
      <p className="font-handwriting text-base text-neutral-500">
        Captured in our hearts 💕
      </p>
    </div>
  );
};
