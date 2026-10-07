package io.github.ctrindadedev.lotline.identity;

import io.github.ctrindadedev.lotline.identity.service.UserAccount;
import java.util.Optional;
import java.util.UUID;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

/** Who is logged in, as seen by other modules: an id, never the account itself. */
@Component
public class CurrentUser {

  public Optional<UUID> id() {
    Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
    if (authentication != null && authentication.getPrincipal() instanceof UserAccount account) {
      return Optional.of(account.id());
    }
    return Optional.empty();
  }
}
