package io.github.ctrindadedev.lotline.plot.service;

import io.github.ctrindadedev.lotline.plot.exception.PlotNotFoundException;
import io.github.ctrindadedev.lotline.plot.persistence.Plot;
import io.github.ctrindadedev.lotline.plot.persistence.PlotRepository;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PlotService {

  private final PlotRepository plotRepository;
  private final PlotGeometryValidator geometryValidator;

  public PlotService(PlotRepository plotRepository, PlotGeometryValidator geometryValidator) {
    this.plotRepository = plotRepository;
    this.geometryValidator = geometryValidator;
  }

  @Transactional
  public PlotDetails create(NewPlot newPlot) {
    geometryValidator.validate(newPlot.boundary());
    Plot plot =
        plotRepository.saveAndFlush(
            new Plot(
                newPlot.boundary(), newPlot.price(), newPlot.description(), newPlot.contact()));
    return PlotDetails.from(plot);
  }

  @Transactional(readOnly = true)
  public PlotDetails findById(UUID id) {
    return plotRepository
        .findById(id)
        .map(PlotDetails::from)
        .orElseThrow(() -> new PlotNotFoundException(id));
  }
}
