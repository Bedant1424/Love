import { describe, it, expect } from 'vitest';
import type { ActivationRequest } from '../../src/shared/types';

describe('Turnstile Client Payload & Type Safety', () => {
  it('1. ActivationRequest type supports optional turnstileToken', () => {
    const payloadWithToken: ActivationRequest = {
      publicId: 'A7K92P4X8Q',
      businessName: 'Sunrise Bakery',
      reviewUrl: 'https://search.google.com/local/writereview?placeid=ChIJ123',
      activationCode: 'K7XM-92PR-V8Q2',
      turnstileToken: '0.mock-turnstile-token',
    };
    expect(payloadWithToken.turnstileToken).toBe('0.mock-turnstile-token');

    const payloadWithoutToken: ActivationRequest = {
      publicId: 'A7K92P4X8Q',
      businessName: 'Sunrise Bakery',
      reviewUrl: 'https://search.google.com/local/writereview?placeid=ChIJ123',
      activationCode: 'K7XM-92PR-V8Q2',
    };
    expect(payloadWithoutToken.turnstileToken).toBeUndefined();
  });

  it('2. ActivationRequest structures turnstileToken properly for payload transmission', () => {
    const token = '0.X.example-token';
    const request: ActivationRequest = {
      publicId: 'TURN123456',
      businessName: 'Apex Cafe',
      reviewUrl: 'https://search.google.com/local/writereview?placeid=ChIJ999',
      activationCode: 'K7XM-92PR-V8Q2',
      turnstileToken: token.trim(),
    };
    expect(request.turnstileToken).toBe(token);
    expect(request.publicId).toBe('TURN123456');
  });

  it('3. Optional turnstileToken can be conditionally omitted without syntax error', () => {
    const turnstileToken: string | null = null;
    const payload: ActivationRequest = {
      publicId: 'TURN123456',
      businessName: 'Sunrise Cafe',
      reviewUrl: 'https://search.google.com/local/writereview?placeid=ChIJ999',
      activationCode: 'K7XM-92PR-V8Q2',
      ...(turnstileToken ? { turnstileToken } : {}),
    };
    expect('turnstileToken' in payload).toBe(false);
  });
});
