package io.github.ctrindadedev.lotline.plot.web;

import static io.github.ctrindadedev.lotline.plot.TestGeometries.polygon;
import static org.hamcrest.Matchers.containsInAnyOrder;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import io.github.ctrindadedev.lotline.IntegrationTest;
import io.github.ctrindadedev.lotline.plot.persistence.Plot;
import io.github.ctrindadedev.lotline.plot.persistence.PlotRepository;
import java.math.BigDecimal;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.transaction.annotation.Transactional;

/** The viewport is [-47.0, -22.0] to [-46.98, -21.98] unless a test says otherwise. */
@IntegrationTest
@AutoConfigureMockMvc
@Transactional
class PlotViewportTests {

  private static final String VIEWPORT = "-47.0,-22.0,-46.98,-21.98";
  private static final String INSIDE =
      "POLYGON((-46.995 -21.995, -46.99 -21.995, -46.99 -21.99, -46.995 -21.99, -46.995 -21.995))";
  private static final String CROSSING_THE_EAST_EDGE =
      "POLYGON((-46.985 -21.995, -46.97 -21.995, -46.97 -21.99, -46.985 -21.99, -46.985 -21.995))";
  private static final String OUTSIDE =
      "POLYGON((-46.97 -21.995, -46.96 -21.995, -46.96 -21.99, -46.97 -21.99, -46.97 -21.995))";
  private static final String COVERING_THE_VIEWPORT =
      "POLYGON((-47.1 -22.1, -46.9 -22.1, -46.9 -21.9, -47.1 -21.9, -47.1 -22.1))";

  @Autowired MockMvc mockMvc;
  @Autowired PlotRepository plotRepository;

  @Test
  void returnsPlotsInsideOrCrossingTheViewportOnly() throws Exception {
    UUID inside = save(INSIDE);
    UUID crossing = save(CROSSING_THE_EAST_EDGE);
    save(OUTSIDE);

    list(VIEWPORT)
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.type").value("FeatureCollection"))
        .andExpect(jsonPath("$.features", hasSize(2)))
        .andExpect(
            jsonPath("$.features[*].id")
                .value(containsInAnyOrder(inside.toString(), crossing.toString())));
  }

  @Test
  void returnsAPlotLargerThanTheViewport() throws Exception {
    UUID covering = save(COVERING_THE_VIEWPORT);

    list(VIEWPORT)
        .andExpect(jsonPath("$.features", hasSize(1)))
        .andExpect(jsonPath("$.features[0].id").value(covering.toString()));
  }

  @Test
  void answersAnEmptyCollectionForAnEmptyViewport() throws Exception {
    save(OUTSIDE);

    list(VIEWPORT).andExpect(status().isOk()).andExpect(jsonPath("$.features", hasSize(0)));
  }

  @Test
  void explainsWhatAValidBoundingBoxLooksLike() throws Exception {
    list("-46.98,-22.0,-47.0,-21.98")
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.errors[0].field").value("bbox"))
        .andExpect(
            jsonPath("$.errors[0].message")
                .value(
                    "must be minLng,minLat,maxLng,maxLat in degrees, in range,"
                        + " with each min below its max"));
  }

  private ResultActions list(String bbox) throws Exception {
    return mockMvc.perform(get("/api/v1/plots").param("bbox", bbox));
  }

  private UUID save(String wkt) {
    return plotRepository
        .saveAndFlush(
            new Plot(polygon(wkt), new BigDecimal("1000"), "A plot", "seller@example.com", null))
        .getId();
  }
}
