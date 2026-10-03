import { describe, it, expect } from 'vitest';
import { createSuccessResponse, createErrorResponse, sanitizeString } from '../../src/shared/utils';

describe('Shared Utilities', () => {
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
