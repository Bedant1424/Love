import React, { useState, useEffect, useMemo } from 'react';
import {
  Radio,
  Download,
  FileSpreadsheet,
  FileArchive,
  Check,
  Copy,
  ShieldCheck,
  Layers,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Info,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import type { ProvisionedCard } from '../shared/types';
import { validateCustomDomain, type CardEnvironment, DEFAULT_PILOT_HOST } from '../shared/url';
import { generateNfcPayload, type NfcPayloadInfo } from '../shared/nfc';
import { generateCardQrSvg, generateCardQrPngBuffer } from '../shared/qr-generator';
import {
  generateManifestCsv,
  generateBatchZipPackage,
  type SupplierSubstrate,
  AVAILABLE_SUBSTRATES,
  DEFAULT_SUBSTRATE,
} from '../shared/fulfillment';

export interface AssetPipelineViewProps {
  batchName: string;
  cards: ProvisionedCard[];
  onClose?: () => void;
}

export const AssetPipelineView: React.FC<AssetPipelineViewProps> = ({
  batchName,
  cards,
  onClose,
}) => {
  // If no cards provided, create a sample card for preview
  const displayCards = useMemo(() => {
    if (cards && cards.length > 0) return cards;
    return [
      {
        id: 'sample-card-1',
        publicId: '8T2K9M4W1X',
        activationCode: 'K7XM-92PR-V8Q2',
        nfcUrl: `https://${DEFAULT_PILOT_HOST}/c/8T2K9M4W1X`,
      },
    ];
  }, [cards]);

  const [selectedCardIndex, setSelectedCardIndex] = useState<number>(0);
  const currentCard = displayCards[selectedCardIndex] ?? displayCards[0]!;

  // Configuration State
  const [environment, setEnvironment] = useState<CardEnvironment>('pilot');
  const [customDomain, setCustomDomain] = useState<string>('qr.example.com');
  const [substrate, setSubstrate] = useState<SupplierSubstrate>(DEFAULT_SUBSTRATE);
  const [previewFace, setPreviewFace] = useState<'front' | 'back'>('back');

  // Generated Asset Cache
  const [qrSvg, setQrSvg] = useState<string>('');
  const [nfcPayload, setNfcPayload] = useState<NfcPayloadInfo | null>(null);
  const [isGeneratingAsset, setIsGeneratingAsset] = useState<boolean>(false);

  // Export State
  const [isExportingZip, setIsExportingZip] = useState<boolean>(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Validate domain input
  const domainValidation = useMemo(() => {
    if (environment !== 'production') return { isValid: true };
    return validateCustomDomain(customDomain);
  }, [environment, customDomain]);

  const urlOptions = useMemo(
    () => ({
      environment,
      customDomain:
        environment === 'production' && domainValidation.isValid
          ? domainValidation.normalizedDomain || customDomain
          : undefined,
    }),
    [environment, customDomain, domainValidation]
  );

  // Re-generate preview QR and NFC when card, env, or domain changes
  useEffect(() => {
    let isMounted = true;
    setIsGeneratingAsset(true);

    async function generateAssets() {
      try {
        const payload = generateNfcPayload(currentCard.publicId, urlOptions);
        const svg = await generateCardQrSvg(currentCard.publicId, urlOptions);

        if (isMounted) {
          setNfcPayload(payload);
          setQrSvg(svg);
          setIsGeneratingAsset(false);
        }
      } catch (err) {
        if (isMounted) {
          console.error('Failed to generate preview assets:', err);
          setIsGeneratingAsset(false);
        }
      }
    }

    generateAssets();

    return () => {
      isMounted = false;
    };
  }, [currentCard.publicId, urlOptions]);

  const copyToClipboard = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch {
      setStatusMessage({ type: 'error', text: 'Clipboard access failed' });
    }
  };

  // 1. Download Manifest CSV
  const handleDownloadCsv = () => {
    try {
      const csvContent = generateManifestCsv(displayCards, {
        substrate,
        urlOptions,
      });

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute(
        'download',
        `qroute-manifest-${batchName.toLowerCase().replace(/[^a-z0-9]/g, '-')}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setStatusMessage({ type: 'success', text: 'Manifest CSV downloaded successfully.' });
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err) {
      setStatusMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Manifest export failed',
      });
    }
  };

  // 2. Download Single Card Vector SVG
  const handleDownloadSingleSvg = () => {
    if (!qrSvg) return;
    const blob = new Blob([qrSvg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `card-${currentCard.publicId}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // 3. Download Single Card Raster PNG
  const handleDownloadSinglePng = async () => {
    try {
      const pngBuffer = await generateCardQrPngBuffer(currentCard.publicId, urlOptions, {
        width: 1024,
      });
      const blob = new Blob([pngBuffer as BlobPart], { type: 'image/png' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `card-${currentCard.publicId}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('PNG download error:', err);
    }
  };

  // 4. Download Full Supplier Package (ZIP)
  const handleDownloadFullZip = async () => {
    setIsExportingZip(true);
    setStatusMessage(null);
    try {
      const zipBytes = await generateBatchZipPackage(displayCards, batchName, {
        substrate,
        urlOptions,
        includePngPreviews: true,
      });

      const blob = new Blob([zipBytes as BlobPart], { type: 'application/zip' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `qroute-supplier-package-${batchName.toLowerCase().replace(/[^a-z0-9]/g, '-')}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setStatusMessage({
        type: 'success',
        text: `Full package (${displayCards.length} cards + SVGs + PNGs + manifest) downloaded.`,
      });
      setTimeout(() => setStatusMessage(null), 5000);
    } catch (err) {
      setStatusMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'ZIP generation failed',
      });
    } finally {
      setIsExportingZip(false);
    }
  };

  // Helper for substrate visual background style
  const getSubstrateStyle = () => {
    switch (substrate) {
      case 'Brushed Metal':
        return 'bg-gradient-to-tr from-zinc-300 via-zinc-100 to-zinc-400 text-zinc-900 border-zinc-400 shadow-md';
      case 'Bamboo / Wood':
        return 'bg-gradient-to-tr from-amber-200 via-amber-100 to-amber-300 text-amber-950 border-amber-300 shadow-md';
      case 'Frosted Acrylic':
        return 'bg-white/90 backdrop-blur-md text-zinc-900 border-white/60 shadow-lg';
      case 'Glossy PVC':
        return 'bg-white text-zinc-950 border-zinc-300 shadow-lg ring-1 ring-zinc-200';
      case 'Matte PVC':
      default:
        return 'bg-zinc-950 text-white border-zinc-800 shadow-xl';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-zinc-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase tracking-widest text-zinc-500">
              Manufacturing Fulfillment Pipeline
            </span>
            <Badge variant="active">ISO/IEC 18004 Level H</Badge>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-zinc-950 mt-1">
            Batch Asset Pipeline: {batchName}
          </h2>
          <p className="text-xs text-zinc-600 mt-0.5">
            Deterministic vector artwork, ISO/IEC 18004 Level H QR matrices, and zero-knowledge
            manufacturing packages.
          </p>
        </div>

        {onClose && (
          <Button variant="outline" size="sm" onClick={onClose}>
            Back to Dashboard
          </Button>
        )}
      </div>

      {statusMessage && (
        <div
          role="alert"
          className={`p-3 rounded-lg text-sm border flex items-center justify-between ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-red-50 text-red-800 border-red-200'
          }`}
        >
          <span>{statusMessage.text}</span>
          <button
            type="button"
            onClick={() => setStatusMessage(null)}
            className="text-xs font-semibold hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Grid: Card Artwork Preview & Configuration */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Interactive Physical Card Canvas (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Card Carousel Navigation */}
          <div className="flex items-center justify-between bg-zinc-50 border border-zinc-200 px-4 py-2.5 rounded-xl">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Card
              </span>
              <span className="text-sm font-mono font-bold text-zinc-900">
                {selectedCardIndex + 1} of {displayCards.length}
              </span>
              <span className="text-xs font-mono text-zinc-500">({currentCard.publicId})</span>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex rounded-lg border border-zinc-200 bg-white p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => setPreviewFace('front')}
                  className={`px-3 py-1 rounded-md font-medium transition-colors ${
                    previewFace === 'front'
                      ? 'bg-zinc-950 text-white'
                      : 'text-zinc-600 hover:text-zinc-900'
                  }`}
                >
                  Front Face
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewFace('back')}
                  className={`px-3 py-1 rounded-md font-medium transition-colors ${
                    previewFace === 'back'
                      ? 'bg-zinc-950 text-white'
                      : 'text-zinc-600 hover:text-zinc-900'
                  }`}
                >
                  Back Face (QR + NFC)
                </button>
              </div>

              {displayCards.length > 1 && (
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                    disabled={selectedCardIndex === 0}
                    onClick={() => setSelectedCardIndex((i) => Math.max(0, i - 1))}
                    aria-label="Previous card in batch"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                    disabled={selectedCardIndex >= displayCards.length - 1}
                    onClick={() =>
                      setSelectedCardIndex((i) => Math.min(displayCards.length - 1, i + 1))
                    }
                    aria-label="Next card in batch"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* CR-80 Standard Physical Card Artwork Canvas (Ratio 85.60mm : 53.98mm = 1.586 : 1) */}
          <div className="relative mx-auto w-full max-w-lg">
            <div
              className={`relative aspect-[856/540] w-full rounded-2xl border p-6 flex flex-col justify-between transition-all duration-300 select-none overflow-hidden ${getSubstrateStyle()}`}
            >
              {/* BACK FACE: Production QR Code + NFC Tap Point + Scratch Foil */}
              {previewFace === 'back' ? (
                <>
                  {/* Top Bar: NFC Indicator & Public ID */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center justify-center h-7 w-7 rounded-full border border-current/30 bg-current/10">
                        <Radio className="h-4 w-4" />
                      </div>
                      <span className="text-[10px] font-mono tracking-wider uppercase opacity-80">
                        NFC NTAG213 CONTACT POINT
                      </span>
                    </div>
                    <span className="text-xs font-mono font-bold tracking-widest px-2 py-0.5 rounded-sm bg-current/10 border border-current/20">
                      ID: {currentCard.publicId}
                    </span>
                  </div>

                  {/* Center: ISO/IEC 18004 Level H QR Vector Artwork */}
                  <div className="flex items-center justify-center my-auto py-2">
                    <div className="relative flex items-center justify-center rounded-xl bg-white p-2.5 shadow-sm border border-zinc-200">
                      {isGeneratingAsset ? (
                        <div className="h-32 w-32 flex items-center justify-center text-xs text-zinc-400 font-mono">
                          Rendering...
                        </div>
                      ) : qrSvg ? (
                        <div
                          className="h-32 w-32 flex items-center justify-center [&>svg]:h-full [&>svg]:w-full"
                          dangerouslySetInnerHTML={{ __html: qrSvg }}
                          aria-label={`QR Code for card ${currentCard.publicId}`}
                        />
                      ) : (
                        <div className="h-32 w-32 flex items-center justify-center text-xs text-zinc-400">
                          Unavailable
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bottom: Activation Code Panel & Permanent Routing Notice */}
                  <div className="space-y-2">
                    {/* Scratch-off Activation Code Panel */}
                    <div className="flex items-center justify-between bg-current/10 border border-current/20 px-3 py-1.5 rounded-lg">
                      <span className="text-[10px] font-mono uppercase tracking-wider opacity-80">
                        Activation Code (Security Foil):
                      </span>
                      <span className="text-xs font-mono font-bold tracking-widest text-emerald-400 drop-shadow-xs">
                        {currentCard.activationCode}
                      </span>
                    </div>

                    {/* Permanent URL & Invariant Notice */}
                    <div className="flex items-center justify-between text-[9px] font-mono opacity-70">
                      <span className="truncate max-w-[280px]">
                        {nfcPayload?.canonicalUrl ||
                          `https://${DEFAULT_PILOT_HOST}/c/${currentCard.publicId}`}
                      </span>
                      <span>ISO 18004 Level H • CR-80</span>
                    </div>
                  </div>
                </>
              ) : (
                /* FRONT FACE: Swiss Modernist Review Invitation */
                <>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="h-4 w-4 text-amber-400" />
                      <span className="text-xs font-semibold uppercase tracking-wider opacity-90">
                        Google Review
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-amber-400">{'★'.repeat(5)}</div>
                  </div>

                  <div className="my-auto py-4 text-center space-y-2">
                    <h3 className="text-2xl font-black tracking-tight uppercase leading-tight">
                      Review Us On Google
                    </h3>
                    <p className="text-xs font-medium opacity-80 max-w-xs mx-auto">
                      Tap phone on card or scan QR code on back.
                      <br />
                      Takes only 5 seconds.
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-current/20 text-[10px] font-mono opacity-70">
                    <div className="flex items-center gap-1.5">
                      <Radio className="h-3.5 w-3.5" />
                      <span>Instant Contactless Tap</span>
                    </div>
                    <span>No App Required</span>
                  </div>
                </>
              )}
            </div>

            {/* Quick Card Download Controls */}
            <div className="mt-3 flex items-center justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadSingleSvg}
                className="text-xs h-8"
              >
                <Download className="h-3.5 w-3.5 mr-1" />
                Download SVG
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadSinglePng}
                className="text-xs h-8"
              >
                <Download className="h-3.5 w-3.5 mr-1" />
                Download PNG (1024px)
              </Button>
            </div>
          </div>

          {/* NFC Hardware Specification & Memory Meter */}
          <Card className="border-zinc-200">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Radio className="h-4 w-4 text-zinc-700" />
                  <CardTitle className="text-sm">NFC NTAG213 Hardware Payload</CardTitle>
                </div>
                <Badge variant="neutral">NDEF Type U (0x55)</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="flex items-center justify-between rounded-lg bg-zinc-50 p-2.5 font-mono">
                <span className="text-zinc-600 truncate max-w-xs">{nfcPayload?.canonicalUrl}</span>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-[11px]"
                  onClick={() => copyToClipboard(nfcPayload?.canonicalUrl || '', 'nfc_url')}
                >
                  {copiedKey === 'nfc_url' ? (
                    <Check className="h-3.5 w-3.5 text-emerald-600 mr-1" />
                  ) : (
                    <Copy className="h-3.5 w-3.5 mr-1" />
                  )}
                  {copiedKey === 'nfc_url' ? 'Copied' : 'Copy'}
                </Button>
              </div>

              {/* Memory Consumption Progress Bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-zinc-600 font-mono text-[11px]">
                  <span>NTAG213 User Memory Consumption</span>
                  <span className="font-semibold text-zinc-900">
                    {nfcPayload?.ntag213BytesUsed} / 144 bytes ({nfcPayload?.ntag213CapacityPercent}
                    %)
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-zinc-200 overflow-hidden">
                  <div
                    className="h-full bg-emerald-600 rounded-full transition-all duration-300"
                    style={{ width: `${nfcPayload?.ntag213CapacityPercent ?? 30}%` }}
                  />
                </div>
                <p className="text-[11px] text-zinc-500">
                  {144 - (nfcPayload?.ntag213BytesUsed ?? 0)} bytes remaining for factory OTP lock
                  bits. Permanent read-only locking directive active.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Configuration & Fulfillment Export (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Environment & Hostname Settings */}
          <Card className="border-zinc-200">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-zinc-700" />
                <CardTitle className="text-sm">Routing Domain Strategy</CardTitle>
              </div>
              <CardDescription className="text-xs">
                Physical cards permanently encode this domain. Choose between $0 Pilot or Owned
                Custom Domain.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Environment Radio Selector */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setEnvironment('pilot')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    environment === 'pilot'
                      ? 'border-zinc-950 bg-zinc-950 text-white shadow-xs'
                      : 'border-zinc-200 bg-white text-zinc-800 hover:border-zinc-300'
                  }`}
                >
                  <span className="block text-xs font-semibold uppercase tracking-wider">
                    Pilot ($0 Free)
                  </span>
                  <span
                    className={`block text-[11px] mt-0.5 ${environment === 'pilot' ? 'text-zinc-300' : 'text-zinc-500'}`}
                  >
                    workers.dev subdomain
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setEnvironment('production')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    environment === 'production'
                      ? 'border-zinc-950 bg-zinc-950 text-white shadow-xs'
                      : 'border-zinc-200 bg-white text-zinc-800 hover:border-zinc-300'
                  }`}
                >
                  <span className="block text-xs font-semibold uppercase tracking-wider">
                    Production
                  </span>
                  <span
                    className={`block text-[11px] mt-0.5 ${environment === 'production' ? 'text-zinc-300' : 'text-zinc-500'}`}
                  >
                    Owned Custom Domain
                  </span>
                </button>
              </div>

              {/* Custom Domain Input (Conditional) */}
              {environment === 'production' && (
                <div className="space-y-1.5 pt-1">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700">
                    Production Hostname (FQDN)
                  </label>
                  <Input
                    value={customDomain}
                    onChange={(e) => setCustomDomain(e.target.value)}
                    placeholder="e.g. qr.yourbrand.com"
                    className="h-9 text-xs font-mono"
                  />
                  {!domainValidation.isValid ? (
                    <p className="text-[11px] text-red-600 font-medium">{domainValidation.error}</p>
                  ) : (
                    <p className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
                      <Check className="h-3 w-3" /> Valid RFC 1123 Hostname
                    </p>
                  )}
                </div>
              )}

              {/* Substrate Material Selector */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700">
                  Card Substrate Material
                </label>
                <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                  {AVAILABLE_SUBSTRATES.map((sub) => (
                    <button
                      key={sub}
                      type="button"
                      onClick={() => setSubstrate(sub)}
                      className={`px-2 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                        substrate === sub
                          ? 'border-zinc-950 bg-zinc-100 text-zinc-950 font-semibold'
                          : 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300'
                      }`}
                    >
                      {sub}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Supplier Export Actions */}
          <Card className="border-zinc-200">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <CardTitle className="text-sm">Zero-Knowledge Supplier Export</CardTitle>
              </div>
              <CardDescription className="text-xs">
                Zero business names, zero review destinations, zero database credentials.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Privacy Guarantee Banner */}
              <div className="rounded-lg border border-emerald-200 bg-emerald-50/70 p-3 text-xs text-emerald-900 space-y-1">
                <span className="font-semibold block">Privacy Guarantee Verified:</span>
                <p className="text-[11px] text-emerald-800 leading-relaxed">
                  Export contains strictly:{' '}
                  <code>
                    card_index, public_id, qr_file, printed_activation_code, nfc_url, substrate
                  </code>
                  . Target Google URLs remain blank until merchant unboxes and activates card.
                </p>
              </div>

              {/* Formula Injection Mitigation Notice */}
              <div className="flex items-start gap-2 p-2.5 rounded-lg bg-zinc-50 border border-zinc-200 text-[11px] text-zinc-600">
                <Info className="h-4 w-4 text-zinc-500 shrink-0 mt-0.5" />
                <p>
                  CSV Formula Injection (CWE-1236) sanitized: all cell values starting with{' '}
                  <code>=, +, -, @</code> are safely escaped with leading single quotes.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 space-y-2">
                <Button
                  variant="primary"
                  size="md"
                  className="w-full justify-center text-xs h-10"
                  onClick={handleDownloadFullZip}
                  isLoading={isExportingZip}
                >
                  <FileArchive className="h-4 w-4 mr-2" />
                  Export Full Supplier Package (ZIP)
                </Button>

                <Button
                  variant="outline"
                  size="md"
                  className="w-full justify-center text-xs h-9"
                  onClick={handleDownloadCsv}
                >
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Download Manifest (CSV)
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
