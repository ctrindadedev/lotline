package io.github.ctrindadedev.lotline.shared;

/** The request clashes with data already stored. Modules extend it; the API answers 409. */
public abstract class ConflictException extends RuntimeException {

  protected ConflictException(String message) {
    super(message);
  }
}
