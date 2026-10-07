package io.github.ctrindadedev.lotline.plot.persistence;

/** A boundary's area (m²) and perimeter (m), measured on the Earth's surface. */
public interface PlotMeasures {

  double getArea();

  double getPerimeter();
}
