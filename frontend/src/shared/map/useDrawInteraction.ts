import type OlMap from 'ol/Map';
import Polygon from 'ol/geom/Polygon';
import Draw, { type DrawEvent } from 'ol/interaction/Draw';
import { useEffect, useEffectEvent } from 'react';
import { toGeoJsonPolygon, type GeoJsonPolygon } from './geojson';

export type DrawShape = 'Polygon' | 'Circle';

interface DrawHandlers {
  onPolygon?: (polygon: GeoJsonPolygon) => void;
}

/** Keeps at most one draw interaction on the map: the one for `shape`, or none. */
export function useDrawInteraction(
  map: OlMap | null,
  shape: DrawShape | null,
  { onPolygon }: DrawHandlers = {},
) {
  const handleDrawEnd = useEffectEvent((event: DrawEvent) => {
    const geometry = event.feature.getGeometry();
    if (geometry instanceof Polygon) {
      onPolygon?.(toGeoJsonPolygon(geometry));
    }
  });

  useEffect(() => {
    if (!map || !shape) {
      return;
    }
    const draw = new Draw({ type: shape });
    draw.on('drawend', handleDrawEnd);
    map.addInteraction(draw);
    return () => {
      map.removeInteraction(draw);
    };
  }, [map, shape]);
}
