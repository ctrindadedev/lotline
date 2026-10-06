import OlMap from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import { fromLonLat } from 'ol/proj';
import OSM from 'ol/source/OSM';
import { useEffect, useRef, useState } from 'react';
import type { Position } from './geojson';

export const INITIAL_CENTER: Position = [-47.06, -22.9];
export const INITIAL_ZOOM = 13;

export function useMap() {
  const targetRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<OlMap | null>(null);

  useEffect(() => {
    const instance = new OlMap({
      target: targetRef.current ?? undefined,
      layers: [new TileLayer({ source: new OSM() })],
      view: new View({ center: fromLonLat(INITIAL_CENTER), zoom: INITIAL_ZOOM }),
    });
    setMap(instance);
    return () => {
      instance.setTarget(undefined);
      setMap(null);
    };
  }, []);

  return { targetRef, map };
}
