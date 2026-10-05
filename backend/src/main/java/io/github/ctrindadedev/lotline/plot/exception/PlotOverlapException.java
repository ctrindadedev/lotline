package io.github.ctrindadedev.lotline.plot.exception;

import io.github.ctrindadedev.lotline.shared.ConflictException;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

public class PlotOverlapException extends ConflictException {

  public PlotOverlapException(List<UUID> overlappingIds) {
    super(
        "The boundary overlaps existing plots: "
            + overlappingIds.stream().map(UUID::toString).collect(Collectors.joining(", ")));
  }
}
