import type {
  BoundingBox,
  GeoJsonFeature,
  GeoJsonFeatureCollection,
  GeoJsonPolygon,
} from '../../shared/map/geojson';

export type { BoundingBox };

export interface PlotProperties {
  price: number;
  description: string;
  /** Only sent to logged-in users. */
  contact?: string;
  createdAt: string;
  ownedByMe: boolean;
}

export type PlotFeature = GeoJsonFeature<PlotProperties>;

export type PlotFeatureCollection = GeoJsonFeatureCollection<PlotProperties>;

export interface PlotChanges {
  price: number;
  description: string;
  contact: string;
}

export interface NewPlot {
  boundary: GeoJsonPolygon;
  price: number;
  description: string;
  contact: string;
}

export type RadiusSearch = {
  lat: number;
  lng: number;
  radiusMeters: number;
  minPrice?: number;
  maxPrice?: number;
  minAreaSquareMeters?: number;
  maxAreaSquareMeters?: number;
};
