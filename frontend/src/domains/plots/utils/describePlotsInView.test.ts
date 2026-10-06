import { describe, expect, it } from 'vitest';
import type { PlotsInView } from '../hooks/usePlotsInView';
import type { PlotFeature } from '../types';
import { describePlotsInView } from './describePlotsInView';
import { messages } from '../../../shared/i18n/messages';

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
    ['the map is not ready', { ...READY, mapReady: false }, messages.plotsInView.mapLoading],
    ['zoomed out', { ...READY, zoomedIn: false }, messages.plotsInView.zoomIn],
    [
      'the request failed',
      { ...READY, error: new Error('Request failed with status 503') },
      messages.plotsInView.failed,
    ],
    ['loading', { ...READY, isLoading: true }, messages.plotsInView.loading],
    ['there are no plots', withPlots(0), messages.plotsInView.none],
    ['there is one plot', withPlots(1), messages.plotsInView.count(1)],
    ['there are several plots', withPlots(3), messages.plotsInView.count(3)],
  ])('describes when %s', (_, state, message) => {
    expect(describePlotsInView(state)).toBe(message);
  });
});
