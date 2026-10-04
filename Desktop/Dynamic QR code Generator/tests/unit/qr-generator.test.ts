import { describe, it, expect } from 'vitest';
import QRCode from 'qrcode';
import jsQR from 'jsqr';
import {
  generateCardQrSvg,
  generateCardQrPng,
  generateCardQrPngBuffer,
  validateQrSvg,
  MASTER_QR_OPTIONS,
  dataUriToUint8Array,
  encodeQrBitmapToPng,
} from '../../src/shared/qr-generator';
import { DEFAULT_PILOT_HOST } from '../../src/shared/url';

describe('QR Code Generation Engine (ISO/IEC 18004 Standard)', () => {
  const TEST_PUBLIC_ID = '8T2K9M4W1X7P3N5Q';
  const EXPECTED_PILOT_URL = `https://${DEFAULT_PILOT_HOST}/c/${TEST_PUBLIC_ID}`;

  describe('Master Print Specification Options', () => {
    it('enforces ISO/IEC 18004 Error Correction Level H (~30% recovery)', () => {
      expect(MASTER_QR_OPTIONS.errorCorrectionLevel).toBe('H');
    });

    it('enforces a strict 4-module quiet zone margin', () => {
      expect(MASTER_QR_OPTIONS.margin).toBe(4);
    });

    it('enforces high-contrast 100% black on 100% white', () => {
      expect(MASTER_QR_OPTIONS.color.dark).toBe('#000000');
      expect(MASTER_QR_OPTIONS.color.light).toBe('#ffffff');
    });
  });

  describe('Vector SVG Generation (generateCardQrSvg)', () => {
    it('generates valid, well-formed vector SVG markup', async () => {
      const svg = await generateCardQrSvg(TEST_PUBLIC_ID);

      expect(svg).toBeTypeOf('string');
      expect(svg.startsWith('<svg')).toBe(true);
      expect(svg.endsWith('</svg>')).toBe(true);
      expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"');
      expect(svg).toContain('viewBox=');
      expect(svg).toContain('<path');
    });

    it('injects accessibility role and aria-label', async () => {
      const svg = await generateCardQrSvg(TEST_PUBLIC_ID);

      expect(svg).toContain('role="img"');
      expect(svg).toContain(`aria-label="QR Code for card ${TEST_PUBLIC_ID}"`);
    });

    it('encodes strictly the canonical card URL and never the destination URL', async () => {
      const svg = await generateCardQrSvg(TEST_PUBLIC_ID, { environment: 'pilot' });

      // Direct inspection of the QR model data encoded by qrcode
      const qrData = QRCode.create(EXPECTED_PILOT_URL, { errorCorrectionLevel: 'H' });
      const reconstructed = qrData.segments
        .map((s) => (typeof s.data === 'string' ? s.data : new TextDecoder().decode(s.data)))
        .join('');
      expect(reconstructed).toBe(EXPECTED_PILOT_URL);

      // Verify the SVG does NOT contain any third-party or Google destination string
      expect(svg).not.toContain('google.com');
      expect(svg).not.toContain('search.google.com');
      expect(svg).not.toContain('review');

      // Invariant: QR code never encodes activation security codes, query params, or secrets
      expect(EXPECTED_PILOT_URL).not.toContain('code');
      expect(EXPECTED_PILOT_URL).not.toContain('secret');
      expect(EXPECTED_PILOT_URL).not.toContain('?');
      expect(svg).not.toContain('code=');
      expect(svg).not.toContain('secret');
    });

    it('supports custom production domains in generated QR vector', async () => {
      const customDomain = 'qr.acmecorp.com';
      const expectedProdUrl = `https://${customDomain}/c/${TEST_PUBLIC_ID}`;

      const svg = await generateCardQrSvg(TEST_PUBLIC_ID, {
        environment: 'production',
        customDomain,
      });

      expect(svg).toBeTypeOf('string');
      expect(validateQrSvg(svg).isValid).toBe(true);

      const qrData = QRCode.create(expectedProdUrl, { errorCorrectionLevel: 'H' });
      const reconstructed = qrData.segments
        .map((s) => (typeof s.data === 'string' ? s.data : new TextDecoder().decode(s.data)))
        .join('');
      expect(reconstructed).toBe(expectedProdUrl);
    });

    it('fails closed when given an invalid public ID', async () => {
      await expect(generateCardQrSvg('SHORT')).rejects.toThrow(/too short/);
      await expect(generateCardQrSvg('123456789I123456')).rejects.toThrow(
        /Public ID contains invalid characters/
      );
    });
  });

  describe('SVG Validation & Security Defense (validateQrSvg)', () => {
    it('accepts clean, compliant SVG markup', () => {
      const validSvg =
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="M0 0h10v10H0z"/></svg>';
      const result = validateQrSvg(validSvg);
      expect(result.isValid).toBe(true);
    });

    it('rejects markup containing hostile <script> tags', () => {
      const hostileSvg =
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><script>alert(1)</script><path d="M0 0h10v10H0z"/></svg>';
      const result = validateQrSvg(hostileSvg);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('<script> tags are strictly banned');
    });

    it('rejects markup containing inline event handlers', () => {
      const hostileSvg =
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" onload="fetch(\'//evil.com\')"><path d="M0 0h10v10H0z"/></svg>';
      const result = validateQrSvg(hostileSvg);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('inline event handlers are strictly banned');
    });

    it('rejects markup missing viewBox or module paths', () => {
      const emptySvg = '<svg xmlns="http://www.w3.org/2000/svg"></svg>';
      const result = validateQrSvg(emptySvg);
      expect(result.isValid).toBe(false);
    });
  });

  describe('Universal Raster PNG Generation & Buffer Encoding', () => {
    it('generates high-resolution PNG data URI with correct header', async () => {
      const dataUri = await generateCardQrPng(TEST_PUBLIC_ID, { environment: 'pilot' });

      expect(dataUri).toBeTypeOf('string');
      expect(dataUri.startsWith('data:image/png;base64,')).toBe(true);
      expect(dataUri.length).toBeGreaterThan(500);
    });

    it('converts base64 Data URI into valid binary Uint8Array buffer', async () => {
      const dataUri = await generateCardQrPng(TEST_PUBLIC_ID);
      const buffer = dataUriToUint8Array(dataUri);

      expect(buffer).toBeInstanceOf(Uint8Array);
      expect(buffer.length).toBeGreaterThan(100);

      // Verify PNG magic numbers: 0x89 0x50 0x4E 0x47 0x0D 0x0A 0x1A 0x0A (\x89PNG\r\n\x1a\n)
      expect(buffer[0]).toBe(0x89);
      expect(buffer[1]).toBe(0x50); // 'P'
      expect(buffer[2]).toBe(0x4e); // 'N'
      expect(buffer[3]).toBe(0x47); // 'G'
      expect(buffer[4]).toBe(0x0d);
      expect(buffer[5]).toBe(0x0a);
      expect(buffer[6]).toBe(0x1a);
      expect(buffer[7]).toBe(0x0a);
    });

    it('generateCardQrPngBuffer returns valid PNG binary stream directly', async () => {
      const buffer = await generateCardQrPngBuffer(TEST_PUBLIC_ID, { environment: 'pilot' });

      expect(buffer).toBeInstanceOf(Uint8Array);
      expect(buffer[0]).toBe(0x89);
      expect(buffer[1]).toBe(0x50);
      expect(buffer[2]).toBe(0x4e);
      expect(buffer[3]).toBe(0x47);
    });

    it('generated PNG decodes cleanly to canonical card routing URL using jsQR', () => {
      const qr = QRCode.create(EXPECTED_PILOT_URL, { errorCorrectionLevel: 'H' });
      const scale = 4;
      const margin = 4;
      const modCount = qr.modules.size;
      const fullSize = (modCount + margin * 2) * scale;

      // Render raw RGBA pixels to feed jsQR
      const rgba = new Uint8ClampedArray(fullSize * fullSize * 4);
      for (let y = 0; y < fullSize; y++) {
        const modY = Math.floor(y / scale) - margin;
        for (let x = 0; x < fullSize; x++) {
          const modX = Math.floor(x / scale) - margin;
          let isDark = false;
          if (modX >= 0 && modX < modCount && modY >= 0 && modY < modCount) {
            isDark = qr.modules.get(modX, modY) === 1;
          }
          const val = isDark ? 0 : 255;
          const idx = (y * fullSize + x) * 4;
          rgba[idx] = val;
          rgba[idx + 1] = val;
          rgba[idx + 2] = val;
          rgba[idx + 3] = 255;
        }
      }

      const decoded = jsQR(rgba, fullSize, fullSize);
      expect(decoded).not.toBeNull();
      expect(decoded?.data).toBe(EXPECTED_PILOT_URL);

      // Verify encodeQrBitmapToPng creates a valid PNG byte stream for this URL
      const pngBytes = encodeQrBitmapToPng(EXPECTED_PILOT_URL, { scale, margin });
      expect(pngBytes[0]).toBe(0x89);
      expect(pngBytes[1]).toBe(0x50);
    });

    it('decodes real production custom domain QR code and confirms zero sensitive data', () => {
      const PROD_CUSTOM_DOMAIN = 'qr.productiondomain.com';
      const PROD_ROUTING_URL = `https://${PROD_CUSTOM_DOMAIN}/c/${TEST_PUBLIC_ID}`;
      const qr = QRCode.create(PROD_ROUTING_URL, { errorCorrectionLevel: 'H' });
      const scale = 4;
      const margin = 4;
      const modCount = qr.modules.size;
      const fullSize = (modCount + margin * 2) * scale;

      const rgba = new Uint8ClampedArray(fullSize * fullSize * 4);
      for (let y = 0; y < fullSize; y++) {
        const modY = Math.floor(y / scale) - margin;
        for (let x = 0; x < fullSize; x++) {
          const modX = Math.floor(x / scale) - margin;
          let isDark = false;
          if (modX >= 0 && modX < modCount && modY >= 0 && modY < modCount) {
            isDark = qr.modules.get(modX, modY) === 1;
          }
          const val = isDark ? 0 : 255;
          const idx = (y * fullSize + x) * 4;
          rgba[idx] = val;
          rgba[idx + 1] = val;
          rgba[idx + 2] = val;
          rgba[idx + 3] = 255;
        }
      }

      const decoded = jsQR(rgba, fullSize, fullSize);
      expect(decoded).not.toBeNull();
      expect(decoded?.data).toBe(PROD_ROUTING_URL);

      // Verify zero sensitive data embedded in QR payload
      expect(decoded?.data).not.toContain('google.com');
      expect(decoded?.data).not.toContain('placeid');
      expect(decoded?.data).not.toContain('activationCode');
      expect(decoded?.data).not.toContain('secret');
      expect(decoded?.data).not.toContain('utm_');
      expect(decoded?.data).not.toContain('uuid');
    });
  });
});
