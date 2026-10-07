package io.github.ctrindadedev.lotline.identity.web;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import io.github.ctrindadedev.lotline.IntegrationTest;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.transaction.annotation.Transactional;

@IntegrationTest
@AutoConfigureMockMvc
@Transactional
class AuthFlowTests {

  private static final String PASSWORD = "correct horse battery";

  @Autowired MockMvc mockMvc;

  private ResultActions register(
      String name, String email, String password, MockHttpSession session) throws Exception {
    return mockMvc.perform(
        post("/api/v1/auth/register")
            .session(session)
            .with(csrf())
            .contentType(MediaType.APPLICATION_JSON)
            .content(
                "{\"name\": \"%s\", \"email\": \"%s\", \"password\": \"%s\"}"
                    .formatted(name, email, password)));
  }

  private ResultActions login(String email, String password, MockHttpSession session)
      throws Exception {
    return mockMvc.perform(
        post("/api/v1/auth/login")
            .session(session)
            .with(csrf())
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"email\": \"%s\", \"password\": \"%s\"}".formatted(email, password)));
  }

  private ResultActions me(MockHttpSession session) throws Exception {
    return mockMvc.perform(get("/api/v1/auth/me").session(session));
  }

  @Test
  void registersLogsInAndLogsOutWithASession() throws Exception {
    MockHttpSession session = new MockHttpSession();

    register("Ana Souza", "Ana@Example.COM", PASSWORD, session)
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.name").value("Ana Souza"))
        .andExpect(jsonPath("$.email").value("ana@example.com"))
        .andExpect(jsonPath("$.id").isNotEmpty());
    me(session).andExpect(status().isOk()).andExpect(jsonPath("$.email").value("ana@example.com"));

    mockMvc
        .perform(post("/api/v1/auth/logout").session(session).with(csrf()))
        .andExpect(status().isNoContent());

    me(session).andExpect(status().isUnauthorized());
  }

  @Test
  void logsInWithTheEmailInAnyCaseANewSessionIdAndANewCsrfToken() throws Exception {
    register("Ana Souza", "ana@example.com", PASSWORD, new MockHttpSession());
    MockHttpSession session = new MockHttpSession();
    String anonymousSessionId = session.getId();

    MvcResult result =
        mockMvc
            .perform(
                post("/api/v1/auth/login")
                    .session(session)
                    .with(csrf())
                    .cookie(new Cookie("XSRF-TOKEN", "token-seen-before-login"))
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(
                        "{\"email\": \"ANA@example.com\", \"password\": \"%s\"}"
                            .formatted(PASSWORD)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.name").value("Ana Souza"))
            .andReturn();

    assertThat(result.getRequest().getSession().getId()).isNotEqualTo(anonymousSessionId);
    assertThat(result.getResponse().getHeaders("Set-Cookie"))
        .anyMatch(header -> header.matches("XSRF-TOKEN=[^;]+;.*"))
        .noneMatch(header -> header.contains("token-seen-before-login"));
  }

  @Test
  void refusesAWrongPasswordOrAnUnknownEmailTheSameWay() throws Exception {
    register("Ana Souza", "ana@example.com", PASSWORD, new MockHttpSession());

    for (String email : new String[] {"ana@example.com", "nobody@example.com"}) {
      MockHttpSession session = new MockHttpSession();
      login(email, "wrong password", session)
          .andExpect(status().isUnauthorized())
          .andExpect(jsonPath("$.detail").value("Email or password is incorrect"));
      me(session).andExpect(status().isUnauthorized());
    }
  }

  @Test
  void refusesASecondAccountWithTheSameEmail() throws Exception {
    register("Ana Souza", "ana@example.com", PASSWORD, new MockHttpSession());

    register("Ana Again", "ANA@example.com", PASSWORD, new MockHttpSession())
        .andExpect(status().isConflict())
        .andExpect(jsonPath("$.detail").value("An account with this email already exists"));
  }

  @Test
  void listsEveryInvalidRegistrationField() throws Exception {
    register("", "not-an-email", "short", new MockHttpSession())
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.errors", hasSize(3)))
        .andExpect(jsonPath("$.errors[?(@.field == 'name')]").exists())
        .andExpect(jsonPath("$.errors[?(@.field == 'email')]").exists())
        .andExpect(jsonPath("$.errors[?(@.field == 'password')]").exists());
  }

  @Test
  void refusesAPasswordLongerThanBcryptReads() throws Exception {
    // 40 characters, but 80 bytes in UTF-8
    register("Ana Souza", "ana@example.com", "é".repeat(40), new MockHttpSession())
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.errors[0].field").value("password"))
        .andExpect(jsonPath("$.errors[0].message").value("must be at most 72 bytes long"));
  }

  // Its XSRF-TOKEN cookie is checked in the CI stack job: MockMvc's csrf() swaps the repository.
  @Test
  void answersAnonymousVisitorsWith401() throws Exception {
    mockMvc
        .perform(get("/api/v1/auth/me"))
        .andExpect(status().isUnauthorized())
        .andExpect(jsonPath("$.detail").value("Log in to do this"));
  }

  @Test
  void needsALoggedInUserAndTheCsrfTokenToWrite() throws Exception {
    mockMvc
        .perform(
            post("/api/v1/plots")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}"))
        .andExpect(status().isUnauthorized())
        .andExpect(jsonPath("$.detail").value("Log in to do this"));

    MockHttpSession session = new MockHttpSession();
    register("Ana Souza", "ana@example.com", PASSWORD, session);
    mockMvc
        .perform(
            post("/api/v1/plots")
                .session(session)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}"))
        .andExpect(status().isForbidden())
        .andExpect(jsonPath("$.detail").value("Missing or invalid CSRF token"));
  }
}
