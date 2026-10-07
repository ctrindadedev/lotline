package io.github.ctrindadedev.lotline.plot.web;

import com.fasterxml.jackson.annotation.JsonInclude;
import io.github.ctrindadedev.lotline.plot.PlotStatus;
import java.math.BigDecimal;
import java.time.Instant;

/**
 * The {@code properties} of a plot Feature; {@code contact} is for logged-in users only, {@code
 * ownedByMe} and {@code reservedByMe} are for the user asking, {@code reservable} is false for
 * plots without a seller.
 */
public record PlotProperties(
    BigDecimal price,
    String description,
    @JsonInclude(JsonInclude.Include.NON_NULL) String contact,
    Instant createdAt,
    PlotStatus status,
    boolean reservable,
    boolean ownedByMe,
    boolean reservedByMe) {}
