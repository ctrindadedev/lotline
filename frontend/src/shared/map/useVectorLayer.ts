import type OlMap from 'ol/Map';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { useEffect, useState } from 'react';
import { toOlFeatures, type GeoJsonFeatureCollection } from './geojson';
import type Style from 'ol/style/Style';
import { polygonStyle } from './styles';

/** Shows a GeoJSON collection on its own layer; `undefined` leaves the layer empty. */
export function useVectorLayer(
  map: OlMap | null,
  collection: GeoJsonFeatureCollection<object> | undefined,
  style: Style = polygonStyle,
) {
  const [source] = useState(() => new VectorSource());

  useEffect(() => {
    if (!map) {
      return;
    }
    const layer = new VectorLayer({ source, style });
    map.addLayer(layer);
    return () => {
      map.removeLayer(layer);
    };
  }, [map, source, style]);

  useEffect(() => {
    source.clear();
    if (collection) {
      source.addFeatures(toOlFeatures(collection));
    }
  }, [source, collection]);
}
