/** `[longitude, latitude]` in degrees (EPSG:4326), the GeoJSON order. */
export type Position = [lng: number, lat: number];

export interface GeoJsonPolygon {
  type: 'Polygon';
  coordinates: Position[][];
}
