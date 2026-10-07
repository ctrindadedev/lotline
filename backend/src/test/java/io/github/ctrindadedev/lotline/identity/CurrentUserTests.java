package io.github.ctrindadedev.lotline.identity;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import io.github.ctrindadedev.lotline.IntegrationTest;
import io.github.ctrindadedev.lotline.identity.service.AccountService;
import io.github.ctrindadedev.lotline.identity.service.NewUser;
import io.github.ctrindadedev.lotline.identity.service.UserAccount;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.User;
import org.springframework.transaction.annotation.Transactional;

@IntegrationTest
@Transactional
class CurrentUserTests {

  @Autowired AccountService accountService;
  @Autowired CurrentUser currentUser;

  @AfterEach
  void clearContext() {
    SecurityContextHolder.clearContext();
  }

  @Test
  void exposesOnlyTheIdOfTheLoggedInAccount() {
    UserAccount account =
        accountService.register(new NewUser("Ana Souza", "ana@example.com", "correct horse"));
    SecurityContextHolder.getContext()
        .setAuthentication(UsernamePasswordAuthenticationToken.authenticated(account, null, null));

    assertThat(currentUser.id()).contains(account.id());
  }

  @Test
  void isEmptyWithoutAnAccountOfThisApplication() {
    assertThat(currentUser.id()).isEmpty();

    SecurityContextHolder.getContext()
        .setAuthentication(
            UsernamePasswordAuthenticationToken.authenticated(
                User.withUsername("someone").password("x").build(), null, null));
    assertThat(currentUser.id()).isEmpty();
  }

  @Test
  void reportsATakenEmailOnlyForTheEmailConstraint() {
    String tooLongForTheColumn = "x".repeat(101);

    assertThatThrownBy(
            () -> accountService.register(new NewUser(tooLongForTheColumn, "b@example.com", "pw")))
        .isInstanceOf(DataIntegrityViolationException.class);
  }

  @Test
  void forgetsThePasswordHashOnceAuthenticated() {
    UserAccount account =
        accountService.register(new NewUser("Ana Souza", "ana@example.com", "correct horse"));
    assertThat(account.getPassword()).startsWith("$2");

    account.eraseCredentials();

    assertThat(account.getPassword()).isNull();
    assertThat(account.getAuthorities()).isEmpty();
  }
}
