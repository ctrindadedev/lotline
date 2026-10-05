package io.github.ctrindadedev.lotline.plot.web;

import static io.github.ctrindadedev.lotline.plot.TestGeometries.polygon;
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

@IntegrationTest
@AutoConfigureMockMvc
@Transactional
class PlotSearchTests {

  // West edge 1,032.6 m east of the centre; its nearest corners are 1,171.7 m away
  private static final String EAST_NEIGHBOUR =
      "POLYGON((-46.99 -22.005, -46.98 -22.005, -46.98 -21.995, -46.99 -21.995, -46.99 -22.005))";
  private static final String AROUND_THE_CENTRE =
      "POLYGON((-47.001 -22.001, -46.999 -22.001, -46.999 -21.999, -47.001 -21.999, -47.001 -22.001))";
  private static final String FAR_AWAY =
      "POLYGON((-46.5 -22.0, -46.49 -22.0, -46.49 -21.99, -46.5 -21.99, -46.5 -22.0))";

  @Autowired MockMvc mockMvc;
  @Autowired PlotRepository plotRepository;

  @Test
  void returnsAPlotContainingTheCentre() throws Exception {
    UUID id = save(AROUND_THE_CENTRE);

    search(10)
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.type").value("FeatureCollection"))
        .andExpect(jsonPath("$.features", hasSize(1)))
        .andExpect(jsonPath("$.features[0].id").value(id.toString()))
        .andExpect(jsonPath("$.features[0].geometry.type").value("Polygon"));
  }

  @Test
  void returnsAPlotWhoseEdgeEntersTheCircleWithEveryCornerOutside() throws Exception {
    UUID id = save(EAST_NEIGHBOUR);

    search(1100)
        .andExpect(jsonPath("$.features", hasSize(1)))
        .andExpect(jsonPath("$.features[0].id").value(id.toString()));
  }

  @Test
  void leavesOutAPlotJustBeyondTheRadius() throws Exception {
    save(EAST_NEIGHBOUR);

    search(1000).andExpect(jsonPath("$.features", hasSize(0)));
  }

  @Test
  void ordersResultsFromTheClosest() throws Exception {
    UUID neighbour = save(EAST_NEIGHBOUR);
    UUID centre = save(AROUND_THE_CENTRE);
    save(FAR_AWAY);

    search(1100)
        .andExpect(jsonPath("$.features", hasSize(2)))
        .andExpect(jsonPath("$.features[0].id").value(centre.toString()))
        .andExpect(jsonPath("$.features[1].id").value(neighbour.toString()));
  }

  @Test
  void answersAnEmptyCollectionWhenNothingIsNear() throws Exception {
    save(FAR_AWAY);

    search(1000)
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.type").value("FeatureCollection"))
        .andExpect(jsonPath("$.features", hasSize(0)));
  }

  @Test
  void listsEveryInvalidParameter() throws Exception {
    mockMvc
        .perform(get("/api/v1/plots/search?lat=91&lng=-47&radiusMeters=0"))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.detail").value("One or more fields are invalid"))
        .andExpect(jsonPath("$.errors", hasSize(2)))
        .andExpect(jsonPath("$.errors[?(@.field == 'lat')].message").exists())
        .andExpect(jsonPath("$.errors[?(@.field == 'radiusMeters')].message").exists());
  }

  private ResultActions search(int radiusMeters) throws Exception {
    return mockMvc.perform(
        get("/api/v1/plots/search?lat=-22&lng=-47&radiusMeters={radius}", radiusMeters));
  }

  private UUID save(String wkt) {
    return plotRepository
        .saveAndFlush(
            new Plot(polygon(wkt), new BigDecimal("1000"), "A plot", "seller@example.com"))
        .getId();
  }
}
