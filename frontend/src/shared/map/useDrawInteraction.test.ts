import Feature from 'ol/Feature';
import OlMap from 'ol/Map';
import Circle from 'ol/geom/Circle';
import Polygon from 'ol/geom/Polygon';
import Draw, { DrawEvent } from 'ol/interaction/Draw';
import Snap from 'ol/interaction/Snap';
import VectorSource from 'ol/source/Vector';
import { fromLonLat } from 'ol/proj';
import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { CircleArea } from './geodesy';
import type { GeoJsonPolygon } from './geojson';
import { useDrawInteraction, type DrawShape } from './useDrawInteraction';

function draws(map: OlMap) {
  return map
    .getInteractions()
    .getArray()
    .filter((interaction) => interaction instanceof Draw);
}

function snaps(map: OlMap) {
  return map
    .getInteractions()
    .getArray()
    .filter((interaction) => interaction instanceof Snap);
}

function finishDrawing(map: OlMap, feature: Feature) {
  draws(map)[0].dispatchEvent(new DrawEvent('drawend', feature));
}

describe('useDrawInteraction', () => {
  it('keeps exactly one draw interaction, replacing it when the shape changes', () => {
    const map = new OlMap({});
    const { rerender } = renderHook(({ shape }) => useDrawInteraction(map, shape), {
      initialProps: { shape: 'Polygon' as DrawShape | null },
    });
    const [polygonDraw] = draws(map);
    expect(draws(map)).toHaveLength(1);

    rerender({ shape: 'Circle' });
    expect(draws(map)).toHaveLength(1);
    expect(draws(map)[0]).not.toBe(polygonDraw);

    rerender({ shape: null });
    expect(draws(map)).toHaveLength(0);
  });

  it('removes its interaction when unmounted and does nothing without a map', () => {
    const map = new OlMap({});
    const { unmount } = renderHook(() => useDrawInteraction(map, 'Polygon'));

    unmount();
    renderHook(() => useDrawInteraction(null, 'Polygon'));

    expect(draws(map)).toHaveLength(0);
  });

  it('hands over a finished polygon as closed GeoJSON in degrees', () => {
    const map = new OlMap({});
    const onPolygon = vi.fn<(polygon: GeoJsonPolygon) => void>();
    renderHook(() => useDrawInteraction(map, 'Polygon', { onPolygon }));
    const corners = [
      [-47, -22],
      [-46.99, -22],
      [-46.99, -21.99],
      [-47, -22],
    ];

    finishDrawing(map, new Feature(new Polygon([corners.map((c) => fromLonLat(c))])));

    expect(onPolygon).toHaveBeenCalledWith({ type: 'Polygon', coordinates: [corners] });
  });

  it('keeps the same interaction when only the handler changes, so a sketch survives', () => {
    const map = new OlMap({});
    const first = vi.fn<(polygon: GeoJsonPolygon) => void>();
    const latest = vi.fn<(polygon: GeoJsonPolygon) => void>();
    const { rerender } = renderHook(
      ({ onPolygon }) => useDrawInteraction(map, 'Polygon', { onPolygon }),
      { initialProps: { onPolygon: first } },
    );
    const [draw] = draws(map);

    rerender({ onPolygon: latest });
    finishDrawing(
      map,
      new Feature(
        new Polygon([
          [
            [0, 0],
            [1, 0],
            [1, 1],
            [0, 0],
          ],
        ]),
      ),
    );

    expect(draws(map)[0]).toBe(draw);
    expect(first).not.toHaveBeenCalled();
    expect(latest).toHaveBeenCalledOnce();
  });

  it('ignores shapes it has no handler for', () => {
    const map = new OlMap({});
    const onPolygon = vi.fn<(polygon: GeoJsonPolygon) => void>();
    renderHook(() => useDrawInteraction(map, 'Circle', { onPolygon }));

    finishDrawing(map, new Feature(new Circle([0, 0], 100)));

    expect(onPolygon).not.toHaveBeenCalled();
  });

  it('hands over a finished circle in degrees and metres', () => {
    const map = new OlMap({});
    const onCircle = vi.fn<(circle: CircleArea) => void>();
    renderHook(() => useDrawInteraction(map, 'Circle', { onCircle }));

    finishDrawing(map, new Feature(new Circle(fromLonLat([-47.06, -22.9]), 1000)));

    expect(onCircle).toHaveBeenCalledWith({ center: [-47.06, -22.9], radiusMeters: 920 });
  });

  it('ignores a circle without a radius, from a click without a drag', () => {
    const map = new OlMap({});
    const onCircle = vi.fn<(circle: CircleArea) => void>();
    renderHook(() => useDrawInteraction(map, 'Circle', { onCircle }));

    finishDrawing(map, new Feature(new Circle(fromLonLat([-47.06, -22.9]), 0)));

    expect(onCircle).not.toHaveBeenCalled();
  });

  it('snaps a polygon to the given features, after the drawing, but never a circle', () => {
    const map = new OlMap({});
    const snapTo = new VectorSource();
    const { rerender, unmount } = renderHook(
      ({ shape }) => useDrawInteraction(map, shape, { snapTo }),
      { initialProps: { shape: 'Polygon' as DrawShape } },
    );
    const interactions = map.getInteractions().getArray();

    expect(snaps(map)).toHaveLength(1);
    expect(interactions.indexOf(snaps(map)[0])).toBeGreaterThan(
      interactions.indexOf(draws(map)[0]),
    );

    rerender({ shape: 'Circle' });
    expect(snaps(map)).toHaveLength(0);

    rerender({ shape: 'Polygon' });
    unmount();
    expect(snaps(map)).toHaveLength(0);
  });

  it("puts a corner snapped to a neighbour's edge exactly on that edge, in degrees", () => {
    const map = new OlMap({});
    const neighbour = new Feature(
      new Polygon([
        [
          [-47.01, -22],
          [-47, -22],
          [-46.99, -22.009],
          [-47.01, -22.009],
          [-47.01, -22],
        ].map((c) => fromLonLat(c)),
      ]),
    );
    const onPolygon = vi.fn<(polygon: GeoJsonPolygon) => void>();
    renderHook(() =>
      useDrawInteraction(map, 'Polygon', {
        onPolygon,
        snapTo: new VectorSource({ features: [neighbour] }),
      }),
    );
    const [a, b] = [fromLonLat([-47, -22]), fromLonLat([-46.99, -22.009])];
    const middle = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];

    finishDrawing(
      map,
      new Feature(
        new Polygon([
          [middle, fromLonLat([-46.98, -22.004]), fromLonLat([-46.98, -22.01]), middle],
        ]),
      ),
    );

    const [corner] = onPolygon.mock.calls[0][0].coordinates[0];
    expect(corner).toEqual([-46.995, -22.0045]);
  });

  it('removes the last corner of the drawing on undo, and does nothing without one', () => {
    const removeLastPoint = vi.spyOn(Draw.prototype, 'removeLastPoint');
    const map = new OlMap({});
    const { result, rerender } = renderHook(({ shape }) => useDrawInteraction(map, shape), {
      initialProps: { shape: 'Polygon' as DrawShape | null },
    });

    result.current.undoLastPoint();
    rerender({ shape: null });
    result.current.undoLastPoint();

    expect(removeLastPoint).toHaveBeenCalledOnce();
    removeLastPoint.mockRestore();
  });
});
