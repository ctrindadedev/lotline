# 11. Viewport listing on `geometry`, with a validated bounding box

- **Status:** Accepted
- **Date:** 2026-10-05

## Context

The map shows the plots in its visible area and reloads them when the user pans or zooms. The frontend knows the viewport as a rectangle in EPSG:3857. The radius search (ADR 0010) needed `geography` to measure metres. A viewport needs no measurement, only "which plots intersect this rectangle".

## Decision

- `GET /api/v1/plots?bbox=minLng,minLat,maxLng,maxLat` returns a `FeatureCollection` of every plot that intersects the rectangle, ordered by id. The parameter format is the OGC/OpenLayers convention. The parameter is required: there is no "list everything" endpoint.
- The filter is `ST_Intersects(boundary, ST_MakeEnvelope(minLng, minLat, maxLng, maxLat, 4326))`, on `geometry`. Web Mercator maps meridians and parallels to straight vertical and horizontal lines, so the 3857 viewport converts to an **exact** lon/lat rectangle, and a planar test in degrees is correct. `ST_Intersects` uses the GiST index on `boundary` from ADR 0004. A test runs `EXPLAIN` on the repository's SQL and checks that the index is used.
- A custom constraint, `@BoundingBox`, validates the parameter. It checks four finite numbers, longitudes in −180..180, latitudes in −90..90, and each min strictly below its max. A failure is a 400 with the same `errors` list as other invalid fields (ADR 0006).

## Alternatives considered

- **`geography` and the expression index from ADR 0010:** it gives the same answer for a viewport, at a higher cost per row, and makes no use of the existing index.
- **Four separate parameters (`minLng=...`):** more verbose, and it departs from the format OpenLayers and other map APIs already use.
- **Parsing and validating in the controller:** it would need an exception that maps to 400, a base `shared` does not have. A Bean Validation constraint reuses the existing 400 path and error shape.
- **Viewports crossing the 180th meridian (`minLng > maxLng`):** rejected for consistency with ADR 0007, since plots cannot cross it either.

## Consequences

- The response is not capped. A viewport zoomed out to a continent returns every plot in it. The frontend should only load plots from a minimum zoom level, and pagination or clustering can come later if the data grows.
- Plots are stored with straight lon/lat edges and rendered with straight 3857 edges. For plot-sized shapes the difference is far below a pixel.
