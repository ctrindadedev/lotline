import { getWidth } from 'ol/extent';
import { get as getProjection } from 'ol/proj';

const WORLD_WIDTH = getWidth(getProjection('EPSG:3857')!.getExtent());

/**
 * The map repeats the world sideways, so map x can lie on a copy. This is the multiple of the
 * world width to subtract from `x` to land on the main copy, where all data lives.
 */
export function worldCopyOffset(x: number): number {
  return Math.round(x / WORLD_WIDTH) * WORLD_WIDTH;
}
