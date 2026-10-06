package io.github.ctrindadedev.lotline.plot.service;

import io.github.ctrindadedev.lotline.plot.exception.PlotNotFoundException;
import io.github.ctrindadedev.lotline.plot.exception.PlotOverlapException;
import io.github.ctrindadedev.lotline.plot.persistence.Plot;
import io.github.ctrindadedev.lotline.plot.persistence.PlotRepository;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PlotService {

  static final double OVERLAP_TOLERANCE_SQUARE_METERS = 1;

  private final PlotRepository plotRepository;
  private final PlotGeometryValidator geometryValidator;

  public PlotService(PlotRepository plotRepository, PlotGeometryValidator geometryValidator) {
    this.plotRepository = plotRepository;
    this.geometryValidator = geometryValidator;
  }

  @Transactional
  public PlotDetails create(NewPlot newPlot) {
    geometryValidator.validate(newPlot.boundary());
    // Lock before the overlap query, so it sees a concurrent registration once that one commits.
    plotRepository.lockRegistrationsUntilCommit();
    List<UUID> overlappingIds =
        plotRepository.findOverlappingIds(newPlot.boundary(), OVERLAP_TOLERANCE_SQUARE_METERS);
    if (!overlappingIds.isEmpty()) {
      throw new PlotOverlapException(overlappingIds);
    }
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

  @Transactional(readOnly = true)
  public List<PlotDetails> searchWithinRadius(
      double lat, double lng, double radiusMeters, SearchFilters filters) {
    return plotRepository
        .findWithinRadius(
            lat,
            lng,
            radiusMeters,
            filters.minPrice(),
            filters.maxPrice(),
            filters.minAreaSquareMeters(),
            filters.maxAreaSquareMeters())
        .stream()
        .map(PlotDetails::from)
        .toList();
  }

  @Transactional(readOnly = true)
  public List<PlotDetails> listInBoundingBox(
      double minLng, double minLat, double maxLng, double maxLat) {
    return plotRepository.findInBoundingBox(minLng, minLat, maxLng, maxLat).stream()
        .map(PlotDetails::from)
        .toList();
  }
}
