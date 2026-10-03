package io.github.ctrindadedev.lotline.plot.web;

import com.fasterxml.jackson.annotation.JsonPropertyOrder;
import java.util.UUID;

/** GeoJSON Feature: a polygon plus the properties of what it outlines. */
@JsonPropertyOrder({"type", "id", "geometry", "properties"})
public record GeoJsonFeature<P>(String type, UUID id, GeoJsonPolygon geometry, P properties) {

  public static final String TYPE = "Feature";

  public GeoJsonFeature(UUID id, GeoJsonPolygon geometry, P properties) {
    this(TYPE, id, geometry, properties);
  }
}
