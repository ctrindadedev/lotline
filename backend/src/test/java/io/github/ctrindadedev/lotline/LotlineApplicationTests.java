package io.github.ctrindadedev.lotline;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;

@IntegrationTest
class LotlineApplicationTests {

  @Autowired JdbcTemplate jdbcTemplate;

  @Test
  void contextLoadsAgainstPostgis() {
    String version = jdbcTemplate.queryForObject("SELECT postgis_version()", String.class);

    assertThat(version).startsWith("3.6");
  }
}
