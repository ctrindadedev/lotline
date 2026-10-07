package io.github.ctrindadedev.lotline.plot.exception;

import io.github.ctrindadedev.lotline.shared.ForbiddenException;

public class OwnPlotReservationException extends ForbiddenException {

  public OwnPlotReservationException() {
    super("You cannot reserve a plot you listed");
  }
}
