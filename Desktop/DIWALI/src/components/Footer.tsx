import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-bg-surface border-t border-white/10 mt-16 pb-24 md:pb-12 text-content-muted">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        {/* Brand & Store Information */}
        <div className="border-b border-white/5 pb-6">
          <h2 className="text-lg font-bold text-content-primary font-display">
            Nagarjuna Traders — Diwali Fireworks
          </h2>
          <p className="text-sm mt-1">
            Diwali catalogue enquiry and order reservation system.
          </p>
          <div className="mt-3 p-3 rounded-lg bg-bg-base border border-white/5 text-xs text-content-secondary space-y-1">
            <p>
              <strong className="text-content-primary">Order Reservation:</strong> Orders submitted online require an advance token (₹50 below ₹200, ₹100 for ₹200+) to reserve items.
            </p>
            <p>
              <strong className="text-content-primary">Counter Collection:</strong> Remaining balance is payable at counter collection upon receiving items.
            </p>
          </div>
        </div>

        {/* Notice */}
        <div className="p-4 rounded-xl bg-bg-elevated border border-white/10 text-xs space-y-1">
          <p className="text-content-secondary leading-relaxed">
            Please ensure you confirm quantities and item availability before finalizing your reservation.
          </p>
        </div>

        {/* Footer Meta */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs pt-4">
          <p>© 2026 Nagarjuna Traders. All rights reserved.</p>
          <p className="text-content-muted font-mono text-[11px]">
            Diwali Catalogue 2026
          </p>
        </div>
      </div>
    </footer>
  );
};
