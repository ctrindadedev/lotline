import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { messages } from '../../../shared/i18n/messages';
import { createQueryWrapper, createTestQueryClient } from '../../../test/queryClient';
import type { PlotFeature } from '../types';
import { usePlotManagement } from './usePlotManagement';

const { forgetUser } = vi.hoisted(() => ({ forgetUser: vi.fn<() => void>() }));
vi.mock('../../auth', () => ({ useForgetUser: () => forgetUser }));

const MINE: PlotFeature = {
  type: 'Feature',
  id: 'plot-1',
  geometry: { type: 'Polygon', coordinates: [] },
  properties: {
    price: 150000.5,
    description: 'Corner plot',
    contact: 'ana@example.com',
    createdAt: '2026-10-06T12:00:00Z',
    ownedByMe: true,
  },
};

function problem(status: number) {
  return Response.json(
    { title: 'x', detail: 'x' },
    { status, headers: { 'Content-Type': 'application/problem+json' } },
  );
}

function render(plot: PlotFeature | null = MINE) {
  const client = createTestQueryClient();
  const invalidate = vi.spyOn(client, 'invalidateQueries');
  const hook = renderHook(() => usePlotManagement(plot), { wrapper: createQueryWrapper(client) });
  return { ...hook, invalidate };
}

describe('usePlotManagement', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    forgetUser.mockClear();
  });

  it('is only for the owner', () => {
    expect(render().result.current.canManage).toBe(true);
    const notMine = { ...MINE, properties: { ...MINE.properties, ownedByMe: false } };
    expect(render(notMine).result.current.canManage).toBe(false);
    expect(render(null).result.current.canManage).toBe(false);
  });

  it('opens the editor filled in, saves the changes and says so', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(Response.json(MINE));
    const { result, invalidate } = render();

    act(() => result.current.startEdit());
    expect(result.current.edit.open).toBe(true);
    expect(result.current.edit.form.getValues()).toEqual({
      price: '150000,5',
      description: 'Corner plot',
      contact: 'ana@example.com',
    });

    await act(() => result.current.edit.submit());

    await waitFor(() => expect(result.current.edit.open).toBe(false));
    expect(result.current.notice).toBe(messages.manage.saved);
    expect(fetchMock.mock.calls[0][0]).toBe('/api/v1/plots/plot-1');
    expect(JSON.parse(fetchMock.mock.calls[0][1]!.body as string)).toEqual({
      price: 150000.5,
      description: 'Corner plot',
      contact: 'ana@example.com',
    });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['plots'] });

    act(() => result.current.dismissNotice());
    expect(result.current.notice).toBeNull();
  });

  it('keeps the editor open with the reason when the change is refused', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(problem(403));
    const { result } = render();

    act(() => result.current.startEdit());
    await act(() => result.current.edit.submit());

    await waitFor(() => expect(result.current.edit.alert).toBe(messages.manage.errors.notOwner));
    expect(result.current.edit.open).toBe(true);

    act(() => result.current.edit.close());
    expect(result.current.edit.open).toBe(false);
  });

  it('forgets the user when the session expired', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(problem(401));
    const { result } = render();

    act(() => result.current.startDelete());
    act(() => result.current.remove.confirm());

    await waitFor(() => expect(forgetUser).toHaveBeenCalledOnce());
    expect(result.current.remove.alert).toBe(messages.manage.errors.sessionExpired);
  });

  it('deletes after confirmation', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(null, { status: 204 }));
    const { result } = render();

    act(() => result.current.startDelete());
    expect(result.current.remove.open).toBe(true);
    act(() => result.current.remove.confirm());

    await waitFor(() => expect(result.current.notice).toBe(messages.manage.deleted));
    expect(result.current.remove.open).toBe(false);
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ method: 'DELETE' });
  });

  it('does nothing without a plot', () => {
    const { result } = render(null);

    act(() => result.current.startEdit());
    act(() => result.current.startDelete());

    expect(result.current.edit.open).toBe(false);
    expect(result.current.remove.open).toBe(false);
  });
});
