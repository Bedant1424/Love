import { describe, it, expect } from 'vitest';
import type { ActivationRequest } from '../../src/shared/types';

describe('Turnstile Client Payload & Type Safety', () => {
  it('1. ActivationRequest type supports optional turnstileToken', () => {
    const payloadWithToken: ActivationRequest = {
      publicId: 'TRNS7K2M9Q4X8P6V',
      businessName: 'Sunrise Bakery',
      reviewUrl: 'https://search.google.com/local/writereview?placeid=ChIJ123',
      activationCode: 'K7XM-92PR-V8Q2',
      turnstileToken: '0.mock-turnstile-token',
    };
    expect(payloadWithToken.turnstileToken).toBe('0.mock-turnstile-token');

    const payloadWithoutToken: ActivationRequest = {
      publicId: 'TRNS7K2M9Q4X8P6V',
      businessName: 'Sunrise Bakery',
      reviewUrl: 'https://search.google.com/local/writereview?placeid=ChIJ123',
      activationCode: 'K7XM-92PR-V8Q2',
    };
    expect(payloadWithoutToken.turnstileToken).toBeUndefined();
  });

  it('2. ActivationRequest structures turnstileToken properly for payload transmission', () => {
    const token = '0.X.example-token';
    const request: ActivationRequest = {
      publicId: 'TRNS7K2M9Q4X8P6V',
      businessName: 'Apex Cafe',
      reviewUrl: 'https://search.google.com/local/writereview?placeid=ChIJ999',
      activationCode: 'K7XM-92PR-V8Q2',
      turnstileToken: token.trim(),
    };
    expect(request.turnstileToken).toBe(token);
    expect(request.publicId).toBe('TRNS7K2M9Q4X8P6V');
  });

  it('3. Optional turnstileToken can be conditionally omitted without syntax error', () => {
    const turnstileToken: string | null = null;
    const payload: ActivationRequest = {
      publicId: 'TRNS7K2M9Q4X8P6V',
      businessName: 'Sunrise Cafe',
      reviewUrl: 'https://search.google.com/local/writereview?placeid=ChIJ999',
      activationCode: 'K7XM-92PR-V8Q2',
      ...(turnstileToken ? { turnstileToken } : {}),
    };
    expect('turnstileToken' in payload).toBe(false);
  });
});
