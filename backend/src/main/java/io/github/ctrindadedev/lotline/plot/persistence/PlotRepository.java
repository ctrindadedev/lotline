package io.github.ctrindadedev.lotline.plot.persistence;

import jakarta.persistence.LockModeType;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.locationtech.jts.geom.Polygon;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PlotRepository extends JpaRepository<Plot, UUID> {

  String IN_BOUNDING_BOX_SQL =
      """
      SELECT p.* FROM plots p
      WHERE ST_Intersects(p.boundary, ST_MakeEnvelope(:minLng, :minLat, :maxLng, :maxLat, 4326))
      ORDER BY p.id
      """;

  String WITHIN_RADIUS_SQL =
      """
      SELECT p.* FROM plots p
      WHERE ST_DWithin(CAST(p.boundary AS geography),
          CAST(ST_SetSRID(ST_MakePoint(:lng, :lat), 4326) AS geography), :radiusMeters)
        AND (CAST(:minPrice AS numeric) IS NULL OR p.price >= CAST(:minPrice AS numeric))
        AND (CAST(:maxPrice AS numeric) IS NULL OR p.price <= CAST(:maxPrice AS numeric))
        AND (CAST(:minArea AS numeric) IS NULL
          OR ST_Area(CAST(p.boundary AS geography)) >= CAST(:minArea AS numeric))
        AND (CAST(:maxArea AS numeric) IS NULL
          OR ST_Area(CAST(p.boundary AS geography)) <= CAST(:maxArea AS numeric))
      ORDER BY ST_Distance(CAST(p.boundary AS geography),
          CAST(ST_SetSRID(ST_MakePoint(:lng, :lat), 4326) AS geography)), p.id
      """;

  List<Plot> findByOwnerIdOrBuyerIdOrderByCreatedAtDesc(UUID ownerId, UUID buyerId);

  @Lock(LockModeType.PESSIMISTIC_WRITE)
  @Query("SELECT p FROM Plot p WHERE p.id = :id")
  Optional<Plot> findByIdForUpdate(@Param("id") UUID id);

  // Quoted aliases: PostgreSQL lower-cases the others and the projection would not find them.
  @Query(
      value =
          """
          WITH p AS (
            SELECT status, price / ST_Area(CAST(boundary AS geography)) AS price_per_m2,
                ST_Area(CAST(boundary AS geography)) AS area
            FROM plots
            WHERE ST_Intersects(boundary, ST_MakeEnvelope(:minLng, :minLat, :maxLng, :maxLat, 4326))
          )
          SELECT count(*) FILTER (WHERE status = 'AVAILABLE') AS "available",
              count(*) FILTER (WHERE status = 'RESERVED') AS "reserved",
              count(*) FILTER (WHERE status = 'SOLD') AS "sold",
              COALESCE(sum(area), 0) AS "totalArea",
              min(price_per_m2) AS "minPricePerSquareMeter",
              percentile_cont(0.5) WITHIN GROUP (ORDER BY price_per_m2)
                  AS "medianPricePerSquareMeter",
              max(price_per_m2) AS "maxPricePerSquareMeter"
          FROM p
          """,
      nativeQuery = true)
  PlotSummaryView summarizeBoundingBox(
      @Param("minLng") double minLng,
      @Param("minLat") double minLat,
      @Param("maxLng") double maxLng,
      @Param("maxLat") double maxLat);

  // Segmentize first, like the overlap check: long edges cast as-is are read as great-circle arcs.
  @Query(
      value =
          """
          SELECT ST_Area(g) AS "area", ST_Perimeter(g) AS "perimeter"
          FROM (SELECT CAST(ST_Segmentize(:boundary, 0.0001) AS geography) AS g) AS measured
          """,
      nativeQuery = true)
  PlotMeasures measure(@Param("boundary") Polygon boundary);

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

  @Query(value = WITHIN_RADIUS_SQL, nativeQuery = true)
  List<Plot> findWithinRadius(
      @Param("lat") double lat,
      @Param("lng") double lng,
      @Param("radiusMeters") double radiusMeters,
      @Param("minPrice") BigDecimal minPrice,
      @Param("maxPrice") BigDecimal maxPrice,
      @Param("minArea") BigDecimal minAreaSquareMeters,
      @Param("maxArea") BigDecimal maxAreaSquareMeters);

  @Query(value = IN_BOUNDING_BOX_SQL, nativeQuery = true)
  List<Plot> findInBoundingBox(
      @Param("minLng") double minLng,
      @Param("minLat") double minLat,
      @Param("maxLng") double maxLng,
      @Param("maxLat") double maxLat);
}
