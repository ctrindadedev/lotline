package io.github.ctrindadedev.lotline.plot.service;

import java.math.BigDecimal;

/** What an owner may change; the boundary stays, so no overlap check is needed. */
public record PlotChanges(BigDecimal price, String description, String contact) {}
