import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { messages } from '../../../shared/i18n/messages';
import { createQueryWrapper, createTestQueryClient } from '../../../test/queryClient';
import type { PlotFeature, PlotProperties } from '../types';
import { usePlotReservation } from './usePlotReservation';

const { auth, navigate, forgetUser } = vi.hoisted(() => ({
  auth: { user: { id: 'u1', name: 'Ana', email: 'ana@example.com' } as object | null },
  navigate: vi.fn<(to: string, options?: object) => void>(),
  forgetUser: vi.fn<() => void>(),
}));
vi.mock('../../auth', () => ({
  useCurrentUser: () => ({ user: auth.user, isLoading: false }),
  useForgetUser: () => forgetUser,
}));
vi.mock('react-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-router')>()),
  useNavigate: () => navigate,
}));

function plot(changes: Partial<PlotProperties> = {}): PlotFeature {
  return {
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
      ...changes,
    },
  };
}

function problem(status: number) {
  return Response.json(
    { title: 'x', detail: 'x' },
    { status, headers: { 'Content-Type': 'application/problem+json' } },
  );
}

function render(feature: PlotFeature | null) {
  const client = createTestQueryClient();
  const invalidate = vi.spyOn(client, 'invalidateQueries');
  const hook = renderHook(() => usePlotReservation(feature), {
    wrapper: createQueryWrapper(client),
  });
  return { ...hook, invalidate };
}

describe('usePlotReservation', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    navigate.mockClear();
    forgetUser.mockClear();
    auth.user = { id: 'u1', name: 'Ana', email: 'ana@example.com' };
  });

  it('reserves an available plot and refreshes the plots', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(Response.json(plot()));
    const { result, invalidate } = render(plot());

    expect(result.current.actions.map((a) => a.label)).toEqual([
      messages.reservation.actions.reserve,
    ]);
    act(() => result.current.actions[0].run());

    await waitFor(() => expect(result.current.notice).toBe(messages.reservation.done.reserve));
    expect(fetchMock.mock.calls[0][0]).toBe('/api/v1/plots/plot-1/reservation');
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ method: 'POST' });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['plots'] });

    act(() => result.current.dismissNotice());
    expect(result.current.notice).toBeNull();
  });

  it('sends a visitor to log in first', () => {
    auth.user = null;
    const fetchMock = vi.spyOn(globalThis, 'fetch');
    const { result } = render(plot());

    act(() => result.current.actions[0].run());

    expect(navigate).toHaveBeenCalledWith('/login', {
      state: { from: '/', reason: 'reservePlot' },
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('asks the seller to confirm the sale before selling', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(Response.json(plot()));
    const { result } = render(plot({ status: 'RESERVED', ownedByMe: true }));

    expect(result.current.actions.map((a) => a.label)).toEqual([
      messages.reservation.actions.sell,
      messages.reservation.actions.release,
    ]);
    act(() => result.current.actions[0].run());
    expect(result.current.sale.open).toBe(true);
    expect(fetchMock).not.toHaveBeenCalled();

    act(() => result.current.sale.confirm());

    await waitFor(() => expect(result.current.notice).toBe(messages.reservation.done.sell));
    expect(result.current.sale.open).toBe(false);
    expect(fetchMock.mock.calls[0][0]).toBe('/api/v1/plots/plot-1/sale');
  });

  it('lets the seller step back from the sale', () => {
    const { result } = render(plot({ status: 'RESERVED', ownedByMe: true }));

    act(() => result.current.actions[0].run());
    act(() => result.current.sale.close());

    expect(result.current.sale.open).toBe(false);
  });

  it('lets the buyer cancel and says when the status changed meanwhile', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(problem(409));
    const { result, invalidate } = render(plot({ status: 'RESERVED', reservedByMe: true }));

    expect(result.current.actions[0].label).toBe(messages.reservation.actions.cancel);
    act(() => result.current.actions[0].run());

    await waitFor(() => expect(result.current.notice).toBe(messages.reservation.errors.changed));
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ method: 'DELETE' });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['plots'] });
  });

  it('forgets the user when the session expired', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(problem(401));
    const { result } = render(plot());

    act(() => result.current.actions[0].run());

    await waitFor(() => expect(forgetUser).toHaveBeenCalledOnce());
    expect(result.current.notice).toBe(messages.reservation.errors.sessionExpired);
  });

  it('offers nothing without a plot', () => {
    expect(render(null).result.current.actions).toEqual([]);
  });
});
