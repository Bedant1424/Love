import React from 'react';
import { ActiveTab } from './Header';

interface FooterProps {
  onSelectTab?: (tab: ActiveTab) => void;
}

export const Footer: React.FC<FooterProps> = ({ onSelectTab }) => {
  return (
    <footer className="bg-stone-950 border-t border-stone-800 mt-16 pb-24 md:pb-12 text-stone-400">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        {/* Brand & Store Information */}
        <div className="border-b border-stone-800 pb-6">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-festive-marigold animate-pulse" />
            <h2 className="text-lg font-bold text-white font-display">
              Nagarjuna Traders — Diwali Fireworks
            </h2>
          </div>
          <p className="text-sm mt-1 text-stone-300">
            Diwali catalogue enquiry and order reservation system.
          </p>
          <div className="mt-3 p-3.5 rounded-xl bg-stone-900 border border-stone-800 text-xs text-stone-300 space-y-1.5">
            <p>
              <strong className="text-amber-300">Order Reservation:</strong> Orders submitted online require an advance token (₹50 below ₹200, ₹100 for ₹200+) to reserve items.
            </p>
            <p>
              <strong className="text-amber-300">Counter Collection:</strong> Remaining balance is payable at counter collection upon receiving items.
            </p>
          </div>
        </div>

        {/* Notice */}
        <div className="p-4 rounded-xl bg-stone-900/60 border border-stone-800/80 text-xs space-y-1">
          <p className="text-stone-400 leading-relaxed">
            Please ensure you confirm quantities and item availability before finalizing your reservation. Strict 18+ age verification required upon collection as per Explosives Regulations.
          </p>
        </div>

        {/* Footer Meta */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs pt-4 border-t border-stone-900">
          <p className="text-stone-500">© 2026 Nagarjuna Traders. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span className="text-stone-500 font-mono text-[11px]">
              Diwali Catalogue 2026
            </span>
            {onSelectTab && (
              <button
                type="button"
                onClick={() => onSelectTab('admin')}
                className="text-stone-500 hover:text-amber-300 transition-colors text-xs underline underline-offset-4 focus:outline-none focus:ring-1 focus:ring-festive-marigold rounded px-1"
                aria-label="Staff Administration Console"
              >
                Staff Operations
              </button>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
};
