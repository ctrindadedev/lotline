import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { CircleArea } from '../../../shared/map/geodesy';
import type { GeoJsonPolygon } from '../../../shared/map/geojson';
import { useSearchParams } from 'react-router';
import { createQueryWrapper } from '../../../test/queryClient';
import { EMPTY_PLOT_FORM } from '../utils/plotForm';
import { useMapPage } from './useMapPage';
import type { PlotFeature } from '../types';
import { messages } from '../../../shared/i18n/messages';

const BOUNDARY: GeoJsonPolygon = {
  type: 'Polygon',
  coordinates: [
    [
      [-47, -22],
      [-46.99, -22],
      [-46.99, -21.99],
      [-47, -22],
    ],
  ],
};

const VALUES = { price: '1000', description: 'A plot', contact: 'seller@example.com' };

const { auth, navigate, forgetUser } = vi.hoisted(() => ({
  auth: {
    user: { id: 'u1', name: 'Ana', email: 'ana@example.com' } as object | null,
    isLoading: false,
  },
  navigate: vi.fn<(to: string, options?: object) => void>(),
  forgetUser: vi.fn<() => void>(),
}));

vi.mock('../../auth', () => ({
  useCurrentUser: () => auth,
  useForgetUser: () => forgetUser,
}));

vi.mock('react-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-router')>()),
  useNavigate: () => navigate,
}));

const { plotDrawn, circleDrawn, closeDetails, detailsArgs, detailsPlot, undoLastPoint } =
  vi.hoisted(() => ({
    detailsPlot: { current: null as PlotFeature | null },
    undoLastPoint: vi.fn<() => void>(),
    plotDrawn: { current: null as ((polygon: GeoJsonPolygon) => void) | null },
    circleDrawn: { current: null as ((circle: CircleArea) => void) | null },
    closeDetails: vi.fn<() => void>(),
    detailsArgs: { plots: undefined as unknown, enabled: false },
  }));

vi.mock('./useMyPlots', () => ({
  useMyPlots: () => ({ plots: [], listed: [], reserved: [], isLoading: false, error: null }),
}));

vi.mock('./usePlotDetails', () => ({
  usePlotDetails: (_map: unknown, _source: unknown, plots: unknown, enabled: boolean) => {
    detailsArgs.plots = plots;
    detailsArgs.enabled = enabled;
    return {
      plot: detailsPlot.current,
      overlayElement: document.createElement('div'),
      select: vi.fn<() => void>(),
      close: closeDetails,
    };
  },
}));

vi.mock('../../../shared/map/useDrawInteraction', () => ({
  useDrawInteraction: (
    _map: unknown,
    _shape: unknown,
    handlers: {
      onPolygon?: (polygon: GeoJsonPolygon) => void;
      onCircle?: (circle: CircleArea) => void;
    },
  ) => {
    plotDrawn.current = handlers.onPolygon ?? null;
    circleDrawn.current = handlers.onCircle ?? null;
    return { undoLastPoint };
  },
}));

function problem(status: number, body: object) {
  return Response.json(body, {
    status,
    headers: { 'Content-Type': 'application/problem+json' },
  });
}

function renderPage() {
  const rendered = renderHook(() => useMapPage(), { wrapper: createQueryWrapper() });
  act(() => rendered.result.current.toolbar.drawPlot());
  act(() => plotDrawn.current!(BOUNDARY));
  return rendered;
}

async function fillAndSubmit(result: { current: ReturnType<typeof useMapPage> }) {
  act(() => result.current.plotForm!.form.reset(VALUES));
  await act(() => result.current.plotForm!.submit());
}

