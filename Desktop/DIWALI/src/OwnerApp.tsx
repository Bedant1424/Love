import React from 'react';
import { AdminView } from './components/AdminView';

export const OwnerApp: React.FC = () => {
  const handleBackToCustomerSite = () => {
    window.location.href = 'https://nagarjuna-traders.pages.dev';
  };

  return (
    <div className="min-h-[100dvh] flex flex-col bg-bg-base text-content-primary selection:bg-festive-marigold selection:text-black">
      {/* Top Owner Bar */}
      <header className="sticky top-0 z-40 bg-bg-surface/95 backdrop-blur-md border-b border-white/10 px-4 py-3 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-festive-marigold text-black font-black flex items-center justify-center font-display shadow-md">
              NT
            </div>
            <div>
              <span className="font-display font-bold text-base text-content-primary tracking-wide block leading-none">
                Nagarjuna Traders
              </span>
              <span className="text-[10px] font-medium text-amber-400 tracking-wider uppercase block mt-1">
                Owner Administration Hub
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-950/60 text-emerald-300 border border-emerald-800/40">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Secure Portal
            </span>
            <button
              onClick={handleBackToCustomerSite}
              className="text-xs text-content-muted hover:text-content-primary font-medium transition-colors hidden sm:inline-block"
            >
              Customer Storefront →
            </button>
          </div>
        </div>
      </header>

      {/* Main Administrative Surface */}
      <main className="flex-1">
        <AdminView onBackToCustomerSite={handleBackToCustomerSite} />
      </main>

      {/* Footer */}
      <footer className="py-4 border-t border-white/5 text-center text-xs text-content-muted bg-bg-surface/50">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Nagarjuna Traders Owner Console - Internal Operations</span>
          <span>Protected by Cloudflare Access Zero Trust</span>
        </div>
      </footer>
    </div>
  );
};

export default OwnerApp;
