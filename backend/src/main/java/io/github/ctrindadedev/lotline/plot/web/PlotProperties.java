package io.github.ctrindadedev.lotline.plot.web;

import java.math.BigDecimal;
import java.time.Instant;

/** The {@code properties} of a plot Feature; {@code ownedByMe} is for the user asking. */
public record PlotProperties(
    BigDecimal price, String description, String contact, Instant createdAt, boolean ownedByMe) {}
