import type Feature from 'ol/Feature';
import { getCenter, type Extent } from 'ol/extent';
import GeoJSON from 'ol/format/GeoJSON';
import type Polygon from 'ol/geom/Polygon';
import { transformExtent } from 'ol/proj';
import { snapRingsToEdges } from './edgeSnapping';
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

const DECIMALS = 7;

/**
 * A drawn polygon in degrees, rounded to 7 decimals (about 1 cm, finer than any hand-drawn
 * vertex), with vertices that touch a neighbour's edge then moved exactly onto it.
 */
export function toGeoJsonPolygon(polygon: Polygon, neighbours: Polygon[] = []): GeoJsonPolygon {
  const drawn = toDegrees(onMainWorld(polygon)).map((ring) => ring.map(roundPosition));
  // Snap after rounding: rounding a snapped vertex would move it off a slanted edge (ADR 0017).
  return { type: 'Polygon', coordinates: snapRingsToEdges(drawn, neighbours.map(toDegrees)) };
}

function toDegrees(polygon: Polygon): Position[][] {
  return (format.writeGeometryObject(polygon) as GeoJsonPolygon).coordinates;
}

function roundPosition([lng, lat]: Position): Position {
  const factor = 10 ** DECIMALS;
  return [Math.round(lng * factor) / factor, Math.round(lat * factor) / factor];
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
