package io.github.ctrindadedev.lotline.plot.web;

import static io.github.ctrindadedev.lotline.TestSecurity.loggedIn;
import static io.github.ctrindadedev.lotline.TestSecurity.signUp;
import static org.hamcrest.Matchers.containsInAnyOrder;
import static org.hamcrest.Matchers.matchesPattern;
import static org.hamcrest.Matchers.startsWith;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import io.github.ctrindadedev.lotline.IntegrationTest;
import io.github.ctrindadedev.lotline.identity.service.AccountService;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

@IntegrationTest
@AutoConfigureMockMvc
@Transactional
class PlotControllerTests {

  private static final String SQUARE =
      "{\"type\": \"Polygon\", \"coordinates\": [[[-47.0, -22.0], [-46.99, -22.0],"
          + " [-46.99, -21.99], [-47.0, -21.99], [-47.0, -22.0]]]}";
  private static final String BOWTIE =
      "{\"type\": \"Polygon\", \"coordinates\": [[[-47.0, -22.0], [-46.99, -21.99],"
          + " [-46.99, -22.0], [-47.0, -21.99], [-47.0, -22.0]]]}";

  @Autowired MockMvc mockMvc;
  @Autowired AccountService accountService;

  @BeforeEach
  void logIn() {
    signUp(accountService, "seller@example.com");
  }

  @Test
  void createsAPlotAndReturnsItAsAFeature() throws Exception {
    String location =
        mockMvc
            .perform(
                post("/api/v1/plots")
                    .with(loggedIn())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(body(SQUARE, "150000.00", "\"Corner plot\"", "\"+55 19 99999-0000\"")))
            .andExpect(status().isCreated())
            .andExpect(header().string("Location", matchesPattern(".*/api/v1/plots/[0-9a-f-]{36}")))
            .andExpect(jsonPath("$.type").value("Feature"))
            .andExpect(jsonPath("$.geometry.type").value("Polygon"))
            .andExpect(jsonPath("$.geometry.coordinates[0][0][0]").value(-47.0))
            .andExpect(jsonPath("$.geometry.coordinates[0][0][1]").value(-22.0))
            .andExpect(jsonPath("$.properties.price").value(150000.00))
            .andExpect(jsonPath("$.properties.description").value("Corner plot"))
            .andExpect(jsonPath("$.properties.createdAt").isNotEmpty())
            .andReturn()
            .getResponse()
            .getHeader("Location");

    mockMvc
        .perform(get(location))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.id").value(location.substring(location.lastIndexOf('/') + 1)))
        .andExpect(jsonPath("$.properties.contact").value("+55 19 99999-0000"));
  }

  @Test
  void rejectsInvalidFieldsWithTheListOfErrors() throws Exception {
    mockMvc
        .perform(
            post("/api/v1/plots")
                .with(loggedIn())
                .contentType(MediaType.APPLICATION_JSON)
                .content(body("null", "-10", "\" \"", "null")))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.status").value(400))
        .andExpect(jsonPath("$.detail").value("One or more fields are invalid"))
        .andExpect(
            jsonPath("$.errors[*].field")
                .value(containsInAnyOrder("boundary", "price", "description", "contact")))
        .andExpect(
            jsonPath("$.errors[?(@.field == 'price')].message").value("must be greater than 0"));
  }

  @Test
  void rejectsAnInvalidGeometryWith422() throws Exception {
    mockMvc
        .perform(
            post("/api/v1/plots")
                .with(loggedIn())
                .contentType(MediaType.APPLICATION_JSON)
                .content(body(BOWTIE, "1000", "\"Bowtie\"", "\"seller@example.com\"")))
        .andExpect(status().isUnprocessableContent())
        .andExpect(jsonPath("$.detail", startsWith("The boundary is not a valid polygon")));
  }

  @Test
  void rejectsAnOverlappingPlotWith409() throws Exception {
    String request = body(SQUARE, "1000", "\"First\"", "\"seller@example.com\"");
    mockMvc
        .perform(
            post("/api/v1/plots")
                .with(loggedIn())
                .contentType(MediaType.APPLICATION_JSON)
                .content(request))
        .andExpect(status().isCreated());

    mockMvc
        .perform(
            post("/api/v1/plots")
                .with(loggedIn())
                .contentType(MediaType.APPLICATION_JSON)
                .content(request))
        .andExpect(status().isConflict())
        .andExpect(jsonPath("$.status").value(409))
        .andExpect(jsonPath("$.detail", startsWith("The boundary overlaps existing plots: ")));
  }

  @Test
  void answers404ForAnUnknownPlot() throws Exception {
    UUID id = UUID.randomUUID();

    mockMvc
        .perform(get("/api/v1/plots/{id}", id))
        .andExpect(status().isNotFound())
        .andExpect(jsonPath("$.detail").value("Plot " + id + " not found"));
  }

  @Test
  void publishesTheOpenApiDocument() throws Exception {
    mockMvc
        .perform(get("/v3/api-docs"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.paths['/api/v1/plots'].post").exists())
        .andExpect(jsonPath("$.paths['/api/v1/plots/{id}'].get").exists());
  }

  private static String body(String boundary, String price, String description, String contact) {
    return "{\"boundary\": %s, \"price\": %s, \"description\": %s, \"contact\": %s}"
        .formatted(boundary, price, description, contact);
  }
}
