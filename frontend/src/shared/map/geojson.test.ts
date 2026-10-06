import type { Polygon } from 'ol/geom';
import { fromLonLat } from 'ol/proj';
import { describe, expect, it } from 'vitest';
import { toBoundingBox, toOlFeatures, type GeoJsonFeatureCollection } from './geojson';

const COLLECTION: GeoJsonFeatureCollection = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      id: 'plot-1',
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [-47, -22],
            [-46.99, -22],
            [-46.99, -21.99],
            [-47, -22],
          ],
        ],
      },
      properties: { price: 1000 },
    },
  ],
};

function extentOf(minLng: number, minLat: number, maxLng: number, maxLat: number) {
  return [...fromLonLat([minLng, minLat]), ...fromLonLat([maxLng, maxLat])];
}

describe('toOlFeatures', () => {
  it('projects the polygon to map coordinates and keeps id and properties', () => {
    const [feature] = toOlFeatures(COLLECTION);
    const ring = (feature.getGeometry() as Polygon).getCoordinates()[0];

    expect(feature.getId()).toBe('plot-1');
    expect(feature.get('price')).toBe(1000);
    expect(ring[1][0]).toBeCloseTo(fromLonLat([-46.99, -22])[0]);
    expect(ring[1][1]).toBeCloseTo(fromLonLat([-46.99, -22])[1]);
  });

  it('returns nothing for an empty collection', () => {
    expect(toOlFeatures({ type: 'FeatureCollection', features: [] })).toEqual([]);
  });
});

describe('toBoundingBox', () => {
  it('converts a map extent to degrees', () => {
    const bbox = toBoundingBox(extentOf(-47.1, -22.95, -47, -22.85));

    expect(bbox.map((v) => Number(v.toFixed(6)))).toEqual([-47.1, -22.95, -47, -22.85]);
  });

  it('clamps an extent wider than the world', () => {
    expect(toBoundingBox(extentOf(-250, -85, 250, 85))).toEqual([
      -180,
      expect.closeTo(-85, 6),
      180,
      expect.closeTo(85, 6),
    ]);
  });

  it('shifts an extent panned onto the next world copy back to the main one', () => {
    const [minLng, , maxLng] = toBoundingBox(extentOf(190, -22, 200, -21));

    expect(minLng).toBeCloseTo(-170);
    expect(maxLng).toBeCloseTo(-160);
  });
});
