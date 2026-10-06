import type MapBrowserEvent from 'ol/MapBrowserEvent';
import type OlMap from 'ol/Map';
import type { Coordinate } from 'ol/coordinate';
import { unByKey } from 'ol/Observable';
import type VectorSource from 'ol/source/Vector';
import { useEffect, useEffectEvent } from 'react';
import { worldCopyOffset } from './worldCopies';

export interface FeatureClick {
  id: string;
  coordinate: Coordinate;
}

/** Reports the feature of `source` under a single click, or null for empty map. */
export function useFeatureClick(
  map: OlMap | null,
  source: VectorSource,
  enabled: boolean,
  onClick: (click: FeatureClick | null) => void,
) {
  const handleClick = useEffectEvent((event: MapBrowserEvent) => {
    const [x, y] = event.coordinate;
    const [feature] = source.getFeaturesAtCoordinate([x - worldCopyOffset(x), y]);
    const id = feature?.getId();
    onClick(id === undefined ? null : { id: String(id), coordinate: event.coordinate });
  });

  useEffect(() => {
    if (!map || !enabled) {
      return;
    }
    const key = map.on('singleclick', handleClick);
    return () => unByKey(key);
  }, [map, enabled]);
}
