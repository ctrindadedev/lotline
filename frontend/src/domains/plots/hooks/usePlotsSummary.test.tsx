import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { MapViewport } from '../../../shared/map/useMapViewport';
import { createQueryWrapper } from '../../../test/queryClient';
import type { PlotsSummary } from '../types';
import { MIN_PLOTS_ZOOM, usePlotsSummary } from './usePlotsInView';

const SUMMARY: PlotsSummary = {
  available: 4,
  reserved: 1,
  sold: 0,
  totalAreaSquareMeters: 685000,
  minPricePerSquareMeter: 1.05,
  medianPricePerSquareMeter: 19.76,
  maxPricePerSquareMeter: 41.46,
};

const VIEWPORT: MapViewport = { bbox: [-47.2, -23, -46.9, -22.8], zoom: MIN_PLOTS_ZOOM };

describe('usePlotsSummary', () => {
  afterEach(() => vi.restoreAllMocks());

  it('summarises the viewport once zoomed in', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(Response.json(SUMMARY));
    const { result } = renderHook(() => usePlotsSummary(VIEWPORT), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current).toEqual(SUMMARY));
    expect(fetchMock.mock.calls[0][0]).toBe(
      `/api/v1/plots/summary?bbox=${encodeURIComponent('-47.2,-23,-46.9,-22.8')}`,
    );
  });

  it('says nothing, and asks nothing, while zoomed out or before the map is ready', () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch');
    const zoomedOut = { ...VIEWPORT, zoom: MIN_PLOTS_ZOOM - 1 };

    expect(
      renderHook(() => usePlotsSummary(zoomedOut), { wrapper: createQueryWrapper() }).result
        .current,
    ).toBeNull();
    expect(
      renderHook(() => usePlotsSummary(null), { wrapper: createQueryWrapper() }).result.current,
    ).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
