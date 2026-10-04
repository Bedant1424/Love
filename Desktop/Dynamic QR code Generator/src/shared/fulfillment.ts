import JSZip from 'jszip';
import type { ProvisionedCard } from './types';
import { type CardUrlOptions, CANONICAL_PUBLIC_HOST } from './url';
import { generateCardQrSvg, generateCardQrPngBuffer } from './qr-generator';
import { generateQrSheetPdf } from './pdf-sheet';

export interface BatchPackageOptions {
  urlOptions?: CardUrlOptions;
}

/**
 * Forbidden tokens and sensitive fields that must NEVER appear in a supplier package.
 * Enforces Zero-Knowledge Supplier Privacy Invariant.
 */
export const FORBIDDEN_SUPPLIER_TOKENS = [
  'activation_code',
  'activationcode',
  'activation_password',
  'password',
  'secret',
  'business_name',
  'business',
  'destination_url',
  'google_url',
  'review_url',
  'place_id',
  'db_uuid',
  'activation_code_hash',
];

/**
 * Sanitizes a batch name for safe use in file and archive names.
 */
export function sanitizeBatchNameForFilename(batchName: string): string {
  const sanitized = batchName
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, '-')
    .replace(/-+/g, '-');
  return sanitized || 'Unnamed-Batch';
}

/**
 * Generates the canonical ZIP filename for a supplier batch package.
 * Example: QRoute_Batch_Batch-2026-A.zip
 */
export function formatBatchZipFilename(batchName: string): string {
  return `QRoute_Batch_${sanitizeBatchNameForFilename(batchName)}.zip`;
}

/**
 * Formats standard padded QR asset file identifier.
 * Example: i = 0, total = 10 -> 'QR-001'
 * Example: i = 99, total = 100 -> 'QR-100'
 */
export function formatQrAssetIdentifier(index: number, totalCards: number): string {
  const padLength = Math.max(3, String(totalCards).length);
  const numStr = String(index + 1).padStart(padLength, '0');
  return `QR-${numStr}`;
}

/**
 * Verifies that a supplier ZIP package contains ONLY permitted QR assets.
 * Permitted entries:
 * - SVG/QR-*.svg
 * - PNG/QR-*.png
 * - QR-SHEET.pdf
 *
 * Strictly blocks:
 * - Plaintext activation codes or hashes
 * - Customer business names or Google review URLs
 * - CSV manifests with credentials
 * - Any unauthorized metadata files
 */
export function verifySupplierPackageSecurity(fileNames: string[]): {
  isSecure: boolean;
  violations: string[];
} {
  const violations: string[] = [];

  for (const name of fileNames) {
    const isSvg = /^SVG\/QR-\d+\.svg$/.test(name);
    const isPng = /^PNG\/QR-\d+\.png$/.test(name);
    const isPdf = name === 'QR-SHEET.pdf';
    const isDir = name === 'SVG/' || name === 'PNG/';

    if (!isSvg && !isPng && !isPdf && !isDir) {
      violations.push(`Unauthorized file detected in supplier package: '${name}'`);
    }

    const lower = name.toLowerCase();
    for (const forbidden of FORBIDDEN_SUPPLIER_TOKENS) {
      if (lower.includes(forbidden)) {
        violations.push(`Forbidden token '${forbidden}' detected in file path '${name}'`);
      }
    }
  }

  return {
    isSecure: violations.length === 0,
    violations,
  };
}

/**
 * Generates ONE complete supplier ZIP archive package containing:
 *
 * QRoute_Batch_<batch>.zip
 *   SVG/
 *     QR-001.svg
 *     QR-002.svg
 *     ...
 *   PNG/
 *     QR-001.png
 *     QR-002.png
 *     ...
 *   QR-SHEET.pdf
 *
 * Sacred Security & Supplier Invariants:
 * - Contains QR assets only.
 * - Excludes activation codes and passwords.
 * - Excludes Google review destination URLs.
 * - Excludes customer and business names.
 * - Customer-facing artwork does not display public IDs beneath/beside QR.
 */
