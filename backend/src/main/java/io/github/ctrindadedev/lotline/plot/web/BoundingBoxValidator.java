package io.github.ctrindadedev.lotline.plot.web;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import java.util.List;
import java.util.Objects;

class BoundingBoxValidator implements ConstraintValidator<BoundingBox, List<Double>> {

  /** Wider than any viewport at the frontend's minimum zoom, even on an 8K screen (ADR 0011). */
  static final double MAX_SPAN_DEGREES = 3;

  @Override
  public boolean isValid(List<Double> bbox, ConstraintValidatorContext context) {
    if (bbox == null) {
      return true;
    }
    if (bbox.size() != 4
        || !bbox.stream().allMatch(v -> Objects.nonNull(v) && Double.isFinite(v))) {
      return false;
    }
    double minLng = bbox.get(0), minLat = bbox.get(1), maxLng = bbox.get(2), maxLat = bbox.get(3);
    return -180 <= minLng
        && minLng < maxLng
        && maxLng <= 180
        && -90 <= minLat
        && minLat < maxLat
        && maxLat <= 90
        && maxLng - minLng <= MAX_SPAN_DEGREES
        && maxLat - minLat <= MAX_SPAN_DEGREES;
  }
}
