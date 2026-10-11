import React from 'react';

export type ActiveTab = 'home' | 'catalogue' | 'customer' | 'cart' | 'review' | 'admin';

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
      {/* Portfolio Demo Notice Banner */}
      <div className="bg-amber-500/15 border-b border-amber-500/30 px-3 py-1 text-center">
        <p className="text-[11px] sm:text-xs font-medium text-amber-300">
          Portfolio Demo Only. No real orders, fireworks sales, delivery, or payments are processed.
        </p>
      </div>

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
              <span>Diwali Catalogue Showcase</span>
              <span>•</span>
              <span className="text-festive-amber">Portfolio Demo</span>
            </p>
          </button>
        </div>

        {/* Operational Mode Pill & Cart Action & Admin Quick Link */}
        <div className="flex items-center gap-2 md:gap-3">
          <span
            className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-950/60 text-amber-300 border border-amber-800/40"
            title="Portfolio Demo Only: All ordering flows and token payments are simulated"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            Portfolio Demo Mode
          </span>

          <button
            onClick={() => onSelectTab('admin')}
            className={`min-h-touch px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all active:scale-95 ${
              activeTab === 'admin'
                ? 'bg-festive-marigold text-black border-festive-marigold'
                : 'bg-bg-elevated hover:bg-white/10 text-content-secondary border-white/10'
            }`}
            aria-label="Open Admin Operations Console"
          >
            Admin Portal
          </button>

          <button
            onClick={() => onSelectTab('cart')}
            className={`relative min-h-touch px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-transform active:scale-95 focus:outline-none focus:ring-2 focus:ring-festive-marigold ${
              activeTab === 'cart'
                ? 'bg-festive-marigold text-black'
                : 'bg-bg-elevated text-content-primary hover:bg-white/10 border border-white/10'
            }`}
            aria-label={`View demo basket with ${cartCount} items`}
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
          Sample Customer
        </button>
        <button
          onClick={() => onSelectTab('cart')}
          className={`min-h-[40px] px-3.5 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
            activeTab === 'cart'
              ? 'bg-white/10 text-festive-marigold'
              : 'text-content-muted hover:text-content-primary'
          }`}
        >
          Demo Basket ({cartCount})
        </button>
        <button
          onClick={() => onSelectTab('review')}
          className={`min-h-[40px] px-3.5 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
            activeTab === 'review'
              ? 'bg-white/10 text-festive-marigold'
              : 'text-content-muted hover:text-content-primary'
          }`}
        >
          Simulated Checkout
        </button>
        <button
          onClick={() => onSelectTab('admin')}
          className={`min-h-[40px] px-3.5 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
            activeTab === 'admin'
              ? 'bg-festive-marigold/20 text-festive-marigold border border-festive-marigold/40'
              : 'text-content-muted hover:text-content-primary'
          }`}
        >
          Admin Console
        </button>
      </nav>
    </header>
  );
};
