import { draftStyle } from '../../../shared/map/styles';
import { useDrawInteraction } from '../../../shared/map/useDrawInteraction';
import { useMap } from '../../../shared/map/useMap';
import { useMapViewport } from '../../../shared/map/useMapViewport';
import { useVectorLayer } from '../../../shared/map/useVectorLayer';
import { describePlotsInView } from '../utils/describePlotsInView';
import { drawShapeFor, interactionHint } from '../utils/interactionMode';
import { useInteractionMode } from './useInteractionMode';
import { usePlotRegistration } from './usePlotRegistration';
import { usePlotsInView } from './usePlotsInView';

export function useMapPage() {
  const { targetRef, map } = useMap();
  const viewport = useMapViewport(map);
  const plotsInView = usePlotsInView(viewport);
  const interaction = useInteractionMode();
  const registration = usePlotRegistration(interaction);
  const { mode } = interaction;

  useVectorLayer(map, plotsInView.plots);
  useVectorLayer(map, registration.draft, draftStyle);
  useDrawInteraction(map, drawShapeFor(mode), { onPolygon: interaction.plotDrawn });

  return {
    mapTargetRef: targetRef,
    plotsStatus: describePlotsInView(plotsInView),
    mode,
    hint: interactionHint(mode),
    toolbar: {
      drawPlot: () => {
        registration.discard();
        interaction.drawPlot();
      },
      drawSearch: () => {
        registration.discard();
        interaction.drawSearch();
      },
      cancel: registration.cancel,
      disabled: registration.isSaving,
    },
    plotForm: registration.form,
    notice: registration.notice,
    dismissNotice: registration.dismissNotice,
  };
}
