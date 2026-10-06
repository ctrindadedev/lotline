import { describe, expect, it } from 'vitest';
import { formatArea, formatListedDate, formatPrice, formatPricePerSquareMeter } from './plotFormat';

describe('plot formatting', () => {
  it('formats prices in reais', () => {
    expect(formatPrice(150000)).toBe('R$150,000.00');
    expect(formatPrice(99.5)).toBe('R$99.50');
  });

  it('uses square metres for small plots and hectares from one hectare up', () => {
    expect(formatArea(8450.4)).toBe('8,450 m²');
    expect(formatArea(9999.4)).toBe('9,999 m²');
    expect(formatArea(10_000)).toBe('1.00 ha');
    expect(formatArea(1_146_442.6)).toBe('114.64 ha');
  });

  it('formats the price per square metre', () => {
    expect(formatPricePerSquareMeter(150000, 1000)).toBe('R$150.00/m²');
  });

  it('formats the listing date', () => {
    expect(formatListedDate('2026-10-06T15:00:00Z')).toBe('Oct 6, 2026');
  });
});
