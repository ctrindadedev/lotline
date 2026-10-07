package io.github.ctrindadedev.lotline.plot.web;

import static io.github.ctrindadedev.lotline.TestSecurity.loggedInAs;
import static io.github.ctrindadedev.lotline.TestSecurity.signUp;
import static io.github.ctrindadedev.lotline.plot.TestGeometries.polygon;
import static org.hamcrest.Matchers.contains;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import io.github.ctrindadedev.lotline.IntegrationTest;
import io.github.ctrindadedev.lotline.identity.service.AccountService;
import io.github.ctrindadedev.lotline.identity.service.NewUser;
import io.github.ctrindadedev.lotline.identity.service.UserAccount;
import io.github.ctrindadedev.lotline.plot.persistence.Plot;
import io.github.ctrindadedev.lotline.plot.persistence.PlotRepository;
import java.math.BigDecimal;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

@IntegrationTest
@AutoConfigureMockMvc
@Transactional
class MyPlotsTests {

  @Autowired MockMvc mockMvc;
  @Autowired AccountService accountService;
  @Autowired PlotRepository plotRepository;

  private UserAccount seller;
  private UserAccount buyer;

  @BeforeEach
  void listPlots() throws Exception {
    seller = signUp(accountService, "seller@example.com");
    buyer = accountService.register(new NewUser("Buyer", "buyer@example.com", "correct horse"));
    save("Older", -47.0, seller.id());
    UUID newer = save("Newer", -46.9, seller.id());
    save("Someone else's", -46.8, buyer.id());
    save("Sample", -46.7, null);
    mockMvc
        .perform(post("/api/v1/plots/" + newer + "/reservation").with(loggedInAs(buyer)))
        .andExpect(status().isOk());
  }

  private UUID save(String description, double lng, UUID ownerId) {
    String wkt =
        "POLYGON((%1$s -22, %2$s -22, %2$s -21.99, %1$s -21.99, %1$s -22))"
            .formatted(lng, lng + 0.01);
    return plotRepository
        .saveAndFlush(
            new Plot(polygon(wkt), new BigDecimal("1000"), description, "x@example.com", ownerId))
        .getId();
  }

  @Test
  void listsThePlotsTheSellerListedNewestFirst() throws Exception {
    mockMvc
        .perform(get("/api/v1/plots/mine").with(loggedInAs(seller)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.type").value("FeatureCollection"))
        .andExpect(
            jsonPath("$.features[*].properties.description").value(contains("Newer", "Older")))
        .andExpect(jsonPath("$.features[*].properties.ownedByMe").value(contains(true, true)));
  }

  @Test
  void listsTheBuyersOwnPlotsAndTheirReservations() throws Exception {
    mockMvc
        .perform(get("/api/v1/plots/mine").with(loggedInAs(buyer)))
        .andExpect(
            jsonPath("$.features[*].properties.description")
                .value(contains("Someone else's", "Newer")))
        .andExpect(jsonPath("$.features[1].properties.reservedByMe").value(true));
  }

  @Test
  void needsALogin() throws Exception {
    mockMvc.perform(get("/api/v1/plots/mine")).andExpect(status().isUnauthorized());
  }
}
