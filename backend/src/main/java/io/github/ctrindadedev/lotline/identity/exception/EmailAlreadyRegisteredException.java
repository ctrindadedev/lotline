package io.github.ctrindadedev.lotline.identity.exception;

import io.github.ctrindadedev.lotline.shared.ConflictException;

public class EmailAlreadyRegisteredException extends ConflictException {

  public EmailAlreadyRegisteredException() {
    super("An account with this email already exists");
  }
}
