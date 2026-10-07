import Feature from 'ol/Feature';
import Circle from 'ol/geom/Circle';
import Point from 'ol/geom/Point';
import Polygon from 'ol/geom/Polygon';
import { fromLonLat } from 'ol/proj';
import type Style from 'ol/style/Style';
import { describe, expect, it } from 'vitest';
import { polygonStyle, reservedPolygonStyle, sketchLabelStyle, styleByProperty } from './styles';

function labelOf(styles: Style[]) {
  return styles.at(-1)?.getText()?.getText();
}

describe('sketchLabelStyle', () => {
  it('labels a circle being drawn with its radius in metres on the ground', () => {
    const circle = new Circle(fromLonLat([-47.06, -22.9]), 2000);

    const styles = sketchLabelStyle(new Feature(circle));

    expect(labelOf(styles)).toBe('1,8 km');
    expect((styles.at(-1)!.getGeometry() as Point).getCoordinates()).toEqual(circle.getCenter());
  });

  it('labels a polygon being drawn with its area', () => {
    const corners = [
      [-47, -22],
      [-46.999, -22],
      [-46.999, -21.999],
      [-47, -21.999],
      [-47, -22],
    ].map((c) => fromLonLat(c));

    expect(labelOf(sketchLabelStyle(new Feature(new Polygon([corners]))))).toBe('1,15 ha');
  });

  it('adds no label to a polygon with no area yet, or to the pointer', () => {
    const start = fromLonLat([-47, -22]);
    const flat = new Polygon([[start, start, start]]);

    for (const geometry of [flat, new Point(start)]) {
      const styles = sketchLabelStyle(new Feature(geometry));
      expect(styles.length).toBeGreaterThan(0);
      expect(styles.every((style) => !style.getText())).toBe(true);
    }
  });
});

describe('styleByProperty', () => {
  it('styles a feature by one of its properties, with a fallback', () => {
    const style = styleByProperty('status', { RESERVED: reservedPolygonStyle }, polygonStyle);

    expect(style(new Feature({ status: 'RESERVED' }))).toBe(reservedPolygonStyle);
    expect(style(new Feature({ status: 'AVAILABLE' }))).toBe(polygonStyle);
    expect(style(new Feature())).toBe(polygonStyle);
  });
});
