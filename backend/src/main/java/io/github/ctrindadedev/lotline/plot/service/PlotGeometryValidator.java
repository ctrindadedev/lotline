package io.github.ctrindadedev.lotline.plot.service;

import io.github.ctrindadedev.lotline.plot.exception.InvalidGeometryException;
import io.github.ctrindadedev.lotline.plot.persistence.PlotRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Locale;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.Polygon;
import org.locationtech.jts.operation.valid.IsValidOp;
import org.locationtech.jts.operation.valid.TopologyValidationError;
import org.springframework.stereotype.Component;

/** Business rules for a plot boundary. Rejects, never repairs. See ADR 0007. */
@Component
public class PlotGeometryValidator {

  static final int WGS84 = 4326;
  static final int MAX_VERTICES = 500;
  // Wider shapes are stored as a band around the globe but measured by the short way across it.
  static final double MAX_LONGITUDE_SPAN = 180;
  static final double MAX_AREA_SQUARE_METERS = 100_000_000;

  private final PlotRepository plotRepository;

  public PlotGeometryValidator(PlotRepository plotRepository) {
    this.plotRepository = plotRepository;
  }

  public void validate(Polygon boundary) {
    if (boundary.getSRID() != WGS84) {
      throw new InvalidGeometryException(
          "The boundary must use SRID " + WGS84 + ", got: " + boundary.getSRID());
    }
    for (Coordinate coordinate : boundary.getCoordinates()) {
      if (Math.abs(coordinate.getX()) > 180 || Math.abs(coordinate.getY()) > 90) {
        throw new InvalidGeometryException(
            "Position " + format(coordinate) + " is outside longitude -180..180, latitude -90..90");
      }
    }
    double longitudeSpan = boundary.getEnvelopeInternal().getWidth();
    if (longitudeSpan > MAX_LONGITUDE_SPAN) {
      throw new InvalidGeometryException(
          "The boundary spans "
              + longitudeSpan
              + " degrees of longitude, maximum "
              + MAX_LONGITUDE_SPAN
              + ": plots crossing the 180th meridian are not supported");
    }
    if (boundary.getNumPoints() > MAX_VERTICES) {
      throw new InvalidGeometryException(
          "The boundary has "
              + boundary.getNumPoints()
              + " positions (all rings, closing positions included), maximum "
              + MAX_VERTICES);
    }
    TopologyValidationError error = new IsValidOp(boundary).getValidationError();
    if (error != null) {
      throw new InvalidGeometryException(
          "The boundary is not a valid polygon: "
              + error.getMessage()
              + " near "
              + format(error.getCoordinate()));
    }
    double area = plotRepository.areaInSquareMeters(boundary);
    if (area > MAX_AREA_SQUARE_METERS) {
      throw new InvalidGeometryException(
          String.format(
              Locale.ROOT,
              "The boundary covers %.0f m², maximum %.0f m²",
              area,
              MAX_AREA_SQUARE_METERS));
    }
  }

  private static String format(Coordinate coordinate) {
    return "[" + round(coordinate.getX()) + ", " + round(coordinate.getY()) + "]";
  }

  private static String round(double degrees) {
    return BigDecimal.valueOf(degrees)
        .setScale(6, RoundingMode.HALF_UP)
        .stripTrailingZeros()
        .toPlainString();
  }
}
