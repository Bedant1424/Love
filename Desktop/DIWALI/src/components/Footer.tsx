import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-bg-surface border-t border-white/10 mt-16 pb-24 md:pb-12 text-content-muted">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        {/* Brand & Portfolio Project Description */}
        <div className="border-b border-white/5 pb-6">
          <h2 className="text-lg font-bold text-content-primary font-display">
            Nagarjuna Traders — Portfolio Demonstration
          </h2>
          <p className="text-sm mt-1">
            Design and engineering demonstration of an online fireworks catalogue ordering workflow.
          </p>
          <div className="mt-3 p-3 rounded-lg bg-bg-base border border-white/5 text-xs text-content-secondary space-y-1">
            <p>
              <strong className="text-content-primary">Poster Reference:</strong> Catalogue items and printed prices reflect a historical Diwali catalogue poster.
            </p>
            <p>
              <strong className="text-content-primary">Printed Location Note:</strong> "Sivakasi, Andhra Pradesh" appears on the original printed artwork as historical reference only.
            </p>
          </div>
        </div>

        {/* Explicit Portfolio Demo Notice */}
        <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-800/40 text-xs space-y-2">
          <div className="flex items-center gap-2 font-bold text-amber-300">
            <span>ℹ️</span>
            <span>Portfolio Demo Notice</span>
          </div>
          <p className="text-amber-200/90 font-semibold text-sm leading-relaxed">
            Portfolio Demo Only. No real orders, fireworks sales, delivery, or payments are processed.
          </p>
          <p className="text-amber-200/80 leading-relaxed">
            This website is a non-commercial software engineering portfolio project demonstrating mobile-first UI patterns, client-side cart arithmetic in integer paise, and a simulated ₹100 token checkout workflow. No financial transactions, commercial trading, or physical product deliveries take place.
          </p>
        </div>

        {/* Footer Meta */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs pt-4">
          <p>© 2026 Nagarjuna Traders Portfolio Project. Built for demonstration.</p>
          <p className="text-festive-amber font-mono text-[11px]">
            Mode: Portfolio Demo • Fixed ₹100 Simulated Token
          </p>
        </div>
      </div>
    </footer>
  );
};
