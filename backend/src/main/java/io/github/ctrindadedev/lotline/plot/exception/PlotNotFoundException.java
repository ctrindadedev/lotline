package io.github.ctrindadedev.lotline.plot.exception;

import io.github.ctrindadedev.lotline.shared.NotFoundException;
import java.util.UUID;

public class PlotNotFoundException extends NotFoundException {

  public PlotNotFoundException(UUID id) {
    super("Plot " + id + " not found");
  }
}
