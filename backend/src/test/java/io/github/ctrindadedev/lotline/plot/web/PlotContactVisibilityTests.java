package io.github.ctrindadedev.lotline.plot.web;

import static io.github.ctrindadedev.lotline.TestSecurity.loggedInAs;
import static io.github.ctrindadedev.lotline.TestSecurity.signUp;
import static io.github.ctrindadedev.lotline.plot.TestGeometries.polygon;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import io.github.ctrindadedev.lotline.IntegrationTest;
import io.github.ctrindadedev.lotline.identity.service.AccountService;
import io.github.ctrindadedev.lotline.identity.service.UserAccount;
import io.github.ctrindadedev.lotline.plot.persistence.Plot;
import io.github.ctrindadedev.lotline.plot.persistence.PlotRepository;
import java.math.BigDecimal;
import java.util.UUID;
import java.util.stream.Stream;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.transaction.annotation.Transactional;

@IntegrationTest
@AutoConfigureMockMvc
@Transactional
class PlotContactVisibilityTests {

  private static final String CONTACT = "seller@example.com";

  @Autowired MockMvc mockMvc;
  @Autowired AccountService accountService;
  @Autowired PlotRepository plotRepository;

  private UserAccount buyer;
  private UUID plotId;

  @BeforeEach
  void listAPlot() {
    buyer = signUp(accountService, "buyer@example.com");
    plotId =
        plotRepository
            .saveAndFlush(
                new Plot(
                    polygon("POLYGON((-47 -22, -46.99 -22, -46.99 -21.99, -47 -21.99, -47 -22))"),
                    new BigDecimal("1000"),
                    "A plot",
                    CONTACT,
                    null))
            .getId();
  }

  static Stream<Arguments> readEndpoints() {
    return Stream.of(
        Arguments.of("by id", "$.properties"),
        Arguments.of("in a viewport", "$.features[0].properties"),
        Arguments.of("in a radius", "$.features[0].properties"));
  }

  private MockHttpServletRequestBuilder read(String endpoint) {
    return switch (endpoint) {
      case "by id" -> get("/api/v1/plots/{id}", plotId);
      case "in a viewport" -> get("/api/v1/plots").param("bbox", "-47.0,-22.0,-46.98,-21.98");
      default -> get("/api/v1/plots/search?lat=-21.995&lng=-46.995&radiusMeters=100");
    };
  }

  @ParameterizedTest(name = "{0}")
  @MethodSource("readEndpoints")
  void hidesTheContactFromVisitors(String endpoint, String properties) throws Exception {
    mockMvc
        .perform(read(endpoint))
        .andExpect(status().isOk())
        .andExpect(jsonPath(properties + ".description").value("A plot"))
        .andExpect(jsonPath(properties + ".contact").doesNotExist());
  }

  @ParameterizedTest(name = "{0}")
  @MethodSource("readEndpoints")
  void showsTheContactToLoggedInUsers(String endpoint, String properties) throws Exception {
    mockMvc
        .perform(read(endpoint).with(loggedInAs(buyer)))
        .andExpect(status().isOk())
        .andExpect(jsonPath(properties + ".contact").value(CONTACT));
  }
}
