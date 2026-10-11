import React from 'react';
import { CATEGORIES } from '../data/catalogueData';
import { CategoryId } from '../types/catalogue';

interface HomeViewProps {
  onSelectCategory: (categoryId: CategoryId) => void;
  onExploreCatalogue: () => void;
  onEnterCustomerDetails: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  onSelectCategory,
  onExploreCatalogue,
  onEnterCustomerDetails,
}) => {
  return (
    <div className="space-y-12 md:space-y-16">
      {/* ── B. FESTIVE HERO SECTION ─────────────────────────────────── */}
      <section className="relative overflow-hidden bg-bg-dark text-white rounded-b-3xl md:rounded-b-[2.5rem] shadow-warm-lg">
        {/* Hero Background Image with Subtle Festive Overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src="/images/hero-diwali.jpg"
            alt="Diwali festive fireworks celebration with illuminated lanterns and diyas"
            className="w-full h-full object-cover object-center opacity-40 mix-blend-luminosity scale-105"
            width="1920"
            height="1080"
            loading="eager"
          />
          {/* Gradients to guarantee high text contrast */}
          <div className="absolute inset-0 bg-gradient-to-r from-bg-dark via-bg-dark/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-bg-dark via-transparent to-black/30" />
        </div>

        {/* Hero Foreground Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 py-12 sm:py-16 md:py-24 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-6 text-left">
            {/* Festive Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-amber-400/15 border border-amber-400/40 text-amber-300 shadow-sm backdrop-blur-sm">
              <span className="w-2 h-2 rounded-full bg-festive-marigold animate-sparkle-pulse" />
              <span>Diwali Fireworks Catalogue 2026</span>
            </div>

            {/* Headline */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold font-display tracking-tight leading-[1.1] text-white">
              Celebrate Diwali with{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-festive-gold to-festive-marigold">
                Authentic Fireworks
              </span>
            </h1>

            {/* Supporting Sentence */}
            <p className="text-base sm:text-lg text-stone-200 max-w-xl leading-relaxed">
              Explore 6 traditional categories directly from our poster catalogue. Transparent printed pricing, advance booking, and collection at the campus.
            </p>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
              <button
                type="button"
                onClick={onExploreCatalogue}
                className="min-h-[48px] px-7 py-3.5 rounded-xl bg-festive-marigold hover:bg-festive-marigold-hover active:scale-95 text-white font-bold text-base transition-transform flex items-center justify-center gap-2 shadow-lg shadow-orange-500/25 focus:outline-none focus:ring-2 focus:ring-amber-400"
              >
                <span>Browse 2026 Catalogue</span>
                <span aria-hidden="true">→</span>
              </button>

              <button
                type="button"
                onClick={onEnterCustomerDetails}
                className="min-h-[48px] px-6 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-stone-100 font-semibold text-base transition-colors border border-white/20 backdrop-blur-sm flex items-center justify-center gap-2"
              >
                <span>Customer Details</span>
              </button>
            </div>

            {/* Micro Highlights */}
            <div className="pt-4 flex flex-wrap items-center gap-4 text-xs text-stone-300">
              <div className="flex items-center gap-1.5">
                <span className="text-amber-400">✓</span> 100% Authentic Festive Crackers
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-amber-400">✓</span> Fixed Advance Token Policy
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-amber-400">✓</span> Collection at the Campus
              </div>
            </div>
          </div>

          {/* Hero Featured Visual Card on Desktop */}
          <div className="lg:col-span-5 hidden lg:block">
            <div className="relative rounded-2xl overflow-hidden border border-white/20 shadow-2xl shadow-black/60 bg-stone-900/40 backdrop-blur-md p-3 group">
              <img
                src="/images/hero-diwali.jpg"
                alt="Festive Diwali sparkler celebration"
                className="w-full h-80 object-cover rounded-xl transition-transform duration-500 group-hover:scale-102"
                width="640"
                height="400"
              />
              <div className="mt-3 p-3 bg-stone-950/80 rounded-xl border border-white/10 flex items-center justify-between">
                <div>
                  <span className="text-xs text-amber-300 font-semibold uppercase tracking-wider block">Festive Special</span>
                  <span className="text-sm font-bold text-white">Full Festival Assortment</span>
                </div>
                <button
                  type="button"
                  onClick={onExploreCatalogue}
                  className="px-3 py-1.5 rounded-lg bg-festive-marigold text-white text-xs font-bold hover:bg-orange-600 transition-colors"
                >
                  Explore →
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── C. CATEGORY SHOWCASE (IMAGE TILES) ────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-stone-200 pb-4">
          <div>
            <div className="text-xs font-bold text-festive-marigold uppercase tracking-wider">Catalogue Sections</div>
            <h2 className="text-2xl md:text-3xl font-bold font-display text-stone-900 mt-1">
              Browse Six Authentic Categories
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 mt-1">
              Select any visual category to explore authentic poster products, sizes, and pricing.
            </p>
          </div>
          <button
            type="button"
            onClick={onExploreCatalogue}
            className="text-xs font-bold text-festive-marigold hover:underline self-start sm:self-auto flex items-center gap-1"
          >
            <span>View Full Catalogue</span>
            <span>→</span>
          </button>
        </div>

        {/* 6 Category Visual Tiles Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => onSelectCategory(cat.id)}
              className="group text-left rounded-2xl bg-white border border-stone-200 hover:border-festive-marigold hover:shadow-warm-md transition-all duration-300 overflow-hidden flex flex-col focus:outline-none focus:ring-2 focus:ring-festive-marigold"
              aria-label={`Browse ${cat.name} category`}
            >
              {/* Category Image Tile */}
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-stone-100">
                <img
                  src={cat.imageUrl || `/images/cat-${cat.id}.jpg`}
                  alt={`${cat.name} product assortment`}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                  width="400"
                  height="300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
                <span className="absolute top-3 left-3 px-2.5 py-1 rounded-md text-[11px] font-bold bg-white/90 text-stone-800 backdrop-blur-sm shadow-sm">
                  Category {cat.sortOrder}
                </span>
                <span className="absolute bottom-3 right-3 w-8 h-8 rounded-full bg-festive-marigold text-white flex items-center justify-center font-bold text-sm shadow-md transition-transform group-hover:translate-x-1">
                  →
                </span>
              </div>

              {/* Category Metadata */}
              <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-bold text-stone-900 font-display group-hover:text-festive-marigold transition-colors">
                    {cat.name}
                  </h3>
                  <p className="text-xs text-stone-600 mt-1.5 leading-relaxed line-clamp-2">
                    {cat.description}
                  </p>
                </div>

                {cat.complianceWarning && (
                  <div className="mt-3 pt-2.5 border-t border-stone-100 text-[11px] text-amber-700 flex items-center gap-1 font-medium">
                    <span aria-hidden="true">⚠️</span>
                    <span className="truncate">{cat.complianceWarning}</span>
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* ── D. FEATURED PRODUCTS PREVIEW ─────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 space-y-6">
        <div className="flex items-center justify-between border-b border-stone-200 pb-4">
          <div>
            <div className="text-xs font-bold text-festive-gold uppercase tracking-wider">Top Selections</div>
            <h2 className="text-2xl font-bold font-display text-stone-900 mt-1">
              Curated Festival Highlights
            </h2>
          </div>
          <button
            type="button"
            onClick={onExploreCatalogue}
            className="text-xs font-bold text-festive-marigold hover:underline"
          >
            Explore All 31 Items →
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Big Lanka Laddi */}
          <div className="rounded-2xl bg-white border border-stone-200 p-3.5 flex flex-col justify-between shadow-warm-sm hover:shadow-warm-md transition-all">
            <div className="aspect-square rounded-xl overflow-hidden bg-stone-100 relative mb-3">
              <img
                src="/images/prod-lanka-laddi.jpg"
                alt="Big Lanka Laddi garland firecracker"
                className="w-full h-full object-cover"
                loading="lazy"
                width="300"
                height="300"
              />
              <span className="absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-bold bg-white/90 text-stone-800 shadow-sm">
                Garland Series
              </span>
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-stone-900 text-sm">Big Lanka Laddi</h3>
              <p className="text-xs text-stone-500">From ₹180 to ₹550</p>
              <div className="pt-2 flex items-center justify-between">
                <span className="text-xs font-bold text-festive-marigold font-mono">₹180.00</span>
                <button
                  type="button"
                  onClick={() => onSelectCategory('laddis')}
                  className="px-3 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold"
                >
                  View Options
                </button>
              </div>
            </div>
          </div>

          {/* Card 2: Sky Shot Multibreak */}
          <div className="rounded-2xl bg-white border border-stone-200 p-3.5 flex flex-col justify-between shadow-warm-sm hover:shadow-warm-md transition-all">
            <div className="aspect-square rounded-xl overflow-hidden bg-stone-100 relative mb-3">
              <img
                src="/images/cat-skyshots.jpg"
                alt="Standard Single Sky Shot tube"
                className="w-full h-full object-cover"
                loading="lazy"
                width="300"
                height="300"
              />
              <span className="absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-bold bg-white/90 text-stone-800 shadow-sm">
                Aerial Repeaters
              </span>
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-stone-900 text-sm">Standard Single Shot</h3>
              <p className="text-xs text-stone-500">Aerial display repeater tube</p>
              <div className="pt-2 flex items-center justify-between">
                <span className="text-xs font-bold text-festive-marigold font-mono">₹120.00</span>
                <button
                  type="button"
                  onClick={() => onSelectCategory('skyshots')}
                  className="px-3 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold"
                >
                  View Options
                </button>
              </div>
            </div>
          </div>

          {/* Card 3: 50 Pcs Laxmi Bomb */}
          <div className="rounded-2xl bg-white border border-stone-200 p-3.5 flex flex-col justify-between shadow-warm-sm hover:shadow-warm-md transition-all">
            <div className="aspect-square rounded-xl overflow-hidden bg-stone-100 relative mb-3">
              <img
                src="/images/prod-laxmi-bomb.jpg"
                alt="50 Pcs Laxmi Bomb sound cracker"
                className="w-full h-full object-cover"
                loading="lazy"
                width="300"
                height="300"
              />
              <span className="absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-bold bg-white/90 text-stone-800 shadow-sm">
                Sound Crackers
              </span>
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-stone-900 text-sm">50 Pcs Laxmi Bomb</h3>
              <p className="text-xs text-stone-500">50 pcs box pack</p>
              <div className="pt-2 flex items-center justify-between">
                <span className="text-xs font-bold text-festive-marigold font-mono">₹240.00</span>
                <button
                  type="button"
                  onClick={() => onSelectCategory('bombs')}
                  className="px-3 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold"
                >
                  View Options
                </button>
              </div>
            </div>
          </div>

          {/* Card 4: Kumpi & Chakri Special */}
          <div className="rounded-2xl bg-white border border-stone-200 p-3.5 flex flex-col justify-between shadow-warm-sm hover:shadow-warm-md transition-all">
            <div className="aspect-square rounded-xl overflow-hidden bg-stone-100 relative mb-3">
              <img
                src="/images/cat-chakri-kumpi.jpg"
                alt="Chakri and Kumpi sparkling fountains"
                className="w-full h-full object-cover"
                loading="lazy"
                width="300"
                height="300"
              />
              <span className="absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-bold bg-white/90 text-stone-800 shadow-sm">
                Spinners & Pots
              </span>
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-stone-900 text-sm">Chakri Medium</h3>
              <p className="text-xs text-stone-500">10 pcs spinning wheel box</p>
              <div className="pt-2 flex items-center justify-between">
                <span className="text-xs font-bold text-festive-marigold font-mono">₹100.00</span>
                <button
                  type="button"
                  onClick={() => onSelectCategory('flowerpots-spinners')}
                  className="px-3 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold"
                >
                  View Options
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── E. SHOPPING ASSISTANCE & CAMPUS COLLECTION ──────────────── */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="rounded-3xl bg-amber-50/70 border border-amber-200/80 p-6 md:p-8 space-y-6">
          <div className="max-w-2xl">
            <h2 className="text-xl md:text-2xl font-bold font-display text-stone-900">
              How Online Ordering Works
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 mt-1.5 leading-relaxed">
              We provide a transparent, legally compliant ordering experience for Diwali celebrations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-white border border-amber-200/60 shadow-sm space-y-2">
              <div className="w-8 h-8 rounded-lg bg-amber-100 text-festive-marigold font-bold flex items-center justify-center text-sm">
                1
              </div>
              <h3 className="text-sm font-bold text-stone-900">Browse & Select</h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Choose items and variants from our authentic catalogue. Minimum order subtotal is ₹50.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-amber-200/60 shadow-sm space-y-2">
              <div className="w-8 h-8 rounded-lg bg-amber-100 text-festive-marigold font-bold flex items-center justify-center text-sm">
                2
              </div>
              <h3 className="text-sm font-bold text-stone-900">Fixed Token Advance</h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Pay a fixed token (₹50 below ₹200; ₹100 for ₹200+) via approved UPI QR to reserve your box.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-amber-200/60 shadow-sm space-y-2">
              <div className="w-8 h-8 rounded-lg bg-amber-100 text-festive-marigold font-bold flex items-center justify-center text-sm">
                3
              </div>
              <h3 className="text-sm font-bold text-stone-900">Collection at the Campus</h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Your order will be ready for collection at the campus. Collection details will be shared when your order is confirmed.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