describe('useMapPage', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('opens the form for a drawn plot and closes it once the plot is saved', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(Response.json({ id: 'new' }, { status: 201 }));
    const { result } = renderPage();
    expect(result.current.mode).toBe('editingPlot');

    await fillAndSubmit(result);

    await waitFor(() => expect(result.current.mode).toBe('idle'));
    expect(result.current.plotForm).toBeNull();
    expect(result.current.notice).toBe(messages.plotForm.saved);
    expect(JSON.parse(fetchMock.mock.calls[0][1]!.body as string)).toEqual({
      boundary: BOUNDARY,
      price: 1000,
      description: 'A plot',
      contact: 'seller@example.com',
    });

    act(() => result.current.dismissNotice());
    expect(result.current.notice).toBeNull();
  });

  it('does not send a form that fails validation', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch');
    const { result } = renderPage();

    await act(() => result.current.plotForm!.submit());

    expect(fetchMock).not.toHaveBeenCalled();
    expect(result.current.plotForm!.form.getFieldState('price').error).toBeDefined();
  });

  it('confirms a save that finishes after the user left the form', async () => {
    let respond: (response: Response) => void = () => {};
    vi.spyOn(globalThis, 'fetch').mockReturnValue(new Promise((resolve) => (respond = resolve)));
    const { result } = renderPage();
    await fillAndSubmit(result);
    await waitFor(() => expect(result.current.toolbar.disabled).toBe(true));

    act(() => result.current.toolbar.drawSearch());
    await act(async () => respond(Response.json({ id: 'new' }, { status: 201 })));

    await waitFor(() => expect(result.current.notice).toBe(messages.plotForm.saved));
    expect(result.current.mode).toBe('drawingSearch');
  });

  it('puts field errors from the API on their fields', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      problem(400, {
        title: 'Bad Request',
        detail: 'One or more fields are invalid',
        errors: [{ field: 'price', message: 'must be at most 1000' }],
      }),
    );
    const { result } = renderPage();

    await fillAndSubmit(result);

    await waitFor(() =>
      expect(result.current.plotForm!.form.getFieldState('price').error?.message).toBe(
        messages.plotForm.errors.price,
      ),
    );
    expect(result.current.plotForm!.alert.message).toBe(messages.plotForm.saveErrors.highlighted);
  });

  it('keeps the drawing, the error and the typed values through a redraw', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      problem(409, { title: 'Conflict', detail: 'overlaps' }),
    );
    const { result } = renderPage();

    await fillAndSubmit(result);

    await waitFor(() =>
      expect(result.current.plotForm!.alert.message).toBe(messages.plotForm.saveErrors.overlap),
    );
    expect(result.current.mode).toBe('editingPlot');

    act(() => result.current.plotForm!.redraw());
    expect(result.current.mode).toBe('drawingPlot');
    expect(result.current.plotForm).toBeNull();

    act(() => plotDrawn.current!(BOUNDARY));
    expect(result.current.plotForm!.alert.message).toBeNull();
    expect(result.current.plotForm!.form.getValues()).toEqual(VALUES);
  });

  it('shows only the search results, clickable, while a circle is searched', async () => {
    const results = { type: 'FeatureCollection', features: [] };
    vi.spyOn(globalThis, 'fetch').mockImplementation(async () => Response.json(results));
    const { result } = renderHook(() => useMapPage(), { wrapper: createQueryWrapper() });

    act(() => result.current.toolbar.drawSearch());
    act(() => circleDrawn.current!({ center: [-47.06, -22.9], radiusMeters: 1500 }));

    expect(result.current.mode).toBe('searching');
    expect(result.current.searchPanel!.radius).toBe('1,5 km');
    await waitFor(() => expect(detailsArgs.plots).toEqual(results.features));
    expect(detailsArgs.enabled).toBe(true);

    act(() => result.current.searchPanel!.newSearch());
    expect(result.current.mode).toBe('drawingSearch');
    expect(result.current.searchPanel).toBeNull();
    expect(detailsArgs.enabled).toBe(false);
  });

  it('leaves a drawing with Esc and removes the last corner with Ctrl+Z', () => {
    undoLastPoint.mockClear();
    const { result } = renderHook(() => useMapPage(), { wrapper: createQueryWrapper() });
    act(() => result.current.toolbar.drawPlot());
    expect(result.current.drawing).toEqual({ canUndo: true, undoLastPoint });

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'z', ctrlKey: true }));
    });
    expect(undoLastPoint).toHaveBeenCalledOnce();

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    });
    expect(result.current.mode).toBe('idle');
    expect(result.current.drawing).toBeNull();
  });

  it('keeps a drawn plot and its form on Esc, and closes the details in idle', () => {
    closeDetails.mockClear();
    const { result } = renderPage();

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    });
    expect(result.current.mode).toBe('editingPlot');

    act(() => result.current.plotForm!.cancel());
    closeDetails.mockClear();
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    });
    expect(closeDetails).not.toHaveBeenCalled();
  });

  it('sends a visitor to the login page to list a plot', () => {
    auth.user = null;
    navigate.mockClear();
    const { result } = renderHook(() => useMapPage(), { wrapper: createQueryWrapper() });

    act(() => result.current.toolbar.drawPlot());

    expect(result.current.mode).toBe('idle');
    expect(navigate).toHaveBeenCalledWith('/login', {
      state: { from: '/', reason: 'listPlot' },
    });
    auth.user = { id: 'u1', name: 'Ana', email: 'ana@example.com' };
  });

  it('waits for the session check before deciding where "list a plot" goes', () => {
    auth.user = null;
    auth.isLoading = true;
    navigate.mockClear();
    const { result } = renderHook(() => useMapPage(), { wrapper: createQueryWrapper() });

    act(() => result.current.toolbar.drawPlot());

    expect(result.current.mode).toBe('idle');
    expect(navigate).not.toHaveBeenCalled();
    auth.user = { id: 'u1', name: 'Ana', email: 'ana@example.com' };
    auth.isLoading = false;
  });

  it('forgets the user when another tab logged out before the plot was saved', async () => {
    forgetUser.mockClear();
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      problem(403, { title: 'Forbidden', detail: 'Missing or invalid CSRF token' }),
    );
    const { result } = renderPage();

    await fillAndSubmit(result);

    await waitFor(() => expect(forgetUser).toHaveBeenCalledOnce());
    expect(result.current.plotForm!.alert.message).toBe(
      messages.plotForm.saveErrors.sessionExpired,
    );
  });

  it('forgets the user when the session expired while drawing', async () => {
    forgetUser.mockClear();
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(problem(401, { title: 'Unauthorized' }));
    const { result } = renderPage();

    await fillAndSubmit(result);

    await waitFor(() => expect(forgetUser).toHaveBeenCalledOnce());
    expect(result.current.plotForm!.alert.message).toBe(
      messages.plotForm.saveErrors.sessionExpired,
    );
  });

  it('closes the plot details when the user starts drawing', () => {
    closeDetails.mockClear();
    const { result } = renderHook(() => useMapPage(), { wrapper: createQueryWrapper() });

    act(() => result.current.toolbar.drawPlot());
    act(() => result.current.toolbar.drawSearch());

    expect(closeDetails).toHaveBeenCalledTimes(2);
  });

  it('drops the drawn plot and the typed values on cancel or when switching to search', () => {
    const { result } = renderPage();
    act(() => result.current.plotForm!.form.reset(VALUES));

    act(() => result.current.plotForm!.cancel());
    expect(result.current.mode).toBe('idle');

    act(() => result.current.toolbar.drawPlot());
    act(() => plotDrawn.current!(BOUNDARY));
    expect(result.current.plotForm!.form.getValues()).toEqual(EMPTY_PLOT_FORM);

    act(() => result.current.toolbar.drawSearch());
    expect(result.current.mode).toBe('drawingSearch');
  });

  it('offers the actions of the open plot to the user asking', () => {
    const plot: PlotFeature = {
      type: 'Feature',
      id: 'plot-1',
      geometry: { type: 'Polygon', coordinates: [] },
      properties: {
        price: 1000,
        description: 'A plot',
        createdAt: '2026-10-07T12:00:00Z',
        status: 'AVAILABLE',
        reservable: true,
        ownedByMe: false,
        reservedByMe: false,
      },
    };
    const labels = () => {
      const { result } = renderHook(() => useMapPage(), { wrapper: createQueryWrapper() });
      return result.current.details.actions.map((action) => action.label);
    };

    detailsPlot.current = plot;
    expect(labels()).toEqual([messages.reservation.actions.reserve]);
    detailsPlot.current = { ...plot, properties: { ...plot.properties, ownedByMe: true } };
    expect(labels()).toEqual([messages.popup.edit, messages.popup.delete]);
    detailsPlot.current = null;
  });

  it('leaves a search when the account menu asks for a tab of the plot list', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async () =>
      Response.json({ type: 'FeatureCollection', features: [] }),
    );
    const { result } = renderHook(() => ({ page: useMapPage(), setParams: useSearchParams()[1] }), {
      wrapper: createQueryWrapper(),
    });
    act(() => result.current.page.toolbar.drawSearch());
    act(() => circleDrawn.current!({ center: [-47.06, -22.9], radiusMeters: 1500 }));
    expect(result.current.page.mode).toBe('searching');

    act(() => result.current.setParams({ panel: 'mine' }));

    await waitFor(() => expect(result.current.page.mode).toBe('idle'));
    expect(result.current.page.plotsPanel.tab).toBe('mine');
  });

  it('keeps a filled-in plot form when the account menu asks for a tab', async () => {
    const { result } = renderHook(() => ({ page: useMapPage(), setParams: useSearchParams()[1] }), {
      wrapper: createQueryWrapper(),
    });
    act(() => result.current.page.toolbar.drawPlot());
    act(() =>
      plotDrawn.current!({
        type: 'Polygon',
        coordinates: [
          [
            [-47, -22],
            [-46.99, -22],
            [-46.99, -21.99],
            [-47, -22],
          ],
        ],
      }),
    );
    expect(result.current.page.mode).toBe('editingPlot');

    act(() => result.current.setParams({ panel: 'reserved' }));

    expect(result.current.page.mode).toBe('editingPlot');
  });
});
