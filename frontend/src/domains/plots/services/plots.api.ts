import { deleteJson, getJson, postJson, putJson } from '../../../shared/lib/http';
import type {
  BoundingBox,
  NewPlot,
  PlotChanges,
  PlotFeature,
  PlotFeatureCollection,
  PlotsSummary,
  RadiusSearch,
} from '../types';

export function listPlotsInBoundingBox(
  bbox: BoundingBox,
  signal?: AbortSignal,
): Promise<PlotFeatureCollection> {
  return getJson('/plots', { bbox: bbox.join(',') }, signal);
}

export function summarizePlotsInBoundingBox(
  bbox: BoundingBox,
  signal?: AbortSignal,
): Promise<PlotsSummary> {
  return getJson('/plots/summary', { bbox: bbox.join(',') }, signal);
}

export function searchPlots(
  search: RadiusSearch,
  signal?: AbortSignal,
): Promise<PlotFeatureCollection> {
  return getJson('/plots/search', search, signal);
}

export function listMyPlots(signal?: AbortSignal): Promise<PlotFeatureCollection> {
  return getJson('/plots/mine', undefined, signal);
}

export function getPlot(id: string): Promise<PlotFeature> {
  return getJson(`/plots/${encodeURIComponent(id)}`);
}

export function createPlot(plot: NewPlot): Promise<PlotFeature> {
  return postJson('/plots', plot);
}

export function updatePlot(id: string, changes: PlotChanges): Promise<PlotFeature> {
  return putJson(`/plots/${encodeURIComponent(id)}`, changes);
}

export function deletePlot(id: string): Promise<void> {
  return deleteJson(`/plots/${encodeURIComponent(id)}`);
}

export function reservePlot(id: string): Promise<PlotFeature> {
  return postJson(`/plots/${encodeURIComponent(id)}/reservation`);
}

export function releaseReservation(id: string): Promise<PlotFeature> {
  return deleteJson<PlotFeature>(`/plots/${encodeURIComponent(id)}/reservation`);
}

export function sellPlot(id: string): Promise<PlotFeature> {
  return postJson(`/plots/${encodeURIComponent(id)}/sale`);
}
