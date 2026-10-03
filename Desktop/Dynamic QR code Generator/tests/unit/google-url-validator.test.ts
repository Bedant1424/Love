import { describe, it, expect } from 'vitest';
import { validateGoogleReviewUrl } from '../../src/shared/google-url-validator';

describe('Centralized Google Review URL Validator', () => {
  describe('Positive Valid Scenarios', () => {
    it('accepts canonical search.google.com writereview URL with placeid', () => {
      const url = 'https://search.google.com/local/writereview?placeid=ChIJN1t_tDeuEmsRUsoyG83frY4';
      const res = validateGoogleReviewUrl(url);
      expect(res.isValid).toBe(true);
      expect(res.normalizedUrl).toBe(url);
    });

    it('accepts search.google.com writereview URL with additional query params', () => {
      const url =
        'https://search.google.com/local/writereview?placeid=ChIJN1t_tDeuEmsRUsoyG83frY4&hl=en';
      const res = validateGoogleReviewUrl(url);
      expect(res.isValid).toBe(true);
      expect(res.normalizedUrl).toContain('placeid=ChIJN1t_tDeuEmsRUsoyG83frY4');
    });

    it('accepts g.page business short link ending with /review', () => {
      const url = 'https://g.page/r/Cb7_EXAMPLE_REVIEW/review';
      const res = validateGoogleReviewUrl(url);
      expect(res.isValid).toBe(true);
      expect(res.normalizedUrl).toBe(url);
    });

    it('accepts g.page custom slug link ending with /review', () => {
      const url = 'https://g.page/sunrisebakery/review';
      const res = validateGoogleReviewUrl(url);
      expect(res.isValid).toBe(true);
      expect(res.normalizedUrl).toBe(url);
    });

    it('accepts maps.app.goo.gl mobile share link', () => {
      const url = 'https://maps.app.goo.gl/wJk8z9L7pQ2';
      const res = validateGoogleReviewUrl(url);
      expect(res.isValid).toBe(true);
      expect(res.normalizedUrl).toBe(url);
    });

    it('accepts maps.google.com CID and place links', () => {
      const url = 'https://maps.google.com/maps?cid=1029384756102938475';
      const res = validateGoogleReviewUrl(url);
      expect(res.isValid).toBe(true);
      expect(res.normalizedUrl).toBe(url);
    });

    it('accepts www.google.com maps links', () => {
      const url = 'https://www.google.com/maps/place/Empire+State+Building';
      const res = validateGoogleReviewUrl(url);
      expect(res.isValid).toBe(true);
      expect(res.normalizedUrl).toBe(url);
    });

    it('handles uppercase hostnames gracefully via normalization', () => {
      const url = 'HTTPS://SEARCH.GOOGLE.COM/local/writereview?placeid=ChIJN1t_tDeuEmsRUsoyG83frY4';
      const res = validateGoogleReviewUrl(url);
      expect(res.isValid).toBe(true);
    });
  });

  describe('Negative & Adversarial Security Scenarios', () => {
    it('rejects HTTP protocol (non-HTTPS)', () => {
      const res = validateGoogleReviewUrl('http://search.google.com/local/writereview?placeid=123');
      expect(res.isValid).toBe(false);
      expect(res.error).toMatch(/HTTPS protocol is strictly required/);
    });

    it('rejects credentials in URL (userinfo spoofing)', () => {
      const res = validateGoogleReviewUrl(
        'https://attacker:secret@search.google.com/local/writereview?placeid=123'
      );
      expect(res.isValid).toBe(false);
      expect(res.error).toMatch(/credentials/i);
    });

    it('rejects subdomain spoofing attack (google.com.evil.com)', () => {
      const res = validateGoogleReviewUrl(
        'https://search.google.com.evil.com/local/writereview?placeid=123'
      );
      expect(res.isValid).toBe(false);
      expect(res.error).toMatch(/approved Google Review domain/i);
    });

    it('rejects path spoofing attack (evil.com/google.com)', () => {
      const res = validateGoogleReviewUrl(
        'https://evil.com/search.google.com/local/writereview?placeid=123'
      );
      expect(res.isValid).toBe(false);
      expect(res.error).toMatch(/approved Google Review domain/i);
    });

    it('rejects CRLF header injection payload', () => {
      const res = validateGoogleReviewUrl(
        'https://search.google.com/local/writereview?placeid=123\r\nInjected-Header: malicious'
      );
      expect(res.isValid).toBe(false);
      expect(res.error).toMatch(/newline/i);
    });

    it('rejects javascript: pseudo-protocol', () => {
      const res = validateGoogleReviewUrl('javascript:alert(document.cookie)');
      expect(res.isValid).toBe(false);
    });

    it('rejects data: URI payload', () => {
      const res = validateGoogleReviewUrl('data:text/html,<script>alert(1)</script>');
      expect(res.isValid).toBe(false);
    });

    it('rejects unapproved Google service domains (e.g. mail, drive, docs)', () => {
      expect(validateGoogleReviewUrl('https://mail.google.com/mail').isValid).toBe(false);
      expect(validateGoogleReviewUrl('https://drive.google.com/drive').isValid).toBe(false);
      expect(validateGoogleReviewUrl('https://docs.google.com/document').isValid).toBe(false);
    });

    it('rejects arbitrary Google redirector URLs (e.g. www.google.com/url)', () => {
      const res = validateGoogleReviewUrl(
        'https://www.google.com/url?q=https://phishing.site&sa=D'
      );
      expect(res.isValid).toBe(false);
      expect(res.error).toMatch(/only permitted for Google Maps paths/i);
    });

    it('rejects search.google.com missing placeid parameter', () => {
      const res = validateGoogleReviewUrl('https://search.google.com/local/writereview');
      expect(res.isValid).toBe(false);
      expect(res.error).toMatch(/placeid/i);
    });

    it('rejects g.page not ending with /review', () => {
      const res = validateGoogleReviewUrl('https://g.page/r/Cb7_EXAMPLE_REVIEW');
      expect(res.isValid).toBe(false);
      expect(res.error).toMatch(/\/review/i);
    });

    it('rejects malformed or empty inputs safely', () => {
      // @ts-expect-error test non-string input
      expect(validateGoogleReviewUrl(null).isValid).toBe(false);
      // @ts-expect-error test non-string input
      expect(validateGoogleReviewUrl(undefined).isValid).toBe(false);
      expect(validateGoogleReviewUrl('').isValid).toBe(false);
      expect(validateGoogleReviewUrl('not-a-url').isValid).toBe(false);
    });
  });
});
