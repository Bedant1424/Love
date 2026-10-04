import { describe, it, expect } from 'vitest';
import JSZip from 'jszip';
import type { ProvisionedCard } from '../../src/shared/types';
import {
  buildCardUrl,
  validateCustomDomain,
  parseCardPublicIdFromUrl,
  DEFAULT_PILOT_HOST,
} from '../../src/shared/url';
import { generateNfcPayload } from '../../src/shared/nfc';
import {
  sanitizeCsvCell,
  verifyZeroKnowledgeManifest,
  generateManifestCsv,
  generateSupplierReadme,
  generateBatchZipPackage,
  DEFAULT_SUBSTRATE,
} from '../../src/shared/fulfillment';

describe('Supplier Fulfillment & Asset Pipeline Engine', () => {
  const MOCK_CARDS: ProvisionedCard[] = [
    {
      id: 'uuid-card-1',
      publicId: '8T2K9M4W1X7P3N5Q',
      activationCode: 'K7XM-92PR-V8Q2',
      nfcUrl: `https://${DEFAULT_PILOT_HOST}/c/8T2K9M4W1X7P3N5Q`,
    },
    {
      id: 'uuid-card-2',
      publicId: '3H5V7N2R9B4M6K8W',
      activationCode: 'B4WT-81MK-P5Q9',
      nfcUrl: `https://${DEFAULT_PILOT_HOST}/c/3H5V7N2R9B4M6K8W`,
    },
  ];

  describe('Canonical URL Building & Domain Resolution (buildCardUrl)', () => {
    it('constructs pilot URL on workers.dev by default', () => {
      const url = buildCardUrl('8T2K9M4W1X7P3N5Q');
      expect(url).toBe(`https://${DEFAULT_PILOT_HOST}/c/8T2K9M4W1X7P3N5Q`);
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

    it('rejects missing custom domain in production mode', () => {
      expect(() => buildCardUrl('8T2K9M4W1X7P3N5Q', { environment: 'production' })).toThrow(
        /Custom domain is required/
      );
    });

    it('never encodes activation codes, query parameters, or secrets in card URLs', () => {
      const url = buildCardUrl('8T2K9M4W1X7P3N5Q');
      expect(url).not.toContain('?');
      expect(url).not.toContain('#');
      expect(url).not.toContain('code');
      expect(url).not.toContain('secret');
      expect(url).toBe(`https://${DEFAULT_PILOT_HOST}/c/8T2K9M4W1X7P3N5Q`);
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
      expect(validateCustomDomain('-invalid.com').isValid).toBe(false);
    });
  });

  describe('URL Identifier Parser (parseCardPublicIdFromUrl)', () => {
    it('parses public ID from full card URL', () => {
      expect(parseCardPublicIdFromUrl('https://example.com/c/8T2K9M4W1X7P3N5Q')).toBe(
        '8T2K9M4W1X7P3N5Q'
      );
      expect(
        parseCardPublicIdFromUrl('https://qroute.workers.dev/c/3H5V7N2R9B4M6K8W?ref=scan')
      ).toBe('3H5V7N2R9B4M6K8W');
    });

    it('parses public ID from path or standalone string', () => {
      expect(parseCardPublicIdFromUrl('/c/8T2K9M4W1X7P3N5Q')).toBe('8T2K9M4W1X7P3N5Q');
      expect(parseCardPublicIdFromUrl('8T2K9M4W1X7P3N5Q')).toBe('8T2K9M4W1X7P3N5Q');
    });

    it('returns null for unparseable or invalid strings', () => {
      expect(parseCardPublicIdFromUrl('')).toBeNull();
      expect(parseCardPublicIdFromUrl('https://google.com')).toBeNull();
      expect(parseCardPublicIdFromUrl('INVALID')).toBeNull();
    });
  });

  describe('NFC Payload & Hardware Specification (generateNfcPayload)', () => {
    it('generates canonical NDEF URI Type U payload metadata', () => {
      const nfc = generateNfcPayload('8T2K9M4W1X7P3N5Q');

      expect(nfc.publicId).toBe('8T2K9M4W1X7P3N5Q');
      expect(nfc.ndefRecordType).toBe('U');
      expect(nfc.ndefTnf).toBe('0x01');
      expect(nfc.ndefPrefixCode).toBe('0x04');
      expect(nfc.ndefCompressedPayload).toBe(`${DEFAULT_PILOT_HOST}/c/8T2K9M4W1X7P3N5Q`);
      expect(nfc.factoryLockDirective).toBe('PERMANENT_READ_ONLY');
    });

    it('never encodes activation codes, secrets, or sensitive parameters in NFC payload', () => {
      const nfc = generateNfcPayload('8T2K9M4W1X7P3N5Q');

      expect(nfc.ndefCompressedPayload).not.toContain('code');
      expect(nfc.ndefCompressedPayload).not.toContain('secret');
      expect(nfc.ndefCompressedPayload).not.toContain('?');
      expect(nfc.ndefCompressedPayload).toBe(`${DEFAULT_PILOT_HOST}/c/8T2K9M4W1X7P3N5Q`);
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

  describe('Zero-Knowledge Supplier Manifest (generateManifestCsv)', () => {
    it('generates compliant RFC 4180 CSV with sacred column headers', () => {
      const csv = generateManifestCsv(MOCK_CARDS);
      const lines = csv.trim().split('\r\n');

      expect(lines[0]).toBe(
        'card_index,public_id,qr_file,printed_activation_code,nfc_url,substrate'
      );
      expect(lines.length).toBe(3); // header + 2 cards

      // Card 1
      expect(lines[1]).toContain('1,8T2K9M4W1X7P3N5Q,qr/8T2K9M4W1X7P3N5Q.svg,K7XM-92PR-V8Q2');
      expect(lines[1]).toContain(DEFAULT_SUBSTRATE);

      // Card 2
      expect(lines[2]).toContain('2,3H5V7N2R9B4M6K8W,qr/3H5V7N2R9B4M6K8W.svg,B4WT-81MK-P5Q9');
    });

    it('guarantees zero-knowledge privacy: never leaks business, review, or DB tokens', () => {
      const csv = generateManifestCsv(MOCK_CARDS);
      const verification = verifyZeroKnowledgeManifest(csv);

      expect(verification.isZeroKnowledge).toBe(true);
      expect(verification.violations).toEqual([]);

      // Explicit verification
      expect(csv).not.toContain('business_name');
      expect(csv).not.toContain('google_url');
      expect(csv).not.toContain('destination_url');
      expect(csv).not.toContain('uuid-card-1');
    });

    it('supports custom substrate material', () => {
      const csv = generateManifestCsv(MOCK_CARDS, { substrate: 'Brushed Metal' });
      expect(csv).toContain('Brushed Metal');
    });

    it('verifyZeroKnowledgeManifest detects forbidden tokens if illegally injected', () => {
      const badCsv = 'card_index,public_id,business_name\n1,8T2K9M4W1X7P3N5Q,Acme Dental';
      const check = verifyZeroKnowledgeManifest(badCsv);
      expect(check.isZeroKnowledge).toBe(false);
      expect(check.violations.length).toBeGreaterThan(0);
    });
  });

  describe('Technical Supplier Specification (generateSupplierReadme)', () => {
    it('produces structured README with print dimensions and NFC specifications', () => {
      const readme = generateSupplierReadme('Batch-Alpha', 100, 'Matte PVC', 'qr.example.com');

      expect(readme).toContain('Batch: Batch-Alpha');
      expect(readme).toContain('Quantity: 100 Cards');
      expect(readme).toContain('Substrate: Matte PVC');
      expect(readme).toContain('85.60 mm x 53.98 mm'); // CR-80
      expect(readme).toContain('28.0 mm x 28.0 mm'); // QR size
      expect(readme).toContain('ISO/IEC 18004 Level H');
      expect(readme).toContain('NXP NTAG213');
      expect(readme).toContain('PERMANENT READ-ONLY LOCK');
      expect(readme).toContain('ZERO-KNOWLEDGE PRIVACY NOTICE');
    });
  });

  describe('Full Batch ZIP Package Packaging (generateBatchZipPackage)', () => {
    it('generates valid ZIP archive containing manifest, README, SVGs, and PNG previews', async () => {
      const zipBytes = await generateBatchZipPackage(MOCK_CARDS, 'Test Batch', {
        substrate: 'Matte PVC',
        includePngPreviews: true,
      });

      expect(zipBytes).toBeInstanceOf(Uint8Array);
      expect(zipBytes.length).toBeGreaterThan(1000);

      // Unpack ZIP in-memory and inspect contents
      const unzipped = await JSZip.loadAsync(zipBytes);

      // Verify root files
      expect(unzipped.file('manifest.csv')).not.toBeNull();
      expect(unzipped.file('README.txt')).not.toBeNull();

      // Read manifest from zip
      const manifestText = await unzipped.file('manifest.csv')!.async('string');
      expect(manifestText).toContain('8T2K9M4W1X7P3N5Q');
      expect(manifestText).toContain('3H5V7N2R9B4M6K8W');

      // Verify vector SVGs in /qr/ folder
      expect(unzipped.file('qr/8T2K9M4W1X7P3N5Q.svg')).not.toBeNull();
      expect(unzipped.file('qr/3H5V7N2R9B4M6K8W.svg')).not.toBeNull();

      const svgContent = await unzipped.file('qr/8T2K9M4W1X7P3N5Q.svg')!.async('string');
      expect(svgContent).toContain('<svg');
      expect(svgContent).toContain('role="img"');

      // Verify raster PNGs in /qr/ folder
      expect(unzipped.file('qr/8T2K9M4W1X7P3N5Q.png')).not.toBeNull();
      expect(unzipped.file('qr/3H5V7N2R9B4M6K8W.png')).not.toBeNull();

      const pngBytes = await unzipped.file('qr/8T2K9M4W1X7P3N5Q.png')!.async('uint8array');
      expect(pngBytes[0]).toBe(0x89);
      expect(pngBytes[1]).toBe(0x50);
    });
  });
});
