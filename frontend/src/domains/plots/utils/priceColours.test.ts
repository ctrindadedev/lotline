import { describe, expect, it } from 'vitest';
import type { PlotFeature, PlotProperties } from '../types';
import {
  positionInRange,
  priceLook,
  pricePerSquareMeter,
  pricesOf,
  rampColour,
} from './priceColours';

const SQUARE = {
  type: 'Polygon' as const,
  coordinates: [
    [
      [-47, -22],
      [-46.99, -22],
      [-46.99, -21.99],
      [-47, -21.99],
      [-47, -22],
    ] as [number, number][],
  ],
};

const PROPERTIES: PlotProperties = {
  price: 1_000_000,
  description: 'A plot',
  createdAt: '2026-10-07T12:00:00Z',
  status: 'AVAILABLE',
  reservable: true,
  ownedByMe: false,
  reservedByMe: false,
};

function plot(id: string, price: number): PlotFeature {
  return { type: 'Feature', id, geometry: SQUARE, properties: { ...PROPERTIES, price } };
}

describe('price colours', () => {
  it('divides the price by the geodesic area', () => {
    const value = pricePerSquareMeter(plot('a', 1_000_000));

    // About 1.15 km² at this latitude.
    expect(value).toBeGreaterThan(0.85);
    expect(value).toBeLessThan(0.88);
  });

  it('finds the range of the plots in view, or none without plots', () => {
    const { byId, range } = pricesOf([plot('a', 1_000_000), plot('b', 4_000_000)]);

    expect(byId.get('b')! / byId.get('a')!).toBeCloseTo(4);
    expect(range!.max / range!.min).toBeCloseTo(4);
    expect(pricesOf([]).range).toBeNull();
  });

  it('places prices on a logarithmic scale, clamped to the range', () => {
    const range = { min: 1, max: 100 };

    expect(positionInRange(1, range)).toBe(0);
    expect(positionInRange(10, range)).toBeCloseTo(0.5);
    expect(positionInRange(100, range)).toBe(1);
    expect(positionInRange(1000, range)).toBe(1);
    expect(positionInRange(5, { min: 5, max: 5 })).toBe(0.5);
  });

  it('runs from light yellow to dark red, through the stops in between', () => {
    expect(rampColour(0)).toEqual([255, 255, 178]);
    expect(rampColour(0.5)).toEqual([253, 141, 60]);
    expect(rampColour(1)).toEqual([189, 0, 38]);
    expect(rampColour(0.125)).toEqual([255, 230, 135]);
  });

  it('colours a plot by its price, grey without one, outlined like the status looks', () => {
    const range = { min: 1, max: 100 };

    expect(priceLook(PROPERTIES, 100, range, false)).toEqual({
      stroke: 'rgb(113 0 23)',
      fill: 'rgb(189 0 38 / 70%)',
      width: 2,
      dashed: false,
    });
    expect(priceLook(PROPERTIES, undefined, range, false).fill).toBe('rgb(175 184 193 / 70%)');
    expect(priceLook({ ...PROPERTIES, ownedByMe: true }, 1, range, true)).toMatchObject({
      width: 4,
      dashed: false,
    });
    expect(priceLook({ ...PROPERTIES, ownedByMe: true }, 1, null, false).dashed).toBe(true);
  });
});
