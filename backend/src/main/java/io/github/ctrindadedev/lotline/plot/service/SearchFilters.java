package io.github.ctrindadedev.lotline.plot.service;

import java.math.BigDecimal;

/** Optional, inclusive bounds combined with the spatial search; a null bound is not applied. */
public record SearchFilters(
    BigDecimal minPrice,
    BigDecimal maxPrice,
    BigDecimal minAreaSquareMeters,
    BigDecimal maxAreaSquareMeters) {}
