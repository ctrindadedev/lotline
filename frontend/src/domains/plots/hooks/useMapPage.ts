import { useNavigate } from 'react-router';
import { useCurrentUser, type AuthRedirect } from '../../auth';
import { isTyping, useKeyDown } from '../../../shared/hooks/useKeyDown';
import { messages } from '../../../shared/i18n/messages';
import {
  draftStyle,
  polygonStyle,
  reservedPolygonStyle,
  searchAreaStyle,
  soldPolygonStyle,
  styleByProperty,
} from '../../../shared/map/styles';
import { useDrawInteraction } from '../../../shared/map/useDrawInteraction';
import { useMap } from '../../../shared/map/useMap';
import { useMapViewport } from '../../../shared/map/useMapViewport';
import { useVectorLayer } from '../../../shared/map/useVectorLayer';
import { describePlotsInView } from '../utils/describePlotsInView';
import { drawShapeFor, interactionHint } from '../utils/interactionMode';
import { shortcutFor } from '../utils/shortcuts';
import { useInteractionMode } from './useInteractionMode';
import { usePlotDetails } from './usePlotDetails';
import { usePlotManagement } from './usePlotManagement';
import { usePlotRegistration } from './usePlotRegistration';
import { usePlotReservation } from './usePlotReservation';
import { usePlotSearch } from './usePlotSearch';
import { usePlotsInView } from './usePlotsInView';
import type { PlotPopupAction } from '../components/PlotPopup';

const plotStyle = styleByProperty(
  'status',
  { RESERVED: reservedPolygonStyle, SOLD: soldPolygonStyle },
  polygonStyle,
);

export function useMapPage() {
  const { targetRef, map } = useMap();
  const viewport = useMapViewport(map);
  const plotsInView = usePlotsInView(viewport);
  const interaction = useInteractionMode();
  const { user, isLoading: userLoading } = useCurrentUser();
  const navigate = useNavigate();
  const registration = usePlotRegistration(interaction);
  const search = usePlotSearch(interaction);
  const { mode } = interaction;
  const searching = mode === 'searching';
  const shownPlots = searching ? search.results : plotsInView.plots;

  useVectorLayer(map, search.circle, searchAreaStyle);
  const plotsSource = useVectorLayer(map, shownPlots, plotStyle);
  useVectorLayer(map, registration.draft, draftStyle);
  const details = usePlotDetails(map, plotsSource, shownPlots, mode === 'idle' || searching);
  const management = usePlotManagement(details.plot);
  const reservation = usePlotReservation(details.plot);
  const popupActions: PlotPopupAction[] = [
    ...reservation.actions.map(({ label, run }) => ({ label, onClick: run })),
    ...(management.canManage
      ? [
          { label: messages.popup.edit, onClick: management.startEdit },
          {
            label: messages.popup.delete,
            onClick: management.startDelete,
            color: 'error' as const,
          },
        ]
      : []),
  ];
  const draw = useDrawInteraction(map, drawShapeFor(mode), {
    onPolygon: interaction.plotDrawn,
    onCircle: interaction.circleDrawn,
    snapTo: plotsSource,
  });

  function leaveFor(next: () => void) {
    details.close();
    registration.discard();
    next();
  }

  const cancel = () => leaveFor(registration.cancel);

  useKeyDown((event) => {
    const action = shortcutFor(
      {
        key: event.key,
        ctrlKey: event.ctrlKey,
        metaKey: event.metaKey,
        shiftKey: event.shiftKey,
        typing: isTyping(event.target),
      },
      mode,
      details.plot !== null,
    );
    if (!action) {
      return;
    }
    event.preventDefault();
    if (action === 'cancel') {
      cancel();
    } else if (action === 'undoLastPoint') {
      draw.undoLastPoint();
    } else {
      details.close();
    }
  });

  return {
    mapTargetRef: targetRef,
    plotsStatus: describePlotsInView(plotsInView),
    mode,
    hint: interactionHint(mode),
    toolbar: {
      drawPlot: () => {
        if (userLoading) {
          return;
        }
        if (!user) {
          const redirect: AuthRedirect = { from: '/', reason: 'listPlot' };
          navigate('/login', { state: redirect });
          return;
        }
        leaveFor(interaction.drawPlot);
      },
      drawSearch: () => leaveFor(interaction.drawSearch),
      cancel,
      disabled: registration.isSaving,
    },
    drawing:
      mode === 'drawingPlot' || mode === 'drawingSearch'
        ? { canUndo: mode === 'drawingPlot', undoLastPoint: draw.undoLastPoint }
        : null,
    plotForm: registration.form,
    searchPanel: search.panel && {
      ...search.panel,
      newSearch: () => leaveFor(interaction.drawSearch),
    },
    details: {
      plot: details.plot,
      overlayElement: details.overlayElement,
      close: details.close,
      actions: popupActions,
      busy: reservation.isBusy,
    },
    management,
    sale: reservation.sale,
    notice: registration.notice ?? management.notice ?? reservation.notice,
    dismissNotice: () => {
      registration.dismissNotice();
      management.dismissNotice();
      reservation.dismissNotice();
    },
  };
}
