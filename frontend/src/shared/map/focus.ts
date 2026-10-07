import type OlMap from 'ol/Map';
import type { Coordinate } from 'ol/coordinate';
import { getCenter, getTopLeft } from 'ol/extent';
import Polygon from 'ol/geom/Polygon';
import { fromLonLat } from 'ol/proj';
import type { GeoJsonPolygon } from './geojson';

// Room above the polygon for a popup anchored to its top edge.
const PADDING = [300, 60, 40, 60];
const MAX_ZOOM = 16;

function toMapPolygon(polygon: GeoJsonPolygon): Polygon {
  return new Polygon(
    polygon.coordinates.map((ring) => ring.map((position) => fromLonLat(position))),
  );
}

/** The middle of the polygon's top edge, in map coordinates: a popup there leaves it visible. */
export function anchorOf(polygon: GeoJsonPolygon): Coordinate {
  const extent = toMapPolygon(polygon).getExtent();
  return [getCenter(extent)[0], getTopLeft(extent)[1]];
}

/**
 * Moves and zooms the map so the polygon fills the view, without zooming in past street level
 * nor out past `minZoom` (a huge plot is then centred, not shown whole).
 */
export function fitMapTo(map: OlMap, polygon: GeoJsonPolygon, minZoom = 0) {
  const view = map.getView();
  view.fit(toMapPolygon(polygon), { size: map.getSize(), padding: PADDING, maxZoom: MAX_ZOOM });
  if ((view.getZoom() ?? minZoom) < minZoom) {
    view.setZoom(minZoom);
  }
}
