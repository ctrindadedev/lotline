import { describe, expect, it } from 'vitest';
import {
  drawShapeFor,
  interactionHint,
  nextInteractionMode,
  type InteractionEvent,
  type InteractionMode,
} from './interactionMode';

describe('nextInteractionMode', () => {
  it.each<[InteractionMode, InteractionEvent['type'], InteractionMode]>([
    ['idle', 'drawPlot', 'drawingPlot'],
    ['idle', 'drawSearch', 'drawingSearch'],
    ['idle', 'cancel', 'idle'],
    ['drawingPlot', 'drawPlot', 'drawingPlot'],
    ['drawingPlot', 'drawSearch', 'drawingSearch'],
    ['drawingPlot', 'cancel', 'idle'],
    ['drawingSearch', 'drawPlot', 'drawingPlot'],
    ['drawingSearch', 'drawSearch', 'drawingSearch'],
    ['drawingSearch', 'cancel', 'idle'],
  ])('%s + %s -> %s', (mode, event, expected) => {
    expect(nextInteractionMode(mode, { type: event })).toBe(expected);
  });
});

describe('drawShapeFor', () => {
  it('draws a polygon for a plot, a circle for a search and nothing when idle', () => {
    expect(drawShapeFor('drawingPlot')).toBe('Polygon');
    expect(drawShapeFor('drawingSearch')).toBe('Circle');
    expect(drawShapeFor('idle')).toBeNull();
  });
});

describe('interactionHint', () => {
  it('tells the user what to do in each mode', () => {
    expect(interactionHint('idle')).toMatch(/^Pan and zoom/);
    expect(interactionHint('drawingPlot')).toMatch(/corners/);
    expect(interactionHint('drawingSearch')).toMatch(/radius/);
  });
});
