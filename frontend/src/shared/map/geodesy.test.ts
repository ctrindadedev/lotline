import Circle from 'ol/geom/Circle';
import { fromLonLat } from 'ol/proj';
import { getDistance } from 'ol/sphere';
import { describe, expect, it } from 'vitest';
import { formatDistance, geodesicCircle, polygonAreaSquareMeters, toCircleArea } from './geodesy';

const CAMPINAS = fromLonLat([-47.06, -22.9]);
const WORLD_WIDTH = fromLonLat([180, 0])[0] * 2;

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

describe('toCircleArea', () => {
  it('turns a radius in map units into metres on the ground', () => {
    const { center, radiusMeters } = toCircleArea(new Circle(CAMPINAS, 1000));

    expect(center).toEqual([-47.06, -22.9]);
    // Web Mercator stretches distances by 1 / cos(latitude): about 921 m at 22.9 degrees S.
    expect(Math.abs(radiusMeters - 1000 * Math.cos((22.9 * Math.PI) / 180))).toBeLessThan(2);
  });

  it('takes a circle drawn on a copy of the world back to the main one', () => {
    const onCopy = new Circle([CAMPINAS[0] + WORLD_WIDTH, CAMPINAS[1]], 1000);

    expect(toCircleArea(onCopy).center).toEqual([-47.06, -22.9]);
  });
});

describe('geodesicCircle', () => {
  it('places every point at the radius from the centre, and closes the ring', () => {
    const center: [number, number] = [-47.06, -22.9];
    const [ring] = geodesicCircle({ center, radiusMeters: 1500 }).coordinates;

    expect(ring.length).toBeGreaterThan(60);
    expect(ring[ring.length - 1]).toEqual(ring[0]);
    for (const point of ring) {
      expect(getDistance(center, point)).toBeCloseTo(1500, 0);
    }
  });
});

describe('formatDistance', () => {
  it.each([
    [0, '0 m'],
    [850.4, '850 m'],
    [999.4, '999 m'],
    [999.6, '1.0 km'],
    [1234, '1.2 km'],
    [50_000, '50.0 km'],
  ])('formats %d m as %s', (meters, label) => {
    expect(formatDistance(meters)).toBe(label);
  });
});
