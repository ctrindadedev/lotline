import { polygonAreaSquareMeters } from '../../../shared/map/geodesy';
import type { PolygonLook } from '../../../shared/map/styles';
import type { PlotFeature, PlotProperties } from '../types';

/** What the map colours plots by. */
export type ColourBy = 'status' | 'price';

export interface PriceRange {
  min: number;
  max: number;
}

type Rgb = [number, number, number];

/** A sequential ramp from light yellow (cheapest) to dark red (most expensive). */
const RAMP: Rgb[] = [
  [255, 255, 178],
  [254, 204, 92],
  [253, 141, 60],
  [240, 59, 32],
  [189, 0, 38],
];

export const RAMP_CSS = RAMP.map(([r, g, b]) => `rgb(${r} ${g} ${b})`);

const NO_PRICE: Rgb = [175, 184, 193];

export function pricePerSquareMeter(plot: PlotFeature): number {
  const area = polygonAreaSquareMeters(plot.geometry);
  return area > 0 ? plot.properties.price / area : 0;
}

/** The price per m² of each plot, by id, and the range they span. */
export function pricesOf(plots: PlotFeature[]): {
  byId: Map<string, number>;
  range: PriceRange | null;
} {
  const byId = new Map(plots.map((plot) => [plot.id, pricePerSquareMeter(plot)]));
  const values = [...byId.values()].filter((value) => value > 0 && Number.isFinite(value));
  const range = values.length > 0 ? { min: Math.min(...values), max: Math.max(...values) } : null;
  return { byId, range };
}

/**
 * Where a price falls in the range, from 0 to 1, on a logarithmic scale: prices per m² spread
 * over orders of magnitude (rural and urban land), and a linear scale would paint most plots alike.
 */
export function positionInRange(value: number, { min, max }: PriceRange): number {
  if (max <= min) {
    return 0.5;
  }
  const t = (Math.log(value) - Math.log(min)) / (Math.log(max) - Math.log(min));
  return Math.min(Math.max(t, 0), 1);
}

export function rampColour(t: number): Rgb {
  const scaled = Math.min(Math.max(t, 0), 1) * (RAMP.length - 1);
  const i = Math.min(Math.floor(scaled), RAMP.length - 2);
  const f = scaled - i;
  return RAMP[i].map((channel, c) => Math.round(channel + (RAMP[i + 1][c] - channel) * f)) as Rgb;
}

/** A plot coloured by its price per m² within the range; grey when it has no price to place. */
export function priceLook(
  plot: PlotProperties,
  value: number | undefined,
  range: PriceRange | null,
  selected: boolean,
): PolygonLook {
  const [r, g, b] =
    value !== undefined && value > 0 && range
      ? rampColour(positionInRange(value, range))
      : NO_PRICE;
  const dark = [r, g, b].map((channel) => Math.round(channel * 0.6));
  return {
    stroke: `rgb(${dark.join(' ')})`,
    fill: `rgb(${r} ${g} ${b} / 70%)`,
    width: selected ? 4 : 2,
    dashed: plot.ownedByMe && !selected,
  };
}
