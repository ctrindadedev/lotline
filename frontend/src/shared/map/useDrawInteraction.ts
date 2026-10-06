import type OlMap from 'ol/Map';
import Draw from 'ol/interaction/Draw';
import { useEffect } from 'react';

export type DrawShape = 'Polygon' | 'Circle';

/** Keeps at most one draw interaction on the map: the one for `shape`, or none. */
export function useDrawInteraction(map: OlMap | null, shape: DrawShape | null) {
  useEffect(() => {
    if (!map || !shape) {
      return;
    }
    const draw = new Draw({ type: shape });
    map.addInteraction(draw);
    return () => {
      map.removeInteraction(draw);
    };
  }, [map, shape]);
}
