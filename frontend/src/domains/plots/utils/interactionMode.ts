import type { DrawShape } from '../../../shared/map/useDrawInteraction';

export type InteractionMode = 'idle' | 'drawingPlot' | 'drawingSearch';

export type InteractionEvent = { type: 'drawPlot' } | { type: 'drawSearch' } | { type: 'cancel' };

const TRANSITIONS: Record<
  InteractionMode,
  Partial<Record<InteractionEvent['type'], InteractionMode>>
> = {
  idle: { drawPlot: 'drawingPlot', drawSearch: 'drawingSearch' },
  drawingPlot: { drawSearch: 'drawingSearch', cancel: 'idle' },
  drawingSearch: { drawPlot: 'drawingPlot', cancel: 'idle' },
};

/** An event the current mode does not handle leaves the mode unchanged. */
export function nextInteractionMode(
  mode: InteractionMode,
  event: InteractionEvent,
): InteractionMode {
  return TRANSITIONS[mode][event.type] ?? mode;
}

export function drawShapeFor(mode: InteractionMode): DrawShape | null {
  switch (mode) {
    case 'drawingPlot':
      return 'Polygon';
    case 'drawingSearch':
      return 'Circle';
    case 'idle':
      return null;
  }
}

export function interactionHint(mode: InteractionMode): string {
  switch (mode) {
    case 'drawingPlot':
      return "Click on the map to place the plot's corners. Double-click to finish.";
    case 'drawingSearch':
      return 'Click the centre of the area, then click again to set the radius.';
    case 'idle':
      return 'Pan and zoom the map to explore. Use the toolbar to list a plot or search an area.';
  }
}
