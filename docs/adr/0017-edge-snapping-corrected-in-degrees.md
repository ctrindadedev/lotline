# 17. Edge snapping corrected in degrees

- **Status:** Accepted
- **Date:** 2026-10-06

## Context

Plots that share a border are allowed; an overlap above 1 m² is rejected with `409` (ADR 0008). To draw a plot along a neighbour, the map snaps the pointer to the neighbour's vertices and edges with OpenLayers' `Snap` interaction.

`Snap` works in the map projection. On an edge it puts the vertex on the straight line in Web Mercator, while the API stores and compares straight lines in longitude/latitude. The two lines coincide on north-south and east-west edges and bow apart on diagonals. Measured at 22° S, a vertex snapped to the middle of a diagonal edge lies 6 mm off the stored edge on a 1.4 km edge and 57 cm off on a 14 km one. Along a shared border that leaves a sliver of several square metres inside the neighbour, enough for a `409` on a border the user drew correctly.

## Decision

- Polygons snap with OpenLayers' `Snap` to the plots on the map, added after the `Draw` interaction. Circles do not snap.
- When the polygon is finished, its vertices are rounded to 7 decimals (about 1 cm). Then every vertex within `1e-5` degrees (about 1.1 m) of a neighbour's edge is moved to the closest point of that edge, computed in longitude/latitude. A vertex on a neighbour's corner stays on that corner.
- **Snapped vertices are not rounded.** A point in the middle of a slanted edge is rarely on the 7-decimal grid, and rounding it would move it up to about 8 mm off the edge: on a long shared border, enough for a sliver above the overlap tolerance (ADR 0008) and a `409`.
- The tolerance is a few times the largest offset Web Mercator can introduce on a plot-sized edge, and small enough not to move a vertex the user placed on purpose.

## Alternatives considered

- **OpenLayers' `Snap` alone:** exact on vertices, but wrong on edges, as measured above.
- **Snapping only to vertices (`edge: false`):** correct, but the user cannot follow a long border without matching every corner of the neighbour.
- **Raising the overlap tolerance:** hides the error for short edges and still fails on long ones; it also weakens the business rule.

## Consequences

- Plots drawn along a neighbour's diagonal border are accepted. Checked against the API: two corners snapped to a 2.9 km diagonal edge land on it with zero offset, and the plot is saved.
- The correction is a pure function (`snapRingsToEdges`), tested with a vertex snapped in Web Mercator and checked against the edge in degrees.
- A vertex drawn by hand within about a metre of a neighbour's edge is also moved onto it. At that distance this is what the user meant.
