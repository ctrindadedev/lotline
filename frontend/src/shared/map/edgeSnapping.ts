import { closestOnSegment, squaredDistance } from 'ol/coordinate';
import type { Position } from './geojson';

/**
 * About 1.1 m. OpenLayers snaps onto the straight edge in Web Mercator, which bows off the
 * straight lon/lat edge the API stores: 6 mm off on a 1.4 km diagonal, 57 cm on a 14 km one.
 */
export const EDGE_SNAP_TOLERANCE_DEGREES = 1e-5;

/**
 * Moves every vertex that lies within the tolerance of a neighbour's edge exactly onto that
 * edge, measured in degrees. A plot that follows its neighbour then shares the border instead
 * of overlapping it by a sliver (ADR 0008).
 */
export function snapRingsToEdges(
  rings: Position[][],
  neighbours: Position[][][],
  tolerance = EDGE_SNAP_TOLERANCE_DEGREES,
): Position[][] {
  const segments = neighbours.flatMap((polygon) =>
    polygon.flatMap((ring) => ring.slice(1).map((end, i) => [ring[i], end])),
  );
  const maxSquared = tolerance * tolerance;
  return rings.map((ring) =>
    ring.map((vertex) => {
      let best: Position = vertex;
      let bestSquared = maxSquared;
      for (const segment of segments) {
        const candidate = closestOnSegment(vertex, segment) as Position;
        const squared = squaredDistance(vertex, candidate);
        if (squared <= bestSquared) {
          best = candidate;
          bestSquared = squared;
        }
      }
      return best;
    }),
  );
}
