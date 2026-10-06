import { useDrawInteraction } from '../../../shared/map/useDrawInteraction';
import { useMap } from '../../../shared/map/useMap';
import { useMapViewport } from '../../../shared/map/useMapViewport';
import { useVectorLayer } from '../../../shared/map/useVectorLayer';
import { describePlotsInView } from '../utils/describePlotsInView';
import { drawShapeFor, interactionHint } from '../utils/interactionMode';
import { useInteractionMode } from './useInteractionMode';
import { usePlotsInView } from './usePlotsInView';

export function useMapPage() {
  const { targetRef, map } = useMap();
  const viewport = useMapViewport(map);
  const plotsInView = usePlotsInView(viewport);
  const interaction = useInteractionMode();
  useVectorLayer(map, plotsInView.plots);
  useDrawInteraction(map, drawShapeFor(interaction.mode));

  return {
    mapTargetRef: targetRef,
    plotsStatus: describePlotsInView(plotsInView),
    interaction,
    hint: interactionHint(interaction.mode),
  };
}
