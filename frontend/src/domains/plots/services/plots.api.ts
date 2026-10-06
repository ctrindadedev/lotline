import { getJson, postJson } from '../../../shared/lib/http';
import type {
  BoundingBox,
  NewPlot,
  PlotFeature,
  PlotFeatureCollection,
  RadiusSearch,
} from '../types';

export function listPlotsInBoundingBox(bbox: BoundingBox): Promise<PlotFeatureCollection> {
  return getJson('/plots', { bbox: bbox.join(',') });
}

export function searchPlots(search: RadiusSearch): Promise<PlotFeatureCollection> {
  return getJson('/plots/search', search);
}

export function getPlot(id: string): Promise<PlotFeature> {
  return getJson(`/plots/${encodeURIComponent(id)}`);
}

export function createPlot(plot: NewPlot): Promise<PlotFeature> {
  return postJson('/plots', plot);
}
