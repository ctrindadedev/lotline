import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError, buildUrl, getJson, postJson } from './http';

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

    await expect(getJson('/plots', { bbox: '1,2,3,4' })).resolves.toEqual({ ok: 1 });
    expect(fetchMock).toHaveBeenCalledWith('/api/v1/plots?bbox=1%2C2%2C3%2C4', { method: 'GET' });
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
