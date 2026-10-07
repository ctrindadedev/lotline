package io.github.ctrindadedev.lotline.plot.persistence;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import io.github.ctrindadedev.lotline.IntegrationTest;
import java.math.BigDecimal;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataAccessException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;

/** What the Liquibase schema guarantees on its own: the spatial index and what it rejects. */
@IntegrationTest
@Transactional
class PlotsSchemaTests {

  // Coordinates are lon lat, and the ring closes on its first point
  private static final String SQUARE =
      "POLYGON((-47.0 -22.0, -46.99 -22.0, -46.99 -21.99, -47.0 -21.99, -47.0 -22.0))";
  // Edges cross in the middle: a self-intersecting ring
  private static final String BOWTIE =
      "POLYGON((-47.0 -22.0, -46.99 -21.99, -46.99 -22.0, -47.0 -21.99, -47.0 -22.0))";

  @Autowired JdbcTemplate jdbcTemplate;

  @Test
  void loadsTheSampleDataOnlyWithTheDemoContext() {
    Integer seedRuns =
        jdbcTemplate.queryForObject(
            "SELECT count(*) FROM databasechangelog WHERE id = 'seed-demo-plots'", Integer.class);
    Integer schemaRuns =
        jdbcTemplate.queryForObject(
            "SELECT count(*) FROM databasechangelog WHERE id = 'create-plots'", Integer.class);

    assertThat(schemaRuns).isOne();
    assertThat(seedRuns).isZero();
  }

  // A missing index breaks no functional test, it only makes queries slow: guard it here
  @Test
  void boundaryHasASpatialIndex() {
    String index =
        jdbcTemplate.queryForObject(
            "SELECT indexdef FROM pg_indexes WHERE indexname = 'plots_boundary_idx'", String.class);

    assertThat(index).contains("USING gist (boundary)");
  }

  @Test
  void acceptsAValidPlot() {
    insert(SQUARE, 4326, new BigDecimal("150000.00"));

    assertThat(jdbcTemplate.queryForObject("SELECT count(*) FROM plots", Long.class)).isOne();
  }

  @Test
  void rejectsSelfIntersectingBoundary() {
    assertThatThrownBy(() -> insert(BOWTIE, 4326, BigDecimal.TEN))
        .isInstanceOf(DataIntegrityViolationException.class)
        .hasMessageContaining("plots_boundary_valid");
  }

  @Test
  void rejectsBoundaryThatIsNotAPolygon() {
    assertThatThrownBy(() -> insert("POINT(-47.0 -22.0)", 4326, BigDecimal.TEN))
        .isInstanceOf(DataAccessException.class)
        .hasMessageContaining("Geometry type (Point) does not match column type (Polygon)");
  }

  @Test
  void rejectsBoundaryInAnotherSrid() {
    assertThatThrownBy(() -> insert(SQUARE, 3857, BigDecimal.TEN))
        .isInstanceOf(DataAccessException.class)
        .hasMessageContaining("SRID");
  }

  @Test
  void rejectsNonPositivePrice() {
    assertThatThrownBy(() -> insert(SQUARE, 4326, BigDecimal.ZERO))
        .isInstanceOf(DataIntegrityViolationException.class)
        .hasMessageContaining("plots_price_positive");
  }

  private void insert(String wkt, int srid, BigDecimal price) {
    jdbcTemplate.update(
        "INSERT INTO plots (id, boundary, price, description, contact)"
            + " VALUES (?, ST_GeomFromText(?, ?), ?, 'A plot', 'seller@example.com')",
        UUID.randomUUID(),
        wkt,
        srid,
        price);
  }
}
