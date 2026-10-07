package io.github.ctrindadedev.lotline.plot.exception;

import io.github.ctrindadedev.lotline.shared.ConflictException;

/** The plot's status does not allow the requested change. */
public class PlotStatusConflictException extends ConflictException {

  public PlotStatusConflictException(String message) {
    super(message);
  }
}
