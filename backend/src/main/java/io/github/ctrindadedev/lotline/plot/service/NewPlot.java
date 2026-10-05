package io.github.ctrindadedev.lotline.plot.service;

import java.math.BigDecimal;
import org.locationtech.jts.geom.Polygon;

public record NewPlot(Polygon boundary, BigDecimal price, String description, String contact) {}
