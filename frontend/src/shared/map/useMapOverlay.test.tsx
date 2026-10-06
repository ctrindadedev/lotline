import OlMap from 'ol/Map';
import { renderHook } from '@testing-library/react';
import { StrictMode } from 'react';
import { describe, expect, it } from 'vitest';
import { useMapOverlay } from './useMapOverlay';

describe('useMapOverlay', () => {
  it('pins one element, mounted in the map, to the given position, even under StrictMode', () => {
    const map = new OlMap({});
    const { result, rerender } = renderHook(({ position }) => useMapOverlay(map, position), {
      initialProps: { position: [10, 20] as number[] | null },
      wrapper: StrictMode,
    });
    const overlays = map.getOverlays().getArray();

    expect(overlays).toHaveLength(1);
    expect(map.getOverlayContainerStopEvent().contains(result.current)).toBe(true);
    expect(overlays[0].getPosition()).toEqual([10, 20]);

    rerender({ position: null });
    expect(overlays[0].getPosition()).toBeUndefined();
  });

  it('removes the overlay when unmounted and does nothing without a map', () => {
    const map = new OlMap({});
    const { result, unmount } = renderHook(() => useMapOverlay(map, null));

    unmount();
    renderHook(() => useMapOverlay(null, [0, 0]));

    expect(map.getOverlays().getLength()).toBe(0);
    expect(map.getOverlayContainerStopEvent().contains(result.current)).toBe(false);
  });
});
