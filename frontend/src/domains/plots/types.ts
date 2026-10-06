import type { GeoJsonPolygon } from '../../shared/map/geojson';

export interface PlotProperties {
  price: number;
  description: string;
  contact: string;
  createdAt: string;
}

export interface PlotFeature {
  type: 'Feature';
  id: string;
  geometry: GeoJsonPolygon;
  properties: PlotProperties;
}

export interface PlotFeatureCollection {
  type: 'FeatureCollection';
  features: PlotFeature[];
}

export interface NewPlot {
  boundary: GeoJsonPolygon;
  price: number;
  description: string;
  contact: string;
}

/** `[minLng, minLat, maxLng, maxLat]` in degrees. */
export type BoundingBox = [minLng: number, minLat: number, maxLng: number, maxLat: number];

export type RadiusSearch = {
  lat: number;
  lng: number;
  radiusMeters: number;
  minPrice?: number;
  maxPrice?: number;
  minAreaSquareMeters?: number;
  maxAreaSquareMeters?: number;
};
