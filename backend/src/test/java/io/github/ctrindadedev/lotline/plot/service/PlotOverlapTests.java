package io.github.ctrindadedev.lotline.plot.service;

import static io.github.ctrindadedev.lotline.plot.TestGeometries.polygon;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import io.github.ctrindadedev.lotline.IntegrationTest;
import io.github.ctrindadedev.lotline.plot.exception.PlotOverlapException;
import java.math.BigDecimal;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.locationtech.jts.geom.Polygon;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.annotation.Transactional;

/** The overlap rule against real PostGIS. See ADR 0008. */
@IntegrationTest
@Transactional
class PlotOverlapTests {

  @Autowired PlotService plotService;

  private UUID existingId;

  @BeforeEach
  void existingPlot() {
    existingId = create(rectangle(-47.0, -22.0, -46.99, -21.99));
  }

  @Test
  void acceptsADisjointPlot() {
    assertAccepted(rectangle(-46.98, -22.0, -46.97, -21.99));
  }

  @Test
  void acceptsANeighbourSharingABorder() {
    assertAccepted(rectangle(-46.99, -22.0, -46.98, -21.99));
  }

  @Test
  void acceptsANeighbourTouchingAtOneCorner() {
    assertAccepted(rectangle(-46.99, -21.99, -46.98, -21.98));
  }

  @Test
  void acceptsANeighbourWhoseSharedBorderDriftsBelowTheTolerance() {
    // 1e-9 degrees is about 0.1 mm: a 0.1 m² sliver along the 1.1 km border
    assertAccepted(rectangle(-46.99 - 1e-9, -22.0, -46.98, -21.99));
  }

  @Test
  void acceptsANeighbourSnappedMidwayAlongASlantedBorder() {
    Polygon slanted = polygon("POLYGON((-47.1 -22.1, -47.09 -22.1, -47.09 -22.093, -47.1 -22.1))");
    create(slanted);
    double x = -47.1 + 0.37 * 0.01;
    double y = -22.1 + 0.37 * 0.007;

    assertAccepted(
        polygon(
            "POLYGON((-47.1 -22.1, -47.1 -22.093, -47.09 -22.093, %s %s, -47.1 -22.1))"
                .formatted(x, y)));
  }

  @Test
  void rejectsAThinSliverAboveTheTolerance() {
    // 1e-5 degrees is about 1 m: a 1,100 m² strip along the border
    assertOverlaps(rectangle(-46.99 - 1e-5, -22.0, -46.98, -21.99));
  }

  @Test
  void rejectsAPartialOverlap() {
    assertOverlaps(rectangle(-46.995, -21.995, -46.985, -21.985));
  }

  @Test
  void rejectsAPlotContainedInAnExistingOne() {
    assertOverlaps(rectangle(-46.998, -21.998, -46.992, -21.992));
  }

  @Test
  void rejectsAPlotContainingAnExistingOne() {
    assertOverlaps(rectangle(-47.01, -22.01, -46.98, -21.98));
  }

  @Test
  void rejectsTheSameBoundarySubmittedTwice() {
    assertOverlaps(rectangle(-47.0, -22.0, -46.99, -21.99));
  }

  @Test
  void rejectsAnOverlapThatAlsoSharesPartOfABorder() {
    // A neighbour to the east with a tongue pushed into the existing plot: the intersection
    // holds both an area and line segments
    assertOverlaps(
        polygon(
            "POLYGON((-46.99 -22.0, -46.98 -22.0, -46.98 -21.99, -46.99 -21.99, -46.99 -21.994,"
                + " -46.995 -21.994, -46.995 -21.996, -46.99 -21.996, -46.99 -22.0))"));
  }

  @Test
  void listsEveryOverlappedPlot() {
    UUID neighbourId = create(rectangle(-46.99, -22.0, -46.98, -21.99));
    String ids =
        Stream.of(existingId, neighbourId)
            .map(UUID::toString)
            .sorted()
            .collect(Collectors.joining(", "));

    assertThatThrownBy(() -> create(rectangle(-46.995, -21.998, -46.985, -21.992)))
        .isInstanceOf(PlotOverlapException.class)
        .hasMessage("The boundary overlaps existing plots: " + ids);
  }

  private void assertAccepted(Polygon boundary) {
    assertThatCode(() -> create(boundary)).doesNotThrowAnyException();
  }

  private void assertOverlaps(Polygon boundary) {
    assertThatThrownBy(() -> create(boundary))
        .isInstanceOf(PlotOverlapException.class)
        .hasMessage("The boundary overlaps existing plots: " + existingId);
  }

  private UUID create(Polygon boundary) {
    PlotDetails plot =
        plotService.create(
            new NewPlot(boundary, new BigDecimal("1000"), "A plot", "seller@example.com"));
    assertThat(plot.id()).isNotNull();
    return plot.id();
  }

  private static Polygon rectangle(double minX, double minY, double maxX, double maxY) {
    return polygon(
        "POLYGON((%s %s, %s %s, %s %s, %s %s, %s %s))"
            .formatted(minX, minY, maxX, minY, maxX, maxY, minX, maxY, minX, minY));
  }
}
