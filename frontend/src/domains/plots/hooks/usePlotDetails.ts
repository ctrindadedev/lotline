import type OlMap from 'ol/Map';
import type VectorSource from 'ol/source/Vector';
import { useState } from 'react';
import { anchorOf, fitMapTo } from '../../../shared/map/focus';
import { useFeatureClick, type FeatureClick } from '../../../shared/map/useFeatureClick';
import { useMapOverlay } from '../../../shared/map/useMapOverlay';
import type { PlotFeature } from '../types';

/**
 * The plot clicked on the map or picked from a list, looked up in the plots already loaded: no
 * extra request, and the details follow every reload.
 */
export function usePlotDetails(
  map: OlMap | null,
  source: VectorSource,
  plots: PlotFeature[],
  enabled: boolean,
  minZoom = 0,
) {
  const [selection, setSelection] = useState<FeatureClick | null>(null);
  useFeatureClick(map, source, enabled, setSelection);

  const plot = enabled && selection ? (plots.find((f) => f.id === selection.id) ?? null) : null;
  // Forget a click whose plot is gone, so it cannot reopen (and pan the map) on a later reload.
  if (selection && !plot) {
    setSelection(null);
  }
  const overlayElement = useMapOverlay(map, plot ? selection!.coordinate : null);

  function select(picked: PlotFeature) {
    if (map) {
      fitMapTo(map, picked.geometry, minZoom);
    }
    setSelection({ id: picked.id, coordinate: anchorOf(picked.geometry) });
  }

  return { plot, overlayElement, select, close: () => setSelection(null) };
}
