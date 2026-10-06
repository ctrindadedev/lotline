import type OlMap from 'ol/Map';
import TileLayer from 'ol/layer/Tile';
import { toLonLat } from 'ol/proj';
import OSM from 'ol/source/OSM';
import { render } from '@testing-library/react';
import { StrictMode, useEffect } from 'react';
import { describe, expect, it } from 'vitest';
import { INITIAL_CENTER, INITIAL_ZOOM, useMap } from './useMap';

function MapHost({ onMap }: { onMap: (map: OlMap | null) => void }) {
  const { targetRef, map } = useMap();
  useEffect(() => {
    onMap(map);
  }, [map, onMap]);
  return <div ref={targetRef} data-testid="map" />;
}

function renderMap() {
  const rendered: { map: OlMap | null } = { map: null };
  const result = render(
    <StrictMode>
      <MapHost onMap={(map) => (rendered.map = map)} />
    </StrictMode>,
  );
  return { ...result, rendered };
}

describe('useMap', () => {
  it('attaches exactly one map to its target, even under StrictMode', () => {
    const { getByTestId } = renderMap();

    expect(getByTestId('map').querySelectorAll('.ol-viewport')).toHaveLength(1);
  });

  it('shows OpenStreetMap tiles centred on the initial position', () => {
    const { rendered } = renderMap();
    const map = rendered.map!;
    const [layer] = map.getLayers().getArray();
    const view = map.getView();

    expect(layer).toBeInstanceOf(TileLayer);
    expect((layer as TileLayer<OSM>).getSource()).toBeInstanceOf(OSM);
    expect(view.getProjection().getCode()).toBe('EPSG:3857');
    expect(view.getZoom()).toBe(INITIAL_ZOOM);
    const [lng, lat] = toLonLat(view.getCenter()!);
    expect(lng).toBeCloseTo(INITIAL_CENTER[0]);
    expect(lat).toBeCloseTo(INITIAL_CENTER[1]);
  });

  it('detaches the map when unmounted', () => {
    const { getByTestId, unmount } = renderMap();
    const target = getByTestId('map');

    unmount();

    expect(target.querySelector('.ol-viewport')).toBeNull();
  });
});
