import OlMap from 'ol/Map';
import View from 'ol/View';
import { fromLonLat } from 'ol/proj';
import { describe, expect, it } from 'vitest';
import { anchorOf, fitMapTo } from './focus';
import type { GeoJsonPolygon } from './geojson';

const SQUARE: GeoJsonPolygon = {
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
};

describe('focus', () => {
  it('points at the middle of the top edge, in map coordinates', () => {
    const [x, y] = anchorOf(SQUARE);
    const [cx] = fromLonLat([-46.995, -21.99]);
    const [, top] = fromLonLat([-47, -21.99]);

    expect(x).toBeCloseTo(cx, 3);
    expect(y).toBeCloseTo(top, 3);
  });

  it('brings the polygon into view without zooming in past street level', () => {
    const map = new OlMap({ view: new View({ center: [0, 0], zoom: 2 }) });

    fitMapTo(map, SQUARE);

    const [x] = map.getView().getCenter()!;
    const [cx] = fromLonLat([-46.995, -21.995]);
    expect(Math.abs(x - cx)).toBeLessThan(1);
    expect(map.getView().getZoom()).toBeGreaterThan(2);
    expect(map.getView().getZoom()).toBeLessThanOrEqual(16);
  });

  it('stops zooming out at the given minimum, centred on the polygon', () => {
    const map = new OlMap({ view: new View({ center: [0, 0], zoom: 2 }) });
    const huge: GeoJsonPolygon = {
      type: 'Polygon',
      coordinates: [
        [
          [-48, -23],
          [-46, -23],
          [-46, -21],
          [-48, -23],
        ],
      ],
    };

    map.setSize([800, 600]);

    fitMapTo(map, huge, 12);

    expect(map.getView().getZoom()).toBe(12);
  });
});
