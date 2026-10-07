package io.github.ctrindadedev.lotline.plot.web;

import static io.github.ctrindadedev.lotline.TestSecurity.loggedInAs;
import static io.github.ctrindadedev.lotline.TestSecurity.signUp;
import static io.github.ctrindadedev.lotline.plot.TestGeometries.polygon;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
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
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.transaction.annotation.Transactional;

@IntegrationTest
@AutoConfigureMockMvc
@Transactional
class PlotReservationTests {

  @Autowired MockMvc mockMvc;
  @Autowired AccountService accountService;
  @Autowired PlotRepository plotRepository;

  private UserAccount seller;
  private UserAccount buyer;
  private UserAccount someoneElse;
  private String plotUrl;

  @BeforeEach
  void listAPlot() {
    seller = signUp(accountService, "seller@example.com");
    buyer = accountService.register(new NewUser("Buyer", "buyer@example.com", "correct horse"));
    someoneElse =
        accountService.register(new NewUser("Other", "other@example.com", "correct horse"));
    UUID id =
        plotRepository
            .saveAndFlush(
                new Plot(
                    polygon("POLYGON((-47 -22, -46.99 -22, -46.99 -21.99, -47 -21.99, -47 -22))"),
                    new BigDecimal("1000"),
                    "A plot",
                    "seller@example.com",
                    seller.id()))
            .getId();
    plotUrl = "/api/v1/plots/" + id;
  }

  private ResultActions reserve(UserAccount user) throws Exception {
    return mockMvc.perform(post(plotUrl + "/reservation").with(loggedInAs(user)));
  }

  private ResultActions release(UserAccount user) throws Exception {
    return mockMvc.perform(delete(plotUrl + "/reservation").with(loggedInAs(user)));
  }

  private ResultActions sell(UserAccount user) throws Exception {
    return mockMvc.perform(post(plotUrl + "/sale").with(loggedInAs(user)));
  }

  @Test
  void letsABuyerReserveAnAvailablePlot() throws Exception {
    reserve(buyer)
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.properties.status").value("RESERVED"))
        .andExpect(jsonPath("$.properties.reservedByMe").value(true))
        .andExpect(jsonPath("$.properties.ownedByMe").value(false));

    mockMvc
        .perform(get(plotUrl).with(loggedInAs(seller)))
        .andExpect(jsonPath("$.properties.status").value("RESERVED"))
        .andExpect(jsonPath("$.properties.reservedByMe").value(false));
    mockMvc
        .perform(get(plotUrl))
        .andExpect(jsonPath("$.properties.status").value("RESERVED"))
        .andExpect(jsonPath("$.properties.reservedByMe").value(false));
  }

  @Test
  void showsANewPlotAsAvailable() throws Exception {
    mockMvc
        .perform(get(plotUrl))
        .andExpect(jsonPath("$.properties.status").value("AVAILABLE"))
        .andExpect(jsonPath("$.properties.reservable").value(true))
        .andExpect(jsonPath("$.properties.reservedByMe").value(false));
  }

  @Test
  void refusesASecondReservation() throws Exception {
    reserve(buyer).andExpect(status().isOk());

    reserve(someoneElse)
        .andExpect(status().isConflict())
        .andExpect(jsonPath("$.detail").value("This plot is already reserved"));
  }

  @Test
  void refusesTheSellerReservingTheirOwnPlot() throws Exception {
    reserve(seller)
        .andExpect(status().isForbidden())
        .andExpect(jsonPath("$.detail").value("You cannot reserve a plot you listed"));
  }

  @Test
  void refusesReservingAPlotWithoutASeller() throws Exception {
    UUID unowned =
        plotRepository
            .saveAndFlush(
                new Plot(
                    polygon("POLYGON((-46 -22, -45.99 -22, -45.99 -21.99, -46 -21.99, -46 -22))"),
                    new BigDecimal("1000"),
                    "A sample plot",
                    "sample@example.com",
                    null))
            .getId();

    mockMvc
        .perform(get("/api/v1/plots/" + unowned))
        .andExpect(jsonPath("$.properties.reservable").value(false));
    mockMvc
        .perform(post("/api/v1/plots/" + unowned + "/reservation").with(loggedInAs(buyer)))
        .andExpect(status().isConflict())
        .andExpect(jsonPath("$.detail").value("This plot has no seller and cannot be reserved"));
  }

  @Test
  void needsALoginToReserve() throws Exception {
    mockMvc
        .perform(post(plotUrl + "/reservation").with(csrf()))
        .andExpect(status().isUnauthorized());
  }

  @Test
  void answers404ForAnUnknownPlot() throws Exception {
    mockMvc
        .perform(
            post("/api/v1/plots/" + UUID.randomUUID() + "/reservation").with(loggedInAs(buyer)))
        .andExpect(status().isNotFound());
  }

  @Test
  void letsTheBuyerOrTheSellerReleaseTheReservation() throws Exception {
    reserve(buyer);
    release(buyer)
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.properties.status").value("AVAILABLE"))
        .andExpect(jsonPath("$.properties.reservedByMe").value(false));

    reserve(buyer);
    release(seller).andExpect(status().isOk());
  }

  @Test
  void refusesAReleaseByAnyoneElseOrWithoutAReservation() throws Exception {
    release(buyer)
        .andExpect(status().isConflict())
        .andExpect(jsonPath("$.detail").value("This plot is not reserved"));

    reserve(buyer);
    release(someoneElse).andExpect(status().isForbidden());
  }

  @Test
  void letsTheSellerConfirmTheSaleOfAReservedPlot() throws Exception {
    sell(seller).andExpect(status().isConflict());
    reserve(buyer);
    sell(buyer).andExpect(status().isForbidden());

    sell(seller)
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.properties.status").value("SOLD"));
    mockMvc
        .perform(get(plotUrl).with(loggedInAs(buyer)))
        .andExpect(jsonPath("$.properties.reservedByMe").value(true));
    release(seller).andExpect(status().isConflict());
    reserve(someoneElse)
        .andExpect(status().isConflict())
        .andExpect(jsonPath("$.detail").value("This plot is already sold"));
  }

  @Test
  void freezesAReservedPlot() throws Exception {
    reserve(buyer);

    mockMvc
        .perform(
            put(plotUrl)
                .with(loggedInAs(seller))
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    "{\"price\": 1, \"description\": \"Cheaper\", \"contact\": \"s@example.com\"}"))
        .andExpect(status().isConflict())
        .andExpect(jsonPath("$.detail").value("A reserved or sold plot cannot be changed"));
    mockMvc.perform(delete(plotUrl).with(loggedInAs(seller))).andExpect(status().isConflict());
  }
}
