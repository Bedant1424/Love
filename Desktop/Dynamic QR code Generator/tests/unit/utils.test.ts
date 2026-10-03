import { describe, it, expect } from 'vitest';
import {
  createSuccessResponse,
  createErrorResponse,
  sanitizeString,
  validatePublicId,
  CROCKFORD_BASE32_REGEX,
} from '../../src/shared/utils';

describe('Shared Utilities - API Envelopes & Sanitization', () => {
  it('creates standard success response envelope', () => {
    const payload = { id: 'test_123', name: 'Sample' };
    const res = createSuccessResponse(payload);

    expect(res).toEqual({
      success: true,
      data: payload,
    });
  });

  it('creates standard error response envelope', () => {
    const res = createErrorResponse('INVALID_PARAM', 'Parameter is malformed', { field: 'id' });

    expect(res).toEqual({
      success: false,
      error: {
        code: 'INVALID_PARAM',
        message: 'Parameter is malformed',
        details: { field: 'id' },
      },
    });
  });

  it('sanitizes strings to strip HTML brackets', () => {
    expect(sanitizeString('  <script>alert(1)</script>  ')).toBe('scriptalert(1)/script');
    expect(sanitizeString('Apex Dental Studio')).toBe('Apex Dental Studio');
  });
});

describe('Shared Utilities - Public ID Validation', () => {
  it('validates canonical 10-character Crockford Base32 ID', () => {
    const res = validatePublicId('A7K92P4X8Q');
    expect(res.isValid).toBe(true);
    expect(res.normalizedId).toBe('A7K92P4X8Q');
  });

  it('normalizes lowercase inputs to uppercase', () => {
    const res = validatePublicId('a7k92p4x8q');
    expect(res.isValid).toBe(true);
    expect(res.normalizedId).toBe('A7K92P4X8Q');
  });

  it('trims leading and trailing whitespace', () => {
    const res = validatePublicId('  A7K92P4X8Q  ');
    expect(res.isValid).toBe(true);
    expect(res.normalizedId).toBe('A7K92P4X8Q');
  });

  it('validates all allowed Crockford digits and letters', () => {
    // 0123456789 (digits)
    expect(validatePublicId('0123456789').isValid).toBe(true);
    // 10 valid letters
    expect(validatePublicId('ABCDEFGHJK').isValid).toBe(true);
    expect(validatePublicId('MNPQRSTVWX').isValid).toBe(true);
  });

  it('strictly rejects ambiguous characters I, L, O, U', () => {
    expect(validatePublicId('A7K92P4X8I').isValid).toBe(false); // contains I
    expect(validatePublicId('A7K92P4X8L').isValid).toBe(false); // contains L
    expect(validatePublicId('A7K92P4X8O').isValid).toBe(false); // contains O
    expect(validatePublicId('A7K92P4X8U').isValid).toBe(false); // contains U
  });

  it('rejects IDs with incorrect lengths', () => {
    expect(validatePublicId('A7K92P4X8').isValid).toBe(false); // 9 chars
    expect(validatePublicId('A7K92P4X8Q1').isValid).toBe(false); // 11 chars
    expect(validatePublicId('').isValid).toBe(false); // 0 chars
  });

  it('rejects injection strings and malicious payloads', () => {
    expect(validatePublicId('../../etc/').isValid).toBe(false);
    expect(validatePublicId('<script>').isValid).toBe(false);
    expect(validatePublicId("' OR 1=1--").isValid).toBe(false);
    expect(validatePublicId('A7K92P4X8Q; DROP TABLE cards;').isValid).toBe(false);
  });

  it('rejects non-string values safely', () => {
    expect(validatePublicId(null).isValid).toBe(false);
    expect(validatePublicId(undefined).isValid).toBe(false);
    expect(validatePublicId(1234567890).isValid).toBe(false);
    expect(validatePublicId({}).isValid).toBe(false);
  });

  it('regex conforms to 10-char Crockford Base32 pattern', () => {
    expect(CROCKFORD_BASE32_REGEX.test('A7K92P4X8Q')).toBe(true);
    expect(CROCKFORD_BASE32_REGEX.test('INVALID_ID')).toBe(false);
  });
});
