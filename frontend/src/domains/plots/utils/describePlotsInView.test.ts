import { describe, expect, it } from 'vitest';
import type { PlotsInView } from '../hooks/usePlotsInView';
import type { PlotFeature } from '../types';
import { describePlotsInView } from './describePlotsInView';

const READY: PlotsInView = {
  mapReady: true,
  zoomedIn: true,
  plots: undefined,
  isLoading: false,
  error: null,
};

function withPlots(count: number): PlotsInView {
  const features = Array.from({ length: count }, () => ({}) as PlotFeature);
  return { ...READY, plots: { type: 'FeatureCollection', features } };
}

describe('describePlotsInView', () => {
  it.each([
    ['the map is not ready', { ...READY, mapReady: false }, 'Loading the map…'],
    ['zoomed out', { ...READY, zoomedIn: false }, 'Zoom in to see the plots in this area.'],
    [
      'the request failed',
      { ...READY, error: new Error('Request failed with status 503') },
      'Could not load plots: Request failed with status 503',
    ],
    ['loading', { ...READY, isLoading: true }, 'Loading plots…'],
    ['there are no plots', withPlots(0), 'No plots in this area yet.'],
    ['there is one plot', withPlots(1), '1 plot in this area.'],
    ['there are several plots', withPlots(3), '3 plots in this area.'],
  ])('describes when %s', (_, state, message) => {
    expect(describePlotsInView(state)).toBe(message);
  });
});
