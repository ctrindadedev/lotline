import type OlMap from 'ol/Map';
import Circle from 'ol/geom/Circle';
import Polygon from 'ol/geom/Polygon';
import Draw, { type DrawEvent } from 'ol/interaction/Draw';
import { useEffect, useEffectEvent } from 'react';
import { toCircleArea, type CircleArea } from './geodesy';
import { toGeoJsonPolygon, type GeoJsonPolygon } from './geojson';
import { radiusLabelStyle } from './styles';

export type DrawShape = 'Polygon' | 'Circle';

interface DrawHandlers {
  onPolygon?: (polygon: GeoJsonPolygon) => void;
  onCircle?: (circle: CircleArea) => void;
}

/** Keeps at most one draw interaction on the map: the one for `shape`, or none. */
export function useDrawInteraction(
  map: OlMap | null,
  shape: DrawShape | null,
  { onPolygon, onCircle }: DrawHandlers = {},
) {
  const handleDrawEnd = useEffectEvent((event: DrawEvent) => {
    const geometry = event.feature.getGeometry();
    if (geometry instanceof Polygon) {
      onPolygon?.(toGeoJsonPolygon(geometry));
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
    const draw = new Draw({
      type: shape,
      style: shape === 'Circle' ? radiusLabelStyle : undefined,
    });
    draw.on('drawend', handleDrawEnd);
    map.addInteraction(draw);
    return () => {
      map.removeInteraction(draw);
    };
  }, [map, shape]);
}
