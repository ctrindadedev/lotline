# 1. Integration tests run against a real PostGIS container

- **Status:** Accepted
- **Date:** 2026-10-03

## Context

The core rules of the application are spatial: rejecting overlapping plots and finding plots within a radius run as native PostGIS SQL (`ST_*` functions, `geography` casts, GiST indexes). Repository queries and the Liquibase schema are only worth testing if they run on the same engine as production.

## Decision

Integration tests start the same image used by docker compose, `postgis/postgis:17-3.6-alpine`, through Testcontainers. The image is declared as a compatible substitute for `postgres`, so the standard `PostgreSQLContainer` and Spring Boot's `@ServiceConnection` can wire the datasource. No connection properties are needed in tests.

- `TestcontainersConfiguration` declares the container as a Spring bean, so it lives as long as the application context.
- The `@IntegrationTest` meta-annotation (`@SpringBootTest` plus that configuration) is the default for integration tests. All tests using it share one cached context and therefore one container.
- Slice tests (for example `@DataJpaTest`) build a different context and start their own container. Use them only when the speed-up justifies the extra container.

## Alternatives considered

- **H2 (or another in-memory database):** it has no PostGIS. The spatial queries would not run at all, or would run against an emulation with different semantics.
- **Mocking the repositories:** this tests nothing that matters here. The risk is in the SQL, not in the Java around it.
- **A shared database from docker compose:** it depends on manual setup, leaks state between runs and cannot run in CI without extra wiring.
- **A static container with `@Testcontainers` / `@Container`:** it works, but it needs manual lifecycle handling to be shared across test classes. The bean approach gets sharing for free from Spring's context cache.

## Consequences

- Running the backend tests requires Docker, locally and in CI.
- The first run pulls the image. After that, the container starts in a few seconds and is reused by every test sharing the context.
- Tests exercise the real SQL, extensions and migrations, so a passing test suite says something about production behavior.
