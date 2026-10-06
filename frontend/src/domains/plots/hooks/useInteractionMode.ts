import { useReducer } from 'react';
import { nextInteractionMode } from '../utils/interactionMode';

export function useInteractionMode() {
  const [mode, dispatch] = useReducer(nextInteractionMode, 'idle');

  return {
    mode,
    drawPlot: () => dispatch({ type: 'drawPlot' }),
    drawSearch: () => dispatch({ type: 'drawSearch' }),
    cancel: () => dispatch({ type: 'cancel' }),
  };
}
