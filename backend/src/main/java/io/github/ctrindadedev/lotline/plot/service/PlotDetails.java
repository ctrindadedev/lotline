package io.github.ctrindadedev.lotline.plot.service;

import io.github.ctrindadedev.lotline.plot.persistence.Plot;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;
import org.locationtech.jts.geom.Polygon;

/** A plot as seen outside the persistence layer: the entity never leaves the service. */
public record PlotDetails(
    UUID id,
    Polygon boundary,
    BigDecimal price,
    String description,
    String contact,
    Instant createdAt) {

  static PlotDetails from(Plot plot) {
    return new PlotDetails(
        plot.getId(),
        plot.getBoundary(),
        plot.getPrice(),
        plot.getDescription(),
        plot.getContact(),
        plot.getCreatedAt());
  }
}
