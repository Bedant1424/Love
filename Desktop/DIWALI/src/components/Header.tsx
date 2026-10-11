import React from 'react';

export type ActiveTab =
  | 'home'
  | 'catalogue'
  | 'customer'
  | 'cart'
  | 'review'
  | 'admin';

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
              <span>Diwali Fireworks Catalogue</span>
              <span>•</span>
              <span className="text-festive-gold">Sivakasi Counter Collection</span>
            </p>
          </button>
        </div>

        {/* Counter Collection Badge, Admin Link & Cart Action */}
        <div className="flex items-center gap-2 md:gap-3">
          <span
            className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-950/60 text-emerald-300 border border-emerald-800/40"
            title="Advance token required online; balance payable at physical counter collection"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Counter Pickup Only
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
            aria-label={`View shopping cart with ${cartCount} items`}
          >
            <span>Cart</span>
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
          Shopping Cart ({cartCount})
        </button>
        <button
          onClick={() => onSelectTab('review')}
          className={`min-h-[40px] px-3.5 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
            activeTab === 'review'
              ? 'bg-white/10 text-festive-marigold'
              : 'text-content-muted hover:text-content-primary'
          }`}
        >
          Review & Pay
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
