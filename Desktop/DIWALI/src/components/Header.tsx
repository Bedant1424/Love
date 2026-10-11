import React from 'react';

export type ActiveTab = 'home' | 'catalogue' | 'customer' | 'cart' | 'review';

interface HeaderProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  cartCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onSelectTab,
  cartCount,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-bg-surface/95 backdrop-blur-md border-b border-white/10">
      {/* Top Brand Banner */}
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onSelectTab('home')}
            className="text-left focus:outline-none focus:ring-2 focus:ring-festive-marigold rounded-md p-0.5"
            aria-label="Nagarjuna Traders Home"
          >
            <div className="flex items-center gap-2">
              <span className="text-xl md:text-2xl font-bold tracking-tight text-content-primary font-display">
                NAGARJUNA TRADERS
              </span>
            </div>
            <p className="text-xs text-content-muted flex items-center gap-1.5 mt-0.5">
              <span>📍 Sivakasi</span>
              <span>•</span>
              <span className="text-festive-amber">Licensed Counter Pickup</span>
            </p>
          </button>
        </div>

        {/* Operational Mode Pill & Cart Action */}
        <div className="flex items-center gap-2 md:gap-3">
          <span
            className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-950/60 text-amber-300 border border-amber-800/40"
            title="Online checkout disabled per Supreme Court e-commerce directive"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            Enquiry Mode Active
          </span>

          <button
            onClick={() => onSelectTab('cart')}
            className={`relative min-h-touch px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-transform active:scale-95 focus:outline-none focus:ring-2 focus:ring-festive-marigold ${
              activeTab === 'cart'
                ? 'bg-festive-marigold text-black'
                : 'bg-bg-elevated text-content-primary hover:bg-white/10 border border-white/10'
            }`}
            aria-label={`View enquiry basket with ${cartCount} items`}
          >
            <span>Basket</span>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                activeTab === 'cart'
                  ? 'bg-black text-festive-marigold'
                  : 'bg-festive-marigold text-black'
              }`}
            >
              {cartCount}
            </span>
          </button>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <nav
        className="max-w-7xl mx-auto px-4 flex items-center gap-1 overflow-x-auto scrollbar-none border-t border-white/5 py-1.5"
        aria-label="Main Navigation"
      >
        <button
          onClick={() => onSelectTab('home')}
          className={`min-h-[40px] px-3.5 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
            activeTab === 'home'
              ? 'bg-white/10 text-festive-marigold'
              : 'text-content-muted hover:text-content-primary'
          }`}
        >
          Home
        </button>
        <button
          onClick={() => onSelectTab('catalogue')}
          className={`min-h-[40px] px-3.5 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
            activeTab === 'catalogue'
              ? 'bg-white/10 text-festive-marigold'
              : 'text-content-muted hover:text-content-primary'
          }`}
        >
          Catalogue (6 Categories)
        </button>
        <button
          onClick={() => onSelectTab('customer')}
          className={`min-h-[40px] px-3.5 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
            activeTab === 'customer'
              ? 'bg-white/10 text-festive-marigold'
              : 'text-content-muted hover:text-content-primary'
          }`}
        >
          Customer Details
        </button>
        <button
          onClick={() => onSelectTab('cart')}
          className={`min-h-[40px] px-3.5 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
            activeTab === 'cart'
              ? 'bg-white/10 text-festive-marigold'
              : 'text-content-muted hover:text-content-primary'
          }`}
        >
          Enquiry Basket ({cartCount})
        </button>
        <button
          onClick={() => onSelectTab('review')}
          className={`min-h-[40px] px-3.5 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
            activeTab === 'review'
              ? 'bg-white/10 text-festive-marigold'
              : 'text-content-muted hover:text-content-primary'
          }`}
        >
          Review Estimate
        </button>
      </nav>
    </header>
  );
};
