import type Feature from 'ol/Feature';
import type { Extent } from 'ol/extent';
import GeoJSON from 'ol/format/GeoJSON';
import { transformExtent } from 'ol/proj';

/** `[longitude, latitude]` in degrees (EPSG:4326), the GeoJSON order. */
export type Position = [lng: number, lat: number];

/** `[minLng, minLat, maxLng, maxLat]` in degrees. */
export type BoundingBox = [minLng: number, minLat: number, maxLng: number, maxLat: number];

export interface GeoJsonPolygon {
  type: 'Polygon';
  coordinates: Position[][];
}

export interface GeoJsonFeature<P = Record<string, unknown>> {
  type: 'Feature';
  id: string;
  geometry: GeoJsonPolygon;
  properties: P;
}

export interface GeoJsonFeatureCollection<P = Record<string, unknown>> {
  type: 'FeatureCollection';
  features: GeoJsonFeature<P>[];
}

const MAP_PROJECTION = 'EPSG:3857';
const DATA_PROJECTION = 'EPSG:4326';

const format = new GeoJSON({
  dataProjection: DATA_PROJECTION,
  featureProjection: MAP_PROJECTION,
});

export function toOlFeatures(collection: GeoJsonFeatureCollection<object>): Feature[] {
  return format.readFeatures(collection);
}

/** The lon/lat rectangle of a map extent, shifted to the main world copy and clamped to it. */
export function toBoundingBox(extent: Extent): BoundingBox {
  const [minLng, minLat, maxLng, maxLat] = transformExtent(extent, MAP_PROJECTION, DATA_PROJECTION);
  const shift = Math.round((minLng + maxLng) / 2 / 360) * 360;
  return [
    clamp(minLng - shift, 180),
    clamp(minLat, 90),
    clamp(maxLng - shift, 180),
    clamp(maxLat, 90),
  ];
}

function clamp(value: number, limit: number): number {
  return Math.min(Math.max(value, -limit), limit);
}
