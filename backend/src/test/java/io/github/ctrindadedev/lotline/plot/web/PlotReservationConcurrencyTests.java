package io.github.ctrindadedev.lotline.plot.web;

import static io.github.ctrindadedev.lotline.TestSecurity.loggedInAs;
import static io.github.ctrindadedev.lotline.TestSecurity.signUp;
import static io.github.ctrindadedev.lotline.plot.TestGeometries.polygon;
import static java.util.concurrent.TimeUnit.SECONDS;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.fail;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;

import io.github.ctrindadedev.lotline.IntegrationTest;
import io.github.ctrindadedev.lotline.identity.service.AccountService;
import io.github.ctrindadedev.lotline.identity.service.NewUser;
import io.github.ctrindadedev.lotline.identity.service.UserAccount;
import io.github.ctrindadedev.lotline.plot.persistence.Plot;
import io.github.ctrindadedev.lotline.plot.persistence.PlotRepository;
import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.support.TransactionTemplate;

/**
 * Two buyers reserving the same plot at once. Not {@code @Transactional}: the rows are committed
 * for real, so every test cleans up after itself. See ADR 0021.
 */
@IntegrationTest
@AutoConfigureMockMvc
class PlotReservationConcurrencyTests {

  private static final long TIMEOUT_SECONDS = 10;

  @Autowired MockMvc mockMvc;
  @Autowired AccountService accountService;
  @Autowired PlotRepository plotRepository;
  @Autowired TransactionTemplate transactionTemplate;
  @Autowired JdbcTemplate jdbcTemplate;

  private final ExecutorService executor = Executors.newFixedThreadPool(2);
  private UserAccount firstBuyer;
  private UserAccount secondBuyer;
  private String reservationUrl;

  @BeforeEach
  void listAPlot() {
    UserAccount seller = signUp(accountService, "seller@example.com");
    firstBuyer =
        accountService.register(new NewUser("First", "first@example.com", "correct horse"));
    secondBuyer =
        accountService.register(new NewUser("Second", "second@example.com", "correct horse"));
    UUID id =
        plotRepository
            .saveAndFlush(
                new Plot(
                    polygon("POLYGON((10 10, 10.01 10, 10.01 10.01, 10 10.01, 10 10))"),
                    new BigDecimal("1000"),
                    "A plot",
                    "seller@example.com",
                    seller.id()))
            .getId();
    reservationUrl = "/api/v1/plots/" + id + "/reservation";
  }

  @AfterEach
  void cleanUp() {
    executor.shutdownNow();
    jdbcTemplate.update("DELETE FROM plots");
    jdbcTemplate.update("DELETE FROM users");
  }

  @Test
  void letsOnlyOneOfTwoConcurrentReservationsThrough() throws Exception {
    CountDownLatch firstReserved = new CountDownLatch(1);
    CountDownLatch commitFirst = new CountDownLatch(1);
    Future<Integer> first =
        executor.submit(() -> reserveHoldingTheCommit(firstReserved, commitFirst));
    Future<Integer> second;
    try {
      assertThat(firstReserved.await(TIMEOUT_SECONDS, SECONDS)).isTrue();
      second = executor.submit(() -> reserve(secondBuyer));
      awaitBlockedOnTheRowOrDone(second);
    } finally {
      commitFirst.countDown();
    }

    assertThat(first.get(TIMEOUT_SECONDS, SECONDS)).isEqualTo(200);
    assertThat(second.get(TIMEOUT_SECONDS, SECONDS)).isEqualTo(409);
    assertThat(jdbcTemplate.queryForObject("SELECT buyer_id FROM plots", UUID.class))
        .isEqualTo(firstBuyer.id());
  }

  /** Reserves inside an outer transaction that commits only when {@code commit} opens. */
  private int reserveHoldingTheCommit(CountDownLatch reserved, CountDownLatch commit) {
    return transactionTemplate.execute(
        transaction -> {
          try {
            int status = reserve(firstBuyer);
            reserved.countDown();
            assertThat(commit.await(TIMEOUT_SECONDS, SECONDS)).isTrue();
            return status;
          } catch (Exception e) {
            throw new IllegalStateException(e);
          }
        });
  }

  private int reserve(UserAccount buyer) throws Exception {
    return mockMvc
        .perform(post(reservationUrl).with(loggedInAs(buyer)))
        .andReturn()
        .getResponse()
        .getStatus();
  }

  // Without the row lock the second request does not wait at all: stop polling once it is done.
  private void awaitBlockedOnTheRowOrDone(Future<?> request) throws InterruptedException {
    Instant deadline = Instant.now().plus(Duration.ofSeconds(TIMEOUT_SECONDS));
    while (Instant.now().isBefore(deadline)) {
      Long waiting =
          jdbcTemplate.queryForObject(
              "SELECT count(*) FROM pg_locks WHERE locktype = 'transactionid' AND NOT granted",
              Long.class);
      if (request.isDone() || waiting > 0) {
        return;
      }
      Thread.sleep(20);
    }
    fail("The second reservation neither finished nor waited on the row lock");
  }
}
