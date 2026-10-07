package io.github.ctrindadedev.lotline.shared;

/**
 * The user is known but may not do this to this resource. Modules extend it; the API answers 403.
 */
public abstract class ForbiddenException extends RuntimeException {

  protected ForbiddenException(String message) {
    super(message);
  }
}
