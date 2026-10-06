package io.github.ctrindadedev.lotline.plot.web;

import static java.lang.annotation.ElementType.PARAMETER;
import static java.lang.annotation.RetentionPolicy.RUNTIME;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;
import java.lang.annotation.Retention;
import java.lang.annotation.Target;

/** {@code minLng,minLat,maxLng,maxLat} in degrees, each in range and with min below max. */
@Target(PARAMETER)
@Retention(RUNTIME)
@Constraint(validatedBy = BoundingBoxValidator.class)
@interface BoundingBox {

  String message() default
      "must be minLng,minLat,maxLng,maxLat in degrees, in range, with each min below its max";

  Class<?>[] groups() default {};

  Class<? extends Payload>[] payload() default {};
}
