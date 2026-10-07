package io.github.ctrindadedev.lotline.plot.web;

import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

public record UpdatePlotRequest(
    @NotNull @Positive @Digits(integer = 12, fraction = 2) BigDecimal price,
    @NotBlank @Size(max = 2000) String description,
    @NotBlank @Size(max = 255) String contact) {}
