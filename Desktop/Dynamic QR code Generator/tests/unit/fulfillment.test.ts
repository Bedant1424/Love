import { describe, it, expect } from 'vitest';
import JSZip from 'jszip';
import type { ProvisionedCard } from '../../src/shared/types';
import {
  buildCardUrl,
  validateCustomDomain,
  parseCardPublicIdFromUrl,
  CANONICAL_PUBLIC_HOST,
  CANONICAL_PUBLIC_ORIGIN,
  DEFAULT_PILOT_HOST,
} from '../../src/shared/url';
import { generateNfcPayload } from '../../src/shared/nfc';
import {
  sanitizeCsvCell,
  generateBatchZipPackage,
  generateAdminMappingCsv,
  formatBatchZipFilename,
  formatQrAssetIdentifier,
  verifySupplierPackageSecurity,
  FORBIDDEN_SUPPLIER_TOKENS,
} from '../../src/shared/fulfillment';
import { generateQrSheetPdf } from '../../src/shared/pdf-sheet';

describe('Supplier Fulfillment & QR Export Engine', () => {
  const MOCK_CARDS: ProvisionedCard[] = [
    {
      id: 'uuid-card-1',
      publicId: '8T2K9M4W1X7P3N5Q',
      activationCode: 'K7XM-92PR-V8Q2',
      nfcUrl: `${CANONICAL_PUBLIC_ORIGIN}/c/8T2K9M4W1X7P3N5Q`,
    },
    {
      id: 'uuid-card-2',
      publicId: '3H5V7N2R9B4M6K8W',
      activationCode: 'B4WT-81MK-P5Q9',
      nfcUrl: `${CANONICAL_PUBLIC_ORIGIN}/c/3H5V7N2R9B4M6K8W`,
    },
  ];

  describe('Canonical URL Centralization & Public Host Invariants', () => {
    it('uses centralized CANONICAL_PUBLIC_HOST (go.taprevieww.workers.dev)', () => {
      expect(CANONICAL_PUBLIC_HOST).toBe('go.taprevieww.workers.dev');
      expect(CANONICAL_PUBLIC_ORIGIN).toBe('https://go.taprevieww.workers.dev');
      expect(DEFAULT_PILOT_HOST).toBe('go.taprevieww.workers.dev');
    });

    it('constructs canonical pilot URL on go.taprevieww.workers.dev by default', () => {
      const url = buildCardUrl('8T2K9M4W1X7P3N5Q');
      expect(url).toBe('https://go.taprevieww.workers.dev/c/8T2K9M4W1X7P3N5Q');
      expect(url).not.toContain('qroute.workers.dev');
    });

    it('constructs production URL with validated custom domain', () => {
      const url = buildCardUrl('8T2K9M4W1X7P3N5Q', {
        environment: 'production',
        customDomain: 'qr.mybusiness.com',
      });
      expect(url).toBe('https://qr.mybusiness.com/c/8T2K9M4W1X7P3N5Q');
    });

    it('normalizes custom domain by stripping accidental schemes, slashes, and paths', () => {
      const url = buildCardUrl('8T2K9M4W1X7P3N5Q', {
        environment: 'production',
        customDomain: 'https://qr.mybusiness.com/extra/path/?query=1#hash',
      });
      expect(url).toBe('https://qr.mybusiness.com/c/8T2K9M4W1X7P3N5Q');
    });

    it('supports development localhost URL', () => {
      const url = buildCardUrl('8T2K9M4W1X7P3N5Q', {
        environment: 'development',
      });
      expect(url).toBe('http://localhost:8787/c/8T2K9M4W1X7P3N5Q');
    });

    it('never encodes activation codes, query parameters, or secrets in card URLs', () => {
      const url = buildCardUrl('8T2K9M4W1X7P3N5Q');
      expect(url).not.toContain('?');
      expect(url).not.toContain('#');
      expect(url).not.toContain('code');
      expect(url).not.toContain('secret');
      expect(url).toBe('https://go.taprevieww.workers.dev/c/8T2K9M4W1X7P3N5Q');
    });

    it('rejects invalid or malformed public IDs', () => {
      expect(() => buildCardUrl('TOO_SHORT')).toThrow(/too short/);
      expect(() => buildCardUrl('123456789O123456')).toThrow(/contains invalid characters/);
    });
  });

  describe('Domain Validator (validateCustomDomain)', () => {
    it('accepts valid RFC 1123 hostnames', () => {
      expect(validateCustomDomain('example.com').isValid).toBe(true);
      expect(validateCustomDomain('qr.example.co.uk').isValid).toBe(true);
      expect(validateCustomDomain('cards.my-domain123.org').isValid).toBe(true);
    });

    it('rejects empty or whitespace domains', () => {
      expect(validateCustomDomain('').isValid).toBe(false);
      expect(validateCustomDomain('   ').isValid).toBe(false);
    });

    it('rejects invalid hostname syntax with spaces or illegal characters', () => {
      expect(validateCustomDomain('invalid domain.com').isValid).toBe(false);
      expect(validateCustomDomain('evil..com').isValid).toBe(false);
    });
  });

  describe('Public ID URL Parser (parseCardPublicIdFromUrl)', () => {
    it('extracts Crockford Base32 ID from canonical URL', () => {
      expect(parseCardPublicIdFromUrl('https://go.taprevieww.workers.dev/c/8T2K9M4W1X7P3N5Q')).toBe(
        '8T2K9M4W1X7P3N5Q'
      );
    });

    it('returns null for unparseable or invalid strings', () => {
      expect(parseCardPublicIdFromUrl('')).toBeNull();
      expect(parseCardPublicIdFromUrl('https://google.com')).toBeNull();
      expect(parseCardPublicIdFromUrl('INVALID')).toBeNull();
    });
  });

  describe('NFC Payload & Hardware Specification (generateNfcPayload)', () => {
    it('generates canonical NDEF URI Type U payload metadata using canonical host', () => {
      const nfc = generateNfcPayload('8T2K9M4W1X7P3N5Q');

      expect(nfc.publicId).toBe('8T2K9M4W1X7P3N5Q');
      expect(nfc.ndefRecordType).toBe('U');
      expect(nfc.ndefTnf).toBe('0x01');
      expect(nfc.ndefPrefixCode).toBe('0x04');
      expect(nfc.ndefCompressedPayload).toBe(`${CANONICAL_PUBLIC_HOST}/c/8T2K9M4W1X7P3N5Q`);
      expect(nfc.factoryLockDirective).toBe('PERMANENT_READ_ONLY');
      expect(nfc.ndefCompressedPayload).not.toContain('qroute.workers.dev');
    });

    it('never encodes activation codes, secrets, or sensitive parameters in NFC payload', () => {
      const nfc = generateNfcPayload('8T2K9M4W1X7P3N5Q');

      expect(nfc.ndefCompressedPayload).not.toContain('code');
      expect(nfc.ndefCompressedPayload).not.toContain('secret');
      expect(nfc.ndefCompressedPayload).not.toContain('?');
    });

    it('verifies NXP NTAG213 hardware memory limits (< 144 bytes)', () => {
      const nfc = generateNfcPayload('8T2K9M4W1X7P3N5Q');

      expect(nfc.ntag213UserCapacityBytes).toBe(144);
      expect(nfc.isNtag213Compatible).toBe(true);
      expect(nfc.ntag213BytesUsed).toBeLessThan(70);
      expect(nfc.ntag213CapacityPercent).toBeLessThan(50);
    });
  });

  describe('CSV Formula Injection Defense (sanitizeCsvCell)', () => {
    it('neutralizes formula triggers (=, +, -, @, \\t, \\r)', () => {
      expect(sanitizeCsvCell('=1+1')).toBe(`"'=1+1"`);
      expect(sanitizeCsvCell('@SUM(A1:A10)')).toBe(`"'@SUM(A1:A10)"`);
      expect(sanitizeCsvCell('-cmd|calc')).toBe(`"'-cmd|calc"`);
      expect(sanitizeCsvCell('+cmd|calc')).toBe(`"'+cmd|calc"`);
      expect(sanitizeCsvCell('\tcalc')).toBe(`"'\tcalc"`);
    });

    it('safely escapes internal double quotes per RFC 4180', () => {
      expect(sanitizeCsvCell('Acme "Pro" Card')).toBe('"Acme ""Pro"" Card"');
    });

    it('leaves clean alphanumeric strings untouched', () => {
      expect(sanitizeCsvCell('8T2K9M4W1X7P3N5Q')).toBe('8T2K9M4W1X7P3N5Q');
      expect(sanitizeCsvCell(42)).toBe('42');
    });
  });

  describe('A4 PDF Sheet Generation (generateQrSheetPdf)', () => {
    it('generates a valid PDF 1.4 binary stream with correct header and EOF', async () => {
      const pdfBytes = await generateQrSheetPdf(MOCK_CARDS);
      expect(pdfBytes).toBeInstanceOf(Uint8Array);
      expect(pdfBytes.length).toBeGreaterThan(500);

      const pdfText = new TextDecoder().decode(pdfBytes);
      expect(pdfText.startsWith('%PDF-1.4')).toBe(true);
      expect(pdfText.trim().endsWith('%%EOF')).toBe(true);
      expect(pdfText).toContain('/Type /Catalog');
      expect(pdfText).toContain('/Type /Pages');
      expect(pdfText).toContain('/MediaBox [0 0 595.28 841.89]'); // A4 size
    });

    it('scales page count correctly for batch sizes: 1 card (1 page), 12 cards (1 page), 13 cards (2 pages), 25 cards (3 pages)', async () => {
      const cards1 = [{ publicId: '8T2K9M4W1X7P3N5Q' }];
      const pdf1 = await generateQrSheetPdf(cards1);
      const text1 = new TextDecoder().decode(pdf1);
      expect(text1).toContain('/Count 1');

      // 12 cards -> 1 page (3x4 grid)
      const cards12 = Array.from({ length: 12 }, (_, i) => ({
        publicId: `TESTCARD${String(i).padStart(8, '0')}`,
      }));
      const pdf12 = await generateQrSheetPdf(cards12);
      const text12 = new TextDecoder().decode(pdf12);
      expect(text12).toContain('/Count 1');

      // 13 cards -> 2 pages
      const cards13 = Array.from({ length: 13 }, (_, i) => ({
        publicId: `TESTCARD${String(i).padStart(8, '0')}`,
      }));
      const pdf13 = await generateQrSheetPdf(cards13);
      const text13 = new TextDecoder().decode(pdf13);
      expect(text13).toContain('/Count 2');

      // 25 cards -> 3 pages
      const cards25 = Array.from({ length: 25 }, (_, i) => ({
        publicId: `TESTCARD${String(i).padStart(8, '0')}`,
      }));
      const pdf25 = await generateQrSheetPdf(cards25);
      const text25 = new TextDecoder().decode(pdf25);
      expect(text25).toContain('/Count 3');
    });

    it('guarantees security invariants in PDF: zero activation codes, passwords, Google URLs, or public IDs in text', async () => {
      const pdfBytes = await generateQrSheetPdf(MOCK_CARDS);
      const pdfText = new TextDecoder().decode(pdfBytes);

      // Must NOT contain activation credentials
      expect(pdfText).not.toContain('K7XM-92PR-V8Q2');
      expect(pdfText).not.toContain('B4WT-81MK-P5Q9');
      expect(pdfText.toLowerCase()).not.toContain('activation');
      expect(pdfText.toLowerCase()).not.toContain('password');

      // Must NOT print public IDs beneath or beside artwork
      expect(pdfText).not.toContain('(8T2K9M4W1X7P3N5Q) Tj');
      expect(pdfText).not.toContain('(3H5V7N2R9B4M6K8W) Tj');

      // Must NOT contain destination URLs
      expect(pdfText.toLowerCase()).not.toContain('google.com');
      expect(pdfText.toLowerCase()).not.toContain('writereview');
    });
  });

  describe('Supplier Package File Naming & Security Verification', () => {
    it('formats batch zip filename canonically', () => {
      expect(formatBatchZipFilename('Batch 2026-A')).toBe('QRoute_Batch_Batch-2026-A.zip');
      expect(formatBatchZipFilename('Pilot Retail / Downtown')).toBe(
        'QRoute_Batch_Pilot-Retail-Downtown.zip'
      );
    });

    it('formats asset identifiers with sequence numbers', () => {
      expect(formatQrAssetIdentifier(0, 10)).toBe('QR-001');
      expect(formatQrAssetIdentifier(9, 10)).toBe('QR-010');
      expect(formatQrAssetIdentifier(99, 100)).toBe('QR-100');
    });

    it('verifySupplierPackageSecurity approves valid supplier archive structure', () => {
      const allowed = [
        'SVG/QR-001.svg',
        'SVG/QR-002.svg',
        'PNG/QR-001.png',
        'PNG/QR-002.png',
        'QR-SHEET.pdf',
      ];
      const check = verifySupplierPackageSecurity(allowed);
      expect(check.isSecure).toBe(true);
      expect(check.violations).toEqual([]);
    });

    it('verifySupplierPackageSecurity rejects forbidden files and tokens', () => {
      const forbidden = ['manifest.csv', 'README.txt', 'activation_codes.txt', 'SVG/QR-001.svg'];
      const check = verifySupplierPackageSecurity(forbidden);
      expect(check.isSecure).toBe(false);
      expect(check.violations.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Full Supplier ZIP Package Generation (generateBatchZipPackage)', () => {
    it('generates valid ZIP archive containing SVG/, PNG/, and QR-SHEET.pdf only', async () => {
      const zipBytes = await generateBatchZipPackage(MOCK_CARDS, 'Test Batch');
      expect(zipBytes).toBeInstanceOf(Uint8Array);
      expect(zipBytes.length).toBeGreaterThan(1000);

      const unzipped = await JSZip.loadAsync(zipBytes);
      const files = Object.keys(unzipped.files);

      // Verify exact structure
      expect(unzipped.file('SVG/QR-001.svg')).not.toBeNull();
      expect(unzipped.file('SVG/QR-002.svg')).not.toBeNull();
      expect(unzipped.file('PNG/QR-001.png')).not.toBeNull();
      expect(unzipped.file('PNG/QR-002.png')).not.toBeNull();
      expect(unzipped.file('QR-SHEET.pdf')).not.toBeNull();

      // Ensure NO manifest.csv, README.txt, or extraneous files
      expect(unzipped.file('manifest.csv')).toBeNull();
      expect(unzipped.file('README.txt')).toBeNull();

      // Check security invariants on the generated archive
      const secCheck = verifySupplierPackageSecurity(files);
      expect(secCheck.isSecure).toBe(true);

      // Check vector SVG validity
      const svg1 = await unzipped.file('SVG/QR-001.svg')!.async('string');
      expect(svg1).toContain('<svg');
      expect(svg1).toContain('role="img"');
      // SVG must NOT render public ID text or activation codes
      expect(svg1).not.toContain('K7XM-92PR-V8Q2');
      expect(svg1).not.toContain('<text');

      // Check PNG validity (starts with PNG signature bytes 0x89 0x50 0x4E 0x47)
      const png1 = await unzipped.file('PNG/QR-001.png')!.async('uint8array');
      expect(png1[0]).toBe(0x89);
      expect(png1[1]).toBe(0x50);
      expect(png1[2]).toBe(0x4e);
      expect(png1[3]).toBe(0x47);

      // Check PDF sheet validity
      const pdf = await unzipped.file('QR-SHEET.pdf')!.async('uint8array');
      const pdfText = new TextDecoder().decode(pdf);
      expect(pdfText.startsWith('%PDF-1.4')).toBe(true);
    });

    it('works seamlessly for batch sizes: 1, 10, and larger batch sizes', async () => {
      // Size 1
      const cards1 = [{ publicId: '8T2K9M4W1X7P3N5Q' }];
      const zip1 = await generateBatchZipPackage(cards1, 'Batch-1');
      const unzipped1 = await JSZip.loadAsync(zip1);
      expect(unzipped1.file('SVG/QR-001.svg')).not.toBeNull();
      expect(unzipped1.file('PNG/QR-001.png')).not.toBeNull();
      expect(unzipped1.file('QR-SHEET.pdf')).not.toBeNull();

      // Size 10
      const cards10 = Array.from({ length: 10 }, (_, i) => ({
        publicId: `CARD${String(i).padStart(12, '0')}`,
      }));
      const zip10 = await generateBatchZipPackage(cards10, 'Batch-10');
      const unzipped10 = await JSZip.loadAsync(zip10);
      expect(unzipped10.file('SVG/QR-001.svg')).not.toBeNull();
      expect(unzipped10.file('SVG/QR-010.svg')).not.toBeNull();
      expect(unzipped10.file('PNG/QR-010.png')).not.toBeNull();
      expect(unzipped10.file('QR-SHEET.pdf')).not.toBeNull();
    });

    it('strictly excludes activation codes, passwords, destinations, and customer identity from supplier archive', async () => {
      const zipBytes = await generateBatchZipPackage(MOCK_CARDS, 'Secure Batch');
      const unzipped = await JSZip.loadAsync(zipBytes);

      for (const [filename, file] of Object.entries(unzipped.files)) {
        if (file.dir) continue;
        const text = await file.async('string');

        // Check for activation codes
        for (const card of MOCK_CARDS) {
          expect(text).not.toContain(card.activationCode);
        }

        // Check for forbidden tokens
        for (const token of FORBIDDEN_SUPPLIER_TOKENS) {
          expect(filename.toLowerCase()).not.toContain(token);
        }
      }
    });
  });

  describe('Isolated Admin-Only Key Mapping (generateAdminMappingCsv)', () => {
    it('generates internal admin-only CSV mapping with activation codes', () => {
      const csv = generateAdminMappingCsv(MOCK_CARDS, 'Batch 2026-A');
      const lines = csv.trim().split('\r\n');

      expect(lines[0]).toBe('card_index,public_id,activation_code,routing_url,batch_name');
      expect(lines.length).toBe(3);

      expect(lines[1]).toContain('1,8T2K9M4W1X7P3N5Q,K7XM-92PR-V8Q2');
      expect(lines[1]).toContain('https://go.taprevieww.workers.dev/c/8T2K9M4W1X7P3N5Q');
      expect(lines[1]).toContain('Batch 2026-A');

      expect(lines[2]).toContain('2,3H5V7N2R9B4M6K8W,B4WT-81MK-P5Q9');
    });

    it('protects against formula injection in admin mapping', () => {
      const dangerousCards: ProvisionedCard[] = [
        {
          id: '1',
          publicId: '8T2K9M4W1X7P3N5Q',
          activationCode: '=1+1',
          nfcUrl: 'https://go.taprevieww.workers.dev/c/8T2K9M4W1X7P3N5Q',
        },
      ];
      const csv = generateAdminMappingCsv(dangerousCards, '@BatchMalicious');
      expect(csv).toContain(`"'=1+1"`);
      expect(csv).toContain(`"'@BatchMalicious"`);
    });
  });
});
