import type { PolygonLook } from '../../../shared/map/styles';
import type { PlotProperties, PlotStatus } from '../types';

/** Map colours of each status, also used by the legend. */
export const STATUS_COLORS: Record<PlotStatus, { stroke: string; fill: string }> = {
  AVAILABLE: { stroke: '#1f6feb', fill: 'rgb(31 111 235 / 20%)' },
  RESERVED: { stroke: '#bf8700', fill: 'rgb(191 135 0 / 25%)' },
  SOLD: { stroke: '#6e7781', fill: 'rgb(110 119 129 / 30%)' },
};

/** Coloured by status; the user's own plots are dashed, the selected one has a thick outline. */
export function plotLook(plot: PlotProperties, selected: boolean): PolygonLook {
  const colors = STATUS_COLORS[plot.status] ?? STATUS_COLORS.AVAILABLE;
  return {
    ...colors,
    width: selected ? 4 : 2,
    dashed: plot.ownedByMe && !selected,
  };
}
