package io.github.ctrindadedev.lotline.plot.persistence;

import static io.github.ctrindadedev.lotline.plot.TestGeometries.SQUARE_WKT;
import static io.github.ctrindadedev.lotline.plot.TestGeometries.polygon;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.withinPercentage;

import io.github.ctrindadedev.lotline.IntegrationTest;
import jakarta.persistence.EntityManager;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Polygon;
import org.locationtech.jts.geom.PrecisionModel;
import org.locationtech.jts.io.ParseException;
import org.locationtech.jts.io.WKTReader;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;

@IntegrationTest
@Transactional
class PlotRepositoryTests {

  private static final GeometryFactory WGS84 = new GeometryFactory(new PrecisionModel(), 4326);

  @Autowired PlotRepository repository;
  @Autowired EntityManager entityManager;
  @Autowired JdbcTemplate jdbcTemplate;

  @Test
  void viewportListingCanUseTheGeometryIndex() {
    jdbcTemplate.execute("SET LOCAL enable_seqscan = off");
    String sql =
        PlotRepository.IN_BOUNDING_BOX_SQL
            .replace(":minLng", "-47.0")
            .replace(":minLat", "-22.0")
            .replace(":maxLng", "-46.98")
            .replace(":maxLat", "-21.98");

    List<Map<String, Object>> plan = jdbcTemplate.queryForList("EXPLAIN " + sql);

    assertThat(plan.toString()).contains("plots_boundary_idx");
  }

  @Test
  void radiusSearchCanUseTheGeographyIndex() {
    // A tiny table is seq-scanned anyway; forbid it to see whether the index is usable at all
    jdbcTemplate.execute("SET LOCAL enable_seqscan = off");
    String sql =
        PlotRepository.WITHIN_RADIUS_SQL
            .replace(":lng", "-47.0")
            .replace(":lat", "-22.0")
            .replace(":radiusMeters", "1000");

    List<Map<String, Object>> plan = jdbcTemplate.queryForList("EXPLAIN " + sql);

    assertThat(plan.toString()).contains("plots_boundary_geography_idx");
  }

  @Test
  void bindsAPolygonParameterKeepingItsSrid() {
    Object srid =
        entityManager
            .createNativeQuery("SELECT ST_SRID(:boundary)")
            .setParameter("boundary", polygon(SQUARE_WKT))
            .getSingleResult();

    assertThat(srid).isEqualTo(4326);
  }

  @Test
  void measuresAreaInSquareMetersOnTheEarthSurface() {
    // 0.01 deg of longitude at 22 S is about 1,032 m; 0.01 deg of latitude is about 1,106 m.
    assertThat(repository.areaInSquareMeters(polygon(SQUARE_WKT)))
        .isCloseTo(1_141_000, withinPercentage(2));
  }

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
