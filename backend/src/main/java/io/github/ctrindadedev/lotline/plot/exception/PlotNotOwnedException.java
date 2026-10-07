package io.github.ctrindadedev.lotline.plot.exception;

import io.github.ctrindadedev.lotline.shared.ForbiddenException;

public class PlotNotOwnedException extends ForbiddenException {

  public PlotNotOwnedException() {
    super("Only the user who listed this plot can change it");
  }
}
