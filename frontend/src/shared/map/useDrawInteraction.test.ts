import OlMap from 'ol/Map';
import Draw from 'ol/interaction/Draw';
import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useDrawInteraction, type DrawShape } from './useDrawInteraction';

function draws(map: OlMap) {
  return map
    .getInteractions()
    .getArray()
    .filter((interaction) => interaction instanceof Draw);
}

describe('useDrawInteraction', () => {
  it('keeps exactly one draw interaction, replacing it when the shape changes', () => {
    const map = new OlMap({});
    const { rerender } = renderHook(({ shape }) => useDrawInteraction(map, shape), {
      initialProps: { shape: 'Polygon' as DrawShape | null },
    });
    const [polygonDraw] = draws(map);
    expect(draws(map)).toHaveLength(1);

    rerender({ shape: 'Circle' });
    expect(draws(map)).toHaveLength(1);
    expect(draws(map)[0]).not.toBe(polygonDraw);

    rerender({ shape: null });
    expect(draws(map)).toHaveLength(0);
  });

  it('removes its interaction when unmounted and does nothing without a map', () => {
    const map = new OlMap({});
    const { unmount } = renderHook(() => useDrawInteraction(map, 'Polygon'));

    unmount();
    renderHook(() => useDrawInteraction(null, 'Polygon'));

    expect(draws(map)).toHaveLength(0);
  });
});
