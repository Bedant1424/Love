import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-bg-surface border-t border-white/10 mt-16 pb-24 md:pb-12 text-content-muted">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        {/* Brand & Artwork Notice */}
        <div className="border-b border-white/5 pb-6">
          <h2 className="text-lg font-bold text-content-primary font-display">
            Nagarjuna Traders
          </h2>
          <p className="text-sm mt-1">
            Authentic Diwali fireworks catalogue extracted directly from supplied poster artwork.
          </p>
          <div className="mt-3 p-3 rounded-lg bg-bg-base border border-white/5 text-xs text-content-secondary space-y-1">
            <p>
              <strong className="text-content-primary">Printed Location:</strong> Sivakasi, Andhra Pradesh (Recorded verbatim from supplied artwork; physical address verification in progress).
            </p>
            <p>
              <strong className="text-content-primary">Catalogue Artwork:</strong> docs/reference/nagarjuna-traders-catalog.jpg
            </p>
          </div>
        </div>

        {/* Mandatory Statutory & Supreme Court Disclaimer */}
        <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-800/30 text-xs space-y-2">
          <div className="flex items-center gap-2 font-bold text-amber-300">
            <span>⚖️</span>
            <span>Statutory Compliance Notice & E-Commerce Disclosure</span>
          </div>
          <p className="text-amber-200/80 leading-relaxed">
            In compliance with the Supreme Court of India directives (<em>Arjun Gopal v. Union of India</em>) and the Explosives Rules, 2008, online commercial checkout, payment capture, and courier/parcel delivery of fireworks are strictly prohibited.
          </p>
          <p className="text-amber-200/80 leading-relaxed">
            This website functions exclusively as a non-binding digital catalogue and price estimate generator for customer convenience. All fireworks must be physically inspected, purchased, and collected in person at our licensed retail counter by individuals 18 years of age or older.
          </p>
        </div>

        {/* Footer Meta */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs pt-4">
          <p>© 2026 Nagarjuna Traders. All rights reserved.</p>
          <p className="text-festive-amber font-mono text-[11px]">
            Milestone 2: Customer Interface • COMMERCE_CHECKOUT_ENABLED=false
          </p>
        </div>
      </div>
    </footer>
  );
};
