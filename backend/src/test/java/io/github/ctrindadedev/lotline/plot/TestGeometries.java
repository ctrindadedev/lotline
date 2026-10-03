package io.github.ctrindadedev.lotline.plot;

import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Polygon;
import org.locationtech.jts.geom.PrecisionModel;
import org.locationtech.jts.io.ParseException;
import org.locationtech.jts.io.WKTReader;

/** Builds test polygons from WKT ({@code lon lat} order). */
public final class TestGeometries {

  /** About 1 km x 1.1 km near Campinas, Brazil. */
  public static final String SQUARE_WKT =
      "POLYGON((-47.0 -22.0, -46.99 -22.0, -46.99 -21.99, -47.0 -21.99, -47.0 -22.0))";

  private TestGeometries() {}

  public static Polygon polygon(String wkt) {
    return polygon(wkt, 4326);
  }

  public static Polygon polygon(String wkt, int srid) {
    try {
      return (Polygon) new WKTReader(new GeometryFactory(new PrecisionModel(), srid)).read(wkt);
    } catch (ParseException e) {
      throw new IllegalArgumentException(e);
    }
  }
}
