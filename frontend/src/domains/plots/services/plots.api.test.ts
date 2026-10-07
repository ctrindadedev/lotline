import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest';
import type { NewPlot, PlotFeature } from '../types';
import {
  createPlot,
  deletePlot,
  getPlot,
  listMyPlots,
  listPlotsInBoundingBox,
  releaseReservation,
  reservePlot,
  searchPlots,
  sellPlot,
  updatePlot,
} from './plots.api';

const PLOT: PlotFeature = {
  type: 'Feature',
  id: '0199a0a0-0000-7000-8000-000000000000',
  geometry: {
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
  properties: {
    price: 150000,
    description: 'Corner plot',
    contact: 'seller@example.com',
    createdAt: '2026-10-06T12:00:00Z',
    status: 'AVAILABLE',
    reservable: true,
    ownedByMe: false,
    reservedByMe: false,
  },
};

const EMPTY_COLLECTION = { type: 'FeatureCollection', features: [] };

describe('plots API', () => {
  let fetchMock: MockInstance<typeof fetch>;

  beforeEach(() => {
    fetchMock = vi.spyOn(globalThis, 'fetch');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function respondWith(body: unknown, status = 200) {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
  }

  function requestedUrl() {
    return fetchMock.mock.calls[0][0];
  }

  it('lists the plots in a bounding box as one comma-separated parameter', async () => {
    respondWith(EMPTY_COLLECTION);

    await expect(listPlotsInBoundingBox([-47, -22, -46.9, -21.9])).resolves.toEqual(
      EMPTY_COLLECTION,
    );
    expect(requestedUrl()).toBe('/api/v1/plots?bbox=-47%2C-22%2C-46.9%2C-21.9');
  });

  it('searches a radius sending only the filters that are set', async () => {
    respondWith({ type: 'FeatureCollection', features: [PLOT] });

    const result = await searchPlots({ lat: -22, lng: -47, radiusMeters: 1500, maxPrice: 200000 });

    expect(result.features).toEqual([PLOT]);
    expect(requestedUrl()).toBe(
      '/api/v1/plots/search?lat=-22&lng=-47&radiusMeters=1500&maxPrice=200000',
    );
  });

  it('fetches one plot by id', async () => {
    respondWith(PLOT);

    await expect(getPlot(PLOT.id)).resolves.toEqual(PLOT);
    expect(requestedUrl()).toBe(`/api/v1/plots/${PLOT.id}`);
  });

  it('creates a plot with a POST', async () => {
    respondWith(PLOT, 201);
    const newPlot: NewPlot = {
      boundary: PLOT.geometry,
      price: 150000,
      description: 'Corner plot',
      contact: 'seller@example.com',
    };

    await expect(createPlot(newPlot)).resolves.toEqual(PLOT);
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v1/plots',
      expect.objectContaining({ method: 'POST', body: JSON.stringify(newPlot) }),
    );
  });

  it('changes a plot with a PUT and removes it with a DELETE', async () => {
    respondWith(PLOT);
    const changes = { price: 1, description: 'New', contact: 'x@example.com' };

    await expect(updatePlot(PLOT.id, changes)).resolves.toEqual(PLOT);
    expect(fetchMock).toHaveBeenCalledWith(
      `/api/v1/plots/${PLOT.id}`,
      expect.objectContaining({ method: 'PUT', body: JSON.stringify(changes) }),
    );

    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));
    await expect(deletePlot(PLOT.id)).resolves.toBeUndefined();
    expect(fetchMock.mock.calls[1][1]).toMatchObject({ method: 'DELETE' });
  });

  it('reserves, releases and sells a plot', async () => {
    respondWith(PLOT);
    const url = `/api/v1/plots/${PLOT.id}`;

    await expect(reservePlot(PLOT.id)).resolves.toEqual(PLOT);
    expect(fetchMock.mock.calls[0][0]).toBe(`${url}/reservation`);
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ method: 'POST' });

    respondWith(PLOT);
    await expect(releaseReservation(PLOT.id)).resolves.toEqual(PLOT);
    expect(fetchMock.mock.calls[1][0]).toBe(`${url}/reservation`);
    expect(fetchMock.mock.calls[1][1]).toMatchObject({ method: 'DELETE' });

    respondWith(PLOT);
    await expect(sellPlot(PLOT.id)).resolves.toEqual(PLOT);
    expect(fetchMock.mock.calls[2][0]).toBe(`${url}/sale`);
  });

  it('lists the plots of the logged-in user', async () => {
    respondWith({ type: 'FeatureCollection', features: [PLOT] });

    await expect(listMyPlots()).resolves.toEqual({ type: 'FeatureCollection', features: [PLOT] });
    expect(fetchMock.mock.calls[0][0]).toBe('/api/v1/plots/mine');
  });
});
