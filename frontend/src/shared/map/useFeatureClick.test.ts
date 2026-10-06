import BaseEvent from 'ol/events/Event';
import Feature from 'ol/Feature';
import OlMap from 'ol/Map';
import type { Coordinate } from 'ol/coordinate';
import Polygon from 'ol/geom/Polygon';
import { fromLonLat } from 'ol/proj';
import VectorSource from 'ol/source/Vector';
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useFeatureClick, type FeatureClick } from './useFeatureClick';

const INSIDE = fromLonLat([-46.995, -21.995]);
const OUTSIDE = fromLonLat([-46.9, -21.9]);
const WORLD_WIDTH = fromLonLat([180, 0])[0] * 2;

function plotSource() {
  const ring = [
    [-47, -22],
    [-46.99, -22],
    [-46.99, -21.99],
    [-47, -21.99],
    [-47, -22],
  ].map((c) => fromLonLat(c));
  const feature = new Feature(new Polygon([ring]));
  feature.setId('plot-1');
  return new VectorSource({ features: [feature] });
}

function click(map: OlMap, coordinate: Coordinate) {
  act(() => {
    map.dispatchEvent(Object.assign(new BaseEvent('singleclick'), { coordinate }));
  });
}

function setUp(enabled = true) {
  const map = new OlMap({});
  const onClick = vi.fn<(click: FeatureClick | null) => void>();
  const hook = renderHook(({ on }) => useFeatureClick(map, plotSource(), on, onClick), {
    initialProps: { on: enabled },
  });
  return { map, onClick, ...hook };
}

describe('useFeatureClick', () => {
  it('reports the plot under the click, and where it was clicked', () => {
    const { map, onClick } = setUp();

    click(map, INSIDE);

    expect(onClick).toHaveBeenCalledWith({ id: 'plot-1', coordinate: INSIDE });
  });

  it('reports null for a click on empty map', () => {
    const { map, onClick } = setUp();

    click(map, OUTSIDE);

    expect(onClick).toHaveBeenCalledWith(null);
  });

  it('finds a plot clicked on a copy of the world', () => {
    const { map, onClick } = setUp();
    const onCopy = [INSIDE[0] + WORLD_WIDTH, INSIDE[1]];

    click(map, onCopy);

    expect(onClick).toHaveBeenCalledWith({ id: 'plot-1', coordinate: onCopy });
  });

  it('ignores clicks while disabled and after unmounting', () => {
    const { map, onClick, rerender, unmount } = setUp(false);
    click(map, INSIDE);

    rerender({ on: true });
    unmount();
    click(map, INSIDE);

    expect(onClick).not.toHaveBeenCalled();
  });
});
