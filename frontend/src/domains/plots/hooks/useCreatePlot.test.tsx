import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createQueryWrapper, createTestQueryClient } from '../../../test/queryClient';
import type { NewPlot } from '../types';
import { useCreatePlot } from './useCreatePlot';

const NEW_PLOT: NewPlot = {
  boundary: {
    type: 'Polygon',
    coordinates: [
      [
        [-47, -22],
        [-46.99, -22],
        [-46.99, -21.99],
        [-47, -22],
      ],
    ],
  },
  price: 1000,
  description: 'A plot',
  contact: 'seller@example.com',
};

describe('useCreatePlot', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('reports a failed save to its error callback', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('', { status: 500 }));
    const onError = vi.fn<(error: Error) => void>();
    const { result } = renderHook(() => useCreatePlot({ onError }), {
      wrapper: createQueryWrapper(),
    });

    act(() => result.current.mutate(NEW_PLOT));

    await waitFor(() => expect(onError).toHaveBeenCalledOnce());
  });

  it('posts the plot and refreshes every plot query', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(Response.json({ id: 'new' }, { status: 201 }));
    const client = createTestQueryClient();
    const invalidate = vi.spyOn(client, 'invalidateQueries');
    const onSuccess = vi.fn<() => void>();
    const { result } = renderHook(() => useCreatePlot({ onSuccess }), {
      wrapper: createQueryWrapper(client),
    });

    act(() => result.current.mutate(NEW_PLOT));

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v1/plots',
      expect.objectContaining({ method: 'POST', body: JSON.stringify(NEW_PLOT) }),
    );
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['plots'] });
    expect(onSuccess).toHaveBeenCalledOnce();
  });
});