export async function generateBatchZipPackage(
  cards: Array<{ publicId: string }>,
  _batchName?: string,
  options: BatchPackageOptions = {}
): Promise<Uint8Array> {
  if (!cards || cards.length === 0) {
    throw new Error('At least one card is required to generate a batch package');
  }

  const zip = new JSZip();
  const totalCards = cards.length;

  const svgFolder = zip.folder('SVG');
  const pngFolder = zip.folder('PNG');

  if (!svgFolder || !pngFolder) {
    throw new Error('Failed to create asset folders inside ZIP archive');
  }

  // 1. Generate individual SVG and high-resolution PNG assets
  for (let i = 0; i < totalCards; i++) {
    const card = cards[i]!;
    const assetId = formatQrAssetIdentifier(i, totalCards);

    // Vector SVG print master (Vector QR only, no decorative frame, no credentials)
    const svgContent = await generateCardQrSvg(card.publicId, options.urlOptions);
    svgFolder.file(`${assetId}.svg`, svgContent);

    // High resolution PNG (1024x1024 raster, QR only, no card mockup, no credentials)
    const pngBuffer = await generateCardQrPngBuffer(card.publicId, options.urlOptions, {
      width: 1024,
    });
    pngFolder.file(`${assetId}.png`, pngBuffer);
  }

  // 2. Generate A4 PDF Sheet containing all QR codes in a clean grid
  const pdfBytes = await generateQrSheetPdf(cards, {
    urlOptions: options.urlOptions,
  });
  zip.file('QR-SHEET.pdf', pdfBytes);

  // 3. Verify security invariants of the zip package entries
  const fileNames = Object.keys(zip.files);
  const securityCheck = verifySupplierPackageSecurity(fileNames);
  if (!securityCheck.isSecure) {
    throw new Error(
      `Supplier package security invariant violation: ${securityCheck.violations.join(', ')}`
    );
  }

  // 4. Generate in-memory ZIP archive
  const zipBytes = await zip.generateAsync({
    type: 'uint8array',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });

  return zipBytes;
}

/**
 * Escapes a CSV cell value per RFC 4180 and protects against CSV Formula Injection (CWE-1236).
 * Any cell starting with =, +, -, @, \t, or \r is prefixed with a single quote (')
 * before being quoted.
 */
export function sanitizeCsvCell(value: string | number): string {
  const str = String(value);

  // CSV Formula Injection mitigation
  let sanitized = str;
  if (/^[=+\-@\t\r]/.test(sanitized)) {
    sanitized = `'${sanitized}`;
  }

  // RFC 4180 quotes escaping: wrap in double quotes and escape internal double quotes
  if (/[",\r\n]/.test(sanitized) || sanitized.startsWith("'")) {
    sanitized = `"${sanitized.replace(/"/g, '""')}"`;
  }

  return sanitized;
}

/**
 * Generates an internal admin-only CSV mapping for operators.
 * This is NEVER sent to suppliers or included in the supplier ZIP package.
 */
export function generateAdminMappingCsv(cards: ProvisionedCard[], batchName: string): string {
  const headers = ['card_index', 'public_id', 'activation_code', 'routing_url', 'batch_name'];
  const rows: string[] = [];
  rows.push(headers.map(sanitizeCsvCell).join(','));

  for (let i = 0; i < cards.length; i++) {
    const card = cards[i]!;
    const cardIndex = i + 1;
    const routingUrl = `https://${CANONICAL_PUBLIC_HOST}/c/${card.publicId}`;

    const row = [
      sanitizeCsvCell(cardIndex),
      sanitizeCsvCell(card.publicId),
      sanitizeCsvCell(card.activationCode),
      sanitizeCsvCell(routingUrl),
      sanitizeCsvCell(batchName),
    ];
    rows.push(row.join(','));
  }

  return rows.join('\r\n') + '\r\n';
}

/**
 * Formats standard confidential admin activation keys export filename.
 * Example: QRoute_Activation_Keys_batch-a.csv
 */
export function formatActivationKeysCsvFilename(batchName: string): string {
  return `QRoute_Activation_Keys_${sanitizeBatchNameForFilename(batchName)}.csv`;
}

/**
 * Generates confidential admin-only activation keys export CSV.
 * Columns: PUBLIC_ID, ACTIVATION_CODE, BATCH, STATUS.
 * Strictly excludes: Google destination, customer identity, secrets, hashes, tokens.
 */
export function generateActivationKeysCsv(
  keys: Array<{
    publicId: string;
    activationCode: string;
    batchName?: string | null;
    status: string;
  }>,
  fallbackBatchName: string
): string {
  const headers = ['PUBLIC_ID', 'ACTIVATION_CODE', 'BATCH', 'STATUS'];
  const rows: string[] = [];
  rows.push(headers.map(sanitizeCsvCell).join(','));

  for (const item of keys) {
    const row = [
      sanitizeCsvCell(item.publicId),
      sanitizeCsvCell(item.activationCode),
      sanitizeCsvCell(item.batchName || fallbackBatchName),
      sanitizeCsvCell(item.status),
    ];
    rows.push(row.join(','));
  }

  return rows.join('\r\n') + '\r\n';
}
