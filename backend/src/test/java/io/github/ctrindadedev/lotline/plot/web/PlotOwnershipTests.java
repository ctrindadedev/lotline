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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.transaction.annotation.Transactional;

@IntegrationTest
@AutoConfigureMockMvc
@Transactional
class PlotOwnershipTests {

  private static final String SQUARE =
      "{\"type\": \"Polygon\", \"coordinates\": [[[-47.0, -22.0], [-46.99, -22.0],"
          + " [-46.99, -21.99], [-47.0, -21.99], [-47.0, -22.0]]]}";
  private static final String CHANGES =
      "{\"price\": 99000.50, \"description\": \"Now with a fence\", \"contact\": \"new@example.com\"}";

  @Autowired MockMvc mockMvc;
  @Autowired AccountService accountService;
  @Autowired PlotRepository plotRepository;

  private UserAccount owner;
  private UserAccount someoneElse;
  private String plotUrl;

  @BeforeEach
  void listAPlot() throws Exception {
    owner = signUp(accountService, "owner@example.com");
    someoneElse =
        accountService.register(new NewUser("Other", "other@example.com", "correct horse"));
    plotUrl =
        mockMvc
            .perform(
                post("/api/v1/plots")
                    .with(loggedInAs(owner))
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(
                        "{\"boundary\": %s, \"price\": 1000, \"description\": \"A plot\", \"contact\": \"owner@example.com\"}"
                            .formatted(SQUARE)))
            .andExpect(status().isCreated())
            .andReturn()
            .getResponse()
            .getHeader("Location");
  }

  private static MockHttpServletRequestBuilder changes(MockHttpServletRequestBuilder request) {
    return request.contentType(MediaType.APPLICATION_JSON).content(CHANGES);
  }

  @Test
  void letsTheOwnerChangeThePriceDescriptionAndContact() throws Exception {
    mockMvc
        .perform(changes(put(plotUrl)).with(loggedInAs(owner)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.properties.price").value(99000.50))
        .andExpect(jsonPath("$.properties.description").value("Now with a fence"))
        .andExpect(jsonPath("$.properties.contact").value("new@example.com"))
        .andExpect(jsonPath("$.properties.ownedByMe").value(true))
        .andExpect(jsonPath("$.geometry.coordinates[0][0][0]").value(-47.0));
  }

  @Test
  void refusesChangesFromAnyoneElse() throws Exception {
    mockMvc
        .perform(changes(put(plotUrl)).with(loggedInAs(someoneElse)))
        .andExpect(status().isForbidden())
        .andExpect(jsonPath("$.detail").value("Only the user who listed this plot can change it"));
    mockMvc
        .perform(delete(plotUrl).with(loggedInAs(someoneElse)))
        .andExpect(status().isForbidden());

    mockMvc.perform(get(plotUrl)).andExpect(jsonPath("$.properties.description").value("A plot"));
  }

  @Test
  void asksVisitorsToLogIn() throws Exception {
    mockMvc.perform(changes(put(plotUrl)).with(csrf())).andExpect(status().isUnauthorized());
    mockMvc.perform(delete(plotUrl).with(csrf())).andExpect(status().isUnauthorized());
  }

  @Test
  void leavesAPlotWithoutOwnerUntouchable() throws Exception {
    Plot unowned =
        plotRepository.saveAndFlush(
            new Plot(
                polygon("POLYGON((-46.9 -22.0, -46.89 -22.0, -46.89 -21.99, -46.9 -22.0))"),
                new BigDecimal("1000"),
                "Listed before accounts",
                "x@example.com",
                null));

    mockMvc
        .perform(changes(put("/api/v1/plots/{id}", unowned.getId())).with(loggedInAs(owner)))
        .andExpect(status().isForbidden());
  }

  @Test
  void answers404ForAnUnknownPlot() throws Exception {
    mockMvc
        .perform(
            changes(put("/api/v1/plots/0199a0a0-0000-7000-8000-000000000000"))
                .with(loggedInAs(owner)))
        .andExpect(status().isNotFound());
  }

  @Test
  void validatesTheChanges() throws Exception {
    mockMvc
        .perform(
            put(plotUrl)
                .with(loggedInAs(owner))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"price\": 0, \"description\": \"\", \"contact\": \"\"}"))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.errors.length()").value(3));
  }

  @Test
  void letsTheOwnerDeleteThePlot() throws Exception {
    mockMvc.perform(delete(plotUrl).with(loggedInAs(owner))).andExpect(status().isNoContent());

    mockMvc.perform(get(plotUrl)).andExpect(status().isNotFound());
  }

  @Test
  void tellsEachUserWhetherThePlotIsTheirs() throws Exception {
    mockMvc
        .perform(get(plotUrl).with(loggedInAs(owner)))
        .andExpect(jsonPath("$.properties.ownedByMe").value(true));
    mockMvc
        .perform(get(plotUrl).with(loggedInAs(someoneElse)))
        .andExpect(jsonPath("$.properties.ownedByMe").value(false));
    mockMvc.perform(get(plotUrl)).andExpect(jsonPath("$.properties.ownedByMe").value(false));
  }
}
