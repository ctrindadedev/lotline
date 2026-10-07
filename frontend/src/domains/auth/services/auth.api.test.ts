import { afterEach, describe, expect, it, vi } from 'vitest';
import { getCurrentUser, logIn, logOut, register } from './auth.api';

const ANA = { id: 'u1', name: 'Ana', email: 'ana@example.com' };

function problem(status: number) {
  return Response.json(
    { title: 'Error', detail: 'x' },
    { status, headers: { 'Content-Type': 'application/problem+json' } },
  );
}

describe('auth API', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    document.cookie = 'XSRF-TOKEN=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
  });

  it('reads the logged-in user, and null for a visitor', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(Response.json(ANA));
    await expect(getCurrentUser()).resolves.toEqual(ANA);
    expect(fetchMock.mock.calls[0][0]).toBe('/api/v1/auth/me');

    fetchMock.mockResolvedValueOnce(problem(401));
    await expect(getCurrentUser()).resolves.toBeNull();
  });

  it('lets other failures through', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(problem(500));

    await expect(getCurrentUser()).rejects.toMatchObject({ status: 500 });
  });

  it('gets the CSRF cookie first when the page has none yet', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockImplementation(async () => Response.json(ANA));

    await logIn({ email: 'ana@example.com', password: 'secret123' });

    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
      '/api/v1/auth/me',
      '/api/v1/auth/login',
    ]);
  });

  it('logs in, registers and logs out with POSTs', async () => {
    document.cookie = 'XSRF-TOKEN=token; path=/';
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockImplementation(async () => Response.json(ANA));

    await logIn({ email: 'ana@example.com', password: 'secret123' });
    await register({ name: 'Ana', email: 'ana@example.com', password: 'secret123' });
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }));
    await logOut();

    expect(fetchMock.mock.calls.map(([url, init]) => [url, init?.method])).toEqual([
      ['/api/v1/auth/login', 'POST'],
      ['/api/v1/auth/register', 'POST'],
      ['/api/v1/auth/logout', 'POST'],
    ]);
  });
});
