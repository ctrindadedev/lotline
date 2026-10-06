import { messages } from '../../../shared/i18n/messages';
import type { CircleArea } from '../../../shared/map/geodesy';
import type { GeoJsonPolygon } from '../../../shared/map/geojson';
import type { DrawShape } from '../../../shared/map/useDrawInteraction';

export type InteractionState =
  | { mode: 'idle' }
  | { mode: 'drawingPlot' }
  | { mode: 'drawingSearch' }
  | { mode: 'editingPlot'; boundary: GeoJsonPolygon }
  | { mode: 'searching'; area: CircleArea };

export type InteractionMode = InteractionState['mode'];

export type InteractionEvent =
  | { type: 'drawPlot' }
  | { type: 'drawSearch' }
  | { type: 'cancel' }
  | { type: 'plotDrawn'; boundary: GeoJsonPolygon }
  | { type: 'plotSaved' }
  | { type: 'circleDrawn'; area: CircleArea };

const TRANSITIONS: Record<
  InteractionMode,
  Partial<Record<InteractionEvent['type'], InteractionMode>>
> = {
  idle: { drawPlot: 'drawingPlot', drawSearch: 'drawingSearch' },
  drawingPlot: { drawSearch: 'drawingSearch', cancel: 'idle', plotDrawn: 'editingPlot' },
  drawingSearch: { drawPlot: 'drawingPlot', cancel: 'idle', circleDrawn: 'searching' },
  editingPlot: {
    drawPlot: 'drawingPlot',
    drawSearch: 'drawingSearch',
    cancel: 'idle',
    plotSaved: 'idle',
  },
  searching: { drawPlot: 'drawingPlot', drawSearch: 'drawingSearch', cancel: 'idle' },
};

export const INITIAL_INTERACTION: InteractionState = { mode: 'idle' };

/** An event the current mode does not handle leaves the state unchanged. */
export function nextInteractionState(
  state: InteractionState,
  event: InteractionEvent,
): InteractionState {
  const mode = TRANSITIONS[state.mode][event.type];
  if (!mode) {
    return state;
  }
  if (mode === 'editingPlot') {
    return event.type === 'plotDrawn' ? { mode, boundary: event.boundary } : state;
  }
  if (mode === 'searching') {
    return event.type === 'circleDrawn' ? { mode, area: event.area } : state;
  }
  return { mode };
}

export function drawShapeFor(mode: InteractionMode): DrawShape | null {
  switch (mode) {
    case 'drawingPlot':
      return 'Polygon';
    case 'drawingSearch':
      return 'Circle';
    case 'idle':
    case 'editingPlot':
    case 'searching':
      return null;
  }
}

/** The toolbar button shown as pressed: editing a plot still belongs to "List a plot". */
export function toolbarModeFor(mode: InteractionMode): 'drawingPlot' | 'drawingSearch' | null {
  switch (mode) {
    case 'drawingPlot':
    case 'editingPlot':
      return 'drawingPlot';
    case 'drawingSearch':
    case 'searching':
      return 'drawingSearch';
    case 'idle':
      return null;
  }
}

export function interactionHint(mode: InteractionMode): string {
  switch (mode) {
    case 'drawingPlot':
      return messages.hints.drawingPlot;
    case 'drawingSearch':
      return messages.hints.drawingSearch;
    case 'editingPlot':
      return messages.hints.editingPlot;
    case 'searching':
      return messages.hints.searching;
    case 'idle':
      return messages.hints.idle;
  }
}
