import { styleByLook } from '../../../shared/map/styles';
import { SELECTED } from '../../../shared/map/useSelectedFeature';
import type { PlotProperties } from '../types';
import { plotLook } from './plotLook';
import { priceLook, type ColourBy, type PriceRange } from './priceColours';

/** The map style of the plot layer: by status or by price per m², outlining the selected plot. */
export function plotStyleFor(
  colourBy: ColourBy,
  prices: { byId: Map<string, number>; range: PriceRange | null },
) {
  return styleByLook((properties, id) => {
    const plot = properties as unknown as PlotProperties;
    const selected = properties[SELECTED] === true;
    return colourBy === 'price'
      ? priceLook(plot, prices.byId.get(String(id)), prices.range, selected)
      : plotLook(plot, selected);
  });
}
