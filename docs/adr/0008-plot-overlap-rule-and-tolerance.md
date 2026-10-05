# 8. Plot overlap rule and tolerance

- **Status:** Accepted
- **Date:** 2026-10-05

## Context

Two plots cannot cover the same land, so a new plot that overlaps an existing one is rejected with 409 (ADR 0006). Neighbours are the normal case, though: plots that share a border or a corner must be accepted.

Plots are drawn by hand on a web map. Even when the seller snaps to a neighbour's border, the coordinates the API receives are not exactly the stored ones:

- the map works in EPSG:3857 and converts to 4326 at the GeoJSON boundary. A snapped vertex comes back with about 1e-15 degrees of drift;
- a vertex snapped onto the middle of a neighbour's slanted edge, at a point computed along the stored lon/lat line, lands a few 1e-15 degrees beside it.

Measured against PostGIS 3.6, both cases make the interiors intersect (`ST_Relate` reports an overlap), but the shared area is below 0.001 m². A strict topological rule would reject legitimate neighbours.

The same measurement showed two traps:

- **Snapping onto an edge in 3857 is not noise.** A straight edge in 3857 and the same edge stored in 4326 are different lines. On a 1.5 km diagonal edge at 22° S, a point snapped midway in 3857 sits 1.2 cm off the stored edge, a 9 m² sliver. On a 15 km edge it is 1.2 m off and 9,400 m².
- **Thin slivers measure wrong as `geography`.** The cast reads each edge as a great-circle arc instead of the stored straight lon/lat line. A degenerate sliver between near-collinear edges then measures as the gap between two arcs: 9 m² for an intersection that is really 0.0002 m².

## Decision

A new plot overlaps an existing one when, in a single native query:

1. their bounding boxes intersect (`&&`, served by the GiST index);
2. their interiors intersect: `ST_Relate(existing, new, 'T********')`. Shared borders and corners pass here;
3. the area of the intersection is **more than 1 m²**. It is measured as `ST_Area(ST_Segmentize(ST_CollectionExtract(ST_Intersection(existing, new), 3), 0.0001)::geography)`:
   - `ST_CollectionExtract(..., 3)` keeps only the polygon parts, since an overlap that also shares a border segment yields a polygon plus lines;
   - `ST_Segmentize` to about 11 m keeps the great-circle arcs on top of the stored lines, so noise measures as noise.

The check runs in `PlotService.create` after geometry validation, so an invalid shape still gets 422 first. The 409 message lists every overlapped plot id.

The frontend must snap in lon/lat: to a neighbour's vertex, or to a point computed along the neighbour's edge in 4326. Snapping onto an edge in 3857 (the OpenLayers default) produces real slivers that the API rejects. This is a requirement for the drawing UX issue (#26).

## Alternatives considered

- **Strict topology (`ST_Relate` or `ST_Overlaps` only):** rejects snapped neighbours because of floating-point drift.
- **A larger area tolerance to also absorb 3857 edge snapping:** that sliver grows with the edge length (9 m² at 1.5 km, 9,400 m² at 15 km). Any fixed number either misses long edges or lets a seller take real land from a neighbour.
- **A tolerance relative to the plot area:** 0.1% of a 100 km² plot is 10 hectares of someone else's land.
- **A width tolerance (negative buffer of the new plot):** buffering in metres reprojects the polygon, which brings its own edge distortion, and the result is harder to explain than an area.
- **Snapping coordinates to a grid (`ST_SnapToGrid`) before comparing:** a point on a slanted edge never lies on a grid, so the T-junction case still overlaps.
- **Repairing the overlap (clipping the new plot to its neighbours):** it silently changes what the seller drew. Rejected for the same reason as `ST_MakeValid` (ADR 0004).

## Consequences

- Neighbours drawn with lon/lat snapping are accepted, and any overlap above 1 m² is rejected, whatever the plot size.
- Overlaps of up to 1 m² per neighbour are accepted. On the scale of land plots that is drawing noise, not a land grab.
- The check and the insert are separate statements, so two overlapping requests arriving together can both pass. Serializing them is a separate issue.
- Tests cover disjoint, shared border, shared corner, sub-tolerance drift, a vertex snapped midway along a slanted edge, a 1 m wide sliver, partial overlap, contained, containing, the same plot submitted twice, and an overlap that also shares a border.
