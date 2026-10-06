import Feature from 'ol/Feature';
import OlMap from 'ol/Map';
import Circle from 'ol/geom/Circle';
import Polygon from 'ol/geom/Polygon';
import Draw, { DrawEvent } from 'ol/interaction/Draw';
import { fromLonLat } from 'ol/proj';
import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { GeoJsonPolygon } from './geojson';
import { useDrawInteraction, type DrawShape } from './useDrawInteraction';

function draws(map: OlMap) {
  return map
    .getInteractions()
    .getArray()
    .filter((interaction) => interaction instanceof Draw);
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
});
