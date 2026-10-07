package io.github.ctrindadedev.lotline.plot;

/** Where a plot is in its sale: {@code AVAILABLE → RESERVED → SOLD}. See ADR 0021. */
public enum PlotStatus {
  AVAILABLE,
  RESERVED,
  SOLD
}
