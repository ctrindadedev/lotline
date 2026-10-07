import { QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { MemoryRouter, useLocation } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createTestQueryClient } from '../../../test/queryClient';
import type { PlotFeature, PlotProperties } from '../types';
import { usePlotsPanel } from './usePlotsPanel';

function plot(id: string, changes: Partial<PlotProperties> = {}): PlotFeature {
  return {
    type: 'Feature',
    id,
    geometry: { type: 'Polygon', coordinates: [] },
    properties: {
      price: 1000,
      description: id,
      createdAt: '2026-10-07T12:00:00Z',
      status: 'AVAILABLE',
      reservable: true,
      ownedByMe: false,
      reservedByMe: false,
      ...changes,
    },
  };
}

const LISTED = plot('listed', { ownedByMe: true });
const RESERVED = plot('reserved', { status: 'RESERVED', reservedByMe: true });
const IN_VIEW = [plot('in-view')];

function render(url: string, userId: string | null) {
  const client = createTestQueryClient();
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={[url]}>{children}</MemoryRouter>
      </QueryClientProvider>
    );
  }
  return renderHook(
    ({ user }) => ({ panel: usePlotsPanel(IN_VIEW, user), search: useLocation().search }),
    { wrapper: Wrapper, initialProps: { user: userId } },
  );
}

describe('usePlotsPanel', () => {
  afterEach(() => vi.restoreAllMocks());

  it('shows a visitor only the plots in view, whatever the URL asks', () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch');
    const { result } = render('/?panel=mine', null);

    expect(result.current.panel.tab).toBe('area');
    expect(result.current.panel.tabs).toEqual(['area']);
    expect(result.current.panel.plots).toBe(IN_VIEW);
    expect(result.current.panel.myPlots).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('splits the plots of the user into listings and reservations, by the tab in the URL', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(
        Response.json({ type: 'FeatureCollection', features: [RESERVED, LISTED] }),
      );
    const { result } = render('/?panel=mine', 'ana');

    expect(result.current.panel.tabs).toEqual(['area', 'mine', 'reserved']);
    expect(result.current.panel.tab).toBe('mine');
    expect(result.current.panel.myPlotsLoading).toBe(true);
    await waitFor(() => expect(result.current.panel.plots).toEqual([LISTED]));
    expect(fetchMock.mock.calls[0][0]).toBe('/api/v1/plots/mine');
    expect(result.current.panel.myPlots).toEqual([RESERVED, LISTED]);

    act(() => result.current.panel.selectTab('reserved'));
    expect(result.current.search).toBe('?panel=reserved');
    expect(result.current.panel.plots).toEqual([RESERVED]);

    act(() => result.current.panel.selectTab('area'));
    expect(result.current.search).toBe('');
    expect(result.current.panel.plots).toBe(IN_VIEW);
  });

  it('reports a failure to load the plots of the user', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      Response.json(
        { title: 'x' },
        { status: 500, headers: { 'Content-Type': 'application/problem+json' } },
      ),
    );
    const { result } = render('/?panel=reserved', 'ana');

    await waitFor(() => expect(result.current.panel.myPlotsFailed).toBe(true));
  });

  it('never shows the plots of the previous user after switching accounts', async () => {
    let answer: (response: Response) => void = () => {};
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(Response.json({ type: 'FeatureCollection', features: [LISTED] }))
      .mockImplementationOnce(() => new Promise((resolve) => (answer = resolve)));
    const { result, rerender } = render('/?panel=mine', 'ana');
    await waitFor(() => expect(result.current.panel.plots).toEqual([LISTED]));

    rerender({ user: 'bruno' });

    expect(result.current.panel.plots).toEqual([]);
    expect(result.current.panel.myPlotsLoading).toBe(true);
    answer(Response.json({ type: 'FeatureCollection', features: [] }));
    await waitFor(() => expect(result.current.panel.myPlotsLoading).toBe(false));
  });
});
