import { describe, expect, it } from 'vitest';
import type { GeoJsonPolygon } from '../../../shared/map/geojson';
import {
  drawShapeFor,
  interactionHint,
  nextInteractionState,
  toolbarModeFor,
  type InteractionEvent,
  type InteractionMode,
  type InteractionState,
} from './interactionMode';

const BOUNDARY: GeoJsonPolygon = {
  type: 'Polygon',
  coordinates: [
    [
      [-47, -22],
      [-46.99, -22],
      [-46.99, -21.99],
      [-47, -22],
    ],
  ],
};

const AREA = { center: [-47.06, -22.9] as [number, number], radiusMeters: 1500 };

const STATES: Record<InteractionMode, InteractionState> = {
  idle: { mode: 'idle' },
  drawingPlot: { mode: 'drawingPlot' },
  drawingSearch: { mode: 'drawingSearch' },
  editingPlot: { mode: 'editingPlot', boundary: BOUNDARY },
  searching: { mode: 'searching', area: AREA },
};

const EVENTS: Record<InteractionEvent['type'], InteractionEvent> = {
  drawPlot: { type: 'drawPlot' },
  drawSearch: { type: 'drawSearch' },
  cancel: { type: 'cancel' },
  plotDrawn: { type: 'plotDrawn', boundary: BOUNDARY },
  plotSaved: { type: 'plotSaved' },
  circleDrawn: { type: 'circleDrawn', area: AREA },
};

describe('nextInteractionState', () => {
  it.each<[InteractionMode, InteractionEvent['type'], InteractionMode]>([
    ['idle', 'drawPlot', 'drawingPlot'],
    ['idle', 'drawSearch', 'drawingSearch'],
    ['drawingPlot', 'drawSearch', 'drawingSearch'],
    ['drawingPlot', 'cancel', 'idle'],
    ['drawingPlot', 'plotDrawn', 'editingPlot'],
    ['drawingSearch', 'drawPlot', 'drawingPlot'],
    ['drawingSearch', 'cancel', 'idle'],
    ['editingPlot', 'drawPlot', 'drawingPlot'],
    ['editingPlot', 'drawSearch', 'drawingSearch'],
    ['editingPlot', 'cancel', 'idle'],
    ['editingPlot', 'plotSaved', 'idle'],
    ['drawingSearch', 'circleDrawn', 'searching'],
    ['searching', 'drawSearch', 'drawingSearch'],
    ['searching', 'drawPlot', 'drawingPlot'],
    ['searching', 'cancel', 'idle'],
  ])('%s + %s -> %s', (mode, event, expected) => {
    expect(nextInteractionState(STATES[mode], EVENTS[event]).mode).toBe(expected);
  });

  it.each<[InteractionMode, InteractionEvent['type']]>([
    ['idle', 'cancel'],
    ['idle', 'plotDrawn'],
    ['idle', 'plotSaved'],
    ['drawingPlot', 'drawPlot'],
    ['drawingPlot', 'plotSaved'],
    ['drawingSearch', 'drawSearch'],
    ['drawingSearch', 'plotDrawn'],
    ['editingPlot', 'plotDrawn'],
    ['editingPlot', 'circleDrawn'],
    ['idle', 'circleDrawn'],
    ['drawingPlot', 'circleDrawn'],
    ['searching', 'circleDrawn'],
    ['searching', 'plotDrawn'],
    ['searching', 'plotSaved'],
  ])('ignores %s + %s', (mode, event) => {
    expect(nextInteractionState(STATES[mode], EVENTS[event])).toBe(STATES[mode]);
  });

  it('keeps the drawn circle while its results are shown', () => {
    expect(nextInteractionState(STATES.drawingSearch, EVENTS.circleDrawn)).toEqual({
      mode: 'searching',
      area: AREA,
    });
  });

  it('keeps the drawn boundary while the plot is being edited', () => {
    expect(nextInteractionState(STATES.drawingPlot, EVENTS.plotDrawn)).toEqual({
      mode: 'editingPlot',
      boundary: BOUNDARY,
    });
  });
});

describe('drawShapeFor', () => {
  it('draws a polygon for a plot, a circle for a search and nothing otherwise', () => {
    expect(drawShapeFor('drawingPlot')).toBe('Polygon');
    expect(drawShapeFor('drawingSearch')).toBe('Circle');
    expect(drawShapeFor('idle')).toBeNull();
    expect(drawShapeFor('editingPlot')).toBeNull();
    expect(drawShapeFor('searching')).toBeNull();
  });
});

describe('toolbarModeFor', () => {
  it('keeps "List a plot" pressed while the drawn plot is edited', () => {
    expect(toolbarModeFor('drawingPlot')).toBe('drawingPlot');
    expect(toolbarModeFor('editingPlot')).toBe('drawingPlot');
    expect(toolbarModeFor('drawingSearch')).toBe('drawingSearch');
    expect(toolbarModeFor('searching')).toBe('drawingSearch');
    expect(toolbarModeFor('idle')).toBeNull();
  });
});

describe('interactionHint', () => {
  it('tells the user what to do in each mode', () => {
    expect(interactionHint('idle')).toMatch(/^Pan and zoom/);
    expect(interactionHint('drawingPlot')).toMatch(/corners/);
    expect(interactionHint('drawingSearch')).toMatch(/radius/);
    expect(interactionHint('editingPlot')).toMatch(/details/);
    expect(interactionHint('searching')).toMatch(/filters/);
  });
});
