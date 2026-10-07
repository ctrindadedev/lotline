import type { FeatureLike } from 'ol/Feature';
import Circle from 'ol/geom/Circle';
import Point from 'ol/geom/Point';
import Polygon from 'ol/geom/Polygon';
import { getArea } from 'ol/sphere';
import Fill from 'ol/style/Fill';
import Stroke from 'ol/style/Stroke';
import Style, { createEditingStyle } from 'ol/style/Style';
import Text from 'ol/style/Text';
import { formatArea, formatDistance } from '../i18n/format';
import { toCircleArea } from './geodesy';

export const polygonStyle = new Style({
  fill: new Fill({ color: 'rgb(31 111 235 / 20%)' }),
  stroke: new Stroke({ color: '#1f6feb', width: 2 }),
});

/** How a polygon is drawn: stroke and fill colours, stroke width, solid or dashed. */
export interface PolygonLook {
  stroke: string;
  fill: string;
  width: number;
  dashed: boolean;
}

const looks = new Map<string, Style>();

/** One shared `Style` per look, so a style function does not allocate on every render. */
export function polygonLookStyle(look: PolygonLook): Style {
  const key = `${look.stroke}|${look.fill}|${look.width}|${look.dashed}`;
  let style = looks.get(key);
  if (!style) {
    style = new Style({
      fill: new Fill({ color: look.fill }),
      stroke: new Stroke({
        color: look.stroke,
        width: look.width,
        lineDash: look.dashed ? [8, 5] : undefined,
      }),
    });
    looks.set(key, style);
  }
  return style;
}

/** A style function that picks each feature's look from its properties and id. */
export function styleByLook(
  lookOf: (properties: Record<string, unknown>, id: string | number | undefined) => PolygonLook,
): (feature: FeatureLike) => Style {
  return (feature) => polygonLookStyle(lookOf(feature.getProperties(), feature.getId()));
}

export const draftStyle = new Style({
  fill: new Fill({ color: 'rgb(219 109 40 / 25%)' }),
  stroke: new Stroke({ color: '#db6d28', width: 2, lineDash: [6, 4] }),
});

export const searchAreaStyle = new Style({
  fill: new Fill({ color: 'rgb(130 80 223 / 8%)' }),
  stroke: new Stroke({ color: '#8250df', width: 2, lineDash: [8, 6] }),
});

const editingStyles: Record<string, Style[]> = createEditingStyle();

function label(text: string, at: Point): Style {
  return new Style({
    geometry: at,
    text: new Text({
      text,
      font: '600 13px system-ui, sans-serif',
      fill: new Fill({ color: '#1f2328' }),
      stroke: new Stroke({ color: '#ffffff', width: 3 }),
      offsetY: -14,
    }),
  });
}

/** The default sketch style, plus a live measure: a circle's radius or a polygon's area. */
export function sketchLabelStyle(feature: FeatureLike): Style[] {
  const geometry = feature.getGeometry();
  const base = (geometry && editingStyles[geometry.getType()]) || [];
  if (geometry instanceof Circle) {
    const radius = formatDistance(toCircleArea(geometry).radiusMeters);
    return [...base, label(radius, new Point(geometry.getCenter()))];
  }
  if (geometry instanceof Polygon) {
    const area = getArea(geometry);
    return area > 0 ? [...base, label(formatArea(area), geometry.getInteriorPoint())] : base;
  }
  return base;
}
