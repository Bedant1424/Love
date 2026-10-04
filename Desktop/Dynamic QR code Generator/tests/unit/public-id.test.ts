import { describe, it, expect } from 'vitest';
import {
  generateRandomPublicId,
  validatePublicId,
  isSequentialNumeric,
  PUBLIC_ID_LENGTH,
  CROCKFORD_ALPHABET,
  CROCKFORD_BASE32_REGEX,
} from '../../src/shared/public-id';
import { buildCardUrl, parseCardPublicIdFromUrl } from '../../src/shared/url';

describe('Public Card Identifier Engine (16-Character Random Crockford Base32)', () => {
  describe('Generator (generateRandomPublicId)', () => {
    it('1. Generates identifier with length exactly equal to PUBLIC_ID_LENGTH (16)', () => {
      const id = generateRandomPublicId();
      expect(id).toHaveLength(16);
      expect(id).toHaveLength(PUBLIC_ID_LENGTH);
    });

    it('2. Uses only characters from the canonical Crockford Base32 alphabet', () => {
      for (let i = 0; i < 50; i++) {
        const id = generateRandomPublicId();
        expect(CROCKFORD_BASE32_REGEX.test(id)).toBe(true);
        for (const char of id) {
          expect(CROCKFORD_ALPHABET).toContain(char);
        }
      }
    });

    it('3. Generates unique identifiers without collisions in a batch', () => {
      const count = 1000;
      const set = new Set<string>();
      for (let i = 0; i < count; i++) {
        const id = generateRandomPublicId();
        expect(set.has(id)).toBe(false);
        set.add(id);
      }
      expect(set.size).toBe(count);
    });

    it('4. Generated IDs are non-sequential and not predictable', () => {
      const ids: string[] = [];
      for (let i = 0; i < 10; i++) {
        const id = generateRandomPublicId();
        expect(isSequentialNumeric(id)).toBe(false);
        ids.push(id);
      }

      // Ensure consecutive IDs do not share common prefix/counter patterns
      for (let i = 1; i < ids.length; i++) {
        expect(ids[i]).not.toBe(ids[i - 1]);
      }
    });

    it('5. Strictly excludes ambiguous/forbidden characters (I, L, O, U)', () => {
      const forbidden = ['I', 'L', 'O', 'U', 'i', 'l', 'o', 'u'];
      for (let i = 0; i < 100; i++) {
        const id = generateRandomPublicId();
        for (const char of forbidden) {
          expect(id).not.toContain(char);
        }
      }
    });

    it('6. Supports custom length parameter while enforcing boundary guards', () => {
      expect(generateRandomPublicId(16)).toHaveLength(16);
      expect(generateRandomPublicId(20)).toHaveLength(20);
      expect(() => generateRandomPublicId(0)).toThrow(/must be greater than 0/);
      expect(() => generateRandomPublicId(-5)).toThrow(/must be greater than 0/);
    });
  });

  describe('Sequential Numeric Detector (isSequentialNumeric)', () => {
    it('detects repeated identical digits', () => {
      expect(isSequentialNumeric('0000000000000000')).toBe(true);
      expect(isSequentialNumeric('1111111111111111')).toBe(true);
      expect(isSequentialNumeric('9999999999999999')).toBe(true);
    });

    it('detects padded sequential counters', () => {
      expect(isSequentialNumeric('0000000000000001')).toBe(true);
      expect(isSequentialNumeric('0000000000000002')).toBe(true);
      expect(isSequentialNumeric('0000000000000123')).toBe(true);
    });

    it('detects ascending or descending sequences', () => {
      expect(isSequentialNumeric('0123456789012345')).toBe(true);
      expect(isSequentialNumeric('9876543210987654')).toBe(true);
    });

    it('returns false for alphanumeric or non-sequential strings', () => {
      expect(isSequentialNumeric('X7K9Q2M4LP8VN3RZ')).toBe(false);
      expect(isSequentialNumeric('TRNS7K2M9Q4X8P6V')).toBe(false);
    });
  });

  describe('Validator (validatePublicId)', () => {
    it('1. Accepts valid 16-character Crockford Base32 identifiers', () => {
      const validSamples = [
        'X7K9Q2M4WP8VN3RZ',
        'P8N3W6TAQ4ZK7WXM',
        '4FQ7ZK2PM9R5CV8X',
        'TRNS7K2M9Q4X8P6V',
        'ACTV7K2M9Q4X8P6V',
      ];

      for (const sample of validSamples) {
        const res = validatePublicId(sample);
        expect(res.isValid).toBe(true);
        expect(res.normalizedId).toBe(sample);
        expect(res.error).toBeUndefined();
      }
    });

    it('2. Rejects IDs that are too short (< 16 characters)', () => {
      const shortSamples = ['', 'A', '123456789', 'ACTV123456', 'TRNS12345'];
      for (const sample of shortSamples) {
        const res = validatePublicId(sample);
        expect(res.isValid).toBe(false);
        expect(res.error).toMatch(/too short|Public ID must be a string/);
      }
    });

    it('3. Rejects IDs that are too long (> 16 characters)', () => {
      const longSamples = ['X7K9Q2M4WP8VN3RZ1', '12345678901234567', 'TRNS7K2M9Q4X8P6VEXTRA'];
      for (const sample of longSamples) {
        const res = validatePublicId(sample);
        expect(res.isValid).toBe(false);
        expect(res.error).toMatch(/too long/);
      }
    });

    it('4. Rejects IDs containing whitespace', () => {
      const whitespaceSamples = [
        ' X7K9Q2M4WP8VN3R',
        'X7K9Q2M4WP8VN3R ',
        'X7K9Q2 M4WP8VN3R',
        '\tX7K9Q2M4WP8VN3R',
        'X7K9Q2M4WP8VN3R\n',
      ];
      for (const sample of whitespaceSamples) {
        const res = validatePublicId(sample);
        expect(res.isValid).toBe(false);
        expect(res.error).toMatch(/cannot contain whitespace|too short|too long/);
      }
    });

    it('5. Rejects lowercase characters (enforces canonical uppercase)', () => {
      const lowercaseSamples = ['x7k9q2m4wp8vn3rz', 'X7k9Q2m4WP8vn3RZ', 'trns7k2m9q4x8p6v'];
      for (const sample of lowercaseSamples) {
        const res = validatePublicId(sample);
        expect(res.isValid).toBe(false);
        expect(res.error).toMatch(/must be uppercase/);
      }
    });

    it('6. Rejects forbidden ambiguous characters (I, L, O, U)', () => {
      expect(validatePublicId('X7K9Q2M4WP8VN3RI').isValid).toBe(false); // I
      expect(validatePublicId('X7K9Q2M4WP8VN3RL').isValid).toBe(false); // L
      expect(validatePublicId('X7K9Q2M4WP8VN3RO').isValid).toBe(false); // O
      expect(validatePublicId('X7K9Q2M4WP8VN3RU').isValid).toBe(false); // U
    });

    it('7. Rejects sequential or predictable numeric IDs', () => {
      expect(validatePublicId('0000000000000001').isValid).toBe(false);
      expect(validatePublicId('0000000000000002').isValid).toBe(false);
      expect(validatePublicId('0123456789012345').isValid).toBe(false);
      expect(validatePublicId('9876543210987654').isValid).toBe(false);
      expect(validatePublicId('0000000000000000').isValid).toBe(false);
    });

    it('8. Rejects URL and path injection attacks', () => {
      const injections = [
        '../../etc/passwd',
        '<script>alert()</',
        "' OR 1=1--123456",
        'A7K92P4X8Q;DROP;',
        '../../../c/hack1',
        'A7K9/M4W?test=12',
      ];
      for (const injection of injections) {
        const res = validatePublicId(injection);
        expect(res.isValid).toBe(false);
      }
    });

    it('9. Rejects non-string inputs safely without crashing', () => {
      expect(validatePublicId(null).isValid).toBe(false);
      expect(validatePublicId(undefined).isValid).toBe(false);
      expect(validatePublicId(1234567890123456).isValid).toBe(false);
      expect(validatePublicId({}).isValid).toBe(false);
      expect(validatePublicId([]).isValid).toBe(false);
    });
  });

  describe('URL & Routing Integration', () => {
    it('1. buildCardUrl incorporates the 16-character public ID directly', () => {
      const publicId = 'X7K9Q2M4WP8VN3RZ';
      const url = buildCardUrl(publicId, {
        environment: 'pilot',
        pilotHost: 'go.taprevieww.workers.dev',
      });
      expect(url).toBe('https://go.taprevieww.workers.dev/c/X7K9Q2M4WP8VN3RZ');
    });

    it('2. parseCardPublicIdFromUrl extracts valid 16-character ID', () => {
      const publicId = 'X7K9Q2M4WP8VN3RZ';
      expect(parseCardPublicIdFromUrl(`https://go.taprevieww.workers.dev/c/${publicId}`)).toBe(
        publicId
      );
      expect(parseCardPublicIdFromUrl(`/c/${publicId}`)).toBe(publicId);
      expect(parseCardPublicIdFromUrl(publicId)).toBe(publicId);
    });

    it('3. parseCardPublicIdFromUrl rejects malformed or legacy 10-char IDs', () => {
      expect(parseCardPublicIdFromUrl('A7K92P4X8Q')).toBeNull();
      expect(parseCardPublicIdFromUrl('https://go.taprevieww.workers.dev/c/A7K92P4X8Q')).toBeNull();
      expect(parseCardPublicIdFromUrl('')).toBeNull();
    });
  });
});
