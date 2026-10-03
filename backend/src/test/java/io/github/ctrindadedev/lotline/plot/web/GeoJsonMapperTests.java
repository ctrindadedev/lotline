package io.github.ctrindadedev.lotline.plot.web;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import io.github.ctrindadedev.lotline.plot.exception.InvalidGeometryException;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Stream;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.locationtech.jts.geom.Polygon;
import tools.jackson.databind.json.JsonMapper;

class GeoJsonMapperTests {

  private final GeoJsonMapper mapper = new GeoJsonMapper();
  private final JsonMapper json = JsonMapper.builder().build();

  private static final List<List<Double>> SQUARE =
      List.of(
          List.of(-47.0, -22.0),
          List.of(-46.99, -22.0),
          List.of(-46.99, -21.99),
          List.of(-47.0, -21.99),
          List.of(-47.0, -22.0));

  private static final List<List<Double>> HOLE =
      List.of(
          List.of(-46.998, -21.998),
          List.of(-46.998, -21.992),
          List.of(-46.992, -21.992),
          List.of(-46.992, -21.998),
          List.of(-46.998, -21.998));

  @Test
  void readsLongitudeAsXAndLatitudeAsYInWgs84() {
    Polygon polygon = mapper.toPolygon(new GeoJsonPolygon(List.of(SQUARE)));

    assertThat(polygon.getSRID()).isEqualTo(4326);
    assertThat(polygon.getExteriorRing().getCoordinateN(0).getX()).isEqualTo(-47.0);
    assertThat(polygon.getExteriorRing().getCoordinateN(0).getY()).isEqualTo(-22.0);
  }

  @Test
  void roundTripsAPolygonWithAHole() {
    GeoJsonPolygon original = new GeoJsonPolygon(List.of(SQUARE, HOLE));

    Polygon polygon = mapper.toPolygon(original);

    assertThat(polygon.getNumInteriorRing()).isOne();
    assertThat(mapper.toGeoJson(polygon)).isEqualTo(original);
    assertThat(mapper.toPolygon(mapper.toGeoJson(polygon)).equalsExact(polygon)).isTrue();
  }

  @Test
  void writesRingsWithTheRightHandRuleWhateverDirectionTheyWereDrawnIn() {
    GeoJsonPolygon drawnBackwards = new GeoJsonPolygon(List.of(SQUARE.reversed(), HOLE.reversed()));

    GeoJsonPolygon written = mapper.toGeoJson(mapper.toPolygon(drawnBackwards));

    assertThat(written).isEqualTo(new GeoJsonPolygon(List.of(SQUARE, HOLE)));
  }

  @Test
  void readsAPolygonFromGeoJsonText() {
    String body =
        """
        {"type": "Polygon", "coordinates": [[[-47.0, -22.0], [-46.99, -22.0],
          [-46.99, -21.99], [-47.0, -21.99], [-47.0, -22.0]]]}
        """;

    Polygon polygon = mapper.toPolygon(json.readValue(body, GeoJsonPolygon.class));

    assertThat(polygon.getExteriorRing().getNumPoints()).isEqualTo(5);
  }

  @Test
  void writesAFeatureCollectionAsGeoJsonText() {
    UUID id = UUID.fromString("0192f1a0-0000-7000-8000-000000000001");
    Polygon polygon = mapper.toPolygon(new GeoJsonPolygon(List.of(SQUARE)));
    var collection =
        new GeoJsonFeatureCollection<>(
            List.of(mapper.toFeature(id, polygon, Map.of("price", 1000))));

    String written = json.writeValueAsString(collection);

    assertThat(written)
        .isEqualTo(
            "{\"type\":\"FeatureCollection\",\"features\":[{\"type\":\"Feature\","
                + "\"id\":\"0192f1a0-0000-7000-8000-000000000001\","
                + "\"geometry\":{\"type\":\"Polygon\",\"coordinates\":[[[-47.0,-22.0],"
                + "[-46.99,-22.0],[-46.99,-21.99],[-47.0,-21.99],[-47.0,-22.0]]]},"
                + "\"properties\":{\"price\":1000}}]}");
  }

  @Test
  void rejectsAMissingGeometry() {
    assertThatThrownBy(() -> mapper.toPolygon(null))
        .isInstanceOf(InvalidGeometryException.class)
        .hasMessage("A geometry is required");
  }

  @ParameterizedTest
  @MethodSource("unsupportedTypes")
  void rejectsGeometryTypesOtherThanPolygon(String type) {
    assertThatThrownBy(() -> mapper.toPolygon(new GeoJsonPolygon(type, List.of(SQUARE))))
        .isInstanceOf(InvalidGeometryException.class)
        .hasMessageStartingWith("Only Polygon geometries are supported");
  }

  static Stream<String> unsupportedTypes() {
    return Stream.of("Point", "LineString", "MultiPolygon", "polygon", null);
  }

  @ParameterizedTest(name = "{0}")
  @MethodSource("malformedPolygons")
  void rejectsMalformedPolygons(String description, GeoJsonPolygon polygon, String message) {
    assertThatThrownBy(() -> mapper.toPolygon(polygon))
        .isInstanceOf(InvalidGeometryException.class)
        .hasMessage(message);
  }

  static Stream<Arguments> malformedPolygons() {
    String noRing = "A polygon needs an exterior ring";
    String shortRing = "A ring needs at least 4 positions";
    String badPosition = "Each position must be [longitude, latitude]";
    return Stream.of(
        Arguments.of("no coordinates", new GeoJsonPolygon(null), noRing),
        Arguments.of("no rings", new GeoJsonPolygon(List.of()), noRing),
        Arguments.of(
            "unclosed ring",
            new GeoJsonPolygon(List.of(SQUARE.subList(0, 4))),
            "A ring must end on its first position"),
        Arguments.of(
            "ring with three positions",
            new GeoJsonPolygon(List.of(List.of(SQUARE.get(0), SQUARE.get(1), SQUARE.get(0)))),
            shortRing),
        Arguments.of("null hole", new GeoJsonPolygon(Arrays.asList(SQUARE, null)), shortRing),
        Arguments.of("position with one number", withFirstPosition(List.of(-47.0)), badPosition),
        Arguments.of(
            "position with altitude", withFirstPosition(List.of(-47.0, -22.0, 10.0)), badPosition),
        Arguments.of(
            "position with null", withFirstPosition(Arrays.asList(-47.0, null)), badPosition));
  }

  private static GeoJsonPolygon withFirstPosition(List<Double> position) {
    List<List<Double>> ring = Stream.concat(Stream.of(position), SQUARE.stream().skip(1)).toList();
    return new GeoJsonPolygon(List.of(ring));
  }
}
