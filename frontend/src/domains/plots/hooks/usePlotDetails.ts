import type OlMap from 'ol/Map';
import type VectorSource from 'ol/source/Vector';
import { useState } from 'react';
import { useFeatureClick, type FeatureClick } from '../../../shared/map/useFeatureClick';
import { useMapOverlay } from '../../../shared/map/useMapOverlay';
import type { PlotFeatureCollection } from '../types';

/** The plot clicked on the map, looked up in the plots already loaded: no extra request. */
export function usePlotDetails(
  map: OlMap | null,
  source: VectorSource,
  plots: PlotFeatureCollection | undefined,
  enabled: boolean,
) {
  const [selection, setSelection] = useState<FeatureClick | null>(null);
  useFeatureClick(map, source, enabled, setSelection);

  const plot =
    enabled && selection ? (plots?.features.find((f) => f.id === selection.id) ?? null) : null;
  // Forget a click whose plot is gone, so it cannot reopen (and pan the map) on a later reload.
  if (selection && !plot) {
    setSelection(null);
  }
  const overlayElement = useMapOverlay(map, plot ? selection!.coordinate : null);

  return { plot, overlayElement, close: () => setSelection(null) };
}
