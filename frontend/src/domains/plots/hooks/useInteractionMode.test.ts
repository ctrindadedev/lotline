import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { GeoJsonPolygon } from '../../../shared/map/geojson';
import { useInteractionMode } from './useInteractionMode';

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

describe('useInteractionMode', () => {
  it('starts idle and follows the toolbar actions', () => {
    const { result } = renderHook(() => useInteractionMode());
    expect(result.current.mode).toBe('idle');

    act(() => result.current.drawPlot());
    expect(result.current.mode).toBe('drawingPlot');

    act(() => result.current.drawSearch());
    expect(result.current.mode).toBe('drawingSearch');

    act(() => result.current.cancel());
    expect(result.current.mode).toBe('idle');
  });

  it('edits a drawn plot until it is saved', () => {
    const { result } = renderHook(() => useInteractionMode());

    act(() => result.current.drawPlot());
    act(() => result.current.plotDrawn(BOUNDARY));
    expect(result.current.state).toEqual({ mode: 'editingPlot', boundary: BOUNDARY });

    act(() => result.current.plotSaved());
    expect(result.current.mode).toBe('idle');
  });
});
