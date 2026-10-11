import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-bg-surface border-t border-white/10 mt-16 pb-24 md:pb-12 text-content-muted">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        {/* Brand & Store Information */}
        <div className="border-b border-white/5 pb-6">
          <h2 className="text-lg font-bold text-content-primary font-display">
            Nagarjuna Traders — Sivakasi Fireworks
          </h2>
          <p className="text-sm mt-1">
            Official Diwali catalogue reservation and counter collection system.
          </p>
          <div className="mt-3 p-3 rounded-lg bg-bg-base border border-white/5 text-xs text-content-secondary space-y-1">
            <p>
              <strong className="text-content-primary">Order Reservation:</strong> Orders submitted online require an advance token (₹50 below ₹200, ₹100 for ₹200+) to secure catalogue pricing and stock reservation.
            </p>
            <p>
              <strong className="text-content-primary">Physical Collection:</strong> Remaining balance is payable at physical counter collection. Courier shipment of fireworks is prohibited under Supreme Court & PESO regulations.
            </p>
          </div>
        </div>

        {/* Statutory Compliance & Safety Notice */}
        <div className="p-4 rounded-xl bg-bg-elevated border border-white/10 text-xs space-y-2">
          <div className="flex items-center gap-2 font-bold text-content-primary">
            <span>⚖️</span>
            <span>Statutory Compliance & Legal Guidelines</span>
          </div>
          <p className="text-content-secondary leading-relaxed">
            In accordance with the Supreme Court of India guidelines and Explosives Rules 2008, all fireworks orders must be collected directly in person at our licensed premises. Age verification (18+) is mandatory.
          </p>
          <p className="text-content-muted text-[11px] leading-relaxed">
            Payment collection is strictly managed under authorized terms. Test environment transactions are recorded with non-payable fixtures until commercial operations open.
          </p>
        </div>

        {/* Footer Meta */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs pt-4">
          <p>© 2026 Nagarjuna Traders. All rights reserved.</p>
          <p className="text-festive-gold font-mono text-[11px]">
            Licensed Counter Pickup • Sivakasi
          </p>
        </div>
      </div>
    </footer>
  );
};
