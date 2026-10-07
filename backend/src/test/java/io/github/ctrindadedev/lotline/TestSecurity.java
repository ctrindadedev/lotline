package io.github.ctrindadedev.lotline;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;

import org.springframework.test.web.servlet.request.RequestPostProcessor;

/** Request helpers for writes, which need a logged-in user and the CSRF token (ADR 0018). */
public final class TestSecurity {

  private TestSecurity() {}

  public static RequestPostProcessor loggedIn() {
    return request ->
        csrf().postProcessRequest(user("seller@example.com").postProcessRequest(request));
  }
}
