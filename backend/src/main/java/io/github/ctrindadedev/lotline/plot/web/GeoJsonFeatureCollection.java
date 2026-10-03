package io.github.ctrindadedev.lotline.plot.web;

import com.fasterxml.jackson.annotation.JsonPropertyOrder;
import java.util.List;

/** GeoJSON FeatureCollection: the shape of every list of plots returned by the API. */
@JsonPropertyOrder({"type", "features"})
public record GeoJsonFeatureCollection<P>(String type, List<GeoJsonFeature<P>> features) {

  public static final String TYPE = "FeatureCollection";

  public GeoJsonFeatureCollection(List<GeoJsonFeature<P>> features) {
    this(TYPE, features);
  }
}
