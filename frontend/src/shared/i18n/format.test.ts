import { describe, expect, it } from 'vitest';
import {
  formatArea,
  formatDate,
  formatDistance,
  formatPrice,
  formatPricePerSquareMeter,
} from './format';

// Intl puts a no-break space between the currency symbol and the amount.
const NBSP = ' ';

describe('Brazilian formatting', () => {
  it('formats prices in reais', () => {
    expect(formatPrice(150000)).toBe(`R$${NBSP}150.000,00`);
    expect(formatPrice(99.5)).toBe(`R$${NBSP}99,50`);
  });

  it('uses square metres for small plots and hectares from one hectare up', () => {
    expect(formatArea(8450.4)).toBe('8.450 m²');
    expect(formatArea(9999.4)).toBe('9.999 m²');
    expect(formatArea(10_000)).toBe('1,00 ha');
    expect(formatArea(1_146_442.6)).toBe('114,64 ha');
  });

  it('formats the price per square metre', () => {
    expect(formatPricePerSquareMeter(150000, 1000)).toBe(`R$${NBSP}150,00/m²`);
  });

  it.each([
    [0, '0 m'],
    [850.4, '850 m'],
    [999.4, '999 m'],
    [999.6, '1,0 km'],
    [1234, '1,2 km'],
    [50_000, '50,0 km'],
  ])('formats a distance of %d m as %s', (meters, label) => {
    expect(formatDistance(meters)).toBe(label);
  });

  it('formats dates', () => {
    expect(formatDate('2026-10-06T15:00:00Z')).toBe('6 de out. de 2026');
  });
});
