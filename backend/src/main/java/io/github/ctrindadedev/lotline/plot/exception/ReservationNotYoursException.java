package io.github.ctrindadedev.lotline.plot.exception;

import io.github.ctrindadedev.lotline.shared.ForbiddenException;

public class ReservationNotYoursException extends ForbiddenException {

  public ReservationNotYoursException() {
    super("Only the seller or the user who reserved this plot can release it");
  }
}
