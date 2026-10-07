package io.github.ctrindadedev.lotline.plot.web;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.math.BigDecimal;
import java.time.Instant;

/**
 * The {@code properties} of a plot Feature; {@code contact} is for logged-in users only and {@code
 * ownedByMe} is for the user asking.
 */
public record PlotProperties(
    BigDecimal price,
    String description,
    @JsonInclude(JsonInclude.Include.NON_NULL) String contact,
    Instant createdAt,
    boolean ownedByMe) {}
