import React from 'react';

export type ActiveTab =
  | 'home'
  | 'catalogue'
  | 'customer'
  | 'cart'
  | 'review'
  | 'track';

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
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200 shadow-warm-sm transition-colors">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
        {/* Brand Logo & Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onSelectTab('home')}
            className="text-left focus:outline-none focus:ring-2 focus:ring-festive-marigold rounded-xl p-1 -m-1 transition-transform active:scale-98"
            aria-label="Nagarjuna Traders Home"
          >
            <div className="flex items-center gap-2.5">
              {/* Diya SVG Icon */}
              <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200/80 flex items-center justify-center text-festive-gold shadow-sm shrink-0">
                <svg
                  className="w-5 h-5 text-festive-marigold animate-diya-flicker"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M12 2C12 2 8 8 8 12C8 14.2 9.8 16 12 16C14.2 16 16 14.2 16 12C16 8 12 2 12 2Z" fill="#F59E0B" />
                  <path d="M12 4C12 4 9.5 8.5 9.5 11.5C9.5 13 10.6 14.2 12 14.2C13.4 14.2 14.5 13 14.5 11.5C14.5 8.5 12 4 12 4Z" fill="#EA580C" />
                  <path d="M3 15C3 15 5 19 12 19C19 19 21 15 21 15C21 18.5 17 21 12 21C7 21 3 18.5 3 15Z" fill="#D97706" />
                </svg>
              </div>

              <div>
                <span className="text-xl md:text-2xl font-bold tracking-tight text-stone-900 font-display block leading-none">
                  NAGARJUNA TRADERS
                </span>
                <span className="text-xs text-stone-500 font-medium block mt-1 tracking-wide">
                  Diwali Fireworks Catalogue
                </span>
              </div>
            </div>
          </button>
        </div>

        {/* Navigation & Cart Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Shop / Catalogue Button */}
          <button
            onClick={() => onSelectTab('catalogue')}
            className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs md:text-sm font-semibold transition-all flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-festive-marigold ${
              activeTab === 'catalogue'
                ? 'bg-amber-100/80 text-festive-marigold font-bold'
                : 'text-stone-700 hover:text-stone-900 hover:bg-stone-100'
            }`}
            aria-label="Browse full fireworks catalogue"
          >
            <svg className="w-4 h-4 text-festive-marigold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <span>Catalogue</span>
          </button>

          {/* Track Order Button */}
          <button
            onClick={() => onSelectTab('track')}
            className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs md:text-sm font-medium transition-all hidden sm:flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-festive-marigold ${
              activeTab === 'track'
                ? 'bg-amber-100/80 text-festive-marigold font-bold'
                : 'text-stone-700 hover:text-stone-900 hover:bg-stone-100'
            }`}
            aria-label="Track existing order status"
          >
            <svg className="w-4 h-4 text-stone-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            <span>Track Order</span>
          </button>

          {/* Shopping Cart Button with Count Badge */}
          <button
            onClick={() => onSelectTab('cart')}
            className={`relative min-h-[44px] px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2.5 transition-all active:scale-95 shadow-sm focus:outline-none focus:ring-2 focus:ring-festive-marigold ${
              activeTab === 'cart'
                ? 'bg-festive-marigold text-white shadow-festive-marigold/20'
                : 'bg-stone-900 text-white hover:bg-stone-800'
            }`}
            aria-label={`Shopping Cart (${cartCount})`}
          >
            <svg className="w-4 h-4 text-amber-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            <span>Cart</span>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-bold transition-colors ${
                activeTab === 'cart'
                  ? 'bg-white text-festive-marigold'
                  : 'bg-festive-marigold text-white'
              }`}
            >
              {cartCount}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
