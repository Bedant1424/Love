import React from 'react';
import { ActiveTab } from './Header';

interface FooterProps {
  onSelectTab?: (tab: ActiveTab) => void;
}

export const Footer: React.FC<FooterProps> = ({ onSelectTab }) => {
  return (
    <footer className="bg-stone-950 border-t border-stone-800 mt-16 pb-24 md:pb-12 text-stone-400">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        {/* Brand & Festive Slogan */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-stone-800/80 pb-6">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-festive-marigold animate-pulse" />
              <h2 className="text-lg font-bold text-white font-display tracking-tight">
                Nagarjuna Traders
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-amber-200/80 font-medium mt-1">
              "Make every celebration a little brighter."
            </p>
          </div>

          {/* Quick Helpful Customer Links */}
          {onSelectTab && (
            <nav className="flex items-center gap-4 text-xs" aria-label="Footer Navigation">
              <button
                type="button"
                onClick={() => onSelectTab('catalogue')}
                className="text-stone-400 hover:text-amber-300 transition-colors focus:outline-none focus:underline"
              >
                Catalogue
              </button>
              <span className="text-stone-700">|</span>
              <button
                type="button"
                onClick={() => onSelectTab('review')}
                className="text-stone-400 hover:text-amber-300 transition-colors focus:outline-none focus:underline"
              >
                Track Order
              </button>
            </nav>
          )}
        </div>

        {/* Store Location & Hours */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-stone-500">
          <p>
            Collection: Collection at the campus
          </p>
          <p className="font-mono text-[11px]">
            Diwali Fireworks Catalogue 2026
          </p>
        </div>

        {/* Copyright */}
        <div className="pt-4 border-t border-stone-900 text-center text-xs text-stone-600">
          <p>&copy; 2026 Nagarjuna Traders. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};
