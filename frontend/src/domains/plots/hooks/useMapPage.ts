import { draftStyle, searchAreaStyle } from '../../../shared/map/styles';
import { useDrawInteraction } from '../../../shared/map/useDrawInteraction';
import { useMap } from '../../../shared/map/useMap';
import { useMapViewport } from '../../../shared/map/useMapViewport';
import { useVectorLayer } from '../../../shared/map/useVectorLayer';
import { describePlotsInView } from '../utils/describePlotsInView';
import { drawShapeFor, interactionHint } from '../utils/interactionMode';
import { useInteractionMode } from './useInteractionMode';
import { usePlotDetails } from './usePlotDetails';
import { usePlotRegistration } from './usePlotRegistration';
import { usePlotSearch } from './usePlotSearch';
import { usePlotsInView } from './usePlotsInView';

export function useMapPage() {
  const { targetRef, map } = useMap();
  const viewport = useMapViewport(map);
  const plotsInView = usePlotsInView(viewport);
  const interaction = useInteractionMode();
  const registration = usePlotRegistration(interaction);
  const search = usePlotSearch(interaction);
  const { mode } = interaction;
  const searching = mode === 'searching';
  const shownPlots = searching ? search.results : plotsInView.plots;

  useVectorLayer(map, search.circle, searchAreaStyle);
  const plotsSource = useVectorLayer(map, shownPlots);
  useVectorLayer(map, registration.draft, draftStyle);
  const details = usePlotDetails(map, plotsSource, shownPlots, mode === 'idle' || searching);
  useDrawInteraction(map, drawShapeFor(mode), {
    onPolygon: interaction.plotDrawn,
    onCircle: interaction.circleDrawn,
  });

  function leaveFor(next: () => void) {
    details.close();
    registration.discard();
    next();
  }

  return {
    mapTargetRef: targetRef,
    plotsStatus: describePlotsInView(plotsInView),
    mode,
    hint: interactionHint(mode),
    toolbar: {
      drawPlot: () => leaveFor(interaction.drawPlot),
      drawSearch: () => leaveFor(interaction.drawSearch),
      cancel: () => leaveFor(registration.cancel),
      disabled: registration.isSaving,
    },
    plotForm: registration.form,
    searchPanel: search.panel && {
      ...search.panel,
      newSearch: () => leaveFor(interaction.drawSearch),
    },
    details: {
      plot: details.plot,
      overlayElement: details.overlayElement,
      close: details.close,
    },
    notice: registration.notice,
    dismissNotice: registration.dismissNotice,
  };
}
