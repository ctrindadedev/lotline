package io.github.ctrindadedev.lotline;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;

import io.github.ctrindadedev.lotline.identity.service.AccountService;
import io.github.ctrindadedev.lotline.identity.service.NewUser;
import io.github.ctrindadedev.lotline.identity.service.UserAccount;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.test.web.servlet.request.RequestPostProcessor;

/** Writes need a logged-in user and the CSRF token (ADR 0018); this logs in a real account. */
public final class TestSecurity {

  private static volatile UserAccount current;

  private TestSecurity() {}

  /** Registers an account and makes it the one {@link #loggedIn()} uses. */
  public static UserAccount signUp(AccountService accountService, String email) {
    current = accountService.register(new NewUser("Seller", email, "correct horse battery"));
    return current;
  }

  public static RequestPostProcessor loggedIn() {
    return loggedInAs(current);
  }

  public static RequestPostProcessor loggedInAs(UserAccount account) {
    return request ->
        csrf()
            .postProcessRequest(
                authentication(
                        UsernamePasswordAuthenticationToken.authenticated(
                            account, null, account.getAuthorities()))
                    .postProcessRequest(request));
  }
}
