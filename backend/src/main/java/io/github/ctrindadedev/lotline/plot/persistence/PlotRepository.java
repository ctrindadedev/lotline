package io.github.ctrindadedev.lotline.plot.persistence;

import java.util.UUID;
import org.locationtech.jts.geom.Polygon;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PlotRepository extends JpaRepository<Plot, UUID> {

  @Query(value = "SELECT ST_Area(CAST(:boundary AS geography))", nativeQuery = true)
  double areaInSquareMeters(@Param("boundary") Polygon boundary);
}
