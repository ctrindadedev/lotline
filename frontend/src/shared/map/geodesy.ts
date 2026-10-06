import type Circle from 'ol/geom/Circle';
import Polygon, { circular } from 'ol/geom/Polygon';
import { toLonLat } from 'ol/proj';
import { getArea, getDistance } from 'ol/sphere';
import type { GeoJsonPolygon, Position } from './geojson';
import { worldCopyOffset } from './worldCopies';

/** A circle on the Earth's surface: the centre in degrees and the radius in metres. */
export interface CircleArea {
  center: Position;
  radiusMeters: number;
}

const CIRCLE_SEGMENTS = 64;

/** Area on the Earth's surface; a sphere, so within a few tenths of a percent of the API's figure. */
export function polygonAreaSquareMeters(polygon: GeoJsonPolygon): number {
  return getArea(new Polygon(polygon.coordinates), { projection: 'EPSG:4326' });
}

/**
 * A circle drawn on the map, in metres on the ground. Its radius is in map units, which Web
 * Mercator stretches away from the equator (1,000 units are about 921 m at 23° S).
 */
export function toCircleArea(circle: Circle): CircleArea {
  const [x, y] = circle.getCenter();
  const mainX = x - worldCopyOffset(x);
  const center = toLonLat([mainX, y]);
  const edge = toLonLat([mainX + circle.getRadius(), y]);
  return {
    center: [round(center[0], 7), round(center[1], 7)],
    radiusMeters: Math.round(getDistance(center, edge)),
  };
}

/** The circle as a polygon of points at `radiusMeters` from the centre, in degrees. */
export function geodesicCircle({ center, radiusMeters }: CircleArea): GeoJsonPolygon {
  const ring = circular(center, radiusMeters, CIRCLE_SEGMENTS).getCoordinates();
  return { type: 'Polygon', coordinates: ring as Position[][] };
}

function round(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}
