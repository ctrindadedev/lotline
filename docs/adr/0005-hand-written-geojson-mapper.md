# 5. Hand-written GeoJSON ↔ JTS mapper

- **Status:** Accepted
- **Date:** 2026-10-03

## Context

Plot boundaries travel between the map and the API as GeoJSON (RFC 7946) and are stored through Hibernate Spatial as JTS geometries. Something has to convert between the two. The API needs only a small part of GeoJSON:

- **In:** one `Polygon` per plot. Anything else is a client error.
- **Out:** `Feature` (one plot) and `FeatureCollection` (search results), with the plot's data in `properties`.

Every geometry must also carry SRID 4326, or the database column rejects it. JTS defaults to SRID 0.

## Decision

`GeoJsonMapper` (in `plot.web`) is the single place where GeoJSON and JTS are converted.

- The wire format is plain records: `GeoJsonPolygon`, `GeoJsonFeature<P>`, `GeoJsonFeatureCollection<P>`. Jackson reads and writes them like any other DTO.
- **Input accepts only `Polygon`.** Other types, missing or empty rings, rings with fewer than four positions, unclosed rings and positions that are not exactly `[longitude, latitude]` are rejected with `InvalidGeometryException`. Nothing is repaired. Interior rings (holes) are supported.
- Every geometry is created by one `GeometryFactory` with SRID 4326, so no other code path can produce an SRID 0 geometry.
- Ring direction follows RFC 7946: input in either direction is accepted (parsers should not reject it), and output always follows the right-hand rule, with exterior rings counterclockwise and holes clockwise.
- Topological validity (self-intersection) and coordinate ranges are not the mapper's job. Plot validation checks them on the parsed polygon.

## Alternatives considered

- **`org.n52.jackson:jackson-datatype-jts`:** its Jackson 3 line (3.0.5) is built against Jackson 3.2, while Spring Boot 4.1 manages Jackson 3.1. Using it would mean overriding the Jackson version Boot was tested with, or staying on its Jackson 2 line.
- **`com.bedatadriven:jackson-datatype-jts`:** unmaintained since 2.4 and Jackson 2 only.
- **A full geometry library (e.g. geolatte-geom's GeoJSON support):** it supports every geometry type and CRS variant. That is more surface to understand and test than one polygon type needs.
- **Serializing JTS objects directly:** Jackson would expose JTS internals (`envelope`, `factory`, ...), not GeoJSON.

## Consequences

- The mapper is under a hundred lines with no extra dependency, and it is fully covered by unit tests: round trip with holes, coordinate order, ring direction, wire format, unsupported types and malformed input.
- Supporting another geometry type later (e.g. `MultiPolygon`) means extending the mapper and its tests.
- Revisit `jackson-datatype-jts` when Boot's Jackson version catches up, if more of GeoJSON is ever needed.
