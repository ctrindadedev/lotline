package io.github.ctrindadedev.lotline.plot.web;

import io.github.ctrindadedev.lotline.plot.exception.InvalidGeometryException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Objects;
import java.util.UUID;
import org.locationtech.jts.algorithm.Orientation;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.LineString;
import org.locationtech.jts.geom.LinearRing;
import org.locationtech.jts.geom.Polygon;
import org.locationtech.jts.geom.PrecisionModel;
import org.springframework.stereotype.Component;

/**
 * The only place where GeoJSON and JTS geometries are converted. Accepts Polygons only and creates
 * every geometry in WGS 84 (SRID 4326). See ADR 0005.
 */
@Component
public class GeoJsonMapper {

  public static final int WGS84 = 4326;

  private static final int MIN_RING_POSITIONS = 4;

  private final GeometryFactory geometryFactory = new GeometryFactory(new PrecisionModel(), WGS84);

  public Polygon toPolygon(GeoJsonPolygon geoJson) {
    if (geoJson == null) {
      throw new InvalidGeometryException("A geometry is required");
    }
    if (!GeoJsonPolygon.TYPE.equals(geoJson.type())) {
      throw new InvalidGeometryException(
          "Only Polygon geometries are supported, got: " + geoJson.type());
    }
    List<List<List<Double>>> rings = geoJson.coordinates();
    if (rings == null || rings.isEmpty()) {
      throw new InvalidGeometryException("A polygon needs an exterior ring");
    }
    LinearRing shell = toRing(rings.getFirst());
    LinearRing[] holes =
        rings.subList(1, rings.size()).stream().map(this::toRing).toArray(LinearRing[]::new);
    return geometryFactory.createPolygon(shell, holes);
  }

  public GeoJsonPolygon toGeoJson(Polygon polygon) {
    List<List<List<Double>>> rings = new ArrayList<>();
    rings.add(toPositions(polygon.getExteriorRing(), true));
    for (int i = 0; i < polygon.getNumInteriorRing(); i++) {
      rings.add(toPositions(polygon.getInteriorRingN(i), false));
    }
    return new GeoJsonPolygon(rings);
  }

  public <P> GeoJsonFeature<P> toFeature(UUID id, Polygon polygon, P properties) {
    return new GeoJsonFeature<>(id, toGeoJson(polygon), properties);
  }

  private LinearRing toRing(List<List<Double>> positions) {
    if (positions == null || positions.size() < MIN_RING_POSITIONS) {
      throw new InvalidGeometryException(
          "A ring needs at least " + MIN_RING_POSITIONS + " positions");
    }
    Coordinate[] coordinates =
        positions.stream().map(this::toCoordinate).toArray(Coordinate[]::new);
    if (!coordinates[0].equals2D(coordinates[coordinates.length - 1])) {
      throw new InvalidGeometryException("A ring must end on its first position");
    }
    return geometryFactory.createLinearRing(coordinates);
  }

  private Coordinate toCoordinate(List<Double> position) {
    if (position == null || position.size() != 2 || position.stream().anyMatch(Objects::isNull)) {
      throw new InvalidGeometryException("Each position must be [longitude, latitude]");
    }
    return new Coordinate(position.get(0), position.get(1));
  }

  // RFC 7946 right-hand rule: output exterior rings counterclockwise and holes clockwise.
  private List<List<Double>> toPositions(LineString ring, boolean counterClockwise) {
    Coordinate[] coordinates = ring.getCoordinates();
    if (Orientation.isCCW(coordinates) != counterClockwise) {
      coordinates = ring.reverse().getCoordinates();
    }
    return Arrays.stream(coordinates).map(c -> List.of(c.getX(), c.getY())).toList();
  }
}
