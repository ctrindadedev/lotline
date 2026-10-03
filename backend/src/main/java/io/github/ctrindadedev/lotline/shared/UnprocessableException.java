package io.github.ctrindadedev.lotline.shared;

/** Well-formed input that breaks a business rule. Modules extend it; the API answers 422. */
public abstract class UnprocessableException extends RuntimeException {

  protected UnprocessableException(String message) {
    super(message);
  }
}
