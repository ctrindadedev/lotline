import { fromLonLat } from 'ol/proj';
import { describe, expect, it } from 'vitest';
import { worldCopyOffset } from './worldCopies';

describe('worldCopyOffset', () => {
  const [x] = fromLonLat([-47, -22]);
  const worldWidth = fromLonLat([180, 0])[0] * 2;

  it('is zero on the main world', () => {
    expect(worldCopyOffset(x)).toBeCloseTo(0);
  });

  it('is a whole number of world widths on a copy', () => {
    expect(worldCopyOffset(x + worldWidth)).toBeCloseTo(worldWidth);
    expect(worldCopyOffset(x - 2 * worldWidth)).toBeCloseTo(-2 * worldWidth);
  });
});
