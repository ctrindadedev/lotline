package io.github.ctrindadedev.lotline.shared.web;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/** The catch-all, without a Spring context: no bean has to be broken to reach it. */
class ApiExceptionHandlerTests {

  @RestController
  static class FailingController {

    @GetMapping("/fail")
    String fail() {
      throw new IllegalStateException("connection to 10.0.0.5 refused");
    }
  }

  private final MockMvc mockMvc =
      MockMvcBuilders.standaloneSetup(new FailingController())
          .setControllerAdvice(new ApiExceptionHandler())
          .build();

  @Test
  void answersAnUnexpectedErrorWithAGeneric500() throws Exception {
    mockMvc
        .perform(get("/fail"))
        .andExpect(status().isInternalServerError())
        .andExpect(content().contentType(MediaType.APPLICATION_PROBLEM_JSON))
        .andExpect(jsonPath("$.status").value(500))
        .andExpect(jsonPath("$.title").value("Internal Server Error"))
        .andExpect(jsonPath("$.detail").value("An unexpected error occurred"))
        .andExpect(content().string(not(containsString("10.0.0.5"))));
  }
}
