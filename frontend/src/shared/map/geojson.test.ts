import Polygon from 'ol/geom/Polygon';
import { fromLonLat } from 'ol/proj';
import { describe, expect, it } from 'vitest';
import {
  polygonCollection,
  toBoundingBox,
  toGeoJsonPolygon,
  toOlFeatures,
  type GeoJsonFeatureCollection,
} from './geojson';

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

describe('toGeoJsonPolygon', () => {
  it('converts a drawn polygon back to degrees, rounded to 7 decimals', () => {
    const ring = [
      [-47.123456789, -22],
      [-46.99, -22],
      [-46.99, -21.99],
      [-47.123456789, -22],
    ];

    expect(toGeoJsonPolygon(new Polygon([ring.map((c) => fromLonLat(c))]))).toEqual({
      type: 'Polygon',
      coordinates: [
        [
          [-47.1234568, -22],
          [-46.99, -22],
          [-46.99, -21.99],
          [-47.1234568, -22],
        ],
      ],
    });
  });

  it('moves a polygon drawn on the next copy of the world back onto the main one', () => {
    const ring = [
      [190, -22],
      [190.01, -22],
      [190.01, -21.99],
      [190, -22],
    ];
    const drawn = new Polygon([ring.map((c) => fromLonLat(c))]);

    const [converted] = toGeoJsonPolygon(drawn).coordinates;

    expect(converted.map(([lng]) => lng)).toEqual([-170, -169.99, -169.99, -170]);
    expect(drawn.getExtent()[0]).toBeCloseTo(fromLonLat([190, -22])[0]);
  });
});

describe('polygonCollection', () => {
  it('wraps one polygon as a feature collection', () => {
    const polygon = COLLECTION.features[0].geometry;

    expect(polygonCollection('draft', polygon)).toEqual({
      type: 'FeatureCollection',
      features: [{ type: 'Feature', id: 'draft', geometry: polygon, properties: {} }],
    });
  });
});
