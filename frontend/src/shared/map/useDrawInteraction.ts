import type OlMap from 'ol/Map';
import Circle from 'ol/geom/Circle';
import Polygon from 'ol/geom/Polygon';
import Draw, { type DrawEvent } from 'ol/interaction/Draw';
import Snap from 'ol/interaction/Snap';
import type VectorSource from 'ol/source/Vector';
import { useCallback, useEffect, useEffectEvent, useRef } from 'react';
import { toCircleArea, type CircleArea } from './geodesy';
import { toGeoJsonPolygon, type GeoJsonPolygon } from './geojson';
import { sketchLabelStyle } from './styles';

export type DrawShape = 'Polygon' | 'Circle';

interface DrawOptions {
  onPolygon?: (polygon: GeoJsonPolygon) => void;
  onCircle?: (circle: CircleArea) => void;
  /** Polygons snap to the vertices and edges of these features while being drawn. */
  snapTo?: VectorSource;
}

/** Keeps at most one draw interaction on the map: the one for `shape`, or none. */
export function useDrawInteraction(
  map: OlMap | null,
  shape: DrawShape | null,
  { onPolygon, onCircle, snapTo }: DrawOptions = {},
) {
  const drawRef = useRef<Draw | null>(null);

  const handleDrawEnd = useEffectEvent((event: DrawEvent) => {
    const geometry = event.feature.getGeometry();
    if (geometry instanceof Polygon) {
      onPolygon?.(toGeoJsonPolygon(geometry, neighbourPolygons(snapTo)));
    } else if (geometry instanceof Circle) {
      const circle = toCircleArea(geometry);
      if (circle.radiusMeters > 0) {
        onCircle?.(circle);
      }
    }
  });

  useEffect(() => {
    if (!map || !shape) {
      return;
    }
    const draw = new Draw({ type: shape, style: sketchLabelStyle });
    draw.on('drawend', handleDrawEnd);
    map.addInteraction(draw);
    // Snap must be added after Draw, so it adjusts the pointer before Draw sees it.
    const snap = shape === 'Polygon' && snapTo ? new Snap({ source: snapTo }) : null;
    if (snap) {
      map.addInteraction(snap);
    }
    drawRef.current = draw;
    return () => {
      map.removeInteraction(draw);
      if (snap) {
        map.removeInteraction(snap);
      }
      drawRef.current = null;
    };
  }, [map, shape, snapTo]);

  const undoLastPoint = useCallback(() => drawRef.current?.removeLastPoint(), []);

  return { undoLastPoint };
}

function neighbourPolygons(source: VectorSource | undefined): Polygon[] {
  return (source?.getFeatures() ?? [])
    .map((feature) => feature.getGeometry())
    .filter((geometry): geometry is Polygon => geometry instanceof Polygon);
}
