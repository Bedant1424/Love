import React from 'react';

interface TestQrCodeProps {
  vpa: string;
  accountName: string;
  amountInr: string;
  transactionNote: string;
  isRestricted?: boolean;
}

export const TestQrCode: React.FC<TestQrCodeProps> = ({
  vpa,
  accountName,
  amountInr,
  transactionNote,
  isRestricted = true,
}) => {
  return (
    <div className="flex flex-col items-center p-6 rounded-2xl bg-white text-black shadow-lg border border-neutral-200 max-w-xs mx-auto">
      {/* Merchant Header */}
      <div className="text-center mb-3">
        <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
          Scan & Pay Advance Token
        </div>
        <div className="font-bold text-base text-neutral-900 mt-0.5">
          {accountName}
        </div>
        <div className="font-mono text-xs text-neutral-600 font-medium">
          {vpa}
        </div>
      </div>

      {/* Stylized QR Code SVG Representation */}
      <div className="relative p-3 bg-neutral-50 border-2 border-neutral-300 rounded-xl my-2">
        <svg
          viewBox="0 0 160 160"
          className="w-44 h-44 select-none"
          role="img"
          aria-label={`UPI QR fixture for ₹${amountInr} to ${vpa}`}
        >
          {/* Background */}
          <rect width="160" height="160" fill="#ffffff" rx="8" />

          {/* Top-Left Finder */}
          <rect x="12" y="12" width="40" height="40" rx="4" fill="#0f172a" />
          <rect x="18" y="18" width="28" height="28" rx="2" fill="#ffffff" />
          <rect x="24" y="24" width="16" height="16" rx="2" fill="#0f172a" />

          {/* Top-Right Finder */}
          <rect x="108" y="12" width="40" height="40" rx="4" fill="#0f172a" />
          <rect x="114" y="18" width="28" height="28" rx="2" fill="#ffffff" />
          <rect x="120" y="24" width="16" height="16" rx="2" fill="#0f172a" />

          {/* Bottom-Left Finder */}
          <rect x="12" y="108" width="40" height="40" rx="4" fill="#0f172a" />
          <rect x="18" y="114" width="28" height="28" rx="2" fill="#ffffff" />
          <rect x="24" y="120" width="16" height="16" rx="2" fill="#0f172a" />

          {/* Alignment & Timing Patterns */}
          <rect x="60" y="24" width="8" height="8" fill="#0f172a" />
          <rect x="76" y="24" width="8" height="8" fill="#0f172a" />
          <rect x="92" y="24" width="8" height="8" fill="#0f172a" />

          <rect x="24" y="60" width="8" height="8" fill="#0f172a" />
          <rect x="24" y="76" width="8" height="8" fill="#0f172a" />
          <rect x="24" y="92" width="8" height="8" fill="#0f172a" />

          {/* Data Pattern Grid */}
          <rect x="60" y="60" width="12" height="12" fill="#0f172a" />
          <rect x="76" y="60" width="8" height="8" fill="#0f172a" />
          <rect x="88" y="60" width="12" height="12" fill="#0f172a" />
          <rect x="108" y="60" width="8" height="8" fill="#0f172a" />
          <rect x="124" y="60" width="12" height="12" fill="#0f172a" />
          <rect x="140" y="60" width="8" height="8" fill="#0f172a" />

          <rect x="60" y="76" width="8" height="8" fill="#0f172a" />
          <rect x="72" y="76" width="16" height="16" fill="#0f172a" />
          <rect x="100" y="76" width="8" height="8" fill="#0f172a" />
          <rect x="116" y="76" width="12" height="12" fill="#0f172a" />
          <rect x="136" y="76" width="12" height="12" fill="#0f172a" />

          <rect x="60" y="96" width="12" height="12" fill="#0f172a" />
          <rect x="76" y="96" width="8" height="8" fill="#0f172a" />
          <rect x="92" y="96" width="12" height="12" fill="#0f172a" />
          <rect x="112" y="96" width="8" height="8" fill="#0f172a" />
          <rect x="128" y="96" width="16" height="16" fill="#0f172a" />

          <rect x="60" y="116" width="16" height="16" fill="#0f172a" />
          <rect x="84" y="116" width="8" height="8" fill="#0f172a" />
          <rect x="100" y="116" width="12" height="12" fill="#0f172a" />
          <rect x="120" y="116" width="8" height="8" fill="#0f172a" />
          <rect x="136" y="116" width="12" height="12" fill="#0f172a" />

          <rect x="60" y="136" width="8" height="8" fill="#0f172a" />
          <rect x="76" y="136" width="12" height="12" fill="#0f172a" />
          <rect x="96" y="136" width="8" height="8" fill="#0f172a" />
          <rect x="112" y="136" width="16" height="16" fill="#0f172a" />
          <rect x="136" y="136" width="8" height="8" fill="#0f172a" />

          {/* Center Safe Fixture Overlay Pill */}
          <rect x="48" y="68" width="64" height="24" rx="4" fill="#f59e0b" />
          <text
            x="80"
            y="84"
            fill="#000000"
            fontSize="9"
            fontWeight="bold"
            textAnchor="middle"
            fontFamily="monospace"
          >
            TEST FIXTURE
          </text>
        </svg>

        {isRestricted && (
          <div className="absolute inset-0 bg-neutral-900/10 backdrop-blur-[0.5px] rounded-xl flex items-end justify-center pb-2 pointer-events-none">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500 text-black shadow">
              NON-PAYABLE FIXTURE
            </span>
          </div>
        )}
      </div>

      {/* Amount and Ref Badge */}
      <div className="w-full text-center mt-2 pt-2 border-t border-neutral-200">
        <div className="text-xl font-bold font-mono text-neutral-900">
          ₹{amountInr}
        </div>
        <div className="text-[11px] text-neutral-500 font-mono mt-0.5">
          Ref: {transactionNote}
        </div>
      </div>
    </div>
  );
};
