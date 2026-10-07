package io.github.ctrindadedev.lotline.plot.persistence;

/** One row of aggregates over the plots in a bounding box; price fields are null when empty. */
public interface PlotSummaryView {

  long getAvailable();

  long getReserved();

  long getSold();

  double getTotalArea();

  Double getMinPricePerSquareMeter();

  Double getMedianPricePerSquareMeter();

  Double getMaxPricePerSquareMeter();
}
