import Feature from 'ol/Feature';
import Circle from 'ol/geom/Circle';
import Point from 'ol/geom/Point';
import { fromLonLat } from 'ol/proj';
import { describe, expect, it } from 'vitest';
import { radiusLabelStyle } from './styles';

describe('radiusLabelStyle', () => {
  it('labels a circle being drawn with its radius in metres', () => {
    const circle = new Circle(fromLonLat([-47.06, -22.9]), 2000);

    const styles = radiusLabelStyle(new Feature(circle));
    const label = styles.at(-1)!;

    expect(label.getText()?.getText()).toBe('1.8 km');
    expect((label.getGeometry() as Point).getCoordinates()).toEqual(circle.getCenter());
  });

  it('keeps the default sketch style for the pointer', () => {
    const styles = radiusLabelStyle(new Feature(new Point([0, 0])));

    expect(styles.length).toBeGreaterThan(0);
    expect(styles.every((style) => !style.getText())).toBe(true);
  });
});
