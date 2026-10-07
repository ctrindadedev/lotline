package io.github.ctrindadedev.lotline.plot.web;

import static io.github.ctrindadedev.lotline.TestSecurity.loggedInAs;
import static io.github.ctrindadedev.lotline.TestSecurity.signUp;
import static io.github.ctrindadedev.lotline.plot.TestGeometries.polygon;
import static org.hamcrest.Matchers.closeTo;
import static org.hamcrest.Matchers.nullValue;
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
import org.junit.jupiter.api.Test;
import org.locationtech.jts.geom.Polygon;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

@IntegrationTest
@AutoConfigureMockMvc
@Transactional
class PlotSummaryTests {

  private static final String VIEWPORT = "-47.1,-22.1,-46.8,-21.9";

  @Autowired MockMvc mockMvc;
  @Autowired AccountService accountService;
  @Autowired PlotRepository plotRepository;

  private UUID save(double lng, String price, UUID ownerId) {
    Polygon square =
        polygon(
            "POLYGON((%1$s -22, %2$s -22, %2$s -21.99, %1$s -21.99, %1$s -22))"
                .formatted(lng, lng + 0.01));
    return plotRepository
        .saveAndFlush(new Plot(square, new BigDecimal(price), "A plot", "x@example.com", ownerId))
        .getId();
  }

  @Test
  void summarisesAnEmptyAreaWithZerosAndNoPrices() throws Exception {
    mockMvc
        .perform(get("/api/v1/plots/summary").param("bbox", VIEWPORT))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.available").value(0))
        .andExpect(jsonPath("$.reserved").value(0))
        .andExpect(jsonPath("$.sold").value(0))
        .andExpect(jsonPath("$.totalAreaSquareMeters").value(0.0))
        .andExpect(jsonPath("$.minPricePerSquareMeter").value(nullValue()))
        .andExpect(jsonPath("$.medianPricePerSquareMeter").value(nullValue()))
        .andExpect(jsonPath("$.maxPricePerSquareMeter").value(nullValue()));
  }

  @Test
  void countsByStatusAndMeasuresAreaAndPricesOnTheGround() throws Exception {
    UserAccount seller = signUp(accountService, "seller@example.com");
    UserAccount buyer =
        accountService.register(new NewUser("Buyer", "buyer@example.com", "correct horse"));
    save(-47.0, "1000000", seller.id());
    save(-46.98, "2000000", seller.id());
    UUID reserved = save(-46.96, "4000000", seller.id());
    save(-46.5, "9000000", seller.id());
    mockMvc
        .perform(post("/api/v1/plots/" + reserved + "/reservation").with(loggedInAs(buyer)))
        .andExpect(status().isOk());
    double area =
        plotRepository
            .measure(polygon("POLYGON((-47 -22, -46.99 -22, -46.99 -21.99, -47 -21.99, -47 -22))"))
            .getArea();

    mockMvc
        .perform(get("/api/v1/plots/summary").param("bbox", VIEWPORT))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.available").value(2))
        .andExpect(jsonPath("$.reserved").value(1))
        .andExpect(jsonPath("$.sold").value(0))
        .andExpect(jsonPath("$.totalAreaSquareMeters").value(closeTo(3 * area, 1)))
        .andExpect(jsonPath("$.minPricePerSquareMeter").value(closeTo(1_000_000 / area, 1e-3)))
        .andExpect(jsonPath("$.medianPricePerSquareMeter").value(closeTo(2_000_000 / area, 1e-3)))
        .andExpect(jsonPath("$.maxPricePerSquareMeter").value(closeTo(4_000_000 / area, 1e-3)));
  }

  @Test
  void refusesToSummariseAnAreaLargerThanTheCap() throws Exception {
    mockMvc
        .perform(get("/api/v1/plots/summary").param("bbox", "-180,-90,180,90"))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.errors[0].field").value("bbox"));
  }

  @Test
  void validatesTheBoundingBoxLikeTheViewportListing() throws Exception {
    mockMvc
        .perform(get("/api/v1/plots/summary").param("bbox", "-46,-22,-47,-21"))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.errors[0].field").value("bbox"));
  }
}
