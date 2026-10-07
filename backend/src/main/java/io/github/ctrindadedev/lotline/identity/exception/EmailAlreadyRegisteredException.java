package io.github.ctrindadedev.lotline.identity.exception;

import io.github.ctrindadedev.lotline.shared.ConflictException;

public class EmailAlreadyRegisteredException extends ConflictException {

  public EmailAlreadyRegisteredException() {
    super("The account could not be created with these details");
  }
}
