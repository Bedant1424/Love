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
  it('validates canonical 16-character Crockford Base32 ID', () => {
    const res = validatePublicId('X7K9Q2M4WP8VN3RZ');
    expect(res.isValid).toBe(true);
    expect(res.normalizedId).toBe('X7K9Q2M4WP8VN3RZ');
  });

  it('rejects lowercase inputs (strict canonical uppercase)', () => {
    const res = validatePublicId('x7k9q2m4wp8vn3rz');
    expect(res.isValid).toBe(false);
    expect(res.error).toMatch(/must be uppercase/);
  });

  it('rejects whitespace in inputs', () => {
    const res = validatePublicId('  X7K9Q2M4WP8VN3RZ  ');
    expect(res.isValid).toBe(false);
    expect(res.error).toMatch(/cannot contain whitespace/);
  });

  it('validates allowed Crockford alphanumeric combinations', () => {
    expect(validatePublicId('ABCDEFGHJKMNPQRS').isValid).toBe(true);
    expect(validatePublicId('TVWXYZ23456789KM').isValid).toBe(true);
  });

  it('strictly rejects ambiguous characters I, L, O, U', () => {
    expect(validatePublicId('X7K9Q2M4WP8VN3RI').isValid).toBe(false); // contains I
    expect(validatePublicId('X7K9Q2M4WP8VN3RL').isValid).toBe(false); // contains L
    expect(validatePublicId('X7K9Q2M4WP8VN3RO').isValid).toBe(false); // contains O
    expect(validatePublicId('X7K9Q2M4WP8VN3RU').isValid).toBe(false); // contains U
  });

  it('rejects sequential or predictable numeric IDs', () => {
    expect(validatePublicId('0000000000000001').isValid).toBe(false);
    expect(validatePublicId('0123456789012345').isValid).toBe(false);
    expect(validatePublicId('1111111111111111').isValid).toBe(false);
  });

  it('rejects IDs with incorrect lengths', () => {
    expect(validatePublicId('X7K9Q2M4WP8VN3R').isValid).toBe(false); // 15 chars
    expect(validatePublicId('X7K9Q2M4WP8VN3RZ1').isValid).toBe(false); // 17 chars
    expect(validatePublicId('').isValid).toBe(false); // 0 chars
  });

  it('rejects injection strings and malicious payloads', () => {
    expect(validatePublicId('../../etc/passwd').isValid).toBe(false);
    expect(validatePublicId('<script>alert()').isValid).toBe(false);
    expect(validatePublicId("' OR 1=1--123456").isValid).toBe(false);
    expect(validatePublicId('X7K9Q2;DROP TABLE').isValid).toBe(false);
  });

  it('rejects non-string values safely', () => {
    expect(validatePublicId(null).isValid).toBe(false);
    expect(validatePublicId(undefined).isValid).toBe(false);
    expect(validatePublicId(1234567890).isValid).toBe(false);
    expect(validatePublicId({}).isValid).toBe(false);
  });

  it('regex conforms to 16-char Crockford Base32 pattern', () => {
    expect(CROCKFORD_BASE32_REGEX.test('X7K9Q2M4WP8VN3RZ')).toBe(true);
    expect(CROCKFORD_BASE32_REGEX.test('INVALID_ID')).toBe(false);
  });
});
