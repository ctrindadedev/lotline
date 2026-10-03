package io.github.ctrindadedev.lotline.plot.web;

import java.util.List;

/**
 * GeoJSON Polygon geometry (RFC 7946): a list of linear rings, exterior first, each a list of
 * {@code [longitude, latitude]} positions.
 */
public record GeoJsonPolygon(String type, List<List<List<Double>>> coordinates) {

  public static final String TYPE = "Polygon";

  public GeoJsonPolygon(List<List<List<Double>>> coordinates) {
    this(TYPE, coordinates);
  }
}
