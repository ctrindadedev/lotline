import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest';
import type { CircleArea } from '../../../shared/map/geodesy';
import { createQueryWrapper } from '../../../test/queryClient';
import type { InteractionState } from '../utils/interactionMode';
import type { useInteractionMode } from './useInteractionMode';
import { usePlotSearch } from './usePlotSearch';

const AREA: CircleArea = { center: [-47.06, -22.9], radiusMeters: 1500 };
const RESULTS = { type: 'FeatureCollection', features: [] };

function interaction(state: InteractionState) {
  return { state } as ReturnType<typeof useInteractionMode>;
}

describe('usePlotSearch', () => {
  let fetchMock: MockInstance<typeof fetch>;

  beforeEach(() => {
    fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockImplementation(async () => Response.json(RESULTS));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function render(state: InteractionState) {
    return renderHook(() => usePlotSearch(interaction(state)), { wrapper: createQueryWrapper() });
  }

  it('searches the drawn circle and shows the area that was searched', async () => {
    const { result } = render({ mode: 'searching', area: AREA });

    expect(result.current.panel!.status).toBe('Searching…');
    await waitFor(() => expect(result.current.results).toEqual(RESULTS));
    expect(fetchMock.mock.calls[0][0]).toBe(
      '/api/v1/plots/search?lng=-47.06&lat=-22.9&radiusMeters=1500',
    );
    expect(result.current.panel).toMatchObject({
      radius: '1.5 km',
      capped: false,
      status: 'No plots reach into this circle.',
    });
    expect(result.current.circle!.features[0].geometry.type).toBe('Polygon');
  });

  it('sends the applied filters, and only those, until they are cleared', async () => {
    const { result } = render({ mode: 'searching', area: AREA });
    await waitFor(() => expect(fetchMock).toHaveBeenCalledOnce());

    act(() =>
      result.current.panel!.form.reset({
        minPrice: '',
        maxPrice: '200000',
        minArea: '500',
        maxArea: '',
      }),
    );
    await act(() => result.current.panel!.applyFilters());

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(fetchMock.mock.calls[1][0]).toBe(
      '/api/v1/plots/search?lng=-47.06&lat=-22.9&radiusMeters=1500&maxPrice=200000&minAreaSquareMeters=500',
    );

    act(() => result.current.panel!.clearFilters());
    expect(result.current.panel!.form.getValues().maxPrice).toBe('');
  });

  it('limits the radius to what the API accepts, and says so', async () => {
    const { result } = render({ mode: 'searching', area: { ...AREA, radiusMeters: 80_000 } });

    expect(result.current.panel).toMatchObject({ radius: '50.0 km', capped: true });
    await waitFor(() => expect(fetchMock.mock.calls[0][0]).toContain('radiusMeters=50000'));
  });

  it('does nothing outside the search mode', () => {
    const { result } = render({ mode: 'idle' });

    expect(result.current).toMatchObject({ circle: undefined, results: undefined, panel: null });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
