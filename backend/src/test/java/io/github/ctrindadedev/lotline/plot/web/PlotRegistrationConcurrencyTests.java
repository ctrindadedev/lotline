package io.github.ctrindadedev.lotline.plot.web;

import static io.github.ctrindadedev.lotline.TestSecurity.loggedIn;
import static io.github.ctrindadedev.lotline.TestSecurity.signUp;
import static java.util.concurrent.TimeUnit.SECONDS;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.fail;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;

import io.github.ctrindadedev.lotline.IntegrationTest;
import io.github.ctrindadedev.lotline.identity.service.AccountService;
import java.time.Duration;
import java.time.Instant;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.support.TransactionTemplate;

/**
 * Two overlapping registrations racing each other. Not {@code @Transactional}: the rows are
 * committed for real, so every test cleans up after itself. See ADR 0009.
 */
@IntegrationTest
@AutoConfigureMockMvc
class PlotRegistrationConcurrencyTests {

  private static final String BODY =
      "{\"boundary\": {\"type\": \"Polygon\", \"coordinates\": [[[10.0, 10.0], [10.01, 10.0],"
          + " [10.01, 10.01], [10.0, 10.01], [10.0, 10.0]]]},"
          + " \"price\": 1000, \"description\": \"A plot\", \"contact\": \"seller@example.com\"}";
  private static final long TIMEOUT_SECONDS = 10;

  @Autowired MockMvc mockMvc;
  @Autowired AccountService accountService;

  @BeforeEach
  void logIn() {
    signUp(accountService, "seller@example.com");
  }

  @Autowired TransactionTemplate transactionTemplate;
  @Autowired JdbcTemplate jdbcTemplate;

  private final ExecutorService executor = Executors.newFixedThreadPool(2);

  @AfterEach
  void cleanUp() {
    executor.shutdownNow();
    jdbcTemplate.update("DELETE FROM plots");
    jdbcTemplate.update("DELETE FROM users");
  }

  @Test
  void letsOnlyOneOfTwoConcurrentOverlappingRegistrationsThrough() throws Exception {
    CountDownLatch firstRegistered = new CountDownLatch(1);
    CountDownLatch commitFirst = new CountDownLatch(1);
    Future<Integer> first =
        executor.submit(() -> registerHoldingTheCommit(firstRegistered, commitFirst));
    Future<Integer> second;
    try {
      assertThat(firstRegistered.await(TIMEOUT_SECONDS, SECONDS)).isTrue();
      second = executor.submit(this::register);
      awaitBlockedOnTheLockOrDone(second);
    } finally {
      commitFirst.countDown();
    }

    assertThat(first.get(TIMEOUT_SECONDS, SECONDS)).isEqualTo(201);
    assertThat(second.get(TIMEOUT_SECONDS, SECONDS)).isEqualTo(409);
    assertThat(jdbcTemplate.queryForObject("SELECT count(*) FROM plots", Long.class)).isOne();
  }

  /** Registers inside an outer transaction that commits only when {@code commit} opens. */
  private int registerHoldingTheCommit(CountDownLatch registered, CountDownLatch commit) {
    return transactionTemplate.execute(
        transaction -> {
          try {
            int status = register();
            registered.countDown();
            assertThat(commit.await(TIMEOUT_SECONDS, SECONDS)).isTrue();
            return status;
          } catch (Exception e) {
            throw new IllegalStateException(e);
          }
        });
  }

  private int register() throws Exception {
    return mockMvc
        .perform(
            post("/api/v1/plots")
                .with(loggedIn())
                .contentType(MediaType.APPLICATION_JSON)
                .content(BODY))
        .andReturn()
        .getResponse()
        .getStatus();
  }

  // Without the lock the second request does not wait at all: stop polling once it is done.
  private void awaitBlockedOnTheLockOrDone(Future<?> request) throws InterruptedException {
    Instant deadline = Instant.now().plus(Duration.ofSeconds(TIMEOUT_SECONDS));
    while (Instant.now().isBefore(deadline)) {
      Long waiting =
          jdbcTemplate.queryForObject(
              "SELECT count(*) FROM pg_locks WHERE locktype = 'advisory' AND NOT granted",
              Long.class);
      if (request.isDone() || waiting > 0) {
        return;
      }
      Thread.sleep(20);
    }
    fail("The second registration neither finished nor waited on the lock");
  }
}
