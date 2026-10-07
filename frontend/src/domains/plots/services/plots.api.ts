import { deleteJson, getJson, postJson, putJson } from '../../../shared/lib/http';
import type {
  BoundingBox,
  NewPlot,
  PlotChanges,
  PlotFeature,
  PlotFeatureCollection,
  RadiusSearch,
} from '../types';

export function listPlotsInBoundingBox(
  bbox: BoundingBox,
  signal?: AbortSignal,
): Promise<PlotFeatureCollection> {
  return getJson('/plots', { bbox: bbox.join(',') }, signal);
}

export function searchPlots(
  search: RadiusSearch,
  signal?: AbortSignal,
): Promise<PlotFeatureCollection> {
  return getJson('/plots/search', search, signal);
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
