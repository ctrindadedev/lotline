import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { GeoJsonPolygon } from '../../../shared/map/geojson';
import { createQueryWrapper } from '../../../test/queryClient';
import { EMPTY_PLOT_FORM } from '../utils/plotForm';
import { useMapPage } from './useMapPage';

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

const { plotDrawn, closeDetails } = vi.hoisted(() => ({
  plotDrawn: { current: null as ((polygon: GeoJsonPolygon) => void) | null },
  closeDetails: vi.fn<() => void>(),
}));

vi.mock('./usePlotDetails', () => ({
  usePlotDetails: () => ({
    plot: null,
    overlayElement: document.createElement('div'),
    close: closeDetails,
  }),
}));

vi.mock('../../../shared/map/useDrawInteraction', () => ({
  useDrawInteraction: (
    _map: unknown,
    _shape: unknown,
    handlers: { onPolygon?: (polygon: GeoJsonPolygon) => void },
  ) => {
    plotDrawn.current = handlers.onPolygon ?? null;
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
    expect(result.current.notice).toBe('Plot listed.');
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

    await waitFor(() => expect(result.current.notice).toBe('Plot listed.'));
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
        'must be at most 1000',
      ),
    );
    expect(result.current.plotForm!.alert).toBe('Check the highlighted fields.');
  });

  it('keeps the drawing, the error and the typed values through a redraw', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      problem(409, { title: 'Conflict', detail: 'overlaps' }),
    );
    const { result } = renderPage();

    await fillAndSubmit(result);

    await waitFor(() => expect(result.current.plotForm!.alert).toMatch(/overlaps/));
    expect(result.current.mode).toBe('editingPlot');

    act(() => result.current.plotForm!.redraw());
    expect(result.current.mode).toBe('drawingPlot');
    expect(result.current.plotForm).toBeNull();

    act(() => plotDrawn.current!(BOUNDARY));
    expect(result.current.plotForm!.alert).toBeNull();
    expect(result.current.plotForm!.form.getValues()).toEqual(VALUES);
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
});
