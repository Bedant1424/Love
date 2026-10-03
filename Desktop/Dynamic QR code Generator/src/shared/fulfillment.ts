import JSZip from 'jszip';
import type { ProvisionedCard } from './types';
import { buildCardUrl, type CardUrlOptions } from './url';
import { generateCardQrSvg, generateCardQrPngBuffer } from './qr-generator';

export type SupplierSubstrate =
  'Matte PVC' | 'Glossy PVC' | 'Brushed Metal' | 'Bamboo / Wood' | 'Frosted Acrylic';

export const DEFAULT_SUBSTRATE: SupplierSubstrate = 'Matte PVC';

export const AVAILABLE_SUBSTRATES: SupplierSubstrate[] = [
  'Matte PVC',
  'Glossy PVC',
  'Brushed Metal',
  'Bamboo / Wood',
  'Frosted Acrylic',
];

export interface ManifestOptions {
  substrate?: SupplierSubstrate;
  urlOptions?: CardUrlOptions;
}

export interface BatchPackageOptions {
  substrate?: SupplierSubstrate;
  urlOptions?: CardUrlOptions;
  includePngPreviews?: boolean;
}

/**
 * Forbidden columns or tokens that must NEVER appear in a supplier manifest or package.
 * Enforces Zero-Knowledge Manufacturing privacy invariant.
 */
export const FORBIDDEN_ZERO_KNOWLEDGE_TOKENS = [
  'business_name',
  'business',
  'destination_url',
  'google_url',
  'review_url',
  'place_id',
  'activation_code_hash',
  'secret',
  'db_uuid',
];

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
 * Verifies that a generated manifest string strictly complies with Zero-Knowledge invariants.
 */
export function verifyZeroKnowledgeManifest(csvString: string): {
  isZeroKnowledge: boolean;
  violations: string[];
} {
  const violations: string[] = [];
  const lowerCsv = csvString.toLowerCase();

  for (const token of FORBIDDEN_ZERO_KNOWLEDGE_TOKENS) {
    if (lowerCsv.includes(token)) {
      violations.push(`Forbidden token '${token}' detected in manifest export`);
    }
  }

  return {
    isZeroKnowledge: violations.length === 0,
    violations,
  };
}

/**
 * Generates an RFC 4180 compliant CSV manifest for supplier card manufacturing.
 *
 * Sacred Zero-Knowledge Schema:
 * card_index,public_id,qr_file,printed_activation_code,nfc_url,substrate
 */
export function generateManifestCsv(
  cards: ProvisionedCard[],
  options: ManifestOptions = {}
): string {
  const substrate = options.substrate ?? DEFAULT_SUBSTRATE;
  const headers = [
    'card_index',
    'public_id',
    'qr_file',
    'printed_activation_code',
    'nfc_url',
    'substrate',
  ];

  const rows: string[] = [];
  rows.push(headers.map(sanitizeCsvCell).join(','));

  for (let i = 0; i < cards.length; i++) {
    const card = cards[i]!;
    const cardIndex = i + 1;
    const publicId = card.publicId;
    const qrFile = `qr/${publicId}.svg`;
    const printedActivationCode = card.activationCode;
    const nfcUrl = buildCardUrl(publicId, options.urlOptions);

    const row = [
      sanitizeCsvCell(cardIndex),
      sanitizeCsvCell(publicId),
      sanitizeCsvCell(qrFile),
      sanitizeCsvCell(printedActivationCode),
      sanitizeCsvCell(nfcUrl),
      sanitizeCsvCell(substrate),
    ];

    rows.push(row.join(','));
  }

  const manifestCsv = rows.join('\r\n') + '\r\n';

  // Self-verification assertion
  const verification = verifyZeroKnowledgeManifest(manifestCsv);
  if (!verification.isZeroKnowledge) {
    throw new Error(`Zero-knowledge manifest violation: ${verification.violations.join(', ')}`);
  }

  return manifestCsv;
}

/**
 * Generates technical manufacturing and print guidelines for the supplier.
 */
