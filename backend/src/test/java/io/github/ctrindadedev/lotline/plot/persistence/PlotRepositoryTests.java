package io.github.ctrindadedev.lotline.plot.persistence;

import static org.assertj.core.api.Assertions.assertThat;

import io.github.ctrindadedev.lotline.IntegrationTest;
import jakarta.persistence.EntityManager;
import java.math.BigDecimal;
import org.junit.jupiter.api.Test;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Polygon;
import org.locationtech.jts.geom.PrecisionModel;
import org.locationtech.jts.io.ParseException;
import org.locationtech.jts.io.WKTReader;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.annotation.Transactional;

@IntegrationTest
@Transactional
class PlotRepositoryTests {

  private static final GeometryFactory WGS84 = new GeometryFactory(new PrecisionModel(), 4326);

  @Autowired PlotRepository repository;
  @Autowired EntityManager entityManager;

  @Test
  void persistsAndReadsBackAPlotWithItsPolygonIntact() throws ParseException {
    Polygon boundary =
        (Polygon)
            new WKTReader(WGS84)
                .read(
                    "POLYGON((-47.06 -22.90, -47.05 -22.90, -47.05 -22.89, -47.0575 -22.885,"
                        + " -47.06 -22.89, -47.06 -22.90))");
    Plot saved =
        repository.saveAndFlush(
            new Plot(boundary, new BigDecimal("250000.50"), "Corner plot", "+55 19 99999-0000"));
    // Drop the first-level cache so the read below really comes from the database.
    entityManager.clear();

    Plot found = repository.findById(saved.getId()).orElseThrow();

    assertThat(found.getId()).isEqualTo(saved.getId());
    assertThat(found.getBoundary().equalsExact(boundary)).isTrue();
    assertThat(found.getBoundary().getSRID()).isEqualTo(4326);
    assertThat(found.getPrice()).isEqualByComparingTo("250000.50");
    assertThat(found.getDescription()).isEqualTo("Corner plot");
    assertThat(found.getContact()).isEqualTo("+55 19 99999-0000");
    assertThat(found.getCreatedAt()).isNotNull();
    assertThat(found.getUpdatedAt()).isNotNull();
  }
}
