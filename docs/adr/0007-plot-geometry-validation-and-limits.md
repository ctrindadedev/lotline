# 7. Plot geometry validation and limits

- **Status:** Accepted
- **Date:** 2026-10-03

## Context

The GeoJSON mapper (ADR 0005) guarantees a well-formed polygon in SRID 4326. A well-formed polygon can still be unacceptable as a plot:

- its edges may cross (a "bowtie"), or a hole may lie outside it;
- coordinates may be garbage, such as a longitude of 500;
- it may be huge: a polygon covering a whole state would block every other listing through the overlap rule;
- it may have so many vertices that storing and comparing it becomes costly.

Invalid input is rejected, never repaired (ADR 0004), and reported as 422 (ADR 0006).

## Decision

`PlotGeometryValidator` (in `plot.service`) runs on every boundary before it is stored. It stops at the first failure and throws `InvalidGeometryException` with the actual value and the limit:

1. **SRID is 4326.** The mapper already ensures it; checking again keeps the validator correct for any caller.
2. **Coordinates are in range:** longitude from -180 to 180, latitude from -90 to 90.
3. **Longitude span of at most 180°.** The column and the overlap check are planar, but `geography` measures the short way around the globe. A thin strip from -179.99° to 179.99° would be measured as a few km² yet stored as a band around the whole planet, blocking every plot at that latitude. Plots crossing the 180th meridian are therefore not supported.
4. **At most 500 positions**, counting every ring and the closing positions. A hand-drawn plot needs a few dozen.
5. **Topologically valid**, using JTS `IsValidOp`. The message names the problem (e.g. self-intersection, hole outside shell) and where it is.
6. **At most 100 km² (10,000 ha).** The area is measured in PostGIS in square metres on the Earth's surface, as `ST_Area` of the boundary cast to `geography` after `ST_Segmentize` (amended in #92: without the segments, each long edge is read as a great-circle arc, and a degenerate sliver one degree long measured 4.36 km²). This check and the next run last because they are the only ones that query the database.
7. **At least about 2 m across** (added in #92): area ÷ perimeter, both measured as above, must be at least 0.5 m. For a strip this is about half its width; a 5 m × 25 m lot scores 2.08 m. It closes two gaps of the absolute 1 m² overlap tolerance (ADR 0008): no shape with at most 1 m² of area can reach 0.5 m (the best one, a circle, reaches 0.28 m), so a tiny plot can no longer hide inside another; and a strip thinner than 1 m can no longer cross plots by under 1 m² each, while a wider one that crosses a plot over more than 1 m already overlaps by more than 1 m².

The limits are constants in the validator. They are generous enough for large rural properties while stopping accidental or abusive shapes.

## Alternatives considered

- **Area in Java (JTS `getArea()`):** on SRID 4326 it returns square degrees, whose size in metres depends on latitude. Measuring belongs in PostGIS, like every other spatial rule.
- **Repairing invalid shapes (`ST_MakeValid`, buffering):** this would silently change the plot the seller drew. Rejected by ADR 0004.
- **Relying only on the database constraint (`CHECK (ST_IsValid(boundary))`):** the insert would fail with a generic constraint error instead of a clear 422 message. The constraint stays as a safety net.
- **Configurable limits (`@ConfigurationProperties`):** nothing needs to change them per environment yet. Constants keep them visible next to the rules.

## Consequences

- Each rule has a unit test, with the area query mocked. The area query itself has an integration test against PostGIS.
- The range check catches garbage, **not** swapped coordinates: in Brazil, `[-22, -47]` and `[-47, -22]` are both in range. Coordinate order is enforced by the mapper's tests and the frontend's conversion, not by this check.
- Plots crossing the 180th meridian (e.g. parts of Fiji or Chukotka) cannot be listed. Supporting them would mean splitting them at the meridian or storing them as `geography`, which the overlap rule cannot use (ADR 0004).
- Changing a limit is a one-line change plus its test.
