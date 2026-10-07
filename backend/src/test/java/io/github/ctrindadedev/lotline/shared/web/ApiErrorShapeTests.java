package io.github.ctrindadedev.lotline.shared.web;

import static io.github.ctrindadedev.lotline.TestSecurity.loggedIn;
import static org.hamcrest.Matchers.emptyOrNullString;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import io.github.ctrindadedev.lotline.IntegrationTest;
import java.util.stream.Stream;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.transaction.annotation.Transactional;

/** Every error path of the API answers with the same RFC 9457 shape. See ADR 0006. */
@IntegrationTest
@AutoConfigureMockMvc
@Transactional
class ApiErrorShapeTests {

  private static final String UNKNOWN_ID = "0199a0a0-0000-7000-8000-000000000000";
  private static final String SQUARE =
      "{\"type\": \"Polygon\", \"coordinates\": [[[-47.0, -22.0], [-46.99, -22.0],"
          + " [-46.99, -21.99], [-47.0, -21.99], [-47.0, -22.0]]]}";
  private static final String BOWTIE =
      "{\"type\": \"Polygon\", \"coordinates\": [[[-47.0, -22.0], [-46.99, -21.99],"
          + " [-46.99, -22.0], [-47.0, -21.99], [-47.0, -22.0]]]}";

  @Autowired MockMvc mockMvc;

  static Stream<Arguments> errorPaths() {
    return Stream.of(
        Arguments.of("invalid fields", json(post("/api/v1/plots"), "{\"price\": -1}"), 400),
        Arguments.of("malformed JSON", json(post("/api/v1/plots"), "{\"price\": "), 400),
        Arguments.of("wrong field type", json(post("/api/v1/plots"), "{\"price\": \"abc\"}"), 400),
        Arguments.of("id that is not a UUID", get("/api/v1/plots/abc"), 400),
        Arguments.of("unknown plot", get("/api/v1/plots/" + UNKNOWN_ID), 404),
        Arguments.of("unknown route", get("/api/v1/nope"), 404),
        Arguments.of("unsupported method", delete("/api/v1/plots").with(loggedIn()), 405),
        Arguments.of(
            "unsupported media type",
            post("/api/v1/plots").with(loggedIn()).contentType(MediaType.TEXT_PLAIN).content("x"),
            415),
        Arguments.of("invalid geometry", json(post("/api/v1/plots"), plot(BOWTIE)), 422),
        Arguments.of("search latitude out of range", search("91", "-47", "100"), 400),
        Arguments.of("search radius above the maximum", search("-22", "-47", "50001"), 400),
        Arguments.of("search radius not a number", search("-22", "-47", "abc"), 400),
        Arguments.of("search radius NaN", search("-22", "-47", "NaN"), 400),
        Arguments.of("search radius Infinity", search("-22", "-47", "Infinity"), 400),
        Arguments.of("search latitude NaN", search("NaN", "-47", "100"), 400),
        Arguments.of(
            "search with a negative price",
            search("-22", "-47", "100").param("minPrice", "-1"),
            400),
        Arguments.of(
            "search with a non-numeric area",
            search("-22", "-47", "100").param("maxAreaSquareMeters", "abc"),
            400),
        Arguments.of(
            "search with an infinite price",
            search("-22", "-47", "100").param("maxPrice", "Infinity"),
            400),
        Arguments.of("search parameter missing", get("/api/v1/plots/search?lat=-22&lng=-47"), 400),
        Arguments.of("bbox missing", get("/api/v1/plots"), 400),
        Arguments.of("bbox with three numbers", viewport("-47,-22,-46.9"), 400),
        Arguments.of("bbox with min above max", viewport("-46.9,-22,-47,-21.9"), 400),
        Arguments.of("bbox latitude out of range", viewport("-47,-91,-46.9,-21.9"), 400),
        Arguments.of("bbox not numeric", viewport("a,b,c,d"), 400),
        Arguments.of("bbox with NaN", viewport("NaN,-22,-46.9,-21.9"), 400));
  }

  @ParameterizedTest(name = "{0} -> {2}")
  @MethodSource("errorPaths")
  void answersWithAProblemDetail(String name, MockHttpServletRequestBuilder request, int status)
      throws Exception {
    assertProblem(mockMvc.perform(request), status);
  }

  @Test
  void answersAnOverlapWithAProblemDetail() throws Exception {
    mockMvc.perform(json(post("/api/v1/plots"), plot(SQUARE)));

    assertProblem(mockMvc.perform(json(post("/api/v1/plots"), plot(SQUARE))), 409);
  }

  @Test
  void namesTheMissingEndpointWithoutInternalDetails() throws Exception {
    mockMvc
        .perform(get("/api/v1/nope"))
        .andExpect(jsonPath("$.detail").value("No endpoint GET /api/v1/nope"));
  }

  private static void assertProblem(ResultActions result, int status) throws Exception {
    result
        .andExpect(status().is(status))
        .andExpect(content().contentType(MediaType.APPLICATION_PROBLEM_JSON))
        .andExpect(jsonPath("$.status").value(status))
        .andExpect(jsonPath("$.title", not(emptyOrNullString())))
        .andExpect(jsonPath("$.detail", not(emptyOrNullString())))
        .andExpect(jsonPath("$.instance", not(emptyOrNullString())));
  }

  private static MockHttpServletRequestBuilder json(
      MockHttpServletRequestBuilder request, String body) {
    return request.with(loggedIn()).contentType(MediaType.APPLICATION_JSON).content(body);
  }

  private static MockHttpServletRequestBuilder search(String lat, String lng, String radius) {
    return get("/api/v1/plots/search")
        .param("lat", lat)
        .param("lng", lng)
        .param("radiusMeters", radius);
  }

  private static MockHttpServletRequestBuilder viewport(String bbox) {
    return get("/api/v1/plots").param("bbox", bbox);
  }

  private static String plot(String boundary) {
    return "{\"boundary\": %s, \"price\": 1000, \"description\": \"A plot\", \"contact\": \"seller@example.com\"}"
        .formatted(boundary);
  }
}
