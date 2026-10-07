import type OlMap from 'ol/Map';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import type { StyleLike } from 'ol/style/Style';
import { useEffect, useRef, useState } from 'react';
import { toOlFeatures, type GeoJsonFeatureCollection } from './geojson';
import { polygonStyle } from './styles';

/**
 * Shows a GeoJSON collection on its own layer; `undefined` leaves the layer empty. A new style
 * restyles the same layer. Returns its source.
 */
export function useVectorLayer(
  map: OlMap | null,
  collection: GeoJsonFeatureCollection<object> | undefined,
  style: StyleLike = polygonStyle,
) {
  const [source] = useState(() => new VectorSource());
  const layerRef = useRef<VectorLayer | null>(null);
  const styleRef = useRef(style);

  useEffect(() => {
    if (!map) {
      return;
    }
    const layer = new VectorLayer({ source, style: styleRef.current });
    map.addLayer(layer);
    layerRef.current = layer;
    return () => {
      map.removeLayer(layer);
      layerRef.current = null;
    };
  }, [map, source]);

  useEffect(() => {
    styleRef.current = style;
    layerRef.current?.setStyle(style);
  }, [style]);

  useEffect(() => {
    source.clear();
    if (collection) {
      source.addFeatures(toOlFeatures(collection));
    }
  }, [source, collection]);

  return source;
}
