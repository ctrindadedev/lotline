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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.ResultMatcher;
import org.springframework.transaction.annotation.Transactional;

/** Searches a 2 km circle around (-22, -47). Small plots are ~11,400 m2, large ones ~285,000 m2. */
@IntegrationTest
@AutoConfigureMockMvc
@Transactional
class PlotSearchFilterTests {

  private static final String SMALL_NEAR =
      "POLYGON((-47.002 -22.002, -47.001 -22.002, -47.001 -22.001, -47.002 -22.001, -47.002 -22.002))";
  private static final String LARGE_NEAR_EAST =
      "POLYGON((-46.999 -22.0, -46.994 -22.0, -46.994 -21.995, -46.999 -21.995, -46.999 -22.0))";
  private static final String LARGE_NEAR_WEST =
      "POLYGON((-47.006 -21.999, -47.001 -21.999, -47.001 -21.994, -47.006 -21.994, -47.006 -21.999))";
  private static final String SMALL_FAR_AWAY =
      "POLYGON((-46.5 -22.0, -46.499 -22.0, -46.499 -21.999, -46.5 -21.999, -46.5 -22.0))";

  @Autowired MockMvc mockMvc;
  @Autowired PlotRepository plotRepository;

  private String smallCheap;
  private String largeExpensive;
  private String largeCheap;

  @BeforeEach
  void savePlots() {
    smallCheap = save(SMALL_NEAR, "100000");
    largeExpensive = save(LARGE_NEAR_EAST, "500000");
    largeCheap = save(LARGE_NEAR_WEST, "150000");
    save(SMALL_FAR_AWAY, "100000");
  }

  @Test
  void returnsEveryPlotInTheCircleWithoutFilters() throws Exception {
    search("").andExpect(status().isOk()).andExpect(ids(smallCheap, largeExpensive, largeCheap));
  }

  @Test
  void filtersByMinimumPrice() throws Exception {
    search("&minPrice=200000").andExpect(ids(largeExpensive));
  }

  @Test
  void filtersByMaximumPriceWithinTheCircleOnly() throws Exception {
    search("&maxPrice=200000").andExpect(ids(smallCheap, largeCheap));
  }

  @Test
  void includesAPriceEqualToEitherBound() throws Exception {
    search("&minPrice=150000&maxPrice=150000").andExpect(ids(largeCheap));
  }

  @Test
  void filtersByMinimumArea() throws Exception {
    search("&minAreaSquareMeters=100000").andExpect(ids(largeExpensive, largeCheap));
  }

  @Test
  void filtersByMaximumArea() throws Exception {
    search("&maxAreaSquareMeters=100000").andExpect(ids(smallCheap));
  }

  @Test
  void combinesPriceAndAreaFilters() throws Exception {
    search("&maxPrice=200000&minAreaSquareMeters=100000").andExpect(ids(largeCheap));
  }

  @Test
  void answersAnEmptyCollectionForAnInvertedRange() throws Exception {
    search("&minPrice=200000&maxPrice=100000")
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.features", hasSize(0)));
  }

  @Test
  void listsEveryInvalidFilter() throws Exception {
    search("&minPrice=-1&maxAreaSquareMeters=-5")
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.errors", hasSize(2)))
        .andExpect(jsonPath("$.errors[?(@.field == 'minPrice')].message").exists())
        .andExpect(jsonPath("$.errors[?(@.field == 'maxAreaSquareMeters')].message").exists());
  }

  private ResultActions search(String filters) throws Exception {
    return mockMvc.perform(get("/api/v1/plots/search?lat=-22&lng=-47&radiusMeters=2000" + filters));
  }

  private static ResultMatcher ids(String... ids) {
    return result -> {
      jsonPath("$.features", hasSize(ids.length)).match(result);
      jsonPath("$.features[*].id").value(containsInAnyOrder(ids)).match(result);
    };
  }

  private String save(String wkt, String price) {
    UUID id =
        plotRepository
            .saveAndFlush(new Plot(polygon(wkt), new BigDecimal(price), "A plot", "seller@x.com"))
            .getId();
    return id.toString();
  }
}
