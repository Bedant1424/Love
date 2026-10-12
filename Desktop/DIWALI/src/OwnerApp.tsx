import React, { useEffect } from 'react';
import { AdminView } from './components/AdminView';

export const OwnerApp: React.FC = () => {
  useEffect(() => {
    document.title = 'Owner Portal | Nagarjuna Traders';
    let robotsMeta = document.querySelector('meta[name="robots"]');
    let created = false;
    if (!robotsMeta) {
      robotsMeta = document.createElement('meta');
      robotsMeta.setAttribute('name', 'robots');
      document.head.appendChild(robotsMeta);
      created = true;
    }
    const previousContent = robotsMeta.getAttribute('content');
    robotsMeta.setAttribute('content', 'noindex, nofollow');

    return () => {
      if (created && robotsMeta?.parentNode) {
        robotsMeta.parentNode.removeChild(robotsMeta);
      } else if (robotsMeta) {
        if (previousContent) {
          robotsMeta.setAttribute('content', previousContent);
        } else {
          robotsMeta.removeAttribute('content');
        }
      }
    };
  }, []);

  const handleBackToCustomerSite = () => {
    if (typeof window !== 'undefined' && window.location.hostname.includes('owner')) {
      window.location.href = 'https://nagarjuna-traders.pages.dev';
    } else {
      window.location.href = '/';
    }
  };

  return (
    <div className="min-h-[100dvh] flex flex-col bg-bg-base text-content-primary selection:bg-festive-marigold selection:text-black">
      {/* Top Owner Bar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200 px-4 py-3 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-orange-600 text-white font-black flex items-center justify-center font-display shadow-sm">
              NT
            </div>
            <div>
              <span className="font-display font-bold text-base text-stone-900 tracking-wide block leading-none">
                Nagarjuna Traders
              </span>
              <span className="text-[10px] font-semibold text-orange-700 tracking-wider uppercase block mt-1">
                Owner Administration Hub
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
              Secure Portal
            </span>
            <button
              onClick={handleBackToCustomerSite}
              className="text-xs text-stone-600 hover:text-stone-900 font-medium transition-colors hidden sm:inline-block"
            >
              Customer Storefront →
            </button>
          </div>
        </div>
      </header>

      {/* Main Administrative Surface */}
      <main className="flex-1 bg-[#FDFBF7]">
        <AdminView onBackToCustomerSite={handleBackToCustomerSite} />
      </main>

      {/* Footer */}
      <footer className="py-4 border-t border-stone-200 text-center text-xs text-stone-600 bg-white">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Nagarjuna Traders Owner Console - Internal Operations</span>
          <span>Protected by Cloudflare Access Zero Trust</span>
        </div>
      </footer>
    </div>
  );
};

export default OwnerApp;
