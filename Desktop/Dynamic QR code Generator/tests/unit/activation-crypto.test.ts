import { describe, it, expect } from 'vitest';
import {
  normalizeActivationCode,
  formatActivationCode,
  validateActivationCodeFormat,
  timingSafeEqualHex,
  hashActivationCode,
  verifyActivationCode,
} from '../../src/shared/activation-crypto';

describe('Activation Cryptography & Code Validation', () => {
  const TEST_SECRET = 'test_activation_secret_for_unit_tests_32chars!';

  describe('normalizeActivationCode', () => {
    it('strips hyphens and whitespace and converts to uppercase', () => {
      expect(normalizeActivationCode(' k7xm - 92pr - l8q2 ')).toBe('K7XM92PRL8Q2');
    });

    it('handles non-string values safely', () => {
      // @ts-expect-error test non-string input
      expect(normalizeActivationCode(null)).toBe('');
      // @ts-expect-error test non-string input
      expect(normalizeActivationCode(undefined)).toBe('');
    });
  });

  describe('formatActivationCode', () => {
    it('formats a 12-character normalized string into XXXX-XXXX-XXXX', () => {
      expect(formatActivationCode('K7XM92PRL8Q2')).toBe('K7XM-92PR-L8Q2');
    });

    it('returns raw clean string if length is not 12', () => {
      expect(formatActivationCode('ABC')).toBe('ABC');
    });
  });

  describe('validateActivationCodeFormat', () => {
    it('accepts valid Crockford Base32 12-character code with hyphens', () => {
      const res = validateActivationCodeFormat('K7XM-92PR-V8Q2');
      expect(res.isValid).toBe(true);
      expect(res.normalizedCode).toBe('K7XM92PRV8Q2');
    });

    it('accepts valid Crockford Base32 12-character code without hyphens', () => {
      const res = validateActivationCodeFormat('K7XM92PRV8Q2');
      expect(res.isValid).toBe(true);
      expect(res.normalizedCode).toBe('K7XM92PRV8Q2');
    });

    it('rejects ambiguous character I', () => {
      const res = validateActivationCodeFormat('K7XI-92PR-V8Q2');
      expect(res.isValid).toBe(false);
      expect(res.error).toMatch(/ambiguous/i);
    });

    it('rejects ambiguous character L', () => {
      const res = validateActivationCodeFormat('K7XL-92PR-V8Q2');
      expect(res.isValid).toBe(false);
      expect(res.error).toMatch(/ambiguous/i);
    });

    it('rejects ambiguous character O', () => {
      const res = validateActivationCodeFormat('K7XO-92PR-V8Q2');
      expect(res.isValid).toBe(false);
      expect(res.error).toMatch(/ambiguous/i);
    });

    it('rejects ambiguous character U', () => {
      const res = validateActivationCodeFormat('K7XU-92PR-V8Q2');
      expect(res.isValid).toBe(false);
      expect(res.error).toMatch(/ambiguous/i);
    });

    it('rejects code shorter than 12 characters', () => {
      const res = validateActivationCodeFormat('K7XM-92PR');
      expect(res.isValid).toBe(false);
      expect(res.error).toMatch(/12 characters/i);
    });

    it('rejects code longer than 12 characters', () => {
      const res = validateActivationCodeFormat('K7XM-92PR-V8Q2-EXTRA');
      expect(res.isValid).toBe(false);
      expect(res.error).toMatch(/12 characters/i);
    });

    it('rejects empty or whitespace code', () => {
      const res = validateActivationCodeFormat('   ');
      expect(res.isValid).toBe(false);
      expect(res.error).toMatch(/empty/i);
    });
  });

  describe('timingSafeEqualHex', () => {
    const HASH_A = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
    const HASH_B = 'a3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';

    it('returns true for identical hashes', () => {
      expect(timingSafeEqualHex(HASH_A, HASH_A)).toBe(true);
    });

    it('returns true for case-differing identical hashes', () => {
      expect(timingSafeEqualHex(HASH_A, HASH_A.toUpperCase())).toBe(true);
    });

    it('returns false for different hashes', () => {
      expect(timingSafeEqualHex(HASH_A, HASH_B)).toBe(false);
    });

    it('returns false for hashes of differing lengths without throwing', () => {
      expect(timingSafeEqualHex(HASH_A, HASH_A.slice(0, 32))).toBe(false);
    });

    it('returns false for non-string values safely', () => {
      // @ts-expect-error non-string input
      expect(timingSafeEqualHex(null, HASH_A)).toBe(false);
      // @ts-expect-error non-string input
      expect(timingSafeEqualHex(HASH_A, undefined)).toBe(false);
    });
  });

  describe('hashActivationCode', () => {
    it('generates a 64-character lowercase hex digest with Web Crypto HMAC-SHA256', async () => {
      const hash = await hashActivationCode('K7XM-92PR-V8Q2', TEST_SECRET);
      expect(hash).toMatch(/^[0-9a-f]{64}$/);
    });

    it('produces identical hashes regardless of hyphens, casing, or whitespace', async () => {
      const hash1 = await hashActivationCode('k7xm-92pr-v8q2', TEST_SECRET);
      const hash2 = await hashActivationCode('K7XM92PRV8Q2', TEST_SECRET);
      const hash3 = await hashActivationCode('  K7XM - 92PR - V8Q2  ', TEST_SECRET);

      expect(hash1).toBe(hash2);
      expect(hash2).toBe(hash3);
    });

    it('produces different hashes for different secrets', async () => {
      const hash1 = await hashActivationCode('K7XM-92PR-V8Q2', TEST_SECRET);
      const hash2 = await hashActivationCode('K7XM-92PR-V8Q2', 'different_secret_key_9999999999');

      expect(hash1).not.toBe(hash2);
    });

    it('fails closed when secret is missing or empty', async () => {
      await expect(hashActivationCode('K7XM-92PR-V8Q2', '')).rejects.toThrow(
        /ACTIVATION_SECRET is not configured/
      );
      // @ts-expect-error undefined secret
      await expect(hashActivationCode('K7XM-92PR-V8Q2', undefined)).rejects.toThrow(
        /ACTIVATION_SECRET is not configured/
      );
    });

    it('fails closed when activation code format is invalid', async () => {
      await expect(hashActivationCode('INVALID-CODE-WITH-I', TEST_SECRET)).rejects.toThrow(
        /ambiguous/
      );
    });
  });

  describe('verifyActivationCode', () => {
    it('returns true when submitted code matches stored hash', async () => {
      const code = 'K7XM-92PR-V8Q2';
      const storedHash = await hashActivationCode(code, TEST_SECRET);

      const isMatch = await verifyActivationCode('k7xm-92pr-v8q2', storedHash, TEST_SECRET);
      expect(isMatch).toBe(true);
    });

    it('returns false when code does not match', async () => {
      const storedHash = await hashActivationCode('K7XM-92PR-V8Q2', TEST_SECRET);

      const isMatch = await verifyActivationCode('ABCD-EFGH-JKMN', storedHash, TEST_SECRET);
      expect(isMatch).toBe(false);
    });

    it('returns false when secret is incorrect', async () => {
      const storedHash = await hashActivationCode('K7XM-92PR-V8Q2', TEST_SECRET);

      const isMatch = await verifyActivationCode(
        'K7XM-92PR-V8Q2',
        storedHash,
        'wrong_secret_1234567890'
      );
      expect(isMatch).toBe(false);
    });

    it('fails closed (returns false) if secret is missing', async () => {
      const storedHash = await hashActivationCode('K7XM-92PR-V8Q2', TEST_SECRET);

      const isMatch = await verifyActivationCode('K7XM-92PR-V8Q2', storedHash, '');
      expect(isMatch).toBe(false);
    });
  });
});
