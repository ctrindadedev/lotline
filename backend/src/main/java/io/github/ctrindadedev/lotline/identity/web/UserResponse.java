package io.github.ctrindadedev.lotline.identity.web;

import io.github.ctrindadedev.lotline.identity.service.UserAccount;
import java.util.UUID;

public record UserResponse(UUID id, String name, String email) {

  static UserResponse from(UserAccount account) {
    return new UserResponse(account.id(), account.name(), account.email());
  }
}
