import { describe, it, expect } from 'vitest';
import {
  generateCrockfordPublicId,
  parsePagination,
  CROCKFORD_BASE32_REGEX,
} from '../../src/shared/utils';
import {
  generateActivationCode,
  validateActivationCodeFormat,
} from '../../src/shared/activation-crypto';
import { isValidEmail } from '../../src/server/admin-auth';

describe('Admin Utilities & Generation Logic', () => {
  describe('generateCrockfordPublicId', () => {
    it('generates a 16-character canonical Crockford Base32 ID', () => {
      const id = generateCrockfordPublicId(16);
      expect(id).toHaveLength(16);
      expect(CROCKFORD_BASE32_REGEX.test(id)).toBe(true);
    });

    it('excludes ambiguous characters I, L, O, U', () => {
      for (let i = 0; i < 100; i++) {
        const id = generateCrockfordPublicId(16);
        expect(id).not.toMatch(/[ILOU]/i);
      }
    });

    it('generates unique IDs with no collisions in 500 samples', () => {
      const set = new Set<string>();
      for (let i = 0; i < 500; i++) {
        const id = generateCrockfordPublicId(16);
        expect(set.has(id)).toBe(false);
        set.add(id);
      }
      expect(set.size).toBe(500);
    });
  });

  describe('generateActivationCode', () => {
    it('generates code formatted as XXXX-XXXX-XXXX', () => {
      const code = generateActivationCode();
      expect(code).toMatch(/^[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{4}$/);
      const val = validateActivationCodeFormat(code);
      expect(val.isValid).toBe(true);
    });

    it('excludes ambiguous characters in all generated codes', () => {
      for (let i = 0; i < 50; i++) {
        const code = generateActivationCode();
        expect(code).not.toMatch(/[ILOU]/i);
      }
    });
  });

  describe('parsePagination', () => {
    it('uses default values when parameters are absent', () => {
      const res = parsePagination();
      expect(res.page).toBe(1);
      expect(res.limit).toBe(20);
      expect(res.offset).toBe(0);
    });

    it('correctly calculates offset for page > 1', () => {
      const res = parsePagination('3', '10');
      expect(res.page).toBe(3);
      expect(res.limit).toBe(10);
      expect(res.offset).toBe(20);
    });

    it('bounds limit to maxLimit', () => {
      const res = parsePagination('1', '500', 20, 100);
      expect(res.limit).toBe(100);
    });

    it('handles negative or invalid values safely', () => {
      const res = parsePagination('-5', 'invalid');
      expect(res.page).toBe(1);
      expect(res.limit).toBe(20);
      expect(res.offset).toBe(0);
    });
  });

  describe('isValidEmail', () => {
    it('accepts valid email addresses', () => {
      expect(isValidEmail('admin@example.com')).toBe(true);
      expect(isValidEmail('operator.one@corp.qroute.com')).toBe(true);
    });

    it('rejects invalid or malformed email strings', () => {
      expect(isValidEmail('notanemail')).toBe(false);
      expect(isValidEmail('admin@')).toBe(false);
      expect(isValidEmail('@domain.com')).toBe(false);
      expect(isValidEmail('')).toBe(false);
    });
  });
});
