# 10. Radius search on `geography`, with an expression index

- **Status:** Accepted
- **Date:** 2026-10-05

## Context

Buyers draw a circle on the map to find plots. The API receives its centre (`lat`, `lng`) and a radius in metres. Boundaries are stored as `geometry(Polygon, 4326)`, which measures in degrees (ADR 0004). A degree of longitude is about 111 km at the equator but only 103 km at 22° S, so a radius cannot be converted to degrees once and reused.

There are two ways to read "plots in the circle": plots whose centre falls inside it, or plots that touch it at all. A buyer who circles an area expects to see every plot that reaches into it, including a large plot whose centre lies outside.

## Decision

- `GET /api/v1/plots/search?lat=&lng=&radiusMeters=` returns a `FeatureCollection` of every plot that **intersects** the circle, closest first, with ties ordered by id.
- The filter is `ST_DWithin(boundary::geography, point::geography, radiusMeters)`. It is true when the shortest distance between the plot and the centre, measured in metres on the spheroid, is at most the radius. A plot whose edge crosses the circle is found even when all its corners are outside.
- A second GiST index, on the expression `(boundary::geography)`, serves this query (changeset 003). The index from ADR 0004 is on `geometry`, and a `geography` predicate cannot use it. The query must spell the cast the same way as the index, or the planner ignores the index. A test runs `EXPLAIN` on the repository's SQL and checks that the index is used.
- Parameters are validated as request parameters: latitude −90..90, longitude −180..180, radius greater than 0 and at most **50 km**. Missing, non-numeric, `NaN` and infinite values are rejected with 400 and the same `errors` list as invalid body fields.
- The search point is built in SQL from the two numbers (`ST_MakePoint(:lng, :lat)`). No JTS geometry is created outside the GeoJSON mapper.

## Alternatives considered

- **Converting the radius to degrees and using `geometry`:** the conversion depends on latitude and direction, so a circle becomes an ellipse in degrees. It is wrong everywhere except at the equator.
- **Centre-in-circle semantics (`ST_DWithin` on `ST_Centroid`):** cheaper, but it misses large plots that reach into the circle.
- **A `geography` column instead of the cast:** it would make this index the natural one, but the overlap rule needs `geometry`-only topology functions (ADR 0004).
- **Pagination instead of a radius cap:** the map shows every result at once, so a page of results would draw a misleading map. The cap keeps the response bounded. 50 km covers a city-wide search.

## Consequences

- The cast reads each stored lon/lat edge as a great-circle arc. Measured at 22° S, the two lines are 0.8 cm apart on a 1 km edge and 1.9 m apart on a 15 km edge. That is irrelevant for a search, so no `ST_Segmentize` here (unlike the overlap area in ADR 0008).
- `radiusMeters` is a distance on the Earth's surface. The frontend must compute it geodesically (`ol/sphere`). A circle drawn in EPSG:3857 reports its radius in Mercator units, which are about 8% too large at 22° S.
- Each write updates two spatial indexes, which is negligible next to the overlap check.
