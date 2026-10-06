import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useInteractionMode } from './useInteractionMode';

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
});
