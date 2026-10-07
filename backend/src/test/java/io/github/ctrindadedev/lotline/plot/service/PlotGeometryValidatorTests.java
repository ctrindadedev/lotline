package io.github.ctrindadedev.lotline.plot.service;

import static io.github.ctrindadedev.lotline.plot.TestGeometries.SQUARE_WKT;
import static io.github.ctrindadedev.lotline.plot.TestGeometries.polygon;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import io.github.ctrindadedev.lotline.plot.exception.InvalidGeometryException;
import io.github.ctrindadedev.lotline.plot.persistence.PlotMeasures;
import io.github.ctrindadedev.lotline.plot.persistence.PlotRepository;
import java.util.stream.Collectors;
import java.util.stream.IntStream;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.locationtech.jts.geom.Polygon;

class PlotGeometryValidatorTests {

  private final PlotRepository plotRepository = mock(PlotRepository.class);
  private final PlotGeometryValidator validator = new PlotGeometryValidator(plotRepository);

  @BeforeEach
  void measuresWithinLimits() {
    givenMeasures(1_141_000.0, 4_276.0);
  }

  private void givenMeasures(double area, double perimeter) {
    PlotMeasures measures = mock(PlotMeasures.class);
    when(measures.getArea()).thenReturn(area);
    when(measures.getPerimeter()).thenReturn(perimeter);
    when(plotRepository.measure(any())).thenReturn(measures);
  }

  @Test
  void acceptsAValidPlot() {
    assertThatCode(() -> validator.validate(polygon(SQUARE_WKT))).doesNotThrowAnyException();
  }

  @Test
  void rejectsAnotherSrid() {
    assertRejected(polygon(SQUARE_WKT, 3857), "The boundary must use SRID 4326, got: 3857");
  }

  @Test
  void rejectsLongitudeOutOfRange() {
    assertRejected(
        polygon("POLYGON((179 0, 181 0, 181 1, 179 1, 179 0))"),
        "Position [181, 0] is outside longitude -180..180, latitude -90..90");
  }

  @Test
  void rejectsLatitudeOutOfRange() {
    assertRejected(
        polygon("POLYGON((0 89, 1 89, 1 91, 0 91, 0 89))"),
        "Position [1, 91] is outside longitude -180..180, latitude -90..90");
  }

  @Test
  void rejectsAStripCrossingThe180thMeridian() {
    assertRejected(
        polygon("POLYGON((-179.99 0, 179.99 0, 179.99 0.01, -179.99 0.01, -179.99 0))"),
        "The boundary spans 359.98 degrees of longitude, maximum 180.0:"
            + " plots crossing the 180th meridian are not supported");
  }

  @Test
  void rejectsABandAroundThePole() {
    assertThatThrownBy(
            () ->
                validator.validate(
                    polygon("POLYGON((-180 89.99, 180 89.99, 180 90, -180 90, -180 89.99))")))
        .isInstanceOf(InvalidGeometryException.class)
        .hasMessageStartingWith("The boundary spans 360.0 degrees of longitude");
  }

  @Test
  void rejectsTooManyVertices() {
    assertRejected(
        circleWithPositions(501),
        "The boundary has 501 positions (all rings, closing positions included), maximum 500");
  }

  @Test
  void acceptsTheMaximumNumberOfVertices() {
    assertThatCode(() -> validator.validate(circleWithPositions(500))).doesNotThrowAnyException();
  }

  @Test
  void rejectsASelfIntersectingBoundary() {
    assertRejected(
        polygon("POLYGON((-47.0 -22.0, -46.99 -21.99, -46.99 -22.0, -47.0 -21.99, -47.0 -22.0))"),
        "The boundary is not a valid polygon: Self-intersection near [-46.995, -21.995]");
  }

  @Test
  void rejectsAHoleOutsideTheBoundary() {
    assertRejected(
        polygon("POLYGON((0 0, 1 0, 1 1, 0 1, 0 0), (2 2, 2 3, 3 3, 3 2, 2 2))"),
        "The boundary is not a valid polygon: Hole lies outside shell near [2, 2]");
  }

  @Test
  void rejectsABoundaryLargerThanTheMaximumArea() {
    givenMeasures(100_000_001.0, 40_000.0);

    assertRejected(polygon(SQUARE_WKT), "The boundary covers 100000001 m², maximum 100000000 m²");
  }

  @Test
  void skipsTheAreaQueryWhenTheShapeIsAlreadyInvalid() {
    assertThatThrownBy(
            () ->
                validator.validate(
                    polygon(
                        "POLYGON((-47.0 -22.0, -46.99 -21.99, -46.99 -22.0, -47.0 -21.99, -47.0 -22.0))")))
        .isInstanceOf(InvalidGeometryException.class);

    verify(plotRepository, never()).measure(any());
  }

  @Test
  void rejectsAPlotThinnerThanTheMinimum() {
    // A strip 0.98 m wide and 100 m long: 98 m² over 201.96 m of border
    givenMeasures(98.0, 201.96);

    assertRejected(
        polygon(SQUARE_WKT),
        "The boundary is too small or too thin: its area per metre of border is 0.49 m,"
            + " minimum 0.50 m (a plot about 2 m across)");
  }

  @Test
  void acceptsAPlotExactlyAtTheMinimumThickness() {
    givenMeasures(100.0, 200.0);

    assertThatCode(() -> validator.validate(polygon(SQUARE_WKT))).doesNotThrowAnyException();
  }

  @Test
  void rejectsAShapeWithNoMeasurableArea() {
    givenMeasures(0.0, 0.0);

    assertThatThrownBy(() -> validator.validate(polygon(SQUARE_WKT)))
        .isInstanceOf(InvalidGeometryException.class)
        .hasMessageContaining("too small or too thin");
  }

  private void assertRejected(Polygon boundary, String message) {
    assertThatThrownBy(() -> validator.validate(boundary))
        .isInstanceOf(InvalidGeometryException.class)
        .hasMessage(message);
  }

  /** A valid ring of {@code positions} positions, the last one closing it. */
  private static Polygon circleWithPositions(int positions) {
    int corners = positions - 1;
    String ring =
        IntStream.rangeClosed(0, corners)
            .mapToObj(
                i -> {
                  double angle = 2 * Math.PI * (i % corners) / corners;
                  return (-47 + 0.001 * Math.cos(angle)) + " " + (-22 + 0.001 * Math.sin(angle));
                })
            .collect(Collectors.joining(", "));
    return polygon("POLYGON((" + ring + "))");
  }
}
