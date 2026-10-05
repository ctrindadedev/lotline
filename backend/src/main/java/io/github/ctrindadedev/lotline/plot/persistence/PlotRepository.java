package io.github.ctrindadedev.lotline.plot.persistence;

import java.util.List;
import java.util.UUID;
import org.locationtech.jts.geom.Polygon;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PlotRepository extends JpaRepository<Plot, UUID> {

  @Query(value = "SELECT ST_Area(CAST(:boundary AS geography))", nativeQuery = true)
  double areaInSquareMeters(@Param("boundary") Polygon boundary);

  @Query(
      value = "SELECT true FROM pg_advisory_xact_lock(hashtext('plot-registration'))",
      nativeQuery = true)
  boolean lockRegistrationsUntilCommit();

  // Segmentize first: the geography cast reads edges as great-circle arcs and inflates slivers.
  @Query(
      value =
          """
          SELECT p.id FROM plots p
          WHERE p.boundary && :boundary
            AND ST_Relate(p.boundary, :boundary, 'T********')
            AND ST_Area(CAST(ST_Segmentize(
                  ST_CollectionExtract(ST_Intersection(p.boundary, :boundary), 3), 0.0001)
                AS geography)) > :toleranceSquareMeters
          ORDER BY p.id
          """,
      nativeQuery = true)
  List<UUID> findOverlappingIds(
      @Param("boundary") Polygon boundary,
      @Param("toleranceSquareMeters") double toleranceSquareMeters);
}
