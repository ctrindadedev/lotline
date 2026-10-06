import { useMap } from '../../../shared/map/useMap';
import { useMapViewport } from '../../../shared/map/useMapViewport';
import { useVectorLayer } from '../../../shared/map/useVectorLayer';
import { describePlotsInView } from '../utils/describePlotsInView';
import { usePlotsInView } from './usePlotsInView';

export function useMapPage() {
  const { targetRef, map } = useMap();
  const viewport = useMapViewport(map);
  const plotsInView = usePlotsInView(viewport);
  useVectorLayer(map, plotsInView.plots);

  return { mapTargetRef: targetRef, plotsStatus: describePlotsInView(plotsInView) };
}
