import type { FeatureLike } from 'ol/Feature';
import Circle from 'ol/geom/Circle';
import Point from 'ol/geom/Point';
import Fill from 'ol/style/Fill';
import Stroke from 'ol/style/Stroke';
import Style, { createEditingStyle } from 'ol/style/Style';
import Text from 'ol/style/Text';
import { formatDistance, toCircleArea } from './geodesy';

export const polygonStyle = new Style({
  fill: new Fill({ color: 'rgb(31 111 235 / 20%)' }),
  stroke: new Stroke({ color: '#1f6feb', width: 2 }),
});

export const draftStyle = new Style({
  fill: new Fill({ color: 'rgb(219 109 40 / 25%)' }),
  stroke: new Stroke({ color: '#db6d28', width: 2, lineDash: [6, 4] }),
});

export const searchAreaStyle = new Style({
  fill: new Fill({ color: 'rgb(130 80 223 / 8%)' }),
  stroke: new Stroke({ color: '#8250df', width: 2, lineDash: [8, 6] }),
});

const editingStyles: Record<string, Style[]> = createEditingStyle();

/** The default sketch style, plus the circle's radius in metres while it is being drawn. */
export function radiusLabelStyle(feature: FeatureLike): Style[] {
  const geometry = feature.getGeometry();
  const base = (geometry && editingStyles[geometry.getType()]) || [];
  if (!(geometry instanceof Circle)) {
    return base;
  }
  const label = new Style({
    geometry: new Point(geometry.getCenter()),
    text: new Text({
      text: formatDistance(toCircleArea(geometry).radiusMeters),
      font: '600 13px system-ui, sans-serif',
      fill: new Fill({ color: '#1f2328' }),
      stroke: new Stroke({ color: '#ffffff', width: 3 }),
      offsetY: -14,
    }),
  });
  return [...base, label];
}
