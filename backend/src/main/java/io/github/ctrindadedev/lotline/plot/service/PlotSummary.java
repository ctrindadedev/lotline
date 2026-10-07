package io.github.ctrindadedev.lotline.plot.service;

import io.github.ctrindadedev.lotline.plot.persistence.PlotSummaryView;

/** Aggregates over the plots in an area; the price figures are null when there are no plots. */
public record PlotSummary(
    long available,
    long reserved,
    long sold,
    double totalAreaSquareMeters,
    Double minPricePerSquareMeter,
    Double medianPricePerSquareMeter,
    Double maxPricePerSquareMeter) {

  static PlotSummary from(PlotSummaryView view) {
    return new PlotSummary(
        view.getAvailable(),
        view.getReserved(),
        view.getSold(),
        view.getTotalArea(),
        view.getMinPricePerSquareMeter(),
        view.getMedianPricePerSquareMeter(),
        view.getMaxPricePerSquareMeter());
  }
}
