import Polygon from 'ol/geom/Polygon';
import { getArea } from 'ol/sphere';
import type { GeoJsonPolygon } from './geojson';

/** Area on the Earth's surface; a sphere, so within a few tenths of a percent of the API's figure. */
export function polygonAreaSquareMeters(polygon: GeoJsonPolygon): number {
  return getArea(new Polygon(polygon.coordinates), { projection: 'EPSG:4326' });
}
