import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createQueryWrapper, createTestQueryClient } from '../../../test/queryClient';
import {
  authKeys,
  useCurrentUser,
  useForgetUser,
  useLogIn,
  useLogOut,
  useRegister,
} from './useAuth';

const ANA = { id: 'u1', name: 'Ana', email: 'ana@example.com' };

describe('auth hooks', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('knows a visitor from a logged-in user', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      Response.json({}, { status: 401, headers: { 'Content-Type': 'application/problem+json' } }),
    );
    const { result } = renderHook(() => useCurrentUser(), { wrapper: createQueryWrapper() });

    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.user).toBeNull();
  });

  it('stores the user after logging in or registering, and refreshes the other queries', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async () => Response.json(ANA));
    const client = createTestQueryClient();
    const invalidate = vi.spyOn(client, 'invalidateQueries');
    const wrapper = createQueryWrapper(client);
    const logIn = renderHook(() => useLogIn(), { wrapper });
    const register = renderHook(() => useRegister(), { wrapper });

    await act(() => logIn.result.current.mutateAsync({ email: 'a@b.co', password: 'secret123' }));
    expect(client.getQueryData(authKeys.me)).toEqual(ANA);

    await act(() =>
      register.result.current.mutateAsync({ name: 'Ana', email: 'a@b.co', password: 'secret123' }),
    );
    expect(invalidate).toHaveBeenCalledTimes(2);
    const { predicate } = invalidate.mock.calls[0][0] as unknown as {
      predicate: (query: { queryKey: unknown[] }) => boolean;
    };
    expect(predicate({ queryKey: ['plots', 'bbox'] })).toBe(true);
    expect(predicate({ queryKey: ['auth', 'me'] })).toBe(false);
  });

  it('forgets the user when told the session is gone and refetches what depended on it', async () => {
    const client = createTestQueryClient();
    client.setQueryData(authKeys.me, ANA);
    const invalidate = vi.spyOn(client, 'invalidateQueries');
    const { result } = renderHook(() => useForgetUser(), { wrapper: createQueryWrapper(client) });

    await act(() => result.current());

    expect(client.getQueryData(authKeys.me)).toBeNull();
    expect(invalidate).toHaveBeenCalledOnce();
  });

  it('forgets the user on logout and refetches everything', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 204 }));
    const client = createTestQueryClient();
    client.setQueryData(authKeys.me, ANA);
    const invalidate = vi.spyOn(client, 'invalidateQueries');
    const { result } = renderHook(() => useLogOut(), { wrapper: createQueryWrapper(client) });

    await act(() => result.current.mutateAsync());

    expect(client.getQueryData(authKeys.me)).toBeNull();
    expect(invalidate).toHaveBeenCalledWith();
  });
});
