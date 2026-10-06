import { describe, expect, it } from 'vitest';
import { polygonAreaSquareMeters } from './geodesy';

describe('polygonAreaSquareMeters', () => {
  it('measures on the Earth, close to the API figure', () => {
    // The API measures 1,141,000 m2 on the spheroid; the sphere reads about 0.5% more.
    const area = polygonAreaSquareMeters({
      type: 'Polygon',
      coordinates: [
        [
          [-47, -22],
          [-46.99, -22],
          [-46.99, -21.99],
          [-47, -21.99],
          [-47, -22],
        ],
      ],
    });

    expect(area).toBeGreaterThan(1_141_000);
    expect(area).toBeLessThan(1_141_000 * 1.01);
  });
});
