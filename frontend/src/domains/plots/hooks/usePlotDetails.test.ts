import BaseEvent from 'ol/events/Event';
import Feature from 'ol/Feature';
import OlMap from 'ol/Map';
import Polygon from 'ol/geom/Polygon';
import { fromLonLat } from 'ol/proj';
import VectorSource from 'ol/source/Vector';
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { PlotFeature, PlotFeatureCollection } from '../types';
import { usePlotDetails } from './usePlotDetails';

const CORNERS: [number, number][] = [
  [-47, -22],
  [-46.99, -22],
  [-46.99, -21.99],
  [-47, -21.99],
  [-47, -22],
];

const PLOT: PlotFeature = {
  type: 'Feature',
  id: 'plot-1',
  geometry: { type: 'Polygon', coordinates: [CORNERS] },
  properties: { price: 1000, description: 'A plot', contact: 'a@b.c', createdAt: '2026-10-06' },
};

const LOADED: PlotFeatureCollection = { type: 'FeatureCollection', features: [PLOT] };
const INSIDE = fromLonLat([-46.995, -21.995]);

function setUp() {
  const map = new OlMap({});
  const feature = new Feature(new Polygon([CORNERS.map((c) => fromLonLat(c))]));
  feature.setId('plot-1');
  const source = new VectorSource({ features: [feature] });
  const hook = renderHook(({ plots, enabled }) => usePlotDetails(map, source, plots, enabled), {
    initialProps: { plots: LOADED as PlotFeatureCollection | undefined, enabled: true },
  });
  const click = () =>
    act(() => {
      map.dispatchEvent(Object.assign(new BaseEvent('singleclick'), { coordinate: INSIDE }));
    });
  return { map, click, ...hook };
}

describe('usePlotDetails', () => {
  it('shows the clicked plot at the click, until it is closed', () => {
    const { map, click, result } = setUp();

    click();

    expect(result.current.plot).toBe(PLOT);
    expect(map.getOverlays().item(0).getPosition()).toEqual(INSIDE);

    act(() => result.current.close());
    expect(result.current.plot).toBeNull();
    expect(map.getOverlays().item(0).getPosition()).toBeUndefined();
  });

  it('forgets a plot that is no longer loaded, so it does not come back by itself', () => {
    const { map, click, result, rerender } = setUp();
    click();

    rerender({ plots: undefined, enabled: true });
    expect(result.current.plot).toBeNull();

    rerender({ plots: LOADED, enabled: true });
    expect(result.current.plot).toBeNull();
    expect(map.getOverlays().item(0).getPosition()).toBeUndefined();
  });

  it('forgets the selection while the map is busy drawing', () => {
    const { click, result, rerender } = setUp();
    click();

    rerender({ plots: LOADED, enabled: false });
    expect(result.current.plot).toBeNull();

    rerender({ plots: LOADED, enabled: true });
    expect(result.current.plot).toBeNull();
  });
});
