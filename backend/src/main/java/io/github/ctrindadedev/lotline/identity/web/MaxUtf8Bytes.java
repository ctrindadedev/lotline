package io.github.ctrindadedev.lotline.identity.web;

import static java.lang.annotation.ElementType.FIELD;
import static java.lang.annotation.RetentionPolicy.RUNTIME;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;
import java.lang.annotation.Retention;
import java.lang.annotation.Target;

/** At most {@code value} bytes in UTF-8. BCrypt reads only the first 72 bytes of a password. */
@Target(FIELD)
@Retention(RUNTIME)
@Constraint(validatedBy = MaxUtf8BytesValidator.class)
@interface MaxUtf8Bytes {

  int value();

  String message() default "must be at most {value} bytes long";

  Class<?>[] groups() default {};

  Class<? extends Payload>[] payload() default {};
}
