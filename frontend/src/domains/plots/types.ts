import type {
  BoundingBox,
  GeoJsonFeature,
  GeoJsonFeatureCollection,
  GeoJsonPolygon,
} from '../../shared/map/geojson';

export type { BoundingBox };

export type PlotStatus = 'AVAILABLE' | 'RESERVED' | 'SOLD';

export interface PlotProperties {
  price: number;
  description: string;
  /** Only sent to logged-in users. */
  contact?: string;
  createdAt: string;
  status: PlotStatus;
  /** False for plots without a seller (the sample plots). */
  reservable: boolean;
  ownedByMe: boolean;
  /** The user asking reserved it, or bought it once sold. */
  reservedByMe: boolean;
}

export type PlotFeature = GeoJsonFeature<PlotProperties>;

/** Aggregates over the plots in view; the price figures are null when there are none. */
export interface PlotsSummary {
  available: number;
  reserved: number;
  sold: number;
  totalAreaSquareMeters: number;
  minPricePerSquareMeter: number | null;
  medianPricePerSquareMeter: number | null;
  maxPricePerSquareMeter: number | null;
}

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
