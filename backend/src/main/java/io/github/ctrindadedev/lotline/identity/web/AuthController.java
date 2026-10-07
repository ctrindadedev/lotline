package io.github.ctrindadedev.lotline.identity.web;

import io.github.ctrindadedev.lotline.identity.service.AccountService;
import io.github.ctrindadedev.lotline.identity.service.NewUser;
import io.github.ctrindadedev.lotline.identity.service.UserAccount;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationCredentialsNotFoundException;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.context.SecurityContextHolderStrategy;
import org.springframework.security.web.authentication.session.ChangeSessionIdAuthenticationStrategy;
import org.springframework.security.web.authentication.session.CompositeSessionAuthenticationStrategy;
import org.springframework.security.web.authentication.session.SessionAuthenticationStrategy;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.security.web.csrf.CsrfAuthenticationStrategy;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Session login over JSON. Logout is Spring Security's filter at {@code POST /api/v1/auth/logout}.
 */
@Tag(name = "Authentication")
@RestController
@RequestMapping("/api/v1/auth")
class AuthController {

  private final AccountService accountService;
  private final AuthenticationManager authenticationManager;
  private final SecurityContextHolderStrategy contextHolder =
      SecurityContextHolder.getContextHolderStrategy();
  private final SecurityContextRepository contextRepository =
      new HttpSessionSecurityContextRepository();
  // Same as Spring's own login: a new session id, and a new CSRF token (the repository csrf.spa()
  // uses).
  private final SessionAuthenticationStrategy onLogin =
      new CompositeSessionAuthenticationStrategy(
          List.of(
              new ChangeSessionIdAuthenticationStrategy(),
              new CsrfAuthenticationStrategy(CookieCsrfTokenRepository.withHttpOnlyFalse())));

  AuthController(AccountService accountService, AuthenticationManager authenticationManager) {
    this.accountService = accountService;
    this.authenticationManager = authenticationManager;
  }

  @Operation(summary = "Create an account and log in")
  @PostMapping("/register")
  ResponseEntity<UserResponse> register(
      @Valid @RequestBody RegisterRequest request,
      HttpServletRequest httpRequest,
      HttpServletResponse httpResponse) {
    accountService.register(new NewUser(request.name(), request.email(), request.password()));
    UserAccount account = logIn(request.email(), request.password(), httpRequest, httpResponse);
    return ResponseEntity.status(HttpStatus.CREATED).body(UserResponse.from(account));
  }

  @Operation(summary = "Log in, starting a session")
  @PostMapping("/login")
  UserResponse login(
      @Valid @RequestBody LoginRequest request,
      HttpServletRequest httpRequest,
      HttpServletResponse httpResponse) {
    return UserResponse.from(logIn(request.email(), request.password(), httpRequest, httpResponse));
  }

  @Operation(summary = "The logged-in user, or 401")
  @GetMapping("/me")
  UserResponse me(CsrfToken csrfToken, @AuthenticationPrincipal UserAccount account) {
    // Loading the deferred token is what writes the XSRF-TOKEN cookie the SPA needs to POST.
    csrfToken.getToken();
    if (account == null) {
      throw new AuthenticationCredentialsNotFoundException("Not logged in");
    }
    return UserResponse.from(account);
  }

  private UserAccount logIn(
      String email, String password, HttpServletRequest request, HttpServletResponse response) {
    Authentication authentication =
        authenticationManager.authenticate(
            UsernamePasswordAuthenticationToken.unauthenticated(email, password));
    onLogin.onAuthentication(authentication, request, response);
    if (request.getAttribute(CsrfToken.class.getName()) instanceof CsrfToken newToken) {
      newToken.getToken();
    }
    SecurityContext context = contextHolder.createEmptyContext();
    context.setAuthentication(authentication);
    contextHolder.setContext(context);
    contextRepository.saveContext(context, request, response);
    return (UserAccount) authentication.getPrincipal();
  }
}
