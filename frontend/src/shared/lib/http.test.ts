import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError, buildUrl, deleteJson, getJson, isSessionLost, postJson, putJson } from './http';

function jsonResponse(body: unknown, status = 200, contentType = 'application/json') {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': contentType } });
}

describe('buildUrl', () => {
  it('prefixes the API base path', () => {
    expect(buildUrl('/plots')).toBe('/api/v1/plots');
  });

  it('encodes query parameters and leaves out undefined ones', () => {
    expect(buildUrl('/plots/search', { lat: -22, radiusMeters: 500, minPrice: undefined })).toBe(
      '/api/v1/plots/search?lat=-22&radiusMeters=500',
    );
  });
});

describe('getJson', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns the parsed body of a successful response', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse({ ok: 1 }));

    const signal = new AbortController().signal;

    await expect(getJson('/plots', { bbox: '1,2,3,4' }, signal)).resolves.toEqual({ ok: 1 });
    expect(fetchMock).toHaveBeenCalledWith('/api/v1/plots?bbox=1%2C2%2C3%2C4', {
      method: 'GET',
      signal,
    });
  });

  it('turns a problem detail into an ApiError with its field errors', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse(
        {
          title: 'Bad Request',
          detail: 'One or more fields are invalid',
          errors: [{ field: 'lat', message: 'must be less than or equal to 90' }],
        },
        400,
        'application/problem+json',
      ),
    );

    const error = await getJson('/plots/search').catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({
      status: 400,
      title: 'Bad Request',
      message: 'One or more fields are invalid',
      errors: [{ field: 'lat', message: 'must be less than or equal to 90' }],
    });
  });

  it('fills in missing problem fields', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('{}', {
        status: 409,
        statusText: 'Conflict',
        headers: { 'Content-Type': 'application/problem+json' },
      }),
    );

    await expect(getJson('/plots')).rejects.toMatchObject({
      status: 409,
      title: 'Conflict',
      message: 'Request failed with status 409',
      errors: [],
    });
  });

  it('keeps the status when a JSON error body cannot be parsed', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('', {
        status: 500,
        statusText: 'Internal Server Error',
        headers: { 'Content-Type': 'application/problem+json' },
      }),
    );

    const error = await getJson('/plots').catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({
      status: 500,
      title: 'Internal Server Error',
      message: 'Request failed with status 500',
    });
  });

  it('does not parse a non-JSON error body', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('<html>Bad Gateway</html>', {
        status: 502,
        statusText: 'Bad Gateway',
        headers: { 'Content-Type': 'text/html' },
      }),
    );

    await expect(getJson('/plots')).rejects.toMatchObject({
      status: 502,
      title: 'Bad Gateway',
      message: 'Request failed with status 502',
    });
  });
});

describe('postJson', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('sends the body as JSON', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(jsonResponse({ id: 'a' }, 201));

    await expect(postJson('/plots', { price: 10 })).resolves.toEqual({ id: 'a' });
    expect(fetchMock).toHaveBeenCalledWith('/api/v1/plots', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{"price":10}',
    });
  });
});

describe('writes', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    document.cookie = 'XSRF-TOKEN=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
  });

  it('send the CSRF token from its cookie, read at request time', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockImplementation(async () => jsonResponse({}));

    document.cookie = 'XSRF-TOKEN=first%20token; path=/';
    await putJson('/plots/1', { price: 1 });
    document.cookie = 'XSRF-TOKEN=second; path=/';
    await postJson('/auth/logout');

    expect(fetchMock.mock.calls[0][1]).toMatchObject({
      method: 'PUT',
      headers: { 'X-XSRF-TOKEN': 'first token', 'Content-Type': 'application/json' },
    });
    expect(fetchMock.mock.calls[1][1]).toEqual({
      method: 'POST',
      headers: { 'X-XSRF-TOKEN': 'second' },
      body: undefined,
    });
  });

  it('send no CSRF header without the cookie, and accept an empty 204', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(null, { status: 204 }));

    await expect(deleteJson('/plots/1')).resolves.toBeUndefined();
    expect(fetchMock).toHaveBeenCalledWith('/api/v1/plots/1', {
      method: 'DELETE',
      headers: {},
      body: undefined,
    });
  });
});

describe('isSessionLost', () => {
  it('is a 401 or a write refused for its CSRF token, nothing else', () => {
    expect(isSessionLost(new ApiError(401, 'Unauthorized', 'Log in to do this'))).toBe(true);
    expect(isSessionLost(new ApiError(403, 'Forbidden', 'Missing or invalid CSRF token'))).toBe(
      true,
    );
    expect(isSessionLost(new ApiError(403, 'Forbidden', 'You cannot do this'))).toBe(false);
    expect(isSessionLost(new ApiError(500, 'Error', 'Missing or invalid CSRF token'))).toBe(false);
    expect(isSessionLost(new TypeError('Failed to fetch'))).toBe(false);
  });
});
