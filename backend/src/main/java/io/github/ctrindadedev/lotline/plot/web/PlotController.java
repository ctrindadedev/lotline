package io.github.ctrindadedev.lotline.plot.web;

import io.github.ctrindadedev.lotline.identity.CurrentUser;
import io.github.ctrindadedev.lotline.plot.service.NewPlot;
import io.github.ctrindadedev.lotline.plot.service.PlotChanges;
import io.github.ctrindadedev.lotline.plot.service.PlotDetails;
import io.github.ctrindadedev.lotline.plot.service.PlotService;
import io.github.ctrindadedev.lotline.plot.service.SearchFilters;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import java.math.BigDecimal;
import java.net.URI;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

@Tag(name = "Plots")
@RestController
@RequestMapping("/api/v1/plots")
class PlotController {

  static final String MAX_RADIUS_METERS = "50000";

  private final PlotService plotService;
  private final GeoJsonMapper geoJsonMapper;
  private final CurrentUser currentUser;

  PlotController(PlotService plotService, GeoJsonMapper geoJsonMapper, CurrentUser currentUser) {
    this.plotService = plotService;
    this.geoJsonMapper = geoJsonMapper;
    this.currentUser = currentUser;
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
                request.contact(),
                currentUser.requireId()));
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

  @Operation(summary = "List the plots that intersect the map viewport")
  @GetMapping
  GeoJsonFeatureCollection<PlotProperties> listInBoundingBox(
      @RequestParam @BoundingBox List<Double> bbox) {
    return toFeatureCollection(
        plotService.listInBoundingBox(bbox.get(0), bbox.get(1), bbox.get(2), bbox.get(3)));
  }

  @Operation(
      summary = "Find plots that intersect a circle, closest first",
      description = "Price and area bounds are optional and inclusive.")
  @GetMapping("/search")
  GeoJsonFeatureCollection<PlotProperties> searchWithinRadius(
      @RequestParam @DecimalMin("-90") @DecimalMax("90") double lat,
      @RequestParam @DecimalMin("-180") @DecimalMax("180") double lng,
      @RequestParam @Positive @DecimalMax(MAX_RADIUS_METERS) double radiusMeters,
      @RequestParam(required = false) @PositiveOrZero BigDecimal minPrice,
      @RequestParam(required = false) @PositiveOrZero BigDecimal maxPrice,
      @RequestParam(required = false) @PositiveOrZero BigDecimal minAreaSquareMeters,
      @RequestParam(required = false) @PositiveOrZero BigDecimal maxAreaSquareMeters) {
    return toFeatureCollection(
        plotService.searchWithinRadius(
            lat,
            lng,
            radiusMeters,
            new SearchFilters(minPrice, maxPrice, minAreaSquareMeters, maxAreaSquareMeters)));
  }

  @Operation(summary = "Change a plot's price, description and contact (its owner only)")
  @PutMapping("/{id}")
  GeoJsonFeature<PlotProperties> update(
      @PathVariable UUID id, @Valid @RequestBody UpdatePlotRequest request) {
    return toFeature(
        plotService.update(
            id,
            new PlotChanges(request.price(), request.description(), request.contact()),
            currentUser.requireId()));
  }

  @Operation(summary = "Remove a plot (its owner only)")
  @DeleteMapping("/{id}")
  ResponseEntity<Void> delete(@PathVariable UUID id) {
    plotService.delete(id, currentUser.requireId());
    return ResponseEntity.noContent().build();
  }

  @Operation(summary = "Reserve an available plot for the logged-in user")
  @PostMapping("/{id}/reservation")
  GeoJsonFeature<PlotProperties> reserve(@PathVariable UUID id) {
    return toFeature(plotService.reserve(id, currentUser.requireId()));
  }

  @Operation(summary = "Release a reservation (the seller or the user who reserved)")
  @DeleteMapping("/{id}/reservation")
  GeoJsonFeature<PlotProperties> release(@PathVariable UUID id) {
    return toFeature(plotService.release(id, currentUser.requireId()));
  }

  @Operation(summary = "Confirm the sale of a reserved plot (its owner only)")
  @PostMapping("/{id}/sale")
  GeoJsonFeature<PlotProperties> sell(@PathVariable UUID id) {
    return toFeature(plotService.sell(id, currentUser.requireId()));
  }

  private GeoJsonFeatureCollection<PlotProperties> toFeatureCollection(List<PlotDetails> plots) {
    return new GeoJsonFeatureCollection<>(plots.stream().map(this::toFeature).toList());
  }

  private GeoJsonFeature<PlotProperties> toFeature(PlotDetails plot) {
    Optional<UUID> me = currentUser.id();
    return geoJsonMapper.toFeature(
        plot.id(),
        plot.boundary(),
        new PlotProperties(
            plot.price(),
            plot.description(),
            me.isPresent() ? plot.contact() : null,
            plot.createdAt(),
            plot.status(),
            plot.reservable(),
            plot.ownerId() != null && me.filter(plot.ownerId()::equals).isPresent(),
            plot.buyerId() != null && me.filter(plot.buyerId()::equals).isPresent()));
  }
}
