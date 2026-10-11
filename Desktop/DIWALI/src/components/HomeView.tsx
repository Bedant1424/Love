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
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="relative px-4 pt-6 pb-8 md:pt-12 md:pb-14 border-b border-white/5 bg-gradient-to-b from-bg-surface/50 to-transparent">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-festive-marigold/10 border border-festive-marigold/30 text-festive-amber uppercase tracking-wider">
            <span>✨</span>
            <span>Diwali Catalogue Portfolio Demonstration</span>
          </div>

          <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold font-display tracking-tight text-content-primary leading-tight max-w-2xl mx-auto">
            Light Up Your Festivities with Authentic Crackers
          </h1>

          <p className="text-base text-content-secondary max-w-xl mx-auto leading-relaxed">
            Interactive software portfolio demonstration based on an authentic Diwali catalogue poster. Browse products, assemble a box, and experience simulated ₹100 token checkout.
          </p>

          {/* Highlighted Portfolio Demo Callout */}
          <div className="max-w-xl mx-auto p-3 rounded-xl bg-amber-950/40 border border-amber-800/40 text-xs text-amber-300 font-medium">
            Portfolio Demo Only. No real orders, fireworks sales, delivery, or payments are processed.
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={onExploreCatalogue}
              className="w-full sm:w-auto min-h-touch px-6 py-3 rounded-xl bg-festive-marigold hover:bg-festive-marigold-hover active:scale-95 text-black font-semibold text-base transition-transform flex items-center justify-center gap-2 shadow-lg shadow-amber-500/10 focus:outline-none focus:ring-2 focus:ring-festive-marigold"
            >
              <span>Browse 2026 Catalogue</span>
              <span aria-hidden="true">→</span>
            </button>

            <button
              type="button"
              onClick={onEnterCustomerDetails}
              className="w-full sm:w-auto min-h-touch px-6 py-3 rounded-xl bg-bg-surface hover:bg-white/10 border border-white/10 text-content-primary font-semibold text-base transition-colors"
            >
              <span>Sample Customer Info</span>
            </button>
          </div>
        </div>
      </section>

      {/* Feature / Architecture Highlight Strip */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-4 rounded-xl bg-bg-surface border border-white/5 flex items-start gap-3">
            <span className="text-2xl" aria-hidden="true">📋</span>
            <div>
              <h2 className="text-sm font-bold text-content-primary font-display">
                Authentic Poster Data
              </h2>
              <p className="text-xs text-content-muted mt-0.5">
                Exact products, categories, and printed prices extracted from the original poster.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-bg-surface border border-white/5 flex items-start gap-3">
            <span className="text-2xl" aria-hidden="true">🪙</span>
            <div>
              <h2 className="text-sm font-bold text-content-primary font-display">
                Fixed ₹100 Demo Token
              </h2>
              <p className="text-xs text-content-muted mt-0.5">
                Fixed 10,000 paise token reservation rule with remaining balance accounting.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-bg-surface border border-white/5 flex items-start gap-3">
            <span className="text-2xl" aria-hidden="true">📱</span>
            <div>
              <h2 className="text-sm font-bold text-content-primary font-display">
                Simulated Checkout Flow
              </h2>
              <p className="text-xs text-content-muted mt-0.5">
                Full UI demonstration with simulated payment pending, success, and error states.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Six Catalogue Categories Grid */}
      <section className="max-w-7xl mx-auto px-4 space-y-5">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold font-display text-content-primary">
              Browse Six Authentic Categories
            </h2>
            <p className="text-xs text-content-muted mt-1">
              Select any category to view individual products, sizes, and pricing details.
            </p>
          </div>
          <button
            type="button"
            onClick={onExploreCatalogue}
            className="hidden sm:inline-flex text-xs font-semibold text-festive-marigold hover:underline"
          >
            View Full Catalogue →
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => onSelectCategory(cat.id)}
              className="p-5 rounded-2xl bg-bg-surface border border-white/10 hover:border-festive-marigold/60 text-left transition-colors flex flex-col justify-between group focus:outline-none focus:ring-2 focus:ring-festive-marigold"
            >
              <div>
                <div className="flex items-center justify-between text-xs text-content-muted mb-2">
                  <span className="font-mono">Category {cat.sortOrder}</span>
                  <span className="text-festive-marigold group-hover:translate-x-1 transition-transform">
                    →
                  </span>
                </div>
                <h3 className="text-lg font-bold text-content-primary font-display group-hover:text-festive-marigold transition-colors">
                  {cat.name}
                </h3>
                <p className="text-xs text-content-muted mt-1 leading-relaxed">
                  {cat.description}
                </p>
              </div>

              {cat.complianceWarning && (
                <div className="mt-4 pt-3 border-t border-white/5 text-[11px] text-amber-300 flex items-center gap-1.5">
                  <span aria-hidden="true">ℹ️</span>
                  <span className="truncate">Catalogue demonstration reference</span>
                </div>
              )}
            </button>
          ))}
        </div>
      </section>

      {/* Demo Information Notice Card */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="p-6 rounded-2xl bg-bg-surface border border-white/10 space-y-3">
          <h2 className="text-base font-bold font-display text-content-primary">
            Portfolio Demonstration Architecture
          </h2>
          <p className="text-xs text-content-secondary leading-relaxed">
            This web application demonstrates a high-performance, mobile-first ordering interface engineered with React 18, TypeScript, Vite, and Tailwind CSS. All price calculations use exact integer paise arithmetic. The project illustrates how a seasonal fireworks ordering system could operate with fixed token payments and admin reconciliation, without processing real payments or conducting actual commercial sales.
          </p>
          <div className="pt-2 flex flex-wrap gap-2 text-xs">
            <span className="px-3 py-1 rounded-lg bg-bg-elevated border border-white/5 text-content-muted">
              🪙 Fixed Token: ₹100 (10,000 paise)
            </span>
            <span className="px-3 py-1 rounded-lg bg-bg-elevated border border-white/5 text-content-muted">
              🔒 Privacy: Transient session memory only
            </span>
            <span className="px-3 py-1 rounded-lg bg-bg-elevated border border-white/5 text-content-muted">
              📦 Scope: Non-commercial software portfolio
            </span>
          </div>
        </div>
      </section>
    </div>
  );
};
