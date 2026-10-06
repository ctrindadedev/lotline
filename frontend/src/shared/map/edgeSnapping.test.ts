import { squaredDistanceToSegment } from 'ol/coordinate';
import { fromLonLat, toLonLat } from 'ol/proj';
import { describe, expect, it } from 'vitest';
import type { Position } from './geojson';
import { EDGE_SNAP_TOLERANCE_DEGREES, snapRingsToEdges } from './edgeSnapping';

// A plot whose east edge is a 1.4 km diagonal: the case where Web Mercator and degrees disagree.
const NEIGHBOUR: Position[][] = [
  [
    [-47.01, -22],
    [-47, -22],
    [-46.99, -22.009],
    [-47.01, -22.009],
    [-47.01, -22],
  ],
];
const DIAGONAL: Position[] = [
  [-47, -22],
  [-46.99, -22.009],
];

/** Where OpenLayers puts a vertex snapped to the middle of the diagonal: on the 3857 line. */
function snappedInMercator(): Position {
  const [a, b] = DIAGONAL.map((p) => fromLonLat(p));
  return toLonLat([(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]) as Position;
}

function distanceToDiagonal(p: Position) {
  return Math.sqrt(squaredDistanceToSegment(p, DIAGONAL));
}

describe('snapRingsToEdges', () => {
  it('starts from a vertex measurably off the lon/lat edge, yet within the tolerance', () => {
    const offset = distanceToDiagonal(snappedInMercator());

    expect(offset).toBeGreaterThan(1e-8);
    expect(offset).toBeLessThan(EDGE_SNAP_TOLERANCE_DEGREES / 10);
  });

  it('moves a vertex snapped in Web Mercator exactly onto the lon/lat edge', () => {
    const vertex = snappedInMercator();
    const ring: Position[] = [vertex, [-46.98, -22.004], [-46.98, -22.01], vertex];

    const [snapped] = snapRingsToEdges([ring], [NEIGHBOUR]);

    expect(distanceToDiagonal(snapped[0])).toBeLessThan(1e-12);
    expect(snapped[3]).toEqual(snapped[0]);
  });

  it("keeps a vertex on a neighbour's corner as it is", () => {
    const ring: Position[] = [
      [-47, -22],
      [-46.98, -22],
      [-46.98, -21.99],
      [-47, -22],
    ];

    expect(snapRingsToEdges([ring], [NEIGHBOUR])).toEqual([ring]);
  });

  it('leaves vertices away from every edge untouched', () => {
    const ring: Position[] = [
      [-46.9, -21.9],
      [-46.89, -21.9],
      [-46.89, -21.89],
      [-46.9, -21.9],
    ];

    expect(snapRingsToEdges([ring], [NEIGHBOUR])).toEqual([ring]);
    expect(snapRingsToEdges([ring], [])).toEqual([ring]);
  });
});
