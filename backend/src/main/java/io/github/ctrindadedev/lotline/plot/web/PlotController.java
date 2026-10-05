package io.github.ctrindadedev.lotline.plot.web;

import io.github.ctrindadedev.lotline.plot.service.NewPlot;
import io.github.ctrindadedev.lotline.plot.service.PlotDetails;
import io.github.ctrindadedev.lotline.plot.service.PlotService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.net.URI;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

@Tag(name = "Plots")
@RestController
@RequestMapping("/api/v1/plots")
class PlotController {

  private final PlotService plotService;
  private final GeoJsonMapper geoJsonMapper;

  PlotController(PlotService plotService, GeoJsonMapper geoJsonMapper) {
    this.plotService = plotService;
    this.geoJsonMapper = geoJsonMapper;
  }

  @Operation(summary = "List a plot for sale")
  @PostMapping
  ResponseEntity<GeoJsonFeature<PlotProperties>> create(
      @Valid @RequestBody CreatePlotRequest request) {
    PlotDetails plot =
        plotService.create(
            new NewPlot(
                geoJsonMapper.toPolygon(request.boundary()),
                request.price(),
                request.description(),
                request.contact()));
    URI location =
        ServletUriComponentsBuilder.fromCurrentRequest()
            .path("/{id}")
            .buildAndExpand(plot.id())
            .toUri();
    return ResponseEntity.created(location).body(toFeature(plot));
  }

  @Operation(summary = "Get a plot by id")
  @GetMapping("/{id}")
  GeoJsonFeature<PlotProperties> findById(@PathVariable UUID id) {
    return toFeature(plotService.findById(id));
  }

  private GeoJsonFeature<PlotProperties> toFeature(PlotDetails plot) {
    return geoJsonMapper.toFeature(
        plot.id(),
        plot.boundary(),
        new PlotProperties(plot.price(), plot.description(), plot.contact(), plot.createdAt()));
  }
}
