import OlMap from 'ol/Map';
import View from 'ol/View';
import { fromLonLat } from 'ol/proj';
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useMapViewport } from './useMapViewport';

function createMap(size?: [number, number]) {
  const map = new OlMap({ view: new View({ center: fromLonLat([-47, -22]), zoom: 13 }) });
  if (size) {
    map.setSize(size);
  }
  return map;
}

describe('useMapViewport', () => {
  it('reads the current viewport as soon as the map is there', () => {
    const map = createMap([800, 600]);
    const { result } = renderHook(() => useMapViewport(map));

    const [minLng, minLat, maxLng, maxLat] = result.current!.bbox;
    expect(result.current!.zoom).toBe(13);
    expect(minLng).toBeLessThan(-47);
    expect(maxLng).toBeGreaterThan(-47);
    expect(minLat).toBeLessThan(-22);
    expect(maxLat).toBeGreaterThan(-22);
  });

  it('follows the map when it stops moving', () => {
    const map = createMap([800, 600]);
    const { result } = renderHook(() => useMapViewport(map));

    act(() => {
      map.getView().setZoom(10);
      map.dispatchEvent('moveend');
    });

    expect(result.current!.zoom).toBe(10);
  });

  it('has no viewport without a map or while the map has no size', () => {
    const unsized = createMap();
    const flat = createMap([0, 600]);

    expect(renderHook(() => useMapViewport(null)).result.current).toBeNull();
    expect(renderHook(() => useMapViewport(unsized)).result.current).toBeNull();
    expect(renderHook(() => useMapViewport(flat)).result.current).toBeNull();
  });

  it('stops listening once unmounted', () => {
    const map = createMap([800, 600]);
    const { unmount } = renderHook(() => useMapViewport(map));

    unmount();

    expect(map.hasListener('moveend')).toBe(false);
  });
});
