package io.github.ctrindadedev.lotline.shared;

/** The requested resource does not exist. Modules extend it; the API answers 404. */
public abstract class NotFoundException extends RuntimeException {

  protected NotFoundException(String message) {
    super(message);
  }
}
