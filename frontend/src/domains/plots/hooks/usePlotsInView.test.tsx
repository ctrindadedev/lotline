import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest';
import type { MapViewport } from '../../../shared/map/useMapViewport';
import { createQueryWrapper } from '../../../test/queryClient';
import { MIN_PLOTS_ZOOM, usePlotsInView } from './usePlotsInView';

const IN_CAMPINAS: MapViewport = { bbox: [-47.1, -22.95, -47, -22.85], zoom: 13 };
const COLLECTION = { type: 'FeatureCollection', features: [] };

describe('usePlotsInView', () => {
  let fetchMock: MockInstance<typeof fetch>;

  beforeEach(() => {
    fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockImplementation(async () => Response.json(COLLECTION));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function render(viewport: MapViewport | null) {
    return renderHook(({ viewport }) => usePlotsInView(viewport), {
      initialProps: { viewport },
      wrapper: createQueryWrapper(),
    });
  }

  it('loads the plots of the visible bounding box', async () => {
    const { result } = render(IN_CAMPINAS);

    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.plots).toEqual(COLLECTION));
    expect(result.current.isLoading).toBe(false);
    expect(fetchMock.mock.calls[0][0]).toBe('/api/v1/plots?bbox=-47.1%2C-22.95%2C-47%2C-22.85');
  });

  it('does not load anything below the minimum zoom', () => {
    const { result } = render({ ...IN_CAMPINAS, zoom: MIN_PLOTS_ZOOM - 1 });

    expect(result.current).toMatchObject({ mapReady: true, zoomedIn: false, isLoading: false });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('drops the previous plots when zooming out', async () => {
    const { result, rerender } = render(IN_CAMPINAS);
    await waitFor(() => expect(result.current.plots).toBeDefined());

    rerender({ viewport: { ...IN_CAMPINAS, zoom: MIN_PLOTS_ZOOM - 1 } });

    expect(result.current.plots).toBeUndefined();
  });

  it('reports a failed request', async () => {
    fetchMock.mockImplementation(async () => new Response('', { status: 503 }));
    const { result } = render(IN_CAMPINAS);

    await waitFor(() =>
      expect(result.current.error?.message).toBe('Request failed with status 503'),
    );
  });

  it('waits for the map', () => {
    expect(render(null).result.current).toMatchObject({ mapReady: false, zoomedIn: false });
  });
});
