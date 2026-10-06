import type OlMap from 'ol/Map';
import { useEffect, useState } from 'react';
import { toBoundingBox, type BoundingBox } from './geojson';

export interface MapViewport {
  bbox: BoundingBox;
  zoom: number;
}

export function readViewport(map: OlMap): MapViewport | null {
  const size = map.getSize();
  const view = map.getView();
  const zoom = view.getZoom();
  if (!size || size[0] === 0 || size[1] === 0 || zoom === undefined) {
    return null;
  }
  return { bbox: toBoundingBox(view.calculateExtent(size)), zoom };
}

export function useMapViewport(map: OlMap | null): MapViewport | null {
  const [viewport, setViewport] = useState<MapViewport | null>(null);

  useEffect(() => {
    if (!map) {
      return;
    }
    const update = () => setViewport(readViewport(map));
    update();
    map.on('moveend', update);
    return () => {
      map.un('moveend', update);
      setViewport(null);
    };
  }, [map]);

  return viewport;
}