export function generateSupplierReadme(
  batchName: string,
  cardCount: number,
  substrate: SupplierSubstrate,
  canonicalDomain: string
): string {
  return `================================================================================
QROUTE PHYSICAL CARD MANUFACTURING & PRINT SPECIFICATION
Batch: ${batchName}
Quantity: ${cardCount} Cards
Substrate: ${substrate}
Date Generated: ${new Date().toISOString()}
================================================================================

1. ZERO-KNOWLEDGE PRIVACY NOTICE
--------------------------------------------------------------------------------
This batch package contains blank, unactivated dynamic review cards.
No business names, Google review URLs, or customer identities are included.
All cards route through the permanent routing domain:
https://${canonicalDomain}/c/<public_id>

2. PHYSICAL CARD SPECIFICATION
--------------------------------------------------------------------------------
- Standard Format: ISO/IEC 7810 ID-1 / CR-80 Standard
- Finished Dimensions: 85.60 mm x 53.98 mm (3.370" x 2.125")
- Corner Radius: 3.18 mm (0.125")
- Core Substrate: ${substrate} (Standard 30 mil / 0.76 mm thickness)

3. QR CODE PRINT REQUIREMENTS
--------------------------------------------------------------------------------
- File Format: Vector SVG files located in the /qr/ folder
- Placement: Back face of card, recommended size: 28.0 mm x 28.0 mm
- Minimum Size: 20.0 mm x 20.0 mm
- Quiet Zone: Minimum 4 modules (3.5 mm) white border on all 4 sides
- Error Correction Level: ISO/IEC 18004 Level H (~30% damage recovery)
- Contrast: 100% K Black (#000000) on 100% White Background (#FFFFFF)

4. NFC ENCODING REQUIREMENTS
--------------------------------------------------------------------------------
- Chip Standard: NXP NTAG213 (or NTAG215 / NTAG216)
- Tag Protocol: NFC Forum Type 2 Tag / ISO 14443-A
- Record Type: NDEF Well-Known Type 'U' (URI, Hex 0x55)
- TNF: 0x01 (NFC Forum Well-Known Type)
- Prefix Code: 0x04 ('https://')
- NFC Payload URL: Found in manifest.csv column 'nfc_url'
- Post-Programming Directive: PERMANENT READ-ONLY LOCK (OTP lock bits set)

5. ACTIVATION CODE PRINTING & SECURITY
--------------------------------------------------------------------------------
- Value: Found in manifest.csv column 'printed_activation_code'
- Format: 12-character Crockford Base32 (XXXX-XXXX-XXXX)
- Placement: Back face of card under scratch-off security foil or protective sleeve
- Font: Monospaced high-legibility OCR-B or Helvetica Bold (min 8pt)

6. FILE PACKAGE CONTENTS
--------------------------------------------------------------------------------
- manifest.csv : Complete manufacturing data mapping
- README.txt   : This technical specification
- qr/*.svg     : Vector artwork for each individual card (named by public_id)
- qr/*.png     : High-resolution raster preview files (1024x1024)

For technical manufacturing inquiries, contact your platform administrator.
================================================================================
`;
}

/**
 * Generates a complete supplier ZIP package containing:
 * - manifest.csv
 * - README.txt
 * - qr/<publicId>.svg
 * - qr/<publicId>.png
 */
export async function generateBatchZipPackage(
  cards: ProvisionedCard[],
  batchName: string,
  options: BatchPackageOptions = {}
): Promise<Uint8Array> {
  const zip = new JSZip();
  const substrate = options.substrate ?? DEFAULT_SUBSTRATE;
  const includePng = options.includePngPreviews !== false;

  // 1. Generate Manifest CSV
  const manifestCsv = generateManifestCsv(cards, {
    substrate,
    urlOptions: options.urlOptions,
  });
  zip.file('manifest.csv', manifestCsv);

  // 2. Generate README.txt
  const domain = options.urlOptions?.customDomain ?? 'qroute.workers.dev';
  const readme = generateSupplierReadme(batchName, cards.length, substrate, domain);
  zip.file('README.txt', readme);

  // 3. Generate QR files
  const qrFolder = zip.folder('qr');
  if (!qrFolder) {
    throw new Error('Failed to create qr folder inside zip');
  }

  for (const card of cards) {
    const publicId = card.publicId;

    // Vector SVG
    const svgContent = await generateCardQrSvg(publicId, options.urlOptions);
    qrFolder.file(`${publicId}.svg`, svgContent);

    // Raster PNG preview
    if (includePng) {
      const pngBuffer = await generateCardQrPngBuffer(publicId, options.urlOptions);
      qrFolder.file(`${publicId}.png`, pngBuffer);
    }
  }

  // 4. Generate in-memory ZIP archive
  const zipBytes = await zip.generateAsync({
    type: 'uint8array',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });

  return zipBytes;
}
