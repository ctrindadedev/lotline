package io.github.ctrindadedev.lotline;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.context.annotation.Bean;
import org.testcontainers.postgresql.PostgreSQLContainer;
import org.testcontainers.utility.DockerImageName;

/**
 * PostGIS container for integration tests. As a bean, it lives as long as the Spring context, so
 * every test sharing a cached context also shares one container.
 */
@TestConfiguration(proxyBeanMethods = false)
public class TestcontainersConfiguration {

  // Same image as docker-compose.yml; there is no Debian 17-3.6 tag.
  private static final DockerImageName POSTGIS =
      DockerImageName.parse("postgis/postgis:17-3.6-alpine").asCompatibleSubstituteFor("postgres");

  @Bean
  @ServiceConnection
  PostgreSQLContainer postgres() {
    return new PostgreSQLContainer(POSTGIS);
  }
}
