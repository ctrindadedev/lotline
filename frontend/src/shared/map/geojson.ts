import type Feature from 'ol/Feature';
import { getCenter, type Extent } from 'ol/extent';
import GeoJSON from 'ol/format/GeoJSON';
import type Polygon from 'ol/geom/Polygon';
import { transformExtent } from 'ol/proj';
import { worldCopyOffset } from './worldCopies';

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

/** Seven decimals of a degree is about 1 cm, finer than any hand-drawn vertex. */
export function toGeoJsonPolygon(polygon: Polygon): GeoJsonPolygon {
  return format.writeGeometryObject(onMainWorld(polygon), { decimals: 7 }) as GeoJsonPolygon;
}

function onMainWorld(polygon: Polygon): Polygon {
  const shift = worldCopyOffset(getCenter(polygon.getExtent())[0]);
  if (shift === 0) {
    return polygon;
  }
  const moved = polygon.clone();
  moved.translate(-shift, 0);
  return moved;
}

export function polygonCollection(id: string, polygon: GeoJsonPolygon): GeoJsonFeatureCollection {
  return {
    type: 'FeatureCollection',
    features: [{ type: 'Feature', id, geometry: polygon, properties: {} }],
  };
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
