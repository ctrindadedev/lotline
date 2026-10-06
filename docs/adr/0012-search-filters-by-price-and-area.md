# 12. Search filters by price and area, computed in PostGIS

- **Status:** Accepted
- **Date:** 2026-10-06

## Context

A buyer who circles an area (ADR 0010) usually has a budget and a size in mind. The radius search needs optional price and area bounds. Plots store a price but no area: the area is a property of the boundary, measured in square metres on the Earth's surface.

## Decision

- `GET /api/v1/plots/search` takes four optional parameters: `minPrice`, `maxPrice`, `minAreaSquareMeters` and `maxAreaSquareMeters`. Each bound is inclusive. All the bounds given are combined with `AND`, together with the circle. A bound that is left out is not applied.
- The filters live in the same native query as the spatial predicate. Each one reads `CAST(:param AS numeric) IS NULL OR <condition>`, so one query serves every combination. The cast is required: PostgreSQL cannot infer the type of a bare null parameter.
- Area is `ST_Area(boundary::geography)`, in square metres, computed at query time, the same measure used when a plot is registered. No `ST_Segmentize`, for the reason given in ADR 0010.
- Parameters are `BigDecimal` with `@PositiveOrZero`. Negative, non-numeric, `NaN` and infinite values are rejected with 400 and the usual `errors` list (ADR 0006).
- A range whose min is above its max is not rejected. No plot can satisfy it, so the answer is an empty collection.
- Only the radius search is filtered. The viewport listing (ADR 0011) keeps showing every plot on the map.

## Alternatives considered

- **A stored or generated `area` column, with an index:** faster to filter on its own, but the circle already narrows the rows through the geography index, so the area is only computed for plots near the buyer. It would add a migration and a value to keep in sync with the boundary.
- **One query per filter combination, or a Criteria/Specification query:** sixteen combinations, or a second query style next to the native spatial SQL. The null-tolerant conditions keep a single, readable query.
- **Rejecting an inverted range with 400:** the error handler reports per-parameter errors. A cross-parameter rule would need a new error shape for a case that only yields "no results".

## Consequences

- The response does not include the area, so a client that shows it has to compute it geodesically.
- `ST_Area` on `geography` runs once per plot inside the circle, which is bounded by the 50 km radius cap.
