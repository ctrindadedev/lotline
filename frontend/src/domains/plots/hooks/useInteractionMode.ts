import { useReducer } from 'react';
import type { CircleArea } from '../../../shared/map/geodesy';
import type { GeoJsonPolygon } from '../../../shared/map/geojson';
import { INITIAL_INTERACTION, nextInteractionState } from '../utils/interactionMode';

export function useInteractionMode() {
  const [state, dispatch] = useReducer(nextInteractionState, INITIAL_INTERACTION);

  return {
    state,
    mode: state.mode,
    drawPlot: () => dispatch({ type: 'drawPlot' }),
    drawSearch: () => dispatch({ type: 'drawSearch' }),
    cancel: () => dispatch({ type: 'cancel' }),
    plotDrawn: (boundary: GeoJsonPolygon) => dispatch({ type: 'plotDrawn', boundary }),
    plotSaved: () => dispatch({ type: 'plotSaved' }),
    circleDrawn: (area: CircleArea) => dispatch({ type: 'circleDrawn', area }),
  };
}
