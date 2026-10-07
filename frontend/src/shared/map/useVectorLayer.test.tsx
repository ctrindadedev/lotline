import OlMap from 'ol/Map';
import VectorLayer from 'ol/layer/Vector';
import type VectorSource from 'ol/source/Vector';
import Style from 'ol/style/Style';
import { renderHook } from '@testing-library/react';
import { StrictMode } from 'react';
import { describe, expect, it } from 'vitest';
import type { GeoJsonFeatureCollection } from './geojson';
import { useVectorLayer } from './useVectorLayer';

const SQUARE = {
  type: 'Polygon' as const,
  coordinates: [
    [
      [-47, -22],
      [-46.99, -22],
      [-46.99, -21.99],
      [-47, -22],
    ] as [number, number][],
  ],
};

function collection(...ids: string[]): GeoJsonFeatureCollection {
  return {
    type: 'FeatureCollection',
    features: ids.map((id) => ({ type: 'Feature', id, geometry: SQUARE, properties: {} })),
  };
}

function vectorSource(map: OlMap) {
  const layers = map.getLayers().getArray();
  expect(layers).toHaveLength(1);
  expect(layers[0]).toBeInstanceOf(VectorLayer);
  return (layers[0] as VectorLayer<VectorSource>).getSource()!;
}

describe('useVectorLayer', () => {
  it('adds a single layer with the features, even under StrictMode', () => {
    const map = new OlMap({});

    renderHook(() => useVectorLayer(map, collection('a', 'b')), { wrapper: StrictMode });

    const ids = vectorSource(map)
      .getFeatures()
      .map((f) => f.getId());
    expect(ids.sort()).toEqual(['a', 'b']);
  });

  it('replaces the features when the collection changes and clears them when it goes away', () => {
    const map = new OlMap({});
    const { rerender } = renderHook(({ data }) => useVectorLayer(map, data), {
      initialProps: { data: collection('a') as GeoJsonFeatureCollection | undefined },
    });

    rerender({ data: collection('b') });
    expect(
      vectorSource(map)
        .getFeatures()
        .map((f) => f.getId()),
    ).toEqual(['b']);

    rerender({ data: undefined });
    expect(vectorSource(map).getFeatures()).toHaveLength(0);
  });

  it('removes its layer when unmounted and does nothing without a map', () => {
    const map = new OlMap({});
    const { unmount } = renderHook(() => useVectorLayer(map, collection('a')));

    unmount();
    renderHook(() => useVectorLayer(null, collection('a')));

    expect(map.getLayers().getLength()).toBe(0);
  });

  it('restyles the same layer when the style changes', () => {
    const map = new OlMap({});
    const first = new Style();
    const second = new Style();
    const { rerender } = renderHook(({ style }) => useVectorLayer(map, collection('a'), style), {
      initialProps: { style: first },
    });
    const [layer] = map.getLayers().getArray() as VectorLayer<VectorSource>[];

    rerender({ style: second });

    expect(map.getLayers().getArray()).toEqual([layer]);
    expect(layer.getStyle()).toBe(second);
  });
});
