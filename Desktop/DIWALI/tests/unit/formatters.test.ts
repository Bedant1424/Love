import { describe, it, expect } from 'vitest';
import { formatPaise, parseInrToPaise } from '../../src/utils/formatters';

describe('Formatters Utility', () => {
  it('formats integer paise correctly into Indian Rupees with two decimals', () => {
    expect(formatPaise(35000)).toBe('₹350.00');
    expect(formatPaise(12000)).toBe('₹120.00');
    expect(formatPaise(6000)).toBe('₹60.00');
    expect(formatPaise(55000)).toBe('₹550.00');
    expect(formatPaise(123456)).toBe('₹1,234.56');
  });

  it('returns "Price on enquiry" for null or undefined paise', () => {
    expect(formatPaise(null)).toBe('Price on enquiry');
    expect(formatPaise(undefined as unknown as null)).toBe('Price on enquiry');
  });

  it('parses rupee strings and numbers to exact integer paise without float drift', () => {
    expect(parseInrToPaise(350)).toBe(35000);
    expect(parseInrToPaise('₹350.00')).toBe(35000);
    expect(parseInrToPaise('120.50')).toBe(12050);
    expect(parseInrToPaise('invalid')).toBe(0);
  });
});
