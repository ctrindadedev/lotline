package io.github.ctrindadedev.lotline.plot.exception;

import io.github.ctrindadedev.lotline.shared.UnprocessableException;

/** A plot boundary that cannot be accepted as drawn. Never repaired, always rejected. */
public class InvalidGeometryException extends UnprocessableException {

  public InvalidGeometryException(String message) {
    super(message);
  }
}
